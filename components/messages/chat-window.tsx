"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageInput } from "./message-input";
import { useSocket } from "@/lib/context/socket-context";
import { format, isToday, isYesterday } from "date-fns";
import { pl } from "date-fns/locale";
import { Check, CheckCheck, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageViewerModal } from "./image-viewer-modal";
import Image from "next/image";

interface Attachment {
  type: "image" | "document";
  url: string;
  name: string;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name?: string;
    username?: string;
    email: string;
    profileImage?: string;
  };
  content: string;
  attachments?: Array<{
    type: "image" | "document";
    url: string;
    name: string;
  }>;
  readBy: string[];
  deliveredTo: string[];
  createdAt: Date;
}

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name?: string;
    username?: string;
    email: string;
    profileImage?: string;
  }>;
  book: {
    _id: string;
    title: string;
    imageUrl?: string;
    author: string;
  };
}

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
}

export function ChatWindow({ conversation, currentUserId }: ChatWindowProps) {
  const { socket, isConnected } = useSocket();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [notificationSound] = useState(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.5;

      // test czy plik istnieje
      audio.addEventListener("error", () => {
        console.log("notification.mp3 not found, using Web Audio API beep");
      });

      return {
        play: () => {
          return audio.play().catch((error) => {
            console.log("MP3 playback failed, using beep:", error);
            // fallback do Web Audio API beep
            try {
              const AudioContext =
                window.AudioContext ||
                (
                  window as Window & {
                    webkitAudioContext?: typeof window.AudioContext;
                  }
                ).webkitAudioContext;
              const audioContext = new AudioContext();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();

              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);

              oscillator.frequency.value = 800;
              oscillator.type = "sine";

              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + 0.5
              );

              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.5);

              return Promise.resolve();
            } catch (beepError) {
              console.error("Both audio methods failed:", beepError);
              return Promise.reject(beepError);
            }
          });
        },
      };
    }
    return null;
  });
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImageClick = (images: string[], index: number) => {
    setSelectedImages(images);
    setSelectedImageIndex(index);
    setImageModalOpen(true);
  };

  const otherParticipant = conversation.participants.find(
    (p) => p.email !== session?.user?.email
  );

  const otherParticipantName = otherParticipant
    ? otherParticipant.username ||
      otherParticipant.name ||
      otherParticipant.email
    : "Unknown User";

  // fetchowanie wiadomosci
  useEffect(() => {
    if (conversation._id) {
      fetchMessages();
      markMessagesAsRead();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation._id]);

  // dolaczanie do pokoju
  useEffect(() => {
    if (socket && isConnected && conversation._id) {
      socket.emit("join-conversation", conversation._id);

      return () => {
        socket.emit("leave-conversation", conversation._id);
      };
    }
  }, [socket, isConnected, conversation._id]);

  // socket listenery
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("new-message", (message: Message) => {
      console.log("New message received via socket:", message);
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        if (exists) {
          console.log("Message already exists, skipping");
          return prev;
        }
        console.log("Adding message to list, current count:", prev.length);
        return [...prev, message];
      });
      markMessagesAsRead();

      if (message.sender.email !== session?.user?.email) {
        console.log("Playing notification sound");
        if (notificationSound) {
          notificationSound.play().catch((error) => {
            console.log("Could not play notification sound:", error);
          });
        }
      } else {
        console.log("Message from self, not playing sound");
      }
    });

    socket.on(
      "messages-read",
      (data: { userId: string; messageIds: string[] }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg._id)
              ? { ...msg, readBy: [...msg.readBy, data.userId] }
              : msg
          )
        );
      }
    );

    socket.on("typing-start", (data: { userId: string; userName: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUser(data.userName);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser(null);
        }, 3000);
      }
    });

    socket.on("typing-stop", (data: { userId: string }) => {
      if (data.userId !== currentUserId) {
        setTypingUser(null);
      }
    });

    return () => {
      socket.off("new-message");
      socket.off("messages-read");
      socket.off("typing-start");
      socket.off("typing-stop");
    };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    socket,
    isConnected,
    currentUserId,
    conversation._id,
    session?.user?.email,
    notificationSound,
  ]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/messages?conversationId=${conversation._id}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const unreadMessages = messages.filter(
        (msg) =>
          msg.sender.email !== session?.user?.email &&
          !msg.readBy.includes(currentUserId)
      );

      if (unreadMessages.length > 0) {
        await fetch("/api/messages/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: conversation._id }),
        });

        if (socket && isConnected) {
          socket.emit("messages-read", {
            conversationId: conversation._id,
            userId: currentUserId,
            messageIds: unreadMessages.map((m) => m._id),
          });
        }
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (scrollRef.current) {
          const viewport = scrollRef.current.closest(
            "[data-radix-scroll-area-viewport]"
          ) as HTMLElement;
          if (viewport) {
            viewport.scrollTo({
              top: viewport.scrollHeight,
              behavior: "smooth",
            });
          }
        }
      }, 50);
    });
  };

  const handleSendMessage = async (
    content: string,
    attachments?: Attachment[]
  ) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    try {
      console.log("Sending message:", {
        conversationId: conversation._id,
        content,
        attachments: attachments?.length || 0,
      });

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation._id,
          content,
          attachments: attachments || [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Message sent successfully:", data.message);

        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();

        if (socket && isConnected) {
          console.log("Emitting via socket to conversation:", conversation._id);
          socket.emit("send-message", {
            conversationId: conversation._id,
            participantEmails: conversation.participants.map((p) => p.email),
            message: data.message,
          });
        } else {
          console.warn("Socket not connected, message not emitted");
        }
      } else {
        const error = await res.json();
        console.error("Error response:", error);
        alert("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message");
    }
  };

  const formatMessageDate = (date: Date) => {
    const messageDate = new Date(date);

    if (isToday(messageDate)) {
      return format(messageDate, "HH:mm", { locale: pl });
    } else if (isYesterday(messageDate)) {
      return `Wczoraj ${format(messageDate, "HH:mm", { locale: pl })}`;
    } else {
      return format(messageDate, "d MMM, HH:mm", { locale: pl });
    }
  };

  const getReadStatus = (message: Message) => {
    // status tylko dla wlasnych wiadomosci
    if (message.sender.email !== session?.user?.email) return null;

    const isRead = message.readBy.some((id) => id !== currentUserId);
    const isDelivered = message.deliveredTo.some((id) => id !== currentUserId);

    if (isRead) {
      return <CheckCheck className="h-4 w-4 text-blue-500" />;
    } else if (isDelivered) {
      return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
    } else {
      return <Check className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4 flex-shrink-0">
        <Avatar>
          <AvatarImage src={otherParticipant?.profileImage} />
          <AvatarFallback>
            {otherParticipantName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <p className="font-semibold">{otherParticipantName}</p>
          <div className="flex items-center gap-2">
            {conversation.book.imageUrl && (
              <Image
                src={conversation.book.imageUrl}
                alt={conversation.book.title}
                className="h-4 w-3 object-cover rounded"
              />
            )}
            <p className="text-sm text-muted-foreground">
              {conversation.book.title}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            isConnected
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
              : "bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-400"
          )}
        >
          {isConnected ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* Messages - dodaj overflow-hidden */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Start a conversation about the book
                  </p>
                  <p className="text-sm font-semibold">
                    {conversation.book.title}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.sender.email === session?.user?.email;
                  const senderName =
                    message.sender.username ||
                    message.sender.name ||
                    message.sender.email;

                  return (
                    <div
                      key={message._id}
                      className={cn(
                        "flex gap-3",
                        isOwn ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {!isOwn && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.profileImage} />
                          <AvatarFallback>
                            {senderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "max-w-[70%] space-y-1",
                          isOwn && "items-end"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg px-4 py-2",
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {message.content && (
                            <p className="break-words">{message.content}</p>
                          )}

                          {message.attachments &&
                            message.attachments.length > 0 && (
                              <div
                                className={cn(
                                  "mt-2",
                                  message.content && "space-y-2"
                                )}
                              >
                                {message.attachments.filter(
                                  (a) => a.type === "image"
                                ).length > 0 && (
                                  <div
                                    className={cn(
                                      "grid gap-2",
                                      message.attachments.filter(
                                        (a) => a.type === "image"
                                      ).length === 1 && "grid-cols-1",
                                      message.attachments.filter(
                                        (a) => a.type === "image"
                                      ).length === 2 && "grid-cols-2",
                                      message.attachments.filter(
                                        (a) => a.type === "image"
                                      ).length >= 3 && "grid-cols-2"
                                    )}
                                  >
                                    {message.attachments
                                      .filter((a) => a.type === "image")
                                      .map((attachment, idx) => (
                                        <Image
                                          key={idx}
                                          src={attachment.url}
                                          alt={attachment.name}
                                          onClick={() =>
                                            handleImageClick(
                                              message
                                                .attachments!.filter(
                                                  (a) => a.type === "image"
                                                )
                                                .map((a) => a.url),
                                              idx
                                            )
                                          }
                                          className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                                        />
                                      ))}
                                  </div>
                                )}

                                {message.attachments
                                  .filter((a) => a.type === "document")
                                  .map((attachment, idx) => (
                                    <a
                                      key={idx}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 hover:underline"
                                    >
                                      <FileText className="h-4 w-4" />
                                      {attachment.name}
                                    </a>
                                  ))}
                              </div>
                            )}
                        </div>

                        <div
                          className={cn(
                            "flex items-center gap-1 text-xs text-muted-foreground",
                            isOwn && "justify-end"
                          )}
                        >
                          <span>{formatMessageDate(message.createdAt)}</span>
                          {getReadStatus(message)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {typingUser && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{typingUser} is typing...</span>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-shrink-0">
        <MessageInput
          conversationId={conversation._id}
          userName={session?.user?.name || session?.user?.email || "User"}
          onSendMessage={handleSendMessage}
        />
      </div>
      <ImageViewerModal
        images={selectedImages}
        initialIndex={selectedImageIndex}
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
      />
    </div>
  );
}
