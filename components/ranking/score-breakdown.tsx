"use client";

import { cn } from "@/lib/utils";
import { ScoreBreakdown as ScoreBreakdownType } from "@/lib/types/ranking";
import { Progress } from "@/components/ui/progress";

interface ScoreBreakdownProps {
  scores: ScoreBreakdownType;
  totalScore: number;
  className?: string;
  showValues?: boolean;
}

const categoryConfig = {
  trading: {
    label: "Trading",
    color: "bg-blue-500 dark:bg-blue-400",
    weight: 30,
  },
  reputation: {
    label: "Reputation",
    color: "bg-green-500 dark:bg-green-400",
    weight: 25,
  },
  community: {
    label: "Community",
    color: "bg-purple-500 dark:bg-purple-400",
    weight: 20,
  },
  activity: {
    label: "Activity",
    color: "bg-orange-500 dark:bg-orange-400",
    weight: 15,
  },
  quality: {
    label: "Quality",
    color: "bg-pink-500 dark:bg-pink-400",
    weight: 10,
  },
} as const;

export function ScoreBreakdown({
  scores,
  totalScore,
  className,
  showValues = true,
}: ScoreBreakdownProps) {
  const maxPossibleScore = 10000;

  return (
    <div className={cn("space-y-3", className)}>
      {Object.entries(scores).map(([key, value]) => {
        const category = categoryConfig[key as keyof ScoreBreakdownType];
        const percentage = (value / maxPossibleScore) * 100;

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{category.label}</span>
                <span className="text-xs text-muted-foreground">
                  ({category.weight}%)
                </span>
              </div>
              {showValues && (
                <span className="font-medium tabular-nums">{value} pts</span>
              )}
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full transition-all", category.color)}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
      {totalScore > 0 && (
        <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm font-semibold">
          <span>Total Score</span>
          <span className="tabular-nums">{totalScore} pts</span>
        </div>
      )}
    </div>
  );
}
