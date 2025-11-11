"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, Check, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

interface AchievementCardProps {
  achievement: {
    _id: string;
    id: string;
    nameKey?: string;
    descriptionKey?: string;
    icon: string;
    tier: "bronze" | "silver" | "gold" | "platinum";
    points: number;
    requirement: Record<string, number> | undefined;
    progress?: number;
    unlocked?: boolean;
    unlockedAt?: Date;
  };
  isCurrentTier?: boolean;
  isNextTier?: boolean;
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

const tierBorders = {
  bronze: "border-[#8B6F47]",
  silver: "border-[#A8A8A8]",
  gold: "border-[#F4D03F]",
  platinum: "border-[#4DD0E1]",
};

const tierLabels = {
  bronze: "Brązowy",
  silver: "Srebrny",
  gold: "Złoty",
  platinum: "Platynowy",
};

export function AchievementCard({
  achievement,
  isCurrentTier = false,
  isNextTier = false,
}: AchievementCardProps) {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";
  const t = useTranslations();

  const requirement = achievement.requirement
    ? Object.values(achievement.requirement)[0] || 1
    : 1;
  const progress = achievement.progress || 0;
  const progressPercent = Math.min((progress / requirement) * 100, 100);

  const metallicGradient = isDark
    ? darkMetallicGradients[achievement.tier]
    : lightMetallicGradients[achievement.tier];

  const tierLabels = {
    bronze: t("achievements.tiers.bronze"),
    silver: t("achievements.tiers.silver"),
    gold: t("achievements.tiers.gold"),
    platinum: t("achievements.tiers.platinum"),
  };

  return (
    <Card
      className={cn(
        "relative border-2 transition-all h-full p-2 overflow-hidden",
        achievement.unlocked
          ? tierBorders[achievement.tier]
          : "border-muted bg-muted/20 grayscale opacity-60"
      )}
      style={
        achievement.unlocked
          ? {
              background: metallicGradient,
            }
          : undefined
      }
    >
      {achievement.unlocked && (
        <>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, 
            transparent 40%, 
            rgba(255, 255, 255, ${isDark ? "0.2" : "0.35"}) 50%, 
            transparent 60%
          )`,
                width: "200%",
                height: "200%",
                animation: "sheenSlide 12.5s linear infinite",
              }}
            />
          </div>
        </>
      )}

      <CardContent className="p-4 space-y-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="text-4xl drop-shadow-sm">{achievement.icon}</div>
          {achievement.unlocked ? (
            <Check className="h-5 w-5 text-green-600 drop-shadow" />
          ) : isNextTier ? (
            <Target className="h-5 w-5 text-yellow-600" />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div>
          <h3
            className={cn(
              "font-semibold text-lg leading-tight",
              achievement.unlocked && "drop-shadow-sm"
            )}
          >
            {t(achievement.nameKey || "")}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                achievement.unlocked &&
                  "bg-white/30 dark:bg-black/40 backdrop-blur-sm"
              )}
            >
              {tierLabels[achievement.tier]}
            </Badge>
            {isCurrentTier && (
              <Badge className="text-xs bg-primary">
                {t("achievements.current")}
              </Badge>
            )}
            {isNextTier && (
              <Badge className="text-xs bg-yellow-600">
                {t("achievements.nextGoal")}
              </Badge>
            )}
          </div>
        </div>

        <p
          className={cn(
            "text-sm",
            achievement.unlocked
              ? "text-foreground/80 drop-shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {t(achievement.descriptionKey || "")}
        </p>

        {!achievement.unlocked && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("achievements.progress")}</span>
              <span>
                {progress}/{requirement}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        <div className="pt-2 border-t border-foreground/10">
          <span
            className={cn(
              "text-sm font-medium",
              achievement.unlocked
                ? "text-foreground drop-shadow-sm"
                : "text-primary"
            )}
          >
            +{achievement.points} {t("achievements.pointsGained")}
          </span>
        </div>

        {achievement.unlockedAt && (
          <p className="text-xs text-foreground/70">
            {t("achievements.hasBeenUnlocked")}{" "}
            {new Date(achievement.unlockedAt).toLocaleDateString("pl-PL")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
