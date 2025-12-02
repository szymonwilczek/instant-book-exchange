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
import { useTranslations } from "next-intl";

interface Book {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt: string;
  status: "active" | "inactive";
}

interface OfferedBooksSectionProps {
  books: Array<{
    _id: string;
    title: string;
    author?: string;
    imageUrl?: string;
    createdAt: string;
    status: "active" | "inactive";
    condition?: string;
    promotedUntil?: string;
    promotedAt?: string;
    ownerNote?: string;
  }>;
  onAddBook: () => void;
  onEditBook: (book: OfferedBooksSectionProps["books"][0]) => void;
  onDeleteBook: (bookId: string) => void;
  onPromote?: (bookId: string) => void;
  userPoints?: number;
  isPublicView?: boolean;
}

export function OfferedBooksSection({
  books,
  onAddBook,
  onEditBook,
  onDeleteBook,
  onPromote,
  userPoints,
  isPublicView,
}: OfferedBooksSectionProps) {
  const needsCarousel = books.length > 4;
  const t = useTranslations("profile");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("offeredBooks")}</CardTitle>
          <Button variant="outline" size="sm" onClick={onAddBook}>
            <Plus className="h-4 w-4 mr-2" />
            {t("addBookButton")}
          </Button>
        </div>
        <CardDescription>{t("offeredBooksSubtitle")}</CardDescription>
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
                    key={book._id}
                    book={{
                      id: book._id,
                      title: book.title,
                      author: book.author,
                      image: book.imageUrl,
                      createdAt: book.createdAt,
                      status: book.status,
                      promotedUntil: book.promotedUntil,
                      promotedAt: book.promotedAt,
                    }}
                    isReadOnly={isPublicView}
                    onEdit={isPublicView ? undefined : () => onEditBook(book)}
                    onDelete={
                      isPublicView ? undefined : () => onDeleteBook(book._id)
                    }
                    onPromote={isPublicView ? undefined : onPromote}
                    userPoints={userPoints}
                    showPromoteActions={!isPublicView}
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
                  key={book._id}
                  book={{
                    id: book._id,
                    title: book.title,
                    author: book.author,
                    image: book.imageUrl,
                    createdAt: book.createdAt,
                    status: book.status,
                    promotedUntil: book.promotedUntil,
                    promotedAt: book.promotedAt,
                  }}
                  isReadOnly={isPublicView}
                  onEdit={isPublicView ? undefined : () => onEditBook(book)}
                  onDelete={
                    isPublicView ? undefined : () => onDeleteBook(book._id)
                  }
                  onPromote={isPublicView ? undefined : onPromote}
                  userPoints={userPoints}
                  showPromoteActions={!isPublicView}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
