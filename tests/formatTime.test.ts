import { formatExchangeTime } from "../lib/utils/format-time";

// mock translation function
const createMockT = (translations: Record<string, string>) => {
    return (key: string) => translations[key] || key;
};

describe("formatExchangeTime", () => {
    describe("English locale - hours", () => {
        const t = createMockT({
            hour: "hour",
            hours: "hours",
            day: "day",
            days: "days",
        });

        it("should format 1 hour correctly", () => {
            const result = formatExchangeTime(0, 1, t, "en");
            expect(result).toBe("1 hour");
        });

        it("should format multiple hours correctly", () => {
            const result = formatExchangeTime(0, 5, t, "en");
            expect(result).toBe("5 hours");
        });

        it("should format 2 hours correctly", () => {
            const result = formatExchangeTime(0, 2, t, "en");
            expect(result).toBe("2 hours");
        });
    });

    describe("English locale - days", () => {
        const t = createMockT({
            hour: "hour",
            hours: "hours",
            day: "day",
            days: "days",
        });

        it("should format 1 day correctly", () => {
            const result = formatExchangeTime(1, 0, t, "en");
            expect(result).toBe("1.0 day");
        });

        it("should format multiple days correctly", () => {
            const result = formatExchangeTime(5, 0, t, "en");
            expect(result).toBe("5.0 days");
        });

        it("should format decimal days correctly", () => {
            const result = formatExchangeTime(2.5, 0, t, "en");
            expect(result).toBe("2.5 days");
        });
    });

    describe("Polish locale - hours", () => {
        const t = createMockT({
            hour: "godzina",
            hours: "godziny",
            hoursMany: "godzin",
            day: "dzień",
            days: "dni",
            daysMany: "dni",
        });

        it("should format 1 hour correctly in Polish", () => {
            const result = formatExchangeTime(0, 1, t, "pl");
            expect(result).toBe("1 godzina");
        });

        it("should format 2-4 hours correctly in Polish", () => {
            expect(formatExchangeTime(0, 2, t, "pl")).toBe("2 godziny");
            expect(formatExchangeTime(0, 3, t, "pl")).toBe("3 godziny");
            expect(formatExchangeTime(0, 4, t, "pl")).toBe("4 godziny");
        });

        it("should format 5+ hours correctly in Polish", () => {
            expect(formatExchangeTime(0, 5, t, "pl")).toBe("5 godzin");
            expect(formatExchangeTime(0, 10, t, "pl")).toBe("10 godzin");
        });
    });

    describe("Polish locale - days", () => {
        const t = createMockT({
            hour: "godzina",
            hours: "godziny",
            hoursMany: "godzin",
            day: "dzień",
            days: "dni",
            daysMany: "dni",
        });

        it("should format 1 day correctly in Polish", () => {
            const result = formatExchangeTime(1, 0, t, "pl");
            expect(result).toBe("1.0 dzień");
        });

        it("should format 2-4 days correctly in Polish", () => {
            expect(formatExchangeTime(2, 0, t, "pl")).toBe("2.0 dni");
            expect(formatExchangeTime(3, 0, t, "pl")).toBe("3.0 dni");
            expect(formatExchangeTime(4, 0, t, "pl")).toBe("4.0 dni");
        });

        it("should format 5+ days correctly in Polish", () => {
            expect(formatExchangeTime(5, 0, t, "pl")).toBe("5.0 dni");
            expect(formatExchangeTime(10, 0, t, "pl")).toBe("10.0 dni");
        });
    });
});
