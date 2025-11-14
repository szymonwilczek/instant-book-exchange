"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, ArrowRightLeft, Coins, MessageSquare } from "lucide-react";
import { TransactionHistory } from "./transactions-history";
import { PointsHistorySection } from "./points-history-section";
import { ReviewsHistory } from "./reviews-history";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

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

interface Review {
  _id: string;
  rating: number;
  comment?: string;
  reviewer: {
    name?: string;
    email: string;
    username?: string;
  };
  createdAt: string;
}

interface PointsHistoryItem {
  _id: string;
  amount: number;
  type: "earned" | "spent";
  source: string;
  description: string;
  createdAt: string;
  relatedBook?: {
    title: string;
    imageUrl?: string;
  };
}

interface HistorySectionProps {
  userEmail?: string;
  isPublicView?: boolean;
}

export function HistorySection({
  userEmail,
  isPublicView,
}: HistorySectionProps) {
  const t = useTranslations("profile");

  // States for Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // States for Transactions
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // States for Points History
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>([]);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        const endpoint = userEmail
          ? `/api/reviews/user?email=${userEmail}`
          : "/api/reviews/my-reviews";

        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    }

    fetchReviews();
  }, [userEmail]);

  // Fetch Transactions
  useEffect(() => {
    async function fetchTransactions() {
      if (!userEmail) {
        setTransactionsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/transactions/user");
        const data: TransactionItem[] = await res.json();
        setTransactions(data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setTransactionsLoading(false);
      }
    }

    fetchTransactions();
  }, [userEmail]);

  // Fetch Points History
  useEffect(() => {
    async function fetchPointsHistory() {
      if (isPublicView) {
        setPointsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/user/points-history?page=${currentPage}&limit=10`
        );
        const data = await res.json();
        setPointsHistory(data.history || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (error) {
        console.error("Error fetching points history:", error);
      } finally {
        setPointsLoading(false);
      }
    }

    fetchPointsHistory();
  }, [currentPage, isPublicView]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <CardTitle>{t("history")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">{t("transactions")}</span>
              <span className="sr-only sm:hidden">{t("transactions")}</span>
            </TabsTrigger>
            <TabsTrigger value="points" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">
                {t("points")}
              </span>
              <span className="sr-only sm:hidden">
                {t("points")}
              </span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">
                {t("reviews")}
              </span>
              <span className="sr-only sm:hidden">
                {t("reviews")}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4">
            <div className="lg:max-h-[450px] lg:overflow-y-auto">
              <TransactionHistory
                transactions={transactions}
                loading={transactionsLoading}
                userEmail={userEmail}
              />
            </div>
          </TabsContent>

          <TabsContent value="points" className="mt-4">
            <div className="lg:max-h-[450px] lg:overflow-y-auto">
              <PointsHistorySection
                history={pointsHistory}
                loading={pointsLoading}
                isPublicView={isPublicView}
              />
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <div className="lg:max-h-[450px] lg:overflow-y-auto">
              <ReviewsHistory reviews={reviews} loading={reviewsLoading} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card >
  );
}
