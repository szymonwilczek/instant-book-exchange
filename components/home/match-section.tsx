"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ShoppingCart, Heart } from "lucide-react";
import { useState } from "react";
import { ListingModal } from "./listing-modal";
import { useCart } from "@/lib/context/cart-context";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface MatchSectionProps {
  matches: any[];
}

export function MatchSection({ matches }: MatchSectionProps) {
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart, loading } = useCart();

  const handleViewBook = async (match: any) => {
    setSelectedBook(match);
    setIsModalOpen(true);

    // inkrementacja viewCount
    try {
      await fetch(`/api/books/${match.offeredBook._id}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const handleAddToCart = async (bookId: string) => {
    try {
      await addToCart(bookId);
    } catch (error) {
      // juz obsluzony w useCart
    }
  };

  if (matches.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
        <h2 className="text-xl font-bold">Dopasowania dla Ciebie</h2>
        <Badge variant="secondary">{matches.length}</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {matches.slice(0, 5).map((match, idx) => {
          const book = match.offeredBook;
          const owner = match.owner;

          return (
            <Card key={idx} className="overflow-hidden group cursor-pointer">
              <div className="relative aspect-[2/3]">
                <img
                  src={book.imageUrl || "/placeholder-book.png"}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleViewBook(match)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAddToCart(book._id)}
                    disabled={loading}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  {book.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {book.author}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  od {owner.username}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedBook && (
        <ListingModal
          book={selectedBook.offeredBook}
          owner={selectedBook.owner}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </div>
  );
}
