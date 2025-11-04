"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConversationList } from "@/components/messages/conversation-list";
import { ChatWindow } from "@/components/messages/chat-window";
import { useSocket } from "@/lib/context/socket-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    image?: string;
  }>;
  book: {
    _id: string;
    title: string;
    coverImage?: string;
    author: string;
  };
  lastMessage?: {
    content: string;
    sender: string;
    createdAt: Date;
  };
  unreadCount: number;
  updatedAt: Date;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, isConnected } = useSocket();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(
      "conversation-update",
      (message: {
        _id: string;
        conversationId: string;
        content: string;
        sender: {
          _id: string;
          email: string;
          name?: string;
          username?: string;
        };
        createdAt: Date;
      }) => {
        console.log("Received new-message in page.tsx:", message);
        console.log("Current conversations:", conversations);
        console.log("Message conversationId:", message.conversationId);
        console.log("Session user email:", session?.user?.email);
        console.log("Message sender email:", message.sender?.email);

        // aktualizacja lokalna zamiast fetchowania
        setConversations((prev) =>
          prev
            .map((conv) => {
              if (conv._id === message.conversationId) {
                const isFromOther =
                  message.sender?.email !== session?.user?.email;

                return {
                  ...conv,
                  lastMessage: {
                    content: message.content,
                    sender: message.sender?._id || message.sender,
                    createdAt: message.createdAt,
                  },
                  unreadCount: isFromOther
                    ? conv.unreadCount + 1
                    : conv.unreadCount,
                  updatedAt: new Date(message.createdAt),
                };
              }
              return conv;
            })
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            )
        );
      }
    );

    return () => {
      socket.off("new-message");
    };
  }, [socket, isConnected, session?.user?.email, conversations]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    router.push(`/messages?conversation=${conversationId}`, { scroll: false });
  };

  const handleBackToList = () => {
    setActiveConversationId(null);
    router.push("/messages");
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConversations((prev) =>
          prev.filter((c) => c._id !== conversationId)
        );
        if (activeConversationId === conversationId) {
          setActiveConversationId(null);
          router.push("/messages");
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-muted-foreground">Ładowanie...</p>
      </div>
    );
  }

  const activeConversation = conversations.find(
    (c) => c._id === activeConversationId
  );

  if (isMobile) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden">
        {activeConversation ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b p-3">
              <Button variant="ghost" size="icon" onClick={handleBackToList}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="font-semibold">Wiadomości</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                conversation={activeConversation}
                currentUserId={session?.user?.id || ""}
              />
            </div>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        )}
      </div>
    );
  }

  // Desktop
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <div className="w-xs min-w-[250px] border-r">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      <div className="flex-1">
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            currentUserId={session?.user?.id || ""}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-medium text-muted-foreground">
                Select a conversation to begin
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
