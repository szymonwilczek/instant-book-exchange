/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMediaQuery } from "../lib/hooks/useMediaQuery";

// mock matchMedia
const createMatchMedia = (matches: boolean) => {
    return (query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    });
};

describe("useMediaQuery hook", () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
        window.matchMedia = originalMatchMedia;
    });

    describe("initial state", () => {
        it("should return true when media query matches", () => {
            window.matchMedia = createMatchMedia(true) as unknown as typeof window.matchMedia;

            const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
            expect(result.current).toBe(true);
        });

        it("should return false when media query does not match", () => {
            window.matchMedia = createMatchMedia(false) as unknown as typeof window.matchMedia;

            const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
            expect(result.current).toBe(false);
        });
    });

    describe("common breakpoints", () => {
        it("should handle mobile breakpoint query", () => {
            window.matchMedia = createMatchMedia(true) as unknown as typeof window.matchMedia;

            const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
            expect(result.current).toBe(true);
        });

        it("should handle tablet breakpoint query", () => {
            window.matchMedia = createMatchMedia(true) as unknown as typeof window.matchMedia;

            const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
            expect(result.current).toBe(true);
        });

        it("should handle desktop breakpoint query", () => {
            window.matchMedia = createMatchMedia(false) as unknown as typeof window.matchMedia;

            const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
            expect(result.current).toBe(false);
        });
    });

    describe("event listener", () => {
        it("should add event listener on mount", () => {
            const addEventListener = jest.fn();
            window.matchMedia = jest.fn().mockImplementation((query) => ({
                matches: false,
                media: query,
                addEventListener,
                removeEventListener: jest.fn(),
            })) as unknown as typeof window.matchMedia;

            renderHook(() => useMediaQuery("(min-width: 768px)"));

            expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
        });

        it("should remove event listener on unmount", () => {
            const removeEventListener = jest.fn();
            window.matchMedia = jest.fn().mockImplementation((query) => ({
                matches: false,
                media: query,
                addEventListener: jest.fn(),
                removeEventListener,
            })) as unknown as typeof window.matchMedia;

            const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
            unmount();

            expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
        });
    });

    describe("query changes", () => {
        it("should call matchMedia with new query when prop changes", () => {
            const matchMediaMock = jest.fn().mockImplementation((query) => ({
                matches: true,
                media: query,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            }));
            window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;

            const { rerender } = renderHook(
                ({ query }) => useMediaQuery(query),
                { initialProps: { query: "(min-width: 768px)" } }
            );

            expect(matchMediaMock).toHaveBeenCalledWith("(min-width: 768px)");

            rerender({ query: "(min-width: 1024px)" });

            expect(matchMediaMock).toHaveBeenCalledWith("(min-width: 1024px)");
        });
    });
});
