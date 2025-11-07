"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface PointsHistorySectionProps {
  isPublicView?: boolean;
}

export function PointsHistorySection({
  isPublicView = false,
}: PointsHistorySectionProps) {
  const [history, setHistory] = useState<PointsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isPublicView) {
      fetchHistory();
    }
  }, [currentPage, isPublicView]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/user/points-history?page=${currentPage}&limit=10`
      );
      const data = await res.json();
      setHistory(data.history || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching points history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isPublicView) return null;

  return (
    <>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : history.length === 0 ? (
        <p className="text-muted-foreground">No points history yet.</p>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {item.type === "earned" ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div
                className={`text-lg font-bold ${
                  item.type === "earned" ? "text-green-600" : "text-red-600"
                }`}
              >
                {item.type === "earned" ? "+" : "-"}
                {item.amount}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
