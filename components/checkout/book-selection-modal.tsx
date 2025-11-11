"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface BookSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  books: any[];
  selectedBooks: any[];
  onConfirm: (selectedBooks: any[]) => void;
}

export function BookSelectionModal({
  open,
  onOpenChange,
  books,
  selectedBooks,
  onConfirm,
}: BookSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const t = useTranslations("checkout");

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalSelected(selectedBooks.map((b) => b._id));
      setSearchQuery("");
    }
    onOpenChange(newOpen);
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBookSelection = (bookId: string) => {
    setLocalSelected((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleConfirm = () => {
    const selected = books.filter((b) => localSelected.includes(b._id));
    onConfirm(selected);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalSelected(selectedBooks.map((b) => b._id));
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col w-full h-[90vh] max-h-[90vh] p-0 gap-0">
        <DialogHeader className="border-b px-6 py-4 flex-shrink-0">
          <DialogTitle>{t("selectBooksToOffer")}</DialogTitle>
          <DialogDescription className="mt-2">
            {t("selectBooksDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 border-b flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchBooks")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="px-6 py-4 space-y-2">
            {books.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t("dontHaveAnyOffers")}
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t("noBookFound")}
              </div>
            ) : (
              filteredBooks.map((book) => {
                const isSelected = localSelected.includes(book._id);
                return (
                  <Card
                    key={book._id}
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => toggleBookSelection(book._id)}
                  >
                    <div className="flex gap-4 items-start">
                      <div className="relative flex-shrink-0">
                        <Image
                          src={book.imageUrl || "/placeholder-book.png"}
                          width={80}
                          height={120}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                            <Check className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold line-clamp-2">
                          {book.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {book.author}
                        </p>
                        <Badge variant="outline" className="text-xs mt-2">
                          {book.condition === "new"
                            ? t("new")
                            : book.condition === "used"
                              ? t("used")
                              : t("damaged")}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="border-t px-6 py-4 space-y-3 flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {t("selected")}:{" "}
            <span className="font-semibold">{localSelected.length}</span> /{" "}
            {books.length}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              {t("cancel")}
            </Button>
            <Button onClick={handleConfirm}>{t("confirm")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
