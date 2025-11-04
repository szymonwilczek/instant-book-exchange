"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, ArrowRightLeft, Calendar } from "lucide-react";

interface TransactionUser {
  _id: string;
  email: string;
  username?: string;
}

interface TransactionBook {
  _id: string;
  title: string;
}

interface TransactionItem {
  _id: string;
  initiator: TransactionUser;
  receiver: TransactionUser;
  requestedBook?: TransactionBook;
  offeredBooks?: unknown[];
  status: string;
  createdAt: string;
}

interface TransactionHistoryProps {
  userEmail?: string;
}

export function TransactionHistory({ userEmail }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userEmail) return;

      setLoading(true);
      try {
        const res = await fetch("/api/transactions/user");
        const data: TransactionItem[] = await res.json();

        // na razie tylko ostatnie 5 transakcji
        setTransactions(data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userEmail]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "accepted":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected",
      completed: "Completed",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
          <CardDescription>Recent book exchanges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Transaction history</CardTitle>
        <CardDescription>Recent book exchanges</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const isInitiator = transaction.initiator.email === userEmail;
              const otherUser = isInitiator
                ? transaction.receiver
                : transaction.initiator;

              return (
                <div
                  key={transaction._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium line-clamp-1">
                        {transaction.requestedBook?.title || "Nieznana książka"}
                      </p>
                      <Badge
                        className={getStatusColor(transaction.status)}
                        variant="outline"
                      >
                        {getStatusLabel(transaction.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ArrowRightLeft className="h-3 w-3" />
                        {isInitiator ? "Sent to" : "Received from"}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {otherUser.username || otherUser.email}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(transaction.createdAt).toLocaleDateString(
                          "pl-PL"
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.offeredBooks &&
                    transaction.offeredBooks.length > 0
                      ? `${transaction.offeredBooks.length} ${
                          transaction.offeredBooks.length === 1
                            ? "book"
                            : "books"
                        }`
                      : "No exchange"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
