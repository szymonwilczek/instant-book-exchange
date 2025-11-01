// components/home/ListingModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{book.title}</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
