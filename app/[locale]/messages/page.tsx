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
  lastMessage?: {
    content: string;
    sender: {
      _id: string;
      email: string;
      name?: string;
      username?: string;
      profileImage?: string;
    };
    createdAt: string | Date;
    attachments?: Array<{
      type: "image" | "document";
      url: string;
      name: string;
    }>;
  };
  unreadCount: number;
  updatedAt: string | Date;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    socket,
    registerConversationUpdateListener,
    unregisterConversationUpdateListener,
  } = useSocket();
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
    if (searchParams) {
      const conversationId = searchParams.get("conversation");
      if (conversationId) {
        setActiveConversationId(conversationId);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const handleConversationUpdate = (update: {
      _id: string;
      conversationId: string;
      updatedAt: string | Date;
      participants: Array<{
        _id: string;
        email: string;
        name?: string;
        username?: string;
        profileImage?: string;
      }>;
    }) => {
      console.log("Received conversation update:", update);

      fetchConversations();
    };

    registerConversationUpdateListener(handleConversationUpdate);

    return () => {
      unregisterConversationUpdateListener();
    };
  }, [
    session?.user?.email,
    registerConversationUpdateListener,
    unregisterConversationUpdateListener,
  ]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
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

  const activeConversation =
    conversations.find((conv) => conv._id === activeConversationId) || null;

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 p-4 md:p-6">
      <div
        className={`w-full md:w-80 flex-shrink-0 ${
          isMobile && activeConversationId ? "hidden" : ""
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={setActiveConversationId}
          onDeleteConversation={() => {}}
        />
      </div>

      {activeConversation ? (
        <div className="flex-1 flex flex-col min-w-0">
          {isMobile && (
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => setActiveConversationId(null)}
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          )}
          <ChatWindow
            conversation={activeConversation}
            currentUserId={session?.user?.id || ""}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
          <p>Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
}
