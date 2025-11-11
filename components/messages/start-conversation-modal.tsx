"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Book {
  _id: string;
  title: string;
  author: string;
  coverImage?: string;
}

interface StartConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book;
  recipientId: string;
  recipientName: string;
}

export function StartConversationModal({
  open,
  onOpenChange,
  book,
  recipientId,
  recipientName,
}: StartConversationModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("messages");

  const handleSubmit = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    try {
      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: recipientId,
          bookId: book._id,
        }),
      });

      if (!convRes.ok) {
        toast.error(t("errors.errorOccured"), {
          position: "top-center",
          description: t("errors.failedToCreateConversation"),
        });
      }

      const convData = await convRes.json();

      const msgRes = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convData.conversation._id,
          content: message,
        }),
      });

      if (!msgRes.ok) {
        toast.error(t("errors.errorOccured"), {
          position: "top-center",
          description: t("errors.failedToSendMessage"),
        });
      }

      onOpenChange(false);
      router.push(`/messages?conversation=${convData.conversation._id}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error(t("errors.errorOccured"), {
        position: "top-center",
        description: t("errors.failedToSendMessage"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t("sendMessageTo")} {recipientName}
          </DialogTitle>
          <DialogDescription>
            {t("startConversationAboutBook")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            {book.coverImage && (
              <Image
                width={150}
                height={200}
                src={book.coverImage}
                alt={book.title}
                className="h-16 w-12 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold">{book.title}</p>
              <p className="text-sm text-muted-foreground">{book.author}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t("message")}</Label>
            <Textarea
              id="message"
              placeholder={t("typeMessage")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/2000 {t("characters")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("cancelButton")}
          </Button>
          <Button onClick={handleSubmit} disabled={!message.trim() || loading}>
            {loading ? t("sendingMessage") : t("sendMessage")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
