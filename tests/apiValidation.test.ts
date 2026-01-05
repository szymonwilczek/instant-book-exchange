import {
    validateRegisterInput,
    isValidEmail,
    isValidUsername,
    validateSearchParams,
    validatePaginationParams,
    validateBookInput,
    isValidISBN,
} from "../lib/api/validation";

describe("API Validation Helpers", () => {
    describe("validateRegisterInput", () => {
        it("should return valid for complete input", () => {
            const result = validateRegisterInput({
                email: "test@example.com",
                password: "password123",
                username: "testuser",
            });
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("should return error when email is missing", () => {
            const result = validateRegisterInput({
                password: "password123",
                username: "testuser",
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("All fields required");
        });

        it("should return error when password is missing", () => {
            const result = validateRegisterInput({
                email: "test@example.com",
                username: "testuser",
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("All fields required");
        });

        it("should return error when username is missing", () => {
            const result = validateRegisterInput({
                email: "test@example.com",
                password: "password123",
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("All fields required");
        });

        it("should return error for invalid email", () => {
            const result = validateRegisterInput({
                email: "invalid-email",
                password: "password123",
                username: "testuser",
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("Invalid email format");
        });

        it("should return error for short password", () => {
            const result = validateRegisterInput({
                email: "test@example.com",
                password: "12345",
                username: "testuser",
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("Password must be at least 6 characters");
        });

        it("should return error for short username", () => {
            const result = validateRegisterInput({
                email: "test@example.com",
                password: "password123",
                username: "ab",
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("Username must be at least 3 characters");
        });

        it("should return error for long username", () => {
            const result = validateRegisterInput({
                email: "test@example.com",
                password: "password123",
                username: "a".repeat(21),
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("Username must be at most 20 characters");
        });
    });

    describe("isValidEmail", () => {
        it("should return true for valid emails", () => {
            expect(isValidEmail("test@example.com")).toBe(true);
            expect(isValidEmail("user.name@domain.org")).toBe(true);
            expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
        });

        it("should return false for invalid emails", () => {
            expect(isValidEmail("invalid")).toBe(false);
            expect(isValidEmail("@example.com")).toBe(false);
            expect(isValidEmail("test@")).toBe(false);
            expect(isValidEmail("test@.com")).toBe(false);
            expect(isValidEmail("test example@test.com")).toBe(false);
        });
    });

    describe("isValidUsername", () => {
        it("should return true for valid usernames", () => {
            expect(isValidUsername("user123")).toBe(true);
            expect(isValidUsername("test_user")).toBe(true);
            expect(isValidUsername("User_Name_123")).toBe(true);
        });

        it("should return false for invalid usernames", () => {
            expect(isValidUsername("ab")).toBe(false); // too short
            expect(isValidUsername("a".repeat(21))).toBe(false); // too long
            expect(isValidUsername("user@name")).toBe(false); // invalid char
            expect(isValidUsername("user name")).toBe(false); // space
        });
    });

    describe("validateSearchParams", () => {
        it("should return defaults when no params provided", () => {
            const result = validateSearchParams({});
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.sortBy).toBe("date");
        });

        it("should parse valid page and limit", () => {
            const result = validateSearchParams({ page: "5", limit: "20" });
            expect(result.page).toBe(5);
            expect(result.limit).toBe(20);
        });

        it("should clamp page to minimum 1", () => {
            const result = validateSearchParams({ page: "0" });
            expect(result.page).toBe(1);
        });

        it("should clamp limit to maximum 100", () => {
            const result = validateSearchParams({ limit: "500" });
            expect(result.limit).toBe(100);
        });

        it("should accept valid sortBy values", () => {
            expect(validateSearchParams({ sortBy: "date" }).sortBy).toBe("date");
            expect(validateSearchParams({ sortBy: "popularity" }).sortBy).toBe("popularity");
            expect(validateSearchParams({ sortBy: "title" }).sortBy).toBe("title");
        });

        it("should default to date for invalid sortBy", () => {
            const result = validateSearchParams({ sortBy: "invalid" });
            expect(result.sortBy).toBe("date");
        });
    });

    describe("validatePaginationParams", () => {
        it("should return defaults when no params provided", () => {
            const result = validatePaginationParams({});
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.skip).toBe(0);
        });

        it("should calculate skip correctly", () => {
            const result = validatePaginationParams({ page: 3, limit: 10 });
            expect(result.skip).toBe(20);
        });

        it("should handle string params", () => {
            const result = validatePaginationParams({ page: "2", limit: "20" });
            expect(result.page).toBe(2);
            expect(result.limit).toBe(20);
            expect(result.skip).toBe(20);
        });
    });

    describe("validateBookInput", () => {
        it("should return valid for complete input", () => {
            const result = validateBookInput({
                title: "Test Book",
                author: "Test Author",
                condition: "good",
            });
            expect(result.isValid).toBe(true);
        });

        it("should return error when title is missing", () => {
            const result = validateBookInput({
                author: "Test Author",
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("Title is required");
        });

        it("should return error when author is missing", () => {
            const result = validateBookInput({
                title: "Test Book",
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("Author is required");
        });

        it("should return error for invalid condition", () => {
            const result = validateBookInput({
                title: "Test Book",
                author: "Test Author",
                condition: "invalid-condition",
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("Invalid condition");
        });

        it("should accept all valid conditions", () => {
            const conditions = ["new", "like-new", "good", "fair", "poor"];
            conditions.forEach((condition) => {
                const result = validateBookInput({
                    title: "Test",
                    author: "Author",
                    condition,
                });
                expect(result.isValid).toBe(true);
            });
        });
    });

    describe("isValidISBN", () => {
        it("should validate correct ISBN-10", () => {
            expect(isValidISBN("0-306-40615-2")).toBe(true);
            expect(isValidISBN("0306406152")).toBe(true);
        });

        it("should validate ISBN-10 with X check digit", () => {
            expect(isValidISBN("0-8044-2957-X")).toBe(true);
        });

        it("should validate correct ISBN-13", () => {
            expect(isValidISBN("978-3-16-148410-0")).toBe(true);
            expect(isValidISBN("9783161484100")).toBe(true);
        });

        it("should reject invalid ISBN", () => {
            expect(isValidISBN("1234567890")).toBe(false); // invalid checksum
            expect(isValidISBN("123")).toBe(false); // too short
            expect(isValidISBN("abcdefghij")).toBe(false); // not numbers
        });
    });
});
