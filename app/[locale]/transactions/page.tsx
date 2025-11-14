"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [activeTab, setActiveTab] = useState("pending");
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

  // najnowsze najpierw
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const pendingTransactions = sortedTransactions.filter(
    (t) =>
      t.status === "pending" &&
      (t.initiator.email === userEmail || t.receiver.email === userEmail)
  );

  const acceptedTransactions = sortedTransactions.filter(
    (t) =>
      t.status === "accepted" &&
      (t.initiator.email === userEmail || t.receiver.email === userEmail)
  );

  const completedTransactions = sortedTransactions.filter(
    (t) =>
      t.status === "completed" &&
      (t.initiator.email === userEmail || t.receiver.email === userEmail)
  );

  const rejectedTransactions = sortedTransactions.filter(
    (t) =>
      t.status === "rejected" &&
      (t.initiator.email === userEmail || t.receiver.email === userEmail)
  );

  const pendingReceivedCount = pendingTransactions.filter(
    (t) => t.receiver.email === userEmail
  ).length;

  const getTransactionsByTab = (tab: string) => {
    switch (tab) {
      case "pending":
        return pendingTransactions;
      case "accepted":
        return acceptedTransactions;
      case "completed":
        return completedTransactions;
      case "rejected":
        return rejectedTransactions;
      default:
        return [];
    }
  };

  const getEmptyMessage = (tab: string) => {
    switch (tab) {
      case "pending":
        return t("noPendingTransactions");
      case "accepted":
        return t("noAcceptedTransactions");
      case "completed":
        return t("dontHaveAnyCompleted");
      case "rejected":
        return t("noRejectedTransactions");
      default:
        return "";
    }
  };

  const renderTransactionList = (tab: string) => {
    const transactionList = getTransactionsByTab(tab);

    if (loading) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      );
    }

    if (transactionList.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{getEmptyMessage(tab)}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {transactionList.map((transaction) => (
          <TransactionCard
            key={transaction._id}
            transaction={transaction}
            userEmail={userEmail || ""}
            onStatusUpdate={handleStatusUpdate}
          />
        ))}
      </div>
    );
  };

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

      {/* mobilne: Select */}
      <div className="md:hidden mb-6">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              <div className="flex items-center gap-2">
                {t("pending")}
                {pendingReceivedCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {pendingReceivedCount}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="accepted">
              <div className="flex items-center gap-2">
                {t("accepted")}
                {acceptedTransactions.length > 0 && (
                  <Badge
                    variant="outline"
                    className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {acceptedTransactions.length}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                {t("completed")}
                {completedTransactions.length > 0 && (
                  <Badge
                    variant="outline"
                    className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {completedTransactions.length}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="rejected">
              <div className="flex items-center gap-2">
                {t("rejected")}
                {rejectedTransactions.length > 0 && (
                  <Badge
                    variant="outline"
                    className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {rejectedTransactions.length}
                  </Badge>
                )}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="mt-6">{renderTransactionList(activeTab)}</div>
      </div>

      {/* desktop: Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full hidden md:block"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-3xl">
          <TabsTrigger value="pending" className="relative">
            {t("pending")}
            {pendingReceivedCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {pendingReceivedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            {t("accepted")}
            {acceptedTransactions.length > 0 && (
              <Badge
                variant="outline"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {acceptedTransactions.length}
              </Badge>
            )}
          </TabsTrigger>
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
          <TabsTrigger value="rejected">
            {t("rejected")}
            {rejectedTransactions.length > 0 && (
              <Badge
                variant="outline"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {rejectedTransactions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {renderTransactionList("pending")}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          {renderTransactionList("accepted")}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {renderTransactionList("completed")}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {renderTransactionList("rejected")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
