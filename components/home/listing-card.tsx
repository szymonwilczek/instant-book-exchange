"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Eye, MapPin, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { ListingModal } from "./listing-modal";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ListingCardProps {
  book: any;
  owner: any;
}

export function ListingCard({ book, owner }: ListingCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card className="h-full -p-2">
        <div className="hidden md:flex h-full gap-4 p-5">
          <img
            src={book.image}
            alt={book.title}
            className="w-20 h-auto object-cover flex-shrink-0 rounded-sm"
          />

          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    by {book.author}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <p className="text-sm font-medium">{owner.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {book.location}
                </div>
              </div>
            </div>

            <div className="flex-1 mb-3">
              <p className="text-sm line-clamp-5 text-muted-foreground">
                Opis książki użytkownika (stan okładki podniszczony, cokolwiek,
                test)
              </p>
            </div>

            <div className="flex justify-between items-center">
              <Badge variant={book.status === "new" ? "default" : "secondary"}>
                {book.status}
              </Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="default" onClick={() => {}}>
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* mobile layout - pionowy */}
        <div className="md:hidden flex flex-col p-4">
          <img
            src={book.image}
            alt={book.title}
            className="w-full h-40 object-cover rounded-sm mb-4"
          />

          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold line-clamp-2">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              by {book.author}
            </p>
          </div>

          <div className="flex justify-between items-start mb-2">
            <Badge
              variant={book.status === "new" ? "default" : "secondary"}
              className="w-fit mb-3"
            >
              {book.status}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {book.location}
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="default" onClick={() => {}}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <ListingModal
        book={book}
        owner={owner}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
