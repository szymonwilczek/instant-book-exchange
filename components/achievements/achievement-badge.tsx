import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

interface AchievementBadgeProps {
  achievement: {
    icon: string;
    nameKey?: string;
    descriptionKey?: string;
    tier: "bronze" | "silver" | "gold" | "platinum";
    points: number;
  };
  size?: "sm" | "md" | "lg";
  unlocked?: boolean;
}

// gradienty dla light mode
const lightMetallicGradients = {
  bronze:
    "linear-gradient(135deg, #8b5d47ff 0%, #6B5444 20%, #A67C52 40%, #7D5E42 60%, #95765A 80%, #8B5D47 100%)",
  silver:
    "linear-gradient(135deg, #D3D3D3 0%, #A8A8A8 25%, #F0F0F0 50%, #BEBEBE 75%, #D3D3D3 100%)",
  gold: "linear-gradient(135deg, #F9E79F 0%, #F4D03F 25%, #FEF5E7 50%, #F7DC6F 75%, #F9E79F 100%)",
  platinum:
    "linear-gradient(135deg, #B2EBF2 0%, #80DEEA 25%, #E0F7FA 50%, #4DD0E1 75%, #B2EBF2 100%)",
};

// gradienty dla dark mode
const darkMetallicGradients = {
  bronze:
    "linear-gradient(135deg, #422f1fff 0%, #4A3528 20%, #734c35ff 40%, #61472F 60%, #422d1bff 80%, #422f1fff 100%)",
  silver:
    "linear-gradient(135deg, #5A5A5A 0%, #3D3D3D 25%, #787878 50%, #4F4F4F 75%, #5A5A5A 100%)",
  gold: "linear-gradient(135deg, #9A7D0A 0%, #7D6608 25%, #B7950B 50%, #85730A 75%, #9A7D0A 100%)",
  platinum:
    "linear-gradient(135deg, #00838F 0%, #006064 25%, #00ACC1 50%, #00838F 75%, #00838F 100%)",
};

export function AchievementBadge({
  achievement,
  size = "md",
  unlocked = true,
}: AchievementBadgeProps) {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";
  const t = useTranslations();

  const metallicGradient = isDark
    ? darkMetallicGradients[achievement.tier]
    : lightMetallicGradients[achievement.tier];

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
              "cursor-pointer w-12 h-12",
              sizeClasses[size],
              !unlocked && "grayscale opacity-40"
            )}
            style={{
              background: metallicGradient,
              color: isDark ? "#e5e5e5" : "#1a1a1a",
            }}
          >
            {achievement.icon}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-background">
              {t(achievement.nameKey || "")}
            </p>
            <p className="text-sm text-muted-background">
              {t(achievement.descriptionKey || "")}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              +{achievement.points} points
            </p>
            {!unlocked && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                🔒 {t("achievements.locked")}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
