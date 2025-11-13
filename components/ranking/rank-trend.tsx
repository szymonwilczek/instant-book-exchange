"use client";

import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface RankTrendProps {
  currentRank: number;
  previousRank: number;
  className?: string;
}

export function RankTrend({
  currentRank,
  previousRank,
  className,
}: RankTrendProps) {
  const difference = previousRank - currentRank;

  if (difference === 0 || previousRank === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground",
          className,
        )}
      >
        <Minus className="h-3 w-3" />
        <span>No change</span>
      </span>
    );
  }

  const isPositive = difference > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isPositive
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400",
        className,
      )}
      title={
        isPositive
          ? `Up ${difference} position${difference > 1 ? "s" : ""}`
          : `Down ${Math.abs(difference)} position${Math.abs(difference) > 1 ? "s" : ""}`
      }
    >
      {isPositive ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      <span>{Math.abs(difference)}</span>
    </span>
  );
}
