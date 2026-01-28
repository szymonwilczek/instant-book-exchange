"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name?: string;
    username?: string;
    email: string;
    image?: string;
  }>;
  book: {
    _id: string;
    title: string;
    imageUrl?: string;
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

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  onDeleteConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();
  const t = useTranslations("messages");

  const filteredConversations = conversations.filter((conv) => {
    const otherParticipant = conv.participants.find(
      (p) => p.email !== session?.user?.email
    );

    if (!otherParticipant) return false;

    const searchLower = searchQuery.toLowerCase();
    const participantName =
      otherParticipant.username ||
      otherParticipant.name ||
      otherParticipant.email;

    return (
      participantName.toLowerCase().includes(searchLower) ||
      (conv.book?.title?.toLowerCase() || "").includes(searchLower)
    );
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold">{t("messages")}</h2>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchForConversation")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredConversations.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? t("noResults") : t("noConversation")}
            </p>
          ) : (
            filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(
                (p) => p.email !== session?.user?.email
              );

              if (!otherParticipant) return null;

              const isActive = conversation._id === activeConversationId;
              const participantName =
                otherParticipant.username ||
                otherParticipant.name ||
                otherParticipant.email;

              return (
                <div
                  key={conversation._id}
                  className={cn(
                    "group flex flex-col cursor-pointer rounded-lg p-3 transition-colors hover:bg-accent",
                    isActive && "bg-accent"
                  )}
                  onClick={() => onSelect(conversation._id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-12 rounded-lg">
                      <AvatarImage src={conversation.book?.imageUrl} />
                      <AvatarFallback>
                        {(conversation.book?.title || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">
                        {conversation.book?.title || t("deletedBook")}
                      </p>

                      {conversation.lastMessage && (
                        <p className="truncate text-sm text-muted-foreground mt-1">
                          <span className="font-bold">
                            {conversation.lastMessage.sender._id ===
                              session?.user?.id ||
                              conversation.lastMessage.sender.email ===
                              session?.user?.email
                              ? t("you")
                              : participantName}
                            :
                          </span>{" "}
                          {conversation.lastMessage.attachments &&
                            conversation.lastMessage.attachments.length > 0 &&
                            !conversation.lastMessage.content ? (
                            <span>📷 {t("photo")}</span>
                          ) : (
                            conversation.lastMessage.content
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {conversation.unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="h-5 min-w-5 rounded-full px-1"
                        >
                          {conversation.unreadCount}
                        </Badge>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conversation._id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("deleteConversation")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {conversation.lastMessage &&
                    conversation.lastMessage.createdAt && (
                      <div className="flex justify-end -mt-1">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {(() => {
                            try {
                              const date = new Date(
                                conversation.lastMessage.createdAt
                              );
                              if (isNaN(date.getTime())) {
                                return "Invalid date";
                              }
                              return formatDistanceToNow(date, {
                                addSuffix: true,
                                locale: enUS,
                              });
                            } catch (error) {
                              console.error("Error formatting date:", error);
                              return "Invalid date";
                            }
                          })()}
                        </span>
                      </div>
                    )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
