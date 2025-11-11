"use client";

import { useState, useRef, KeyboardEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X, Loader2 } from "lucide-react";
import { useSocket } from "@/lib/context/socket-context";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Attachment {
  url: string;
  name: string;
  type: "image";
}

interface MessageInputProps {
  conversationId: string;
  userName: string;
  onSendMessage: (content: string, attachments?: Attachment[]) => void;
}

export function MessageInput({
  conversationId,
  userName,
  onSendMessage,
}: MessageInputProps) {
  const { socket } = useSocket();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations("message");

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length + attachments.length > 5) {
      toast.error(t("errors.maxLengthExceeded"), {
        position: "top-center",
        description: t("errors.maxLengthError"),
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachments((prev) => [...prev, ...data.attachments]);
      } else {
        const error = await res.json();
        toast.error(t("errors.errorOccured"), {
          position: "top-center",
          description: error.error || t("errors.failedToUploadImages"),
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("errors.errorOccured"), {
        position: "top-center",
        description: t("errors.failedToUploadImages"),
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return;

    onSendMessage(
      message.trim(),
      attachments.length > 0 ? attachments : undefined
    );
    setMessage("");
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    if (socket && message.trim()) {
      socket.emit("typing-start", {
        conversationId,
        userId: "current-user-id",
        userName: userName,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing-stop", {
          conversationId,
          userId: "current-user-id",
        });
      }, 1000);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="border-t p-4">
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative group">
              <Image
                src={attachment.url}
                alt={attachment.name}
                width={80}
                height={80}
                className="h-20 w-20 rounded-lg object-cover border"
              />
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={handleFileClick}
          disabled={isUploading || attachments.length >= 5}
          type="button"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t("typeMessage")}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={!message.trim() && attachments.length === 0}
          size="icon"
          type="button"
          className="self-center"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
