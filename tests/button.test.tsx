import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../components/ui/button";

describe("Button Component", () => {
    describe("rendering", () => {
        it("should render button with text", () => {
            render(<Button>Click me</Button>);
            expect(screen.getByRole("button")).toHaveTextContent("Click me");
        });

        it("should render button with data-slot attribute", () => {
            render(<Button>Test</Button>);
            expect(screen.getByRole("button")).toHaveAttribute("data-slot", "button");
        });

        it("should render children correctly", () => {
            render(
                <Button>
                    <span data-testid="child">Child Element</span>
                </Button>
            );
            expect(screen.getByTestId("child")).toBeInTheDocument();
        });
    });

    describe("variants", () => {
        it("should apply default variant classes", () => {
            render(<Button>Default</Button>);
            const button = screen.getByRole("button");
            expect(button).toHaveClass("bg-primary");
        });

        it("should apply destructive variant classes", () => {
            render(<Button variant="destructive">Delete</Button>);
            const button = screen.getByRole("button");
            expect(button).toHaveClass("bg-destructive");
        });

        it("should apply outline variant classes", () => {
            render(<Button variant="outline">Outline</Button>);
            const button = screen.getByRole("button");
            expect(button).toHaveClass("border");
        });

        it("should apply ghost variant classes", () => {
            render(<Button variant="ghost">Ghost</Button>);
            const button = screen.getByRole("button");
            expect(button).toHaveClass("hover:bg-accent");
        });
    });

    describe("sizes", () => {
        it("should apply default size classes", () => {
            render(<Button>Default Size</Button>);
            const button = screen.getByRole("button");
            expect(button).toHaveClass("h-9");
        });

        it("should apply small size classes", () => {
            render(<Button size="sm">Small</Button>);
            const button = screen.getByRole("button");
            expect(button).toHaveClass("h-8");
        });

        it("should apply large size classes", () => {
            render(<Button size="lg">Large</Button>);
            const button = screen.getByRole("button");
            expect(button).toHaveClass("h-10");
        });

        it("should apply icon size classes", () => {
            render(<Button size="icon">🔍</Button>);
            const button = screen.getByRole("button");
            expect(button).toHaveClass("size-9");
        });
    });

    describe("states", () => {
        it("should be disabled when disabled prop is true", () => {
            render(<Button disabled>Disabled</Button>);
            expect(screen.getByRole("button")).toBeDisabled();
        });

        it("should have disabled styles when disabled", () => {
            render(<Button disabled>Disabled</Button>);
            const button = screen.getByRole("button");
            expect(button).toHaveClass("disabled:opacity-50");
        });
    });

    describe("custom className", () => {
        it("should merge custom className with default classes", () => {
            render(<Button className="custom-class">Custom</Button>);
            const button = screen.getByRole("button");
            expect(button).toHaveClass("custom-class");
            expect(button).toHaveClass("bg-primary");
        });
    });

    describe("html attributes", () => {
        it("should pass through type attribute", () => {
            render(<Button type="submit">Submit</Button>);
            expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
        });

        it("should pass through id attribute", () => {
            render(<Button id="test-button">Test</Button>);
            expect(screen.getByRole("button")).toHaveAttribute("id", "test-button");
        });
    });
});
