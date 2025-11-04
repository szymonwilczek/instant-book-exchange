"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X, MapPin, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/context/cart-context";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

interface CartItemBook {
  _id: string;
  title: string;
  author: string;
  imageUrl?: string;
  condition: string;
  owner: {
    _id: string;
    username: string;
    location?: string;
    profileImage?: string;
    averageRating?: number;
  };
}

export function CartSheet() {
  const { cart, cartCount, removeFromCart, loading } = useCart();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleCheckout = () => {
    setOpen(false);
    router.push("/checkout");
  };

  const handleRemove = async (bookId: string) => {
    try {
      await removeFromCart(bookId);
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  // grupowanie ksiazek po wlascicielu (uzytkowniku wystawiajacym)
  const groupedByOwner = React.useMemo(() => {
    const groups: {
      [key: string]: Array<{ book: CartItemBook; addedAt: string }>;
    } = {};

    cart.forEach((item) => {
      const ownerId = item.book.owner._id;
      if (!groups[ownerId]) {
        groups[ownerId] = [];
      }
      groups[ownerId].push(item);
    });

    return Object.values(groups);
  }, [cart]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <ShoppingCart className="h-4 w-4" />
          {cartCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {cartCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart ({cartCount})
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Something feels empty here... Add something!
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Browse books
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-120px)] mt-6">
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-6">
                {groupedByOwner.map((ownerBooks, idx) => {
                  const owner = ownerBooks[0].book.owner;
                  return (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 space-y-3 bg-muted/30"
                    >
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            From: {owner.username}
                          </p>
                          {owner.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {owner.location}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {ownerBooks.length}{" "}
                          {ownerBooks.length === 1 ? "book" : "books"}
                        </Badge>
                      </div>

                      {ownerBooks.map((item) => (
                        <div
                          key={item.book._id}
                          className="flex gap-3 items-start"
                        >
                          <Image
                            src={item.book.imageUrl || "/placeholder-book.png"}
                            alt={item.book.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">
                              {item.book.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {item.book.author}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {item.book.condition === "new"
                                ? "New"
                                : item.book.condition === "used"
                                  ? "Used"
                                  : "Damaged"}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(item.book._id)}
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 px-4 mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transactions:</span>
                <span className="font-semibold">{groupedByOwner.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Books:</span>
                <span className="font-semibold">{cartCount}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={loading}
              >
                Go to exchange
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
