"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useSession } from "next-auth/react";

interface MessageData {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    email: string;
    name?: string;
    username?: string;
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

interface ConversationUpdate {
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
}

interface TypingData {
  conversationId: string;
  userId: string;
  userName: string;
}

interface SocketContextType {
  socket: {
    emit: (event: string, data: unknown) => Promise<void>;
    on: (event: string, callback: (data: unknown) => void) => void;
    off: (event: string) => void;
  };
  isConnected: boolean;
  registerMessageListener: (
    conversationId: string,
    callback: (message: MessageData) => void
  ) => void;
  unregisterMessageListener: (conversationId: string) => void;
  registerTypingListener: (
    conversationId: string,
    callback: (data: TypingData) => void
  ) => void;
  unregisterTypingListener: (conversationId: string) => void;
  registerConversationUpdateListener: (
    callback: (data: ConversationUpdate) => void
  ) => void;
  unregisterConversationUpdateListener: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: {
    emit: async () => {},
    on: () => {},
    off: () => {},
  },
  isConnected: true,
  registerMessageListener: () => {},
  unregisterMessageListener: () => {},
  registerTypingListener: () => {},
  unregisterTypingListener: () => {},
  registerConversationUpdateListener: () => {},
  unregisterConversationUpdateListener: () => {},
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected] = useState(true);
  const { data: session } = useSession();

  // listenery dla wiadomosci, typing i aktualizacji konwersacji
  const messageListenersRef = useRef<
    Map<string, (message: MessageData) => void>
  >(new Map());
  const typingListenersRef = useRef<Map<string, (data: TypingData) => void>>(
    new Map()
  );
  const conversationUpdateListenerRef = useRef<
    ((data: ConversationUpdate) => void) | null
  >(null);

  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const activeConversationsRef = useRef<Set<string>>(new Set());
  const messageTimestampsRef = useRef<Map<string, number>>(new Map());

  // sledzenie aktywnosci uzytkownika
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  const shouldPoll = useCallback(() => {
    const userInactive = Date.now() - lastActivityRef.current > 5 * 60 * 1000; // 5 min
    const hasActiveConversations = activeConversationsRef.current.size > 0;
    return hasActiveConversations && !userInactive;
  }, []);

  useEffect(() => {
    if (!session?.user?.email) return;

    let pollInterval = 3000;
    let consecutiveErrors = 0;

    const startPolling = async () => {
      if (!shouldPoll()) {
        pollInterval = Math.min(pollInterval * 1.2, 30000);
        pollingTimeoutRef.current = setTimeout(startPolling, pollInterval);
        return;
      }

      try {
        if (activeConversationsRef.current.size > 0) {
          const conversationIds = Array.from(activeConversationsRef.current);

          for (const conversationId of conversationIds) {
            const lastTimestamp =
              messageTimestampsRef.current.get(conversationId) || 0;

            const response = await fetch(
              `/api/messages?conversationId=${conversationId}&since=${lastTimestamp}&limit=10`
            );

            if (response.ok) {
              const data = await response.json();

              if (data.messages && data.messages.length > 0) {
                // tylko nowe wiadomosci
                const newMessages = data.messages.filter((msg: MessageData) => {
                  const msgTime = new Date(msg.createdAt).getTime();
                  return msgTime > lastTimestamp;
                });

                if (newMessages.length > 0) {
                  pollInterval = 1000;
                  consecutiveErrors = 0;

                  newMessages.forEach((message: MessageData) => {
                    const callback =
                      messageListenersRef.current.get(conversationId);
                    callback?.(message);
                  });

                  const lastMessage = newMessages[newMessages.length - 1];
                  messageTimestampsRef.current.set(
                    conversationId,
                    new Date(lastMessage.createdAt).getTime()
                  );
                } else {
                  pollInterval = Math.min(pollInterval * 1.05, 10000);
                }
              } else {
                pollInterval = Math.min(pollInterval * 1.05, 10000);
              }
            }
          }
        }

        if (conversationUpdateListenerRef.current) {
          const response = await fetch(
            `/api/conversations?since=${Date.now() - 30000}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.updates && data.updates.length > 0) {
              data.updates.forEach((update: ConversationUpdate) => {
                conversationUpdateListenerRef.current?.(update);
              });
            }
          }
        }

        consecutiveErrors = 0;
      } catch (error) {
        console.error("Polling error:", error);
        consecutiveErrors++;
        pollInterval = Math.min(
          pollInterval * (1 + 0.1 * consecutiveErrors),
          30000
        );
      }

      pollingTimeoutRef.current = setTimeout(startPolling, pollInterval);
    };

    startPolling();

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [session?.user?.email, shouldPoll]);

  // WebSocket emit poprzez HTTP
  const socket = {
    emit: async (event: string, data: unknown): Promise<void> => {
      try {
        switch (event) {
          case "typing-start":
            await fetch("/api/messages/typing-start", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            break;

          case "typing-stop":
            await fetch("/api/messages/typing-stop", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            break;

          case "send-message":
            await fetch("/api/messages/send-socket-event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            break;

          case "messages-read":
            await fetch("/api/messages/read-socket-event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            break;

          case "message-delivered":
            await fetch("/api/messages/delivered-socket-event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            break;

          case "join-conversation":
            activeConversationsRef.current.add(data as string);
            messageTimestampsRef.current.set(data as string, Date.now());
            console.log("Joined conversation:", data);
            break;

          case "leave-conversation":
            activeConversationsRef.current.delete(data as string);
            messageListenersRef.current.delete(data as string);
            typingListenersRef.current.delete(data as string);
            messageTimestampsRef.current.delete(data as string);
            console.log("Left conversation:", data);
            break;

          case "join":
            console.log("User joined:", data);
            break;

          default:
            console.log("Unknown socket event:", event);
        }
      } catch (error) {
        console.error(`Error emitting socket event ${event}:`, error);
        throw error;
      }
    },

    on: (event: string, callback: (data: unknown) => void) => {
      console.log(`Socket listener registered for: ${event}`);
    },

    off: (event: string) => {
      console.log(`Socket listener removed for: ${event}`);
    },
  };

  const registerMessageListener = (
    conversationId: string,
    callback: (message: MessageData) => void
  ) => {
    messageListenersRef.current.set(conversationId, callback);
    activeConversationsRef.current.add(conversationId);
  };

  const unregisterMessageListener = (conversationId: string) => {
    messageListenersRef.current.delete(conversationId);
    activeConversationsRef.current.delete(conversationId);
    messageTimestampsRef.current.delete(conversationId);
  };

  const registerTypingListener = (
    conversationId: string,
    callback: (data: TypingData) => void
  ) => {
    typingListenersRef.current.set(conversationId, callback);
  };

  const unregisterTypingListener = (conversationId: string) => {
    typingListenersRef.current.delete(conversationId);
  };

  const registerConversationUpdateListener = (
    callback: (data: ConversationUpdate) => void
  ) => {
    conversationUpdateListenerRef.current = callback;
  };

  const unregisterConversationUpdateListener = () => {
    conversationUpdateListenerRef.current = null;
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        registerMessageListener,
        unregisterMessageListener,
        registerTypingListener,
        unregisterTypingListener,
        registerConversationUpdateListener,
        unregisterConversationUpdateListener,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
