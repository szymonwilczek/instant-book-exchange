/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { useLeaderboard } from "../lib/hooks/useLeaderboard";

// mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useLeaderboard hook", () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    const mockLeaderboardResponse = {
        users: [
            { userId: "1", username: "User1", totalScore: 1000, tier: "silver", rank: 1 },
            { userId: "2", username: "User2", totalScore: 800, tier: "bronze", rank: 2 },
        ],
        total: 2,
        currentPage: 1,
        totalPages: 1,
    };

    describe("initial state", () => {
        it("should start with loading true", () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockLeaderboardResponse,
            });

            const { result } = renderHook(() => useLeaderboard());

            expect(result.current.isLoading).toBe(true);
            expect(result.current.data).toBeNull();
            expect(result.current.error).toBeNull();
            expect(result.current.currentPage).toBe(1);
        });
    });

    describe("successful fetch", () => {
        it("should fetch leaderboard data", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockLeaderboardResponse,
            });

            const { result } = renderHook(() => useLeaderboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toEqual(mockLeaderboardResponse);
            expect(result.current.error).toBeNull();
        });

        it("should use default pagination values", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockLeaderboardResponse,
            });

            renderHook(() => useLeaderboard());

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith("/api/ranking/leaderboard?page=1&limit=100");
            });
        });

        it("should use custom pagination values", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockLeaderboardResponse,
            });

            renderHook(() => useLeaderboard({ initialPage: 2, limit: 50 }));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith("/api/ranking/leaderboard?page=2&limit=50");
            });
        });
    });

    describe("pagination", () => {
        it("should change page with setPage", async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockLeaderboardResponse,
            });

            const { result } = renderHook(() => useLeaderboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.setPage(2);
            });

            expect(result.current.currentPage).toBe(2);
        });

        it("should refetch when page changes", async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockLeaderboardResponse,
            });

            const { result } = renderHook(() => useLeaderboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            act(() => {
                result.current.setPage(2);
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith("/api/ranking/leaderboard?page=2&limit=100");
            });
        });
    });

    describe("error handling", () => {
        it("should set error on fetch failure", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            const { result } = renderHook(() => useLeaderboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe("Failed to fetch leaderboard");
            expect(result.current.data).toBeNull();
        });

        it("should handle network error", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network error"));

            const { result } = renderHook(() => useLeaderboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.error).toBe("Network error");
        });
    });

    describe("refetch", () => {
        it("should provide refetch function", async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => mockLeaderboardResponse,
            });

            const { result } = renderHook(() => useLeaderboard());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.refetch).toBe("function");

            // call refetch
            await act(async () => {
                await result.current.refetch();
            });

            // should have been called twice (initial + refetch)
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });
});
