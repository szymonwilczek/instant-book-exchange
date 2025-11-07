"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface BookInventoryMobileProps {
  books: any[];
  offeredBooks: any[];
  onOpenSelectionModal: () => void;
}

export function BookInventoryMobile({
  books,
  offeredBooks,
  onOpenSelectionModal,
}: BookInventoryMobileProps) {
  const t = useTranslations("cart");

  if (books.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {t("dontHaveAnyOffers")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={onOpenSelectionModal}
        className="w-full"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t("addBooks")}
      </Button>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {books.map((book) => {
            const isOffered = offeredBooks.some((b) => b._id === book._id);
            return (
              <Card
                key={book._id}
                className={cn(
                  "p-3 transition-all",
                  isOffered && "opacity-50 bg-muted"
                )}
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
                    <h4 className="font-medium text-sm line-clamp-2">
                      {book.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {book.author}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {book.condition === "new"
                        ? t("new")
                        : book.condition === "used"
                          ? t("used")
                          : t("damaged")}
                    </Badge>
                    {isOffered && (
                      <Badge variant="secondary" className="text-xs mt-1 ml-1">
                        {t("offered")}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
