// pure utility functions for ranking - no database dependencies
// extracted for testing without db connection

export type TierType =
    | "bronze"
    | "silver"
    | "gold"
    | "platinum"
    | "diamond"
    | "legendary";

/**
 * assigns tier based on total score
 */
export function assignTier(totalScore: number): TierType {
    if (totalScore >= 10000) return "legendary";
    if (totalScore >= 7500) return "diamond";
    if (totalScore >= 5000) return "platinum";
    if (totalScore >= 2500) return "gold";
    if (totalScore >= 1000) return "silver";
    return "bronze";
}

/**
 * returns thresholds for all tiers
 */
export function getTierThresholds(): Array<{
    tier: TierType;
    minScore: number;
    maxScore: number;
}> {
    return [
        { tier: "bronze", minScore: 0, maxScore: 999 },
        { tier: "silver", minScore: 1000, maxScore: 2499 },
        { tier: "gold", minScore: 2500, maxScore: 4999 },
        { tier: "platinum", minScore: 5000, maxScore: 7499 },
        { tier: "diamond", minScore: 7500, maxScore: 9999 },
        { tier: "legendary", minScore: 10000, maxScore: Infinity },
    ];
}

/**
 * returns weight for each score category
 */
export function getScoreWeights(): Record<string, number> {
    return {
        trading: 0.3,
        reputation: 0.25,
        community: 0.2,
        activity: 0.15,
        quality: 0.1,
    };
}

/**
 * calculates progress to next tier
 */
export function getProgressToNextTier(
    currentScore: number
): { currentTier: TierType; nextTier: TierType | null; progress: number } {
    const thresholds = getTierThresholds();
    const currentTier = assignTier(currentScore);
    const currentIndex = thresholds.findIndex((t) => t.tier === currentTier);

    if (currentIndex === thresholds.length - 1) {
        return { currentTier, nextTier: null, progress: 100 };
    }

    const current = thresholds[currentIndex];
    const next = thresholds[currentIndex + 1];
    const tierRange = current.maxScore - current.minScore + 1;
    const progressInTier = currentScore - current.minScore;
    const progress = Math.min(100, Math.round((progressInTier / tierRange) * 100));

    return { currentTier, nextTier: next.tier, progress };
}
