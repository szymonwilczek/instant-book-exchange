"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowRightLeft,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Star,
  Package,
  User,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ReviewModal } from "./review-modal";
import { StartConversationModal } from "@/components/messages/start-conversation-modal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface TransactionCardProps {
  transaction: any;
  userEmail: string;
  onStatusUpdate: (id: string, status: string) => void;
}

export function TransactionCard({
  transaction,
  userEmail,
  onStatusUpdate,
}: TransactionCardProps) {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const isReceiver = transaction.receiver.email === userEmail;
  const otherUser = isReceiver ? transaction.initiator : transaction.receiver;

  const statusConfig = {
    pending: {
      label: "Pending",
      color: "bg-yellow-500",
      variant: "secondary" as const,
    },
    accepted: {
      label: "Accepted",
      color: "bg-green-500",
      variant: "default" as const,
    },
    rejected: {
      label: "Rejected",
      color: "bg-red-500",
      variant: "destructive" as const,
    },
    completed: {
      label: "Completed",
      color: "bg-blue-500",
      variant: "outline" as const,
    },
  };

  const deliveryMethodLabels = {
    personal: { label: "Personal pickup", icon: User },
    paczkomat: { label: "Książkomat Parcel", icon: Package },
    courier: { label: "Courier", icon: Truck },
  };

  const status = statusConfig[transaction.status as keyof typeof statusConfig];
  const deliveryInfo =
    deliveryMethodLabels[
      transaction.deliveryMethod as keyof typeof deliveryMethodLabels
    ] || deliveryMethodLabels.personal;
  const DeliveryIcon = deliveryInfo.icon;

  const handleSendMessage = () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setMessageModalOpen(true);
  };

  const handleReview = async (rating: number, comment: string) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction._id,
          reviewedUserId: otherUser._id,
          rating,
          comment,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit review");
      }

      alert("Dziękujemy za opinię!");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    }
  };

  const handleComplete = () => {
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    await handleReview(rating, comment);
    onStatusUpdate(transaction._id, "completed");
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Lewa strona - informacje */}
          <div className="flex-1 space-y-4">
            {/* Header z użytkownikiem */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={otherUser.profileImage} />
                  <AvatarFallback>
                    {otherUser.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {isReceiver ? "Od: " : "Do: "}
                    {otherUser.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {otherUser.email}
                  </p>
                </div>
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            {/* Książki */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Książka requestowana */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {isReceiver ? "Your book" : "You want to receive"}
                </p>
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                  <img
                    src={
                      transaction.requestedBook.imageUrl ||
                      "/placeholder-book.png"
                    }
                    alt={transaction.requestedBook.title}
                    className="w-16 h-20 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-2">
                      {transaction.requestedBook.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {transaction.requestedBook.author}
                    </p>
                  </div>
                </div>
              </div>

              {/* Książki oferowane */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {isReceiver ? "In exchange for" : "Your offer"}
                </p>
                {transaction.offeredBooks.length === 0 ? (
                  <div className="flex items-center justify-center h-28 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                    No exchange
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transaction.offeredBooks.map((book: any) => (
                      <div
                        key={book._id}
                        className="flex gap-3 p-2 bg-muted/50 rounded-lg"
                      >
                        <img
                          src={book.imageUrl || "/placeholder-book.png"}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs line-clamp-2">
                            {book.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {book.author}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lokalizacja, metoda dostawy i data */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <DeliveryIcon className="h-4 w-4" />
                {deliveryInfo.label}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {transaction.exchangeLocation}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {format(new Date(transaction.createdAt), "d MMM yyyy, HH:mm", {
                  locale: pl,
                })}
              </div>
            </div>

            {/* Akcje */}
            <div className="flex flex-wrap gap-2 pt-2">
              {isReceiver && transaction.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onStatusUpdate(transaction._id, "accepted")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onStatusUpdate(transaction._id, "rejected")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}

              {transaction.status === "accepted" && (
                <Button size="sm" variant="outline" onClick={handleComplete}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as completed
                </Button>
              )}

              {transaction.status === "completed" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReviewModalOpen(true)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  See reviews
                </Button>
              )}

              <Button size="sm" variant="ghost" onClick={handleSendMessage}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Send message
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <ReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        transaction={transaction}
        onSubmit={handleReviewSubmit}
      />

      <StartConversationModal
        open={messageModalOpen}
        onOpenChange={setMessageModalOpen}
        book={{
          _id: transaction.requestedBook._id,
          title: transaction.requestedBook.title,
          author: transaction.requestedBook.author,
          coverImage: transaction.requestedBook.imageUrl,
        }}
        recipientId={otherUser._id}
        recipientName={otherUser.username || otherUser.name}
      />
    </>
  );
}
