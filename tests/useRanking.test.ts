/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useRanking } from "../lib/hooks/useRanking";

// mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useRanking hook", () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    describe("initial state", () => {
        it("should start with loading true when userId provided", () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ totalScore: 100 }),
            });

            const { result } = renderHook(() => useRanking("user123"));

            expect(result.current.isLoading).toBe(true);
            expect(result.current.ranking).toBeNull();
            expect(result.current.error).toBeNull();
        });

        it("should set loading false when no userId provided", async () => {
            const { result } = renderHook(() => useRanking(undefined));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.ranking).toBeNull();
        });
    });

    describe("successful fetch", () => {
        it("should fetch ranking data for userId", async () => {
            const mockRanking = {
                userId: "user123",
                totalScore: 1500,
                tier: "silver",
                rank: 42,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRanking,
            });

            const { result } = renderHook(() => useRanking("user123"));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.ranking).toEqual(mockRanking);
            expect(result.current.error).toBeNull();
            expect(mockFetch).toHaveBeenCalledWith("/api/ranking/user/user123");
        });
    });

    describe("error handling", () => {
        it("should handle 404 response gracefully", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            const { result } = renderHook(() => useRanking("nonexistent"));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.ranking).toBeNull();
            expect(result.current.error).toBeNull(); // 404 is not treated as error
        });

        it("should set error on fetch failure", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            const { result } = renderHook(() => useRanking("user123"));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe("Failed to fetch ranking");
            expect(result.current.ranking).toBeNull();
        });

        it("should handle network error", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network error"));

            const { result } = renderHook(() => useRanking("user123"));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe("Network error");
            expect(result.current.ranking).toBeNull();
        });
    });

    describe("refetch", () => {
        it("should provide refetch function", async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => ({ totalScore: 100 }),
            });

            const { result } = renderHook(() => useRanking("user123"));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.refetch).toBe("function");
        });
    });
});
