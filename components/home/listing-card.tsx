"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Eye, MapPin, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { ListingModal } from "./listing-modal";
import { StartConversationModal } from "@/components/messages/start-conversation-modal";
import { useCart } from "@/lib/context/cart-context";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ListingCardProps {
  book: {
    _id: string;
    title: string;
    author: string;
    imageUrl?: string;
    ownerNote?: string;
    description?: string;
    condition: "new" | "used" | "damaged";
    viewCount?: number;
    promotedUntil?: string;
  };
  owner: {
    _id: string;
    username?: string;
    name?: string;
    location?: string;
  };
  isMatch?: boolean;
}

export function ListingCard({
  book,
  owner,
  isMatch = false,
}: ListingCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const { addToCart, loading } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("listings");

  const isPromoted =
    book.promotedUntil && new Date(book.promotedUntil) > new Date();

  const handleViewBook = async () => {
    setIsModalOpen(true);

    // inkrementacja viewCount
    try {
      await fetch(`/api/books/${book._id}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const handleSendMessage = () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (owner._id === session.user?.id) {
      toast.error(t("errors.waitASecond"), {
        position: "top-center",
        description: t("errors.messageToYourself"),
      });
      return;
    }

    setIsMessageModalOpen(true);
  };

  const handleAddToCart = async () => {
    if (!session) {
      toast.error(t("errors.waitASecond"), {
        position: "top-center",
        description: t("errors.leggedInCartError"),
      });
      return;
    }

    try {
      await addToCart(book._id);
    } catch (error) {
      // juz obsluzony w useCart
      console.error("Error adding book to cart:", error);
    }
  };

  const conditionLabel = {
    new: t("conditions.new"),
    used: t("conditions.used"),
    damaged: t("conditions.damaged"),
  };

  return (
    <>
      <Card
        className={`h-full -p-2 ${isMatch ? "border-2 border-orange-500" : ""} ${isPromoted ? "border-2 border-purple-500" : ""}`}
      >
        <div className="hidden md:flex h-full gap-4 p-5">
          {isPromoted && (
            <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-semibold">
              {t("promoted.badge")}
            </div>
          )}

          <Image
            width={80}
            height={112}
            src={book.imageUrl || "/placeholder-book.png"}
            alt={book.title}
            className="w-20 h-28 object-cover flex-shrink-0 rounded-sm"
          />

          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    by <span className="font-medium">{book.author}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <p className="text-sm font-medium">
                  {owner.username || owner.name}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {owner.location || t("errors.noLocation")}
                </div>
              </div>
            </div>

            <div className="flex-1 mb-3">
              <p className="text-sm line-clamp-2 max-w-2xl text-muted-foreground">
                {book.ownerNote ||
                  book.description ||
                  t("errors.noDescription")}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Badge
                  variant={book.condition === "new" ? "default" : "secondary"}
                >
                  {
                    conditionLabel[
                      book.condition as keyof typeof conditionLabel
                    ]
                  }
                </Badge>
                <Badge variant="outline">
                  <Eye className="w-3 h-3 mr-1" />
                  {book.viewCount || 0}
                </Badge>
                {isPromoted && (
                  <Badge className="bg-purple-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    {t("promoted.promoted")}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendMessage}
                  title="Send message"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleViewBook}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleAddToCart}
                  disabled={loading}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* mobile layout - pionowy */}
        <div
          className={`md:hidden flex flex-col p-4 relative ${isMatch ? "border-2 border-orange-500" : ""} ${isPromoted ? "border-2 border-purple-500" : ""}`}
        >
          {isPromoted && (
            <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-semibold">
              {t("promoted.badge")}
            </div>
          )}

          <Image
            src={book.imageUrl || "/placeholder-book.png"}
            width={160}
            height={200}
            alt={book.title}
            className="w-full h-40 object-contain rounded-sm mb-4"
          />

          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold line-clamp-2">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              by <span className="font-medium">{book.author}</span>
            </p>
          </div>

          <div className="flex justify-between items-start mb-2">
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={book.condition === "new" ? "default" : "secondary"}
                className="w-fit"
              >
                {conditionLabel[book.condition as keyof typeof conditionLabel]}
              </Badge>
              <Badge variant="outline">
                <Eye className="w-3 h-3 mr-1" />
                {book.viewCount || 0}
              </Badge>
              {isPromoted && (
                <Badge className="bg-purple-500 text-white w-fit">
                  <Star className="w-3 h-3 mr-1" />
                  {t("promoted.promoted")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {owner.location || t("errors.noLocation")}
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline" onClick={handleSendMessage}>
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleViewBook}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handleAddToCart}
              disabled={loading}
            >
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

      <StartConversationModal
        open={isMessageModalOpen}
        onOpenChange={setIsMessageModalOpen}
        book={{
          _id: book._id,
          title: book.title,
          author: book.author,
          coverImage: book.imageUrl,
        }}
        recipientId={owner._id}
        recipientName={owner.username || owner.name || t("errors.unknown")}
      />
    </>
  );
}
