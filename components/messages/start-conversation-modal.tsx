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
        throw new Error("Failed to create conversation");
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
        throw new Error("Failed to send message");
      }

      onOpenChange(false);
      router.push(`/messages?conversation=${convData.conversation._id}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send message to {recipientName}</DialogTitle>
          <DialogDescription>
            Start a conversation about the book
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Book Info */}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            {book.coverImage && (
              <img
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

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/2000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!message.trim() || loading}>
            {loading ? "Sending..." : "Send message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
