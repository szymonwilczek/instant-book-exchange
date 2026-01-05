import { cn } from "../lib/utils";

describe("cn utility function", () => {
    describe("basic class merging", () => {
        it("should return single class unchanged", () => {
            expect(cn("text-red-500")).toBe("text-red-500");
        });

        it("should merge multiple classes", () => {
            const result = cn("text-red-500", "bg-blue-500");
            expect(result).toContain("text-red-500");
            expect(result).toContain("bg-blue-500");
        });

        it("should handle empty input", () => {
            expect(cn()).toBe("");
        });

        it("should handle undefined values", () => {
            expect(cn("text-red-500", undefined)).toBe("text-red-500");
        });

        it("should handle null values", () => {
            expect(cn("text-red-500", null)).toBe("text-red-500");
        });

        it("should handle false values", () => {
            expect(cn("text-red-500", false)).toBe("text-red-500");
        });
    });

    describe("tailwind class conflict resolution", () => {
        it("should resolve conflicting padding classes", () => {
            const result = cn("p-4", "p-2");
            expect(result).toBe("p-2");
        });

        it("should resolve conflicting margin classes", () => {
            const result = cn("m-4", "m-8");
            expect(result).toBe("m-8");
        });

        it("should resolve conflicting text color classes", () => {
            const result = cn("text-red-500", "text-blue-500");
            expect(result).toBe("text-blue-500");
        });

        it("should resolve conflicting background classes", () => {
            const result = cn("bg-red-500", "bg-blue-500");
            expect(result).toBe("bg-blue-500");
        });
    });

    describe("conditional classes", () => {
        it("should include class when condition is true", () => {
            const isActive = true;
            const result = cn("base-class", isActive && "active-class");
            expect(result).toContain("active-class");
        });

        it("should exclude class when condition is false", () => {
            const isActive = false;
            const result = cn("base-class", isActive && "active-class");
            expect(result).not.toContain("active-class");
        });
    });

    describe("array of classes", () => {
        it("should handle array input", () => {
            const result = cn(["text-red-500", "bg-blue-500"]);
            expect(result).toContain("text-red-500");
            expect(result).toContain("bg-blue-500");
        });
    });

    describe("object syntax", () => {
        it("should include class when object value is true", () => {
            const result = cn({ "text-red-500": true, "bg-blue-500": false });
            expect(result).toContain("text-red-500");
            expect(result).not.toContain("bg-blue-500");
        });
    });
});
