"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { ListingCard } from "./listing-card";
import { Badge } from "../ui/badge";

interface PromotedBook {
  _id: string;
  title: string;
  author?: string;
  imageUrl?: string;
  condition: string;
  owner: {
    username: string;
    email: string;
    location?: string;
    profileImage?: string;
  };
  promotedUntil: string;
}

interface PromotedSectionProps {
  books: PromotedBook[];
  onBookClick: (book: PromotedBook) => void;
}

export function PromotedSection({ books, onBookClick }: PromotedSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (books.length === 0) return null;

  return (
    <Card className="border-2 border-purple-500/50 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <CardTitle className="text-purple-700 dark:text-purple-300">
              Promoted Books
            </CardTitle>
            <Badge variant="secondary">{books.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent>
          <div className="space-y-4">
            {books.map((book) => (
              <ListingCard key={book._id} book={book} owner={book.owner} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
