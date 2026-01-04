import {
    getTierColor,
    getTierProgress,
    formatScoreBreakdown,
    isPremiumTier,
    getTierLabel,
    getTierIcon,
    formatRank,
    getRankTrend,
} from "../lib/ranking/utils";

describe("Ranking Utils", () => {
    describe("getTierColor", () => {
        it("should return correct color for each tier", () => {
            expect(getTierColor("bronze")).toBe("#cd7f32");
            expect(getTierColor("silver")).toBe("#c0c0c0");
            expect(getTierColor("gold")).toBe("#ffd700");
            expect(getTierColor("platinum")).toBe("#00d9ff");
            expect(getTierColor("diamond")).toBe("#b9f2ff");
            expect(getTierColor("legendary")).toBe("#ffa500");
        });

        it("should return valid hex colors", () => {
            const hexRegex = /^#[0-9a-f]{6}$/i;
            expect(getTierColor("bronze")).toMatch(hexRegex);
            expect(getTierColor("gold")).toMatch(hexRegex);
        });
    });

    describe("getTierProgress", () => {
        it("should return 100% progress and null nextTier for legendary", () => {
            const result = getTierProgress(10000, "legendary");
            expect(result.nextTier).toBeNull();
            expect(result.progress).toBe(100);
            expect(result.pointsNeeded).toBe(0);
        });

        it("should calculate progress correctly for bronze", () => {
            const result = getTierProgress(250, "bronze");
            expect(result.nextTier).toBe("silver");
            expect(result.progress).toBe(50);
            expect(result.pointsNeeded).toBe(250);
        });

        it("should return silver as next tier for bronze", () => {
            const result = getTierProgress(0, "bronze");
            expect(result.nextTier).toBe("silver");
        });

        it("should clamp progress between 0 and 100", () => {
            const result = getTierProgress(600, "bronze");
            expect(result.progress).toBeLessThanOrEqual(100);
            expect(result.progress).toBeGreaterThanOrEqual(0);
        });
    });

    describe("formatScoreBreakdown", () => {
        it("should return all 5 categories", () => {
            const scores = {
                trading: 100,
                reputation: 200,
                community: 150,
                activity: 50,
                quality: 75,
            };
            const result = formatScoreBreakdown(scores);
            expect(result).toHaveLength(5);
        });

        it("should include correct category names", () => {
            const scores = {
                trading: 0,
                reputation: 0,
                community: 0,
                activity: 0,
                quality: 0,
            };
            const result = formatScoreBreakdown(scores);
            const categories = result.map((r) => r.category);
            expect(categories).toEqual([
                "Trading",
                "Reputation",
                "Community",
                "Activity",
                "Quality",
            ]);
        });

        it("should calculate percentage correctly", () => {
            const scores = {
                trading: 1000,
                reputation: 0,
                community: 0,
                activity: 0,
                quality: 0,
            };
            const result = formatScoreBreakdown(scores);
            const trading = result.find((r) => r.category === "Trading");
            expect(trading?.percentage).toBe(10); // 1000/10000 * 100
        });
    });

    describe("isPremiumTier", () => {
        it("should return true for platinum, diamond, legendary", () => {
            expect(isPremiumTier("platinum")).toBe(true);
            expect(isPremiumTier("diamond")).toBe(true);
            expect(isPremiumTier("legendary")).toBe(true);
        });

        it("should return false for bronze, silver, gold", () => {
            expect(isPremiumTier("bronze")).toBe(false);
            expect(isPremiumTier("silver")).toBe(false);
            expect(isPremiumTier("gold")).toBe(false);
        });
    });

    describe("getTierLabel", () => {
        it("should return capitalized tier names", () => {
            expect(getTierLabel("bronze")).toBe("Bronze");
            expect(getTierLabel("silver")).toBe("Silver");
            expect(getTierLabel("gold")).toBe("Gold");
            expect(getTierLabel("platinum")).toBe("Platinum");
            expect(getTierLabel("diamond")).toBe("Diamond");
            expect(getTierLabel("legendary")).toBe("Legendary");
        });
    });

    describe("getTierIcon", () => {
        it("should return emoji for each tier", () => {
            expect(getTierIcon("bronze")).toBe("🥉");
            expect(getTierIcon("silver")).toBe("🥈");
            expect(getTierIcon("gold")).toBe("🥇");
            expect(getTierIcon("platinum")).toBe("💎");
            expect(getTierIcon("diamond")).toBe("👑");
            expect(getTierIcon("legendary")).toBe("🏆");
        });
    });

    describe("formatRank", () => {
        it("should add correct suffix for 1st, 2nd, 3rd", () => {
            expect(formatRank(1)).toBe("1st");
            expect(formatRank(2)).toBe("2nd");
            expect(formatRank(3)).toBe("3rd");
        });

        it("should add th suffix for 4-20", () => {
            expect(formatRank(4)).toBe("4th");
            expect(formatRank(11)).toBe("11th");
            expect(formatRank(12)).toBe("12th");
            expect(formatRank(13)).toBe("13th");
        });

        it("should handle 21st, 22nd, 23rd correctly", () => {
            expect(formatRank(21)).toBe("21st");
            expect(formatRank(22)).toBe("22nd");
            expect(formatRank(23)).toBe("23rd");
        });

        it("should handle larger numbers", () => {
            expect(formatRank(100)).toBe("100th");
            expect(formatRank(101)).toBe("101st");
            expect(formatRank(111)).toBe("111th");
        });
    });

    describe("getRankTrend", () => {
        it("should return 1 when rank improved (lower number)", () => {
            expect(getRankTrend(5, 10)).toBe(1);
            expect(getRankTrend(1, 100)).toBe(1);
        });

        it("should return -1 when rank worsened (higher number)", () => {
            expect(getRankTrend(10, 5)).toBe(-1);
            expect(getRankTrend(100, 1)).toBe(-1);
        });

        it("should return 0 when rank unchanged", () => {
            expect(getRankTrend(5, 5)).toBe(0);
            expect(getRankTrend(100, 100)).toBe(0);
        });

        it("should return 0 when previousRank is 0 (new user)", () => {
            expect(getRankTrend(10, 0)).toBe(0);
        });
    });
});
