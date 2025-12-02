"use client";

import { Badge } from "@/components/ui/badge";
import { User, ArrowRightLeft, Calendar } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

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
  transactions: TransactionItem[];
  loading: boolean;
  userEmail?: string;
}

export function TransactionHistory({
  transactions,
  loading,
  userEmail,
}: TransactionHistoryProps) {
  const t = useTranslations("profile");
  const locale = useLocale();

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
    const dateLocale = locale === "pl" ? "pl-PL" : "en-US";

    if (transaction.completedAt) {
      return new Date(transaction.completedAt).toLocaleDateString(dateLocale);
    }
    if (transaction.rejectedAt) {
      return new Date(transaction.rejectedAt).toLocaleDateString(dateLocale);
    }
    if (transaction.acceptedAt) {
      return new Date(transaction.acceptedAt).toLocaleDateString(dateLocale);
    }
    return new Date(transaction.createdAt).toLocaleDateString(dateLocale);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t("noTransactionsFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const isInitiator = transaction.initiator.email === userEmail;
        const otherUser = isInitiator
          ? transaction.receiver
          : transaction.initiator;

        // ksiazki ktore "ja" otrzymuje w tej transakcji
        const incomingBooks = isInitiator
          ? (transaction.requestedBook ? [transaction.requestedBook] : [])
          : (transaction.offeredBooks || []);

        // ksiazki ktore "ja" wysylam w tej transakcji
        const outgoingBooks = isInitiator
          ? (transaction.offeredBooks || [])
          : (transaction.requestedBook ? [transaction.requestedBook] : []);

        let displayBook = null;
        let actionLabel = "";
        let moreCount = 0;

        // priorytet: pokaz to co otrzymalem. jesli nic nie otrzymalem, pokaz to co wyslalem
        if (incomingBooks.length > 0) {
          displayBook = incomingBooks[0];
          actionLabel = t("receivedFrom");
          moreCount = incomingBooks.length - 1;
        } else if (outgoingBooks.length > 0) {
          displayBook = outgoingBooks[0];
          actionLabel = t("sentTo");
          moreCount = outgoingBooks.length - 1;
        } else {
          // fallback
          actionLabel = t("transactionWith");
        }

        return (
          <div
            key={transaction._id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium line-clamp-1">
                  {displayBook?.title || t("unknownBook")}
                  {moreCount > 0 && <span className="text-muted-foreground ml-1 text-xs">(+{moreCount})</span>}
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
  );
}
