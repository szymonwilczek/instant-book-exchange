"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { BookCard } from "../book-card";

interface BookBase {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt: string;
}

interface WishlistSectionProps {
  wishlist?: BookBase[];
  onRemoveFromWishlist: (bookId: string) => void;
  onAddToWishlist: () => void;
  isPublicView?: boolean;
}

export function WishlistSection({
  wishlist,
  onRemoveFromWishlist,
  onAddToWishlist,
  isPublicView = false,
}: WishlistSectionProps) {

  if (!wishlist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wishlist</CardTitle>
          <CardDescription>Books you want to receive</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ładowanie listy życzeń...</p>
        </CardContent>
      </Card>
    );
  }

  const needsCarousel = wishlist.length > 4;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Wishlist</CardTitle>
          {!isPublicView && (
            <Button variant="outline" size="sm" onClick={onAddToWishlist}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj książkę
            </Button>
          )}
        </div>
        <CardDescription>
          {isPublicView
            ? "Książki, które chce otrzymać"
            : "Książki, które chcesz otrzymać"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {wishlist.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>
              {isPublicView
                ? "Ta lista życzeń jest pusta"
                : "Twoja lista życzeń jest pusta"}
            </p>
            {!isPublicView && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={onAddToWishlist}
              >
                <Plus className="h-4 w-4 mr-2" />
                Dodaj pierwszą książkę
              </Button>
            )}
          </div>
        ) : needsCarousel ? (
          <Carousel
            className="w-full"
            opts={{ loop: false }}
            plugins={[Autoplay({ delay: 7500 })]}
          >
            <CarouselContent>
              {wishlist.map((book) => (
                <CarouselItem
                  key={book.id}
                  className="basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <BookCard
                    book={book}
                    isReadOnly={isPublicView}
                    onDelete={isPublicView ? undefined : onRemoveFromWishlist}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        ) : (
          <div className="flex gap-4 overflow-x-auto">
            {wishlist.map((book, index) => (
              <div key={index} className="flex-shrink-0 w-xs max-w-xs">
                <BookCard
                  book={book}
                  isReadOnly={isPublicView}
                  onDelete={isPublicView ? undefined : onRemoveFromWishlist}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
