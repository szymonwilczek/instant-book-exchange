// API validation helpers - pure functions for testing
// extracted from API routes for unit testing without database

export interface RegisterInput {
    email?: string;
    password?: string;
    username?: string;
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * validates register input - checks required fields
 */
export function validateRegisterInput(input: RegisterInput): ValidationResult {
    if (!input.email || !input.password || !input.username) {
        return { isValid: false, error: "All fields required" };
    }

    if (!isValidEmail(input.email)) {
        return { isValid: false, error: "Invalid email format" };
    }

    if (input.password.length < 6) {
        return { isValid: false, error: "Password must be at least 6 characters" };
    }

    if (input.username.length < 3) {
        return { isValid: false, error: "Username must be at least 3 characters" };
    }

    if (input.username.length > 20) {
        return { isValid: false, error: "Username must be at most 20 characters" };
    }

    return { isValid: true };
}

/**
 * validates email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * validates username format
 */
export function isValidUsername(username: string): boolean {
    // alphanumeric and underscores only, 3-20 chars
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
}

/**
 * validates search query params
 */
export function validateSearchParams(params: {
    page?: string;
    limit?: string;
    sortBy?: string;
}): {
    page: number;
    limit: number;
    sortBy: string;
} {
    const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || "10", 10) || 10));
    const validSortOptions = ["date", "popularity", "title"];
    const sortBy = validSortOptions.includes(params.sortBy || "")
        ? params.sortBy!
        : "date";

    return { page, limit, sortBy };
}

/**
 * validates pagination params
 */
export function validatePaginationParams(params: {
    page?: string | number;
    limit?: string | number;
}): { page: number; limit: number; skip: number } {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

/**
 * validates book create input
 */
export interface BookInput {
    title?: string;
    author?: string;
    isbn?: string;
    condition?: string;
}

export function validateBookInput(input: BookInput): ValidationResult {
    if (!input.title || input.title.trim().length === 0) {
        return { isValid: false, error: "Title is required" };
    }

    if (!input.author || input.author.trim().length === 0) {
        return { isValid: false, error: "Author is required" };
    }

    const validConditions = ["new", "like-new", "good", "fair", "poor"];
    if (input.condition && !validConditions.includes(input.condition)) {
        return { isValid: false, error: "Invalid condition" };
    }

    return { isValid: true };
}

/**
 * validates ISBN format (ISBN-10 or ISBN-13)
 */
export function isValidISBN(isbn: string): boolean {
    const cleaned = isbn.replace(/[-\s]/g, "");

    if (cleaned.length === 10) {
        // ISBN-10 validation
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            if (!/\d/.test(cleaned[i])) return false;
            sum += parseInt(cleaned[i], 10) * (10 - i);
        }
        const check = cleaned[9].toUpperCase();
        if (check === "X") {
            sum += 10;
        } else if (/\d/.test(check)) {
            sum += parseInt(check, 10);
        } else {
            return false;
        }
        return sum % 11 === 0;
    }

    if (cleaned.length === 13) {
        // ISBN-13 validation
        if (!/^\d{13}$/.test(cleaned)) return false;
        let sum = 0;
        for (let i = 0; i < 13; i++) {
            sum += parseInt(cleaned[i], 10) * (i % 2 === 0 ? 1 : 3);
        }
        return sum % 10 === 0;
    }

    return false;
}
