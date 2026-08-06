import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "../context/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";

function renderWithProvider() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders a button", () => {
    renderWithProvider();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("displays sun icon in dark mode", () => {
    renderWithProvider();
    expect(screen.getByRole("button")).toHaveTextContent("☀️");
  });

  it("displays moon icon in light mode", () => {
    localStorage.setItem("theme", "light");
    renderWithProvider();
    expect(screen.getByRole("button")).toHaveTextContent("🌙");
  });

  it("has correct aria-label in dark mode", () => {
    renderWithProvider();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Switch to light mode"
    );
  });

  it("has correct aria-label in light mode", () => {
    localStorage.setItem("theme", "light");
    renderWithProvider();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Switch to dark mode"
    );
  });

  it("toggles theme on click", async () => {
    const user = userEvent.setup();
    renderWithProvider();

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("☀️");

    await user.click(button);
    expect(button).toHaveTextContent("🌙");

    await user.click(button);
    expect(button).toHaveTextContent("☀️");
  });

  it("has theme-toggle class", () => {
    renderWithProvider();
    expect(screen.getByRole("button")).toHaveClass("theme-toggle");
  });
});
