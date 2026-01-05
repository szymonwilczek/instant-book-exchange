import {
    BISAC_CATEGORIES,
    GENRE_DISPLAY_MAP,
    simplifyGenre,
} from "../lib/data/bisac-categories";

describe("BISAC Categories", () => {
    describe("BISAC_CATEGORIES constant", () => {
        it("should contain 15 categories", () => {
            expect(BISAC_CATEGORIES).toHaveLength(15);
        });

        it("should include fiction categories", () => {
            expect(BISAC_CATEGORIES).toContain("FICTION / Fantasy / General");
            expect(BISAC_CATEGORIES).toContain("FICTION / Science Fiction / General");
            expect(BISAC_CATEGORIES).toContain("FICTION / Romance / General");
            expect(BISAC_CATEGORIES).toContain("FICTION / Horror");
        });

        it("should include nonfiction categories", () => {
            expect(BISAC_CATEGORIES).toContain("NONFICTION / Biography & Autobiography");
            expect(BISAC_CATEGORIES).toContain("NONFICTION / History / General");
            expect(BISAC_CATEGORIES).toContain("NONFICTION / Self-Help / General");
        });

        it("should include young adult categories", () => {
            expect(BISAC_CATEGORIES).toContain("YOUNG ADULT FICTION / Fantasy / General");
            expect(BISAC_CATEGORIES).toContain("YOUNG ADULT FICTION / Romance / General");
        });

        it("should include juvenile category", () => {
            expect(BISAC_CATEGORIES).toContain("JUVENILE FICTION / Fantasy & Magic");
        });
    });

    describe("GENRE_DISPLAY_MAP constant", () => {
        it("should have mapping for all BISAC categories", () => {
            BISAC_CATEGORIES.forEach((category) => {
                expect(GENRE_DISPLAY_MAP).toHaveProperty(category);
            });
        });

        it("should have correct display names", () => {
            expect(GENRE_DISPLAY_MAP["FICTION / Fantasy / General"]).toBe("Fantasy");
            expect(GENRE_DISPLAY_MAP["FICTION / Science Fiction / General"]).toBe("Science Fiction");
            expect(GENRE_DISPLAY_MAP["FICTION / Horror"]).toBe("Horror");
            expect(GENRE_DISPLAY_MAP["NONFICTION / Biography & Autobiography"]).toBe("Biography");
        });

        it("should have YA prefixed names for young adult", () => {
            expect(GENRE_DISPLAY_MAP["YOUNG ADULT FICTION / Fantasy / General"]).toBe("YA Fantasy");
            expect(GENRE_DISPLAY_MAP["YOUNG ADULT FICTION / Romance / General"]).toBe("YA Romance");
        });

        it("should have children's prefix for juvenile", () => {
            expect(GENRE_DISPLAY_MAP["JUVENILE FICTION / Fantasy & Magic"]).toBe("Children's Fantasy");
        });
    });

    describe("simplifyGenre function", () => {
        it("should return display name for known genre", () => {
            expect(simplifyGenre("FICTION / Fantasy / General")).toBe("Fantasy");
            expect(simplifyGenre("FICTION / Horror")).toBe("Horror");
            expect(simplifyGenre("NONFICTION / History / General")).toBe("History");
        });

        it("should extract last part for unknown genre", () => {
            expect(simplifyGenre("FICTION / Some New Genre / Subcategory")).toBe("Subcategory");
            expect(simplifyGenre("UNKNOWN / Category")).toBe("Category");
        });

        it("should return original string if no slash found", () => {
            expect(simplifyGenre("SimpleGenre")).toBe("SimpleGenre");
        });

        it("should trim whitespace from extracted genre", () => {
            expect(simplifyGenre("FICTION / Genre With Spaces ")).toBe("Genre With Spaces");
        });

        it("should handle empty string", () => {
            expect(simplifyGenre("")).toBe("");
        });
    });
});
