"use client";

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
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

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

  const content = (
    <>
      <img
        src={book.image}
        alt={book.title}
        className="w-full h-48 object-cover mb-4"
      />
      <p>
        <strong>Autor:</strong> {book.author}
      </p>
      <p>
        <strong>Opis:</strong> {book.description}
      </p>
      <p>
        <strong>Lokalizacja:</strong> {book.location}
      </p>
      <p>
        <strong>Właściciel:</strong> {owner.name} ({owner.email})
      </p>
      <Badge>{book.status}</Badge>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="w-screen max-w-full rounded-t-lg p-4"
        >
          <SheetHeader>
            <SheetTitle>{book.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{book.title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
