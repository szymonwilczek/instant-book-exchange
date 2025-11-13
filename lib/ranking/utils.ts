import { TierType, ScoreBreakdown } from "@/lib/types/ranking";

/**
 * Zwraca kolor dla tier (do użycia w charts/badges)
 */
export function getTierColor(tier: TierType): string {
  const colors: Record<TierType, string> = {
    bronze: "#cd7f32",
    silver: "#c0c0c0",
    gold: "#ffd700",
    platinum: "#00d9ff",
    diamond: "#b9f2ff",
    legendary: "#ffa500",
  };
  return colors[tier];
}

/**
 * Oblicza % postępu do następnego tier
 */
export function getTierProgress(
  currentScore: number,
  currentTier: TierType,
): { nextTier: TierType | null; progress: number; pointsNeeded: number } {
  const thresholds: Record<TierType, number> = {
    bronze: 0,
    silver: 500,
    gold: 1500,
    platinum: 3000,
    diamond: 5000,
    legendary: 8000,
  };

  const tiers: TierType[] = [
    "bronze",
    "silver",
    "gold",
    "platinum",
    "diamond",
    "legendary",
  ];

  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex === tiers.length - 1) {
    return { nextTier: null, progress: 100, pointsNeeded: 0 };
  }

  const nextTier = tiers[currentIndex + 1];
  const currentThreshold = thresholds[currentTier];
  const nextThreshold = thresholds[nextTier];

  const pointsInCurrentTier = currentScore - currentThreshold;
  const pointsNeededForNextTier = nextThreshold - currentThreshold;
  const progress = (pointsInCurrentTier / pointsNeededForNextTier) * 100;

  return {
    nextTier,
    progress: Math.min(Math.max(progress, 0), 100),
    pointsNeeded: nextThreshold - currentScore,
  };
}

/**
 * Formatuje score breakdown do wyświetlenia (z kategoriami)
 */
export function formatScoreBreakdown(scores: ScoreBreakdown): {
  category: string;
  score: number;
  percentage: number;
}[] {
  const maxPossible = 10000;

  return [
    {
      category: "Trading",
      score: scores.trading,
      percentage: (scores.trading / maxPossible) * 100,
    },
    {
      category: "Reputation",
      score: scores.reputation,
      percentage: (scores.reputation / maxPossible) * 100,
    },
    {
      category: "Community",
      score: scores.community,
      percentage: (scores.community / maxPossible) * 100,
    },
    {
      category: "Activity",
      score: scores.activity,
      percentage: (scores.activity / maxPossible) * 100,
    },
    {
      category: "Quality",
      score: scores.quality,
      percentage: (scores.quality / maxPossible) * 100,
    },
  ];
}

/**
 * Sprawdza czy user jest "premium" (Platinum+)
 */
export function isPremiumTier(tier: TierType): boolean {
  return tier === "platinum" || tier === "diamond" || tier === "legendary";
}

/**
 * Zwraca nazwę tier dla display
 */
export function getTierLabel(tier: TierType): string {
  const labels: Record<TierType, string> = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    diamond: "Diamond",
    legendary: "Legendary",
  };
  return labels[tier];
}

/**
 * Zwraca emoji/icon dla tier
 */
export function getTierIcon(tier: TierType): string {
  const icons: Record<TierType, string> = {
    bronze: "🥉",
    silver: "🥈",
    gold: "🥇",
    platinum: "💎",
    diamond: "👑",
    legendary: "🏆",
  };
  return icons[tier];
}

/**
 * Formatuje rank dla display (z ordinal suffix)
 */
export function formatRank(rank: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = rank % 100;
  const suffix = suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
  return `${rank}${suffix}`;
}

/**
 * Oblicza trend direction (-1 = down, 0 = same, 1 = up)
 */
export function getRankTrend(
  currentRank: number,
  previousRank: number,
): -1 | 0 | 1 {
  if (previousRank === 0 || currentRank === previousRank) return 0;
  return currentRank < previousRank ? 1 : -1;
}
