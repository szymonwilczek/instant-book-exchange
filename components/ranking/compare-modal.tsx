"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TierBadge } from "./tier-badge";
import { ScoreBreakdown } from "./score-breakdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaderboardEntry } from "@/lib/types/ranking";
import { useRouter } from "next/navigation";

interface CompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user1Id: string;
  user2Id: string;
}

interface ComparisonData {
  user1: LeaderboardEntry;
  user2: LeaderboardEntry;
  differences: {
    scoreDiff: number;
    rankDiff: number;
    scoreBreakdown: {
      trading: number;
      reputation: number;
      community: number;
      activity: number;
      quality: number;
    };
  };
}

export function CompareModal({
  open,
  onOpenChange,
  user1Id,
  user2Id,
}: CompareModalProps) {
  const router = useRouter();
  const [data, setData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user1Id || !user2Id) return;

    const fetchComparison = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/ranking/compare?user1=${user1Id}&user2=${user2Id}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch comparison");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparison();
  }, [open, user1Id, user2Id]);

  const renderUserCard = (user: LeaderboardEntry, side: "left" | "right") => (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar className="h-20 w-20 border-4 border-background">
          <AvatarImage src={user.profileImage} alt={user.username} />
          <AvatarFallback className="text-2xl">
            {user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{user.username}</h3>
          <div className="mt-1 flex items-center justify-center gap-2">
            <TierBadge tier={user.tier} size="sm" showLabel />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Rank</span>
          <span className="text-2xl font-bold">#{user.rank}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Score</span>
          <span className="text-lg font-semibold tabular-nums">
            {user.totalScore.toLocaleString()}
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => router.push(`/profile/${user.userId}`)}
      >
        View Profile
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  const renderStatsComparison = (data: ComparisonData) => {
    const stats = [
      {
        label: "Completed Trades",
        user1: data.user1.stats.completedTransactions,
        user2: data.user2.stats.completedTransactions,
      },
      {
        label: "Average Rating",
        user1: data.user1.stats.averageRating.toFixed(1),
        user2: data.user2.stats.averageRating.toFixed(1),
      },
      {
        label: "Total Reviews",
        user1: data.user1.stats.totalReviews,
        user2: data.user2.stats.totalReviews,
      },
      {
        label: "Books Added",
        user1: data.user1.stats.booksAdded,
        user2: data.user2.stats.booksAdded,
      },
      {
        label: "Login Streak",
        user1: `${data.user1.stats.loginStreakDays} days`,
        user2: `${data.user2.stats.loginStreakDays} days`,
      },
    ];

    return (
      <div className="space-y-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <span className="w-1/3 text-sm font-medium tabular-nums">
              {stat.user1}
            </span>
            <span className="w-1/3 text-center text-xs text-muted-foreground">
              {stat.label}
            </span>
            <span className="w-1/3 text-right text-sm font-medium tabular-nums">
              {stat.user2}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Users</DialogTitle>
          <DialogDescription>
            Side-by-side comparison of user rankings and statistics
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6">
            <div className="flex gap-6">
              <Skeleton className="h-48 flex-1" />
              <Skeleton className="h-48 flex-1" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* User Cards */}
            <div className="flex gap-6">
              {renderUserCard(data.user1, "left")}
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
              </div>
              {renderUserCard(data.user2, "right")}
            </div>

            {/* Score Difference */}
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">Score Difference</p>
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  data.differences.scoreDiff > 0
                    ? "text-green-600 dark:text-green-400"
                    : data.differences.scoreDiff < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground",
                )}
              >
                {data.differences.scoreDiff > 0 ? "+" : ""}
                {data.differences.scoreDiff.toLocaleString()} pts
              </p>
            </div>

            {/* Score Breakdown Comparison */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-3 font-semibold">
                  {data.user1.username}&apos;s Scores
                </h4>
                <ScoreBreakdown
                  scores={data.user1.scores}
                  totalScore={data.user1.totalScore}
                />
              </div>
              <div>
                <h4 className="mb-3 font-semibold">
                  {data.user2.username}&apos;s Scores
                </h4>
                <ScoreBreakdown
                  scores={data.user2.scores}
                  totalScore={data.user2.totalScore}
                />
              </div>
            </div>

            {/* Stats Comparison */}
            <div>
              <h4 className="mb-3 font-semibold">Detailed Statistics</h4>
              {renderStatsComparison(data)}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
