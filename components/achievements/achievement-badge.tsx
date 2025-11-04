import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  achievement: {
    icon: string;
    name: string;
    description: string;
    tier: "bronze" | "silver" | "gold" | "platinum";
    points: number;
  };
  size?: "sm" | "md" | "lg";
  unlocked?: boolean;
}

const tierColors = {
  bronze: "bg-amber-700 text-white border-amber-800",
  silver: "bg-slate-400 text-slate-900 border-slate-500",
  gold: "bg-yellow-500 text-yellow-900 border-yellow-600",
  platinum: "bg-cyan-400 text-cyan-900 border-cyan-500",
};

export function AchievementBadge({
  achievement,
  size = "md",
  unlocked = true,
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: "text-base p-1",
    md: "text-xl p-1.5",
    lg: "text-2xl p-2",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              "cursor-pointer transition-all hover:scale-110",
              tierColors[achievement.tier],
              sizeClasses[size],
              !unlocked && "grayscale opacity-40"
            )}
          >
            {achievement.icon}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{achievement.name}</p>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
            <p className="text-xs font-medium text-primary">
              +{achievement.points} points
            </p>
            {!unlocked && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                🔒 Locked
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
