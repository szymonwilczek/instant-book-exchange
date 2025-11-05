"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useTranslations } from "next-intl";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface BookInventoryProps {
  books: any[];
  offeredBooks: any[];
}

function DraggableBook({ book, isOffered }: { book: any; isOffered: boolean }) {
  const t = useTranslations("cart");
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: book._id,
      disabled: isOffered,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isOffered ? "opacity-40 cursor-not-allowed" : ""
      }`}
    >
      <div className="flex gap-3">
        <Image
          width={150}
          height={200}
          src={book.imageUrl || "/placeholder-book.png"}
          alt={book.title}
          className="w-12 h-16 object-cover rounded"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2">{book.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {book.author}
          </p>
          <Badge variant="outline" className="text-xs mt-1">
            {book.condition === "new"
              ? t('new') 
              : book.condition === "used"
                ? t('used') 
                : t('damaged')} 
          </Badge>
        </div>
      </div>
    </Card>
  );
}

export function BookInventory({ books, offeredBooks }: BookInventoryProps) {
  const { setNodeRef } = useDroppable({
    id: "inventory",
  });
  const t = useTranslations("cart");

  if (books.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        {t('dontHaveAnyOffers')}
      </div>
    );
  }

  return (
    <div ref={setNodeRef}>
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-2">
          {books.map((book) => {
            const isOffered = offeredBooks.some((b) => b._id === book._id);
            return (
              <DraggableBook key={book._id} book={book} isOffered={isOffered} />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
