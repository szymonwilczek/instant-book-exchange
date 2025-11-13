"use client";

import { cn } from "@/lib/utils";
import { LeaderboardEntry } from "@/lib/types/ranking";
import { TierBadge } from "./tier-badge";
import { RankTrend } from "./rank-trend";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface RankingCardProps {
  entry: LeaderboardEntry;
  position: number;
  isCurrentUser?: boolean;
  className?: string;
}

export function RankingCard({
  entry,
  position,
  isCurrentUser = false,
  className,
}: RankingCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/profile/${entry.userId}`);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-orange-600";
    return "text-muted-foreground";
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-4 rounded-lg border p-4 transition-all hover:border-primary hover:shadow-md cursor-pointer",
        isCurrentUser && "border-primary bg-primary/5",
        className,
      )}
    >
      {/* Rank Number */}
      <div className="flex w-12 items-center justify-center">
        <span
          className={cn(
            "text-2xl font-bold tabular-nums",
            getRankColor(position),
          )}
        >
          #{position}
        </span>
      </div>

      {/* Avatar */}
      <Avatar className="h-12 w-12 border-2 border-background">
        <AvatarImage src={entry.profileImage} alt={entry.username} />
        <AvatarFallback>{entry.username.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">{entry.username}</p>
          <TierBadge tier={entry.tier} size="sm" />
          {isCurrentUser && (
            <span className="text-xs font-medium text-primary">(You)</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-muted-foreground tabular-nums">
            {entry.totalScore.toLocaleString()} pts
          </p>
          <RankTrend
            currentRank={entry.rank}
            previousRank={entry.previousRank}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
        <div className="text-center">
          <p className="font-semibold text-foreground tabular-nums">
            {entry.stats.completedTransactions}
          </p>
          <p className="text-xs">Trades</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground tabular-nums">
            {entry.stats.averageRating.toFixed(1)}
          </p>
          <p className="text-xs">Rating</p>
        </div>
      </div>
    </div>
  );
}
