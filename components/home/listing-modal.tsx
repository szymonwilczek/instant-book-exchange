"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, MapPin, Eye } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { StartConversationModal } from "@/components/messages/start-conversation-modal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ListingModalProps {
  book: any;
  owner: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListingModal({
  book,
  owner,
  open,
  onOpenChange,
}: ListingModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const conditionLabel = {
    new: "Nowy",
    used: "Używany",
    damaged: "Uszkodzony",
  };

  const handleSendMessage = () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (owner._id === session.user?.id) {
      alert("Nie możesz wysłać wiadomości do siebie");
      return;
    }

    setMessageModalOpen(true);
  };

  const content = (
    <div className="space-y-4">
      <img
        src={book.imageUrl || "/placeholder-book.png"}
        alt={book.title}
        className="w-full h-64 object-cover rounded-lg"
      />

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">
            Autor
          </h4>
          <p className="text-base">{book.author}</p>
        </div>

        {book.description && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Opis książki
            </h4>
            <p className="text-sm">{book.description}</p>
          </div>
        )}

        {book.ownerNote && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Notatka właściciela
            </h4>
            <p className="text-sm italic">{book.ownerNote}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Badge variant={book.condition === "new" ? "default" : "secondary"}>
            {conditionLabel[book.condition as keyof typeof conditionLabel]}
          </Badge>
          <Badge variant="outline">
            <Eye className="w-3 h-3 mr-1" />
            {book.viewCount || 0} wyświetleń
          </Badge>
        </div>

        <div className="pt-2 border-t">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Właściciel
          </h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{owner.username || owner.name}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {owner.location || "Brak lokalizacji"}
              </div>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={handleSendMessage}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Wyślij wiadomość
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            className="w-screen max-w-full rounded-t-lg p-4 max-h-[90vh] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>{book.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{content}</div>
          </SheetContent>
        </Sheet>

        <StartConversationModal
          open={messageModalOpen}
          onOpenChange={setMessageModalOpen}
          book={{
            _id: book._id,
            title: book.title,
            author: book.author,
            coverImage: book.imageUrl,
          }}
          recipientId={owner._id}
          recipientName={owner.username || owner.name}
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{book.title}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      <StartConversationModal
        open={messageModalOpen}
        onOpenChange={setMessageModalOpen}
        book={{
          _id: book._id,
          title: book.title,
          author: book.author,
          coverImage: book.imageUrl,
        }}
        recipientId={owner._id}
        recipientName={owner.username || owner.name}
      />
    </>
  );
}
