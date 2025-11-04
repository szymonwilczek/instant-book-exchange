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

interface Book {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt: string;
  status: "active" | "inactive";
}

interface OfferedBooksSectionProps {
  books: Book[];
  onAddBook: () => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
}

export function OfferedBooksSection({
  books,
  onAddBook,
  onEditBook,
  onDeleteBook,
}: OfferedBooksSectionProps) {
  const needsCarousel = books.length > 4;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Offered Books</CardTitle>
          <Button variant="outline" size="sm" onClick={onAddBook}>
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        </div>
        <CardDescription>Manage your offered books</CardDescription>
      </CardHeader>
      <CardContent>
        {needsCarousel ? (
          <Carousel
            className="w-full"
            opts={{ loop: false }}
            plugins={[Autoplay({ delay: 7500 })]}
          >
            <CarouselContent>
              {books.map((book, index) => (
                <CarouselItem
                  key={index}
                  className="basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <BookCard
                    isReadOnly={false}
                    book={book}
                    onEdit={onEditBook}
                    onDelete={onDeleteBook}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        ) : (
          <div className="flex gap-4 overflow-x-auto">
            {books.map((book, index) => (
              <div key={index} className="flex-shrink-0 w-xs max-w-xs">
                <BookCard
                  isReadOnly={false}
                  book={book}
                  onEdit={onEditBook}
                  onDelete={onDeleteBook}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
