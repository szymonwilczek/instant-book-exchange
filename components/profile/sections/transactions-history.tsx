"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { User, ArrowRightLeft, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

interface TransactionUser {
  _id: string;
  email: string;
  username?: string;
}

interface TransactionBook {
  _id: string;
  title: string;
  author?: string;
}

interface TransactionItem {
  _id: string;
  initiator: TransactionUser;
  receiver: TransactionUser;
  requestedBook?: TransactionBook;
  offeredBooks?: TransactionBook[];
  status: string;
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
}

interface TransactionHistoryProps {
  userEmail?: string;
}

export function TransactionHistory({ userEmail }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("profile");

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userEmail) return;

      setLoading(true);
      try {
        const res = await fetch("/api/transactions/user");
        const data: TransactionItem[] = await res.json();
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
      pending: t("pending"),
      accepted: t("accepted"),
      rejected: t("rejected"),
      completed: t("completed"),
    };
    return labels[status] || status;
  };

  const getTransactionDate = (transaction: TransactionItem) => {
    if (transaction.completedAt) {
      return new Date(transaction.completedAt).toLocaleDateString("pl-PL");
    }
    if (transaction.rejectedAt) {
      return new Date(transaction.rejectedAt).toLocaleDateString("pl-PL");
    }
    if (transaction.acceptedAt) {
      return new Date(transaction.acceptedAt).toLocaleDateString("pl-PL");
    }
    return new Date(transaction.createdAt).toLocaleDateString("pl-PL");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  return (
    <>
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("noTransactionsFound")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const isInitiator = transaction.initiator.email === userEmail;
            const otherUser = isInitiator
              ? transaction.receiver
              : transaction.initiator;

            const receivedBook = isInitiator
              ? transaction.requestedBook
              : transaction.offeredBooks?.[0];

            const actionLabel = t("receivedFrom");

            return (
              <div
                key={transaction._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium line-clamp-1">
                      {receivedBook?.title || t("unknownBook")}
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
                      {actionLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {otherUser.username || otherUser.email}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {getTransactionDate(transaction)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
