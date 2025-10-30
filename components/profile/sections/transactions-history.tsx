"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface Transaction {
  id: string;
  product: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "cancelled";
  buyer: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  getStatusColor: (status: string) => string;
}

export function TransactionHistory({
  transactions,
  getStatusColor,
}: TransactionHistoryProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Recent sales and order status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{transaction.product}</p>
                  <Badge
                    className={getStatusColor(transaction.status)}
                    variant="secondary"
                  >
                    {transaction.status}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {transaction.buyer}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>{transaction.date}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-foreground font-mono">
                    {transaction.id}
                  </span>
                </div>
              </div>
              <div className="text-lg font-semibold">
                ${transaction.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
