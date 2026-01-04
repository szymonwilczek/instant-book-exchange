import {
  assignTier,
  getTierThresholds,
  getScoreWeights,
  getProgressToNextTier,
} from "../lib/ranking/tierUtils";

describe("Ranking Tier Utilities", () => {
  describe("assignTier", () => {
    it("should return bronze for scores below 1000", () => {
      expect(assignTier(0)).toBe("bronze");
      expect(assignTier(500)).toBe("bronze");
      expect(assignTier(999)).toBe("bronze");
    });

    it("should return silver for scores 1000-2499", () => {
      expect(assignTier(1000)).toBe("silver");
      expect(assignTier(1500)).toBe("silver");
      expect(assignTier(2499)).toBe("silver");
    });

    it("should return gold for scores 2500-4999", () => {
      expect(assignTier(2500)).toBe("gold");
      expect(assignTier(3500)).toBe("gold");
      expect(assignTier(4999)).toBe("gold");
    });

    it("should return platinum for scores 5000-7499", () => {
      expect(assignTier(5000)).toBe("platinum");
      expect(assignTier(6000)).toBe("platinum");
      expect(assignTier(7499)).toBe("platinum");
    });

    it("should return diamond for scores 7500-9999", () => {
      expect(assignTier(7500)).toBe("diamond");
      expect(assignTier(8500)).toBe("diamond");
      expect(assignTier(9999)).toBe("diamond");
    });

    it("should return legendary for scores 10000 and above", () => {
      expect(assignTier(10000)).toBe("legendary");
      expect(assignTier(15000)).toBe("legendary");
      expect(assignTier(100000)).toBe("legendary");
    });
  });

  describe("getTierThresholds", () => {
    it("should return all 6 tiers", () => {
      const thresholds = getTierThresholds();
      expect(thresholds).toHaveLength(6);
    });

    it("should have correct tier names", () => {
      const thresholds = getTierThresholds();
      const tierNames = thresholds.map((t) => t.tier);
      expect(tierNames).toEqual([
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "legendary",
      ]);
    });

    it("should have bronze starting at 0", () => {
      const thresholds = getTierThresholds();
      const bronze = thresholds.find((t) => t.tier === "bronze");
      expect(bronze?.minScore).toBe(0);
      expect(bronze?.maxScore).toBe(999);
    });

    it("should have legendary with Infinity max", () => {
      const thresholds = getTierThresholds();
      const legendary = thresholds.find((t) => t.tier === "legendary");
      expect(legendary?.minScore).toBe(10000);
      expect(legendary?.maxScore).toBe(Infinity);
    });

    it("should have continuous thresholds (no gaps)", () => {
      const thresholds = getTierThresholds();
      for (let i = 0; i < thresholds.length - 1; i++) {
        expect(thresholds[i].maxScore + 1).toBe(thresholds[i + 1].minScore);
      }
    });
  });

  describe("getScoreWeights", () => {
    it("should return weights that sum to 1.0", () => {
      const weights = getScoreWeights();
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
    });

    it("should have all 5 score categories", () => {
      const weights = getScoreWeights();
      expect(Object.keys(weights)).toEqual([
        "trading",
        "reputation",
        "community",
        "activity",
        "quality",
      ]);
    });

    it("should have trading as highest weight (0.3)", () => {
      const weights = getScoreWeights();
      expect(weights.trading).toBe(0.3);
    });
  });

  describe("getProgressToNextTier", () => {
    it("should return 0% progress at tier start", () => {
      const result = getProgressToNextTier(0);
      expect(result.currentTier).toBe("bronze");
      expect(result.nextTier).toBe("silver");
      expect(result.progress).toBe(0);
    });

    it("should return 50% progress at tier midpoint", () => {
      const result = getProgressToNextTier(500);
      expect(result.currentTier).toBe("bronze");
      expect(result.progress).toBe(50);
    });

    it("should return 100% progress and null nextTier for legendary", () => {
      const result = getProgressToNextTier(15000);
      expect(result.currentTier).toBe("legendary");
      expect(result.nextTier).toBeNull();
      expect(result.progress).toBe(100);
    });

    it("should correctly identify next tier", () => {
      expect(getProgressToNextTier(1500).nextTier).toBe("gold");
      expect(getProgressToNextTier(3000).nextTier).toBe("platinum");
      expect(getProgressToNextTier(6000).nextTier).toBe("diamond");
    });
  });
});
