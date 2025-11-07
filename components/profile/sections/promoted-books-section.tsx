"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookCard } from "../book-card";
import { Sparkles } from "lucide-react";

interface PromotedBooksSectionProps {
  books: Array<{
    _id: string;
    title: string;
    author?: string;
    imageUrl?: string;
    createdAt: string;
    promotedUntil?: string;
    promotedAt?: string;
  }>;
  userPoints: number;
  onExtend: (bookId: string) => void;
  onCancel: (bookId: string) => void;
  isPublicView?: boolean;
}

export function PromotedBooksSection({
  books,
  userPoints,
  onExtend,
  onCancel,
  isPublicView = false,
}: PromotedBooksSectionProps) {
  if (isPublicView) return null;
  if (!books || !Array.isArray(books) || books.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-600" />
          <CardTitle>Promoted Books</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.isArray(books) &&
            books.map((book) => (
              <BookCard
                key={book._id}
                book={{
                  id: book._id,
                  title: book.title,
                  author: book.author,
                  image: book.imageUrl,
                  createdAt: book.createdAt,
                  promotedUntil: book.promotedUntil,
                  promotedAt: book.promotedAt,
                }}
                userPoints={userPoints}
                showPromoteActions={true}
                onExtend={onExtend}
                onCancel={onCancel}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
