"use client";

import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ExchangeZoneProps {
  requestedBook: any;
  offeredBooks: any[];
  onRemoveBook: (bookId: string) => void;
}

export function ExchangeZone({
  requestedBook,
  offeredBooks,
  onRemoveBook,
}: ExchangeZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "exchange-zone",
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Drop zone - Twoje książki */}
      <div
        ref={setNodeRef}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 min-h-[200px] transition-colors",
          isOver
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/25 bg-muted/20"
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline">
            You&apos;re offering{" "}
            {offeredBooks.length > 0 ? `(${offeredBooks.length})` : ""}
          </Badge>
        </div>

        {offeredBooks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground text-center">
            Drag your books here
            <br />
            or leave empty
          </div>
        ) : (
          <div className="space-y-2">
            {offeredBooks.map((book) => (
              <Card key={book._id} className="p-3 relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveBook(book._id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex gap-3">
                  <Image
                    src={book.imageUrl || "/placeholder-book.png"}
                    height={150}
                    width={100}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm line-clamp-2">
                      {book.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {book.author}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Książka którą chcesz otrzymać */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="default">You&apos;ll receive</Badge>
        </div>
        <div className="flex gap-3">
          <Image
            width={200}
            height={350}
            src={requestedBook.imageUrl || "/placeholder-book.png"}
            alt={requestedBook.title}
            className="w-20 h-28 object-cover rounded"
          />
          <div className="flex-1">
            <h4 className="font-semibold line-clamp-2">
              {requestedBook.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {requestedBook.author}
            </p>
            <Badge variant="secondary" className="mt-2">
              {requestedBook.condition === "new"
                ? "New"
                : requestedBook.condition === "used"
                  ? "Used"
                  : "Damaged"}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
