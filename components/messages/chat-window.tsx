"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
import { toast } from "sonner";
import { useTranslations } from "next-intl";

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
  createdAt: string | Date;
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
  const { socket, registerMessageListener, unregisterMessageListener } =
    useSocket();
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

      audio.addEventListener("error", () => {
        console.log("notification.mp3 not found, using Web Audio API beep");
      });

      return {
        play: async () => {
          try {
            return await audio.play();
          } catch (error) {
            console.log("MP3 playback failed, using beep:", error);
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
          }
        },
      };
    }
    return null;
  });
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const t = useTranslations("messages");

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
    : t("unknownUser");

  useEffect(() => {
    if (conversation._id) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [conversation._id]);

  // dolaczanie do konwersacji via polling
  useEffect(() => {
    socket.emit("join-conversation", conversation._id);

    return () => {
      socket.emit("leave-conversation", conversation._id);
    };
  }, [socket, conversation._id]);

  const markMessagesAsRead = useCallback(async () => {
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

        await socket.emit("messages-read", {
          conversationId: conversation._id,
          userId: currentUserId,
          messageIds: unreadMessages.map((m) => m._id),
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [messages, session?.user?.email, currentUserId, conversation._id, socket]);

  const handleNewMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === message._id);
        if (exists) {
          return prev;
        }

        const wasNearBottom = (() => {
          if (!scrollRef.current) return false;
          const viewport = scrollRef.current.closest(
            "[data-radix-scroll-area-viewport]"
          ) as HTMLElement;
          if (!viewport) return false;

          const threshold = 100; // 100px od dolu
          return (
            viewport.scrollTop + viewport.clientHeight >=
            viewport.scrollHeight - threshold
          );
        })();

        // dzwiek tylko dla nowych wiadomosci
        if (message.sender.email !== session?.user?.email) {
          console.log("Playing notification sound");
          if (notificationSound) {
            notificationSound.play().catch((error) => {
              console.log("Could not play notification sound:", error);
            });
          }
        }

        const newMessages = [...prev, message];

        if (wasNearBottom) {
          setTimeout(() => {
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
          }, 100);
        }

        return newMessages;
      });

      setTimeout(() => {
        markMessagesAsRead();
      }, 0);
    },
    [
      conversation._id,
      session?.user?.email,
      notificationSound,
      markMessagesAsRead,
    ]
  );

  useEffect(() => {
    registerMessageListener(conversation._id, handleNewMessage);

    return () => {
      unregisterMessageListener(conversation._id);
    };
  }, [
    conversation._id,
    registerMessageListener,
    unregisterMessageListener,
    handleNewMessage,
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

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (scrollRef.current) {
          const viewport = scrollRef.current.querySelector(
            "[data-radix-scroll-area-viewport]"
          ) as HTMLElement;
          if (viewport) {
            viewport.scrollTo({
              top: viewport.scrollHeight,
              behavior: "smooth",
            });
          } else {
            console.log("Viewport not found");
          }
        } else {
          console.log("scrollRef.current is null");
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

        setMessages((prev) => [...prev, data.message]);

        setTimeout(scrollToBottom, 100);

        await socket.emit("send-message", {
          conversationId: conversation._id,
          participantEmails: conversation.participants.map((p) => p.email),
          message: data.message,
        });
      } else {
        const error = await res.json();
        console.error("Error sending message:", error);
        toast.error(t("errors.errorOccured"), {
          position: "top-center",
          description: error.error || t("errors.failedToSendMessage"),
        });
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast.error(t("errors.errorOccured"), {
        position: "top-center",
        description: t("errors.failedToSendMessage"),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">{t("loadingMessages")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b p-4 bg-background">
        <div className="flex items-center gap-3">
          {otherParticipant?.profileImage && (
            <Avatar>
              <AvatarImage src={otherParticipant.profileImage} />
              <AvatarFallback>
                {otherParticipantName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <h2 className="font-semibold">{otherParticipantName}</h2>
            <p className="text-xs text-muted-foreground">
              {conversation.book.title}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-hidden" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("noMessagesYet")}</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage =
                message.sender.email === session?.user?.email;
              const showAvatar =
                index === 0 ||
                messages[index - 1].sender._id !== message.sender._id;
              const showDate =
                index === 0 ||
                !isToday(new Date(message.createdAt)) ||
                !isToday(new Date(messages[index - 1].createdAt));

              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <div className="flex-1 border-t"></div>
                      <span className="px-2 text-xs text-muted-foreground">
                        {isToday(new Date(message.createdAt))
                          ? "Today"
                          : isYesterday(new Date(message.createdAt))
                            ? "Yesterday"
                            : format(
                                new Date(message.createdAt),
                                "dd MMMM yyyy",
                                { locale: pl }
                              )}
                      </span>
                      <div className="flex-1 border-t"></div>
                    </div>
                  )}

                  <div
                    className={cn("flex gap-2", isOwnMessage && "justify-end")}
                  >
                    {!isOwnMessage && showAvatar && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.sender.profileImage} />
                        <AvatarFallback>
                          {message.sender.username?.charAt(0).toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!isOwnMessage && !showAvatar && (
                      <div className="w-8 flex-shrink-0"></div>
                    )}

                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md",
                        isOwnMessage && "order-2"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 break-words",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>

                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {message.attachments.map((attachment, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    const imageUrls =
                                      message.attachments
                                        ?.filter((a) => a.type === "image")
                                        .map((a) => a.url) || [];
                                    handleImageClick(
                                      imageUrls,
                                      imageUrls.indexOf(attachment.url)
                                    );
                                  }}
                                  className="relative group cursor-pointer"
                                  type="button"
                                >
                                  {attachment.type === "image" ? (
                                    <Image
                                      src={attachment.url}
                                      alt={attachment.name}
                                      width={150}
                                      height={150}
                                      className="rounded object-cover w-full h-24"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center bg-secondary rounded h-24 w-full">
                                      <FileText className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>

                      <div
                        className={cn(
                          "text-xs text-muted-foreground mt-1 flex items-center gap-1",
                          isOwnMessage && "justify-end"
                        )}
                      >
                        {format(new Date(message.createdAt), "HH:mm", {
                          locale: pl,
                        })}
                        {isOwnMessage && (
                          <>
                            {message.readBy.length > 0 ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : message.deliveredTo.length > 0 ? (
                              <Check className="h-3 w-3" />
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {typingUser && (
            <div className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>T</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  {typingUser} {t("isTyping")}
                </span>
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"></div>
                  <div
                    className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex-shrink-0">
        <MessageInput
          conversationId={conversation._id}
          userName={
            session?.user?.name || session?.user?.email || t("anonymous")
          }
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
