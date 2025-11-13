"use client";

import { cn } from "@/lib/utils";
import { TierType } from "@/lib/types/ranking";
import { useTranslations } from "next-intl";

interface TierBadgeProps {
  tier: TierType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TierBadge({
  tier,
  size = "md",
  showLabel = false,
  className,
}: TierBadgeProps) {

  const t = useTranslations("ranking");
  const tierConfig: Record<
    TierType,
    {
      icon: string;
      color: string;
      label: string;
    }
  > = {
    bronze: {
      icon: "🥉",
      color: "text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800",
      label: t("tiers.bronze"),
    },
    silver: {
      icon: "🥈",
      color: "text-gray-700 bg-gray-100 border-gray-300 dark:text-gray-400 dark:bg-gray-950 dark:border-gray-800",
      label: t("tiers.silver"),
    },
    gold: {
      icon: "🥇",
      color: "text-yellow-700 bg-yellow-100 border-yellow-300 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800",
      label: t("tiers.gold"),
    },
    platinum: {
      icon: "💎",
      color: "text-cyan-700 bg-cyan-100 border-cyan-300 dark:text-cyan-400 dark:bg-cyan-950 dark:border-cyan-800",
      label: t("tiers.platinum"),
    },
    diamond: {
      icon: "👑",
      color: "text-purple-700 bg-purple-100 border-purple-300 dark:text-purple-400 dark:bg-purple-950 dark:border-purple-800",
      label: t("tiers.diamond"),
    },
    legendary: {
      icon: "🏆",
      color: "text-amber-700 bg-amber-100 border-amber-300 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800 animate-pulse",
      label: t("tiers.legendary"),
    },
  };
  const config = tierConfig[tier];

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        config.color,
        sizeClasses[size],
        className,
      )}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
