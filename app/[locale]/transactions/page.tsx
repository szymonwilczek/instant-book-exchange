"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { TransactionCard } from "@/components/transactions/transaction-card";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface TransactionData {
  _id: string;
  initiator: {
    email: string;
    username: string;
  };
  receiver: {
    email: string;
    username: string;
  };
  status: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const t = useTranslations("transactions");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (searchParams && searchParams.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }

    fetchTransactions();
  }, [status, router, searchParams]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions/user");
      const data = await res.json();
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTransactions();
      } else {
        const error = await res.json();
        toast.error(`Wystąpił błąd!`, {
          position: "top-center",
          description: error.error || t("failedToUpdate"),
        });
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error(`Wystąpił błąd!`, {
        position: "top-center",
        description: t("failedToUpdate"),
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-center items-center h-[50vh]">
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const userEmail = session.user?.email;

  // sortowanie po dacie (najnowsze najpierw)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // filtrowanie transakcji
  const sentTransactions = sortedTransactions.filter(
    (t) => t.initiator.email === userEmail && t.status !== "completed"
  );

  const receivedTransactions = sortedTransactions.filter(
    (t) => t.receiver.email === userEmail && t.status !== "completed"
  );

  const completedTransactions = sortedTransactions.filter(
    (t) =>
      t.status === "completed" &&
      (t.initiator.email === userEmail || t.receiver.email === userEmail)
  );

  // statystyki
  const pendingReceived = receivedTransactions.filter(
    (t) => t.status === "pending"
  ).length;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {showSuccess && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            {t("successSubmit")}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="received" className="relative">
            {t("received")}
            {pendingReceived > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {pendingReceived}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">{t("sent")}</TabsTrigger>
          <TabsTrigger value="completed">
            {t("completed")}
            {completedTransactions.length > 0 && (
              <Badge
                variant="outline"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {completedTransactions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          ) : receivedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t("notReceivedAnyOffers")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction._id}
                  transaction={transaction}
                  userEmail={userEmail || ""}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          ) : sentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t("haventSentAnyOffers")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction._id}
                  transaction={transaction}
                  userEmail={userEmail || ""}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          ) : completedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t("dontHaveAnyCompleted")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction._id}
                  transaction={transaction}
                  userEmail={userEmail || ""}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
