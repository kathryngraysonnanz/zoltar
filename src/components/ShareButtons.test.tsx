import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareButtons } from "./ShareButtons";

describe("ShareButtons", () => {
  const mockProps = {
    url: "https://example.com/fortune/test123",
    title: "My Zoltar Fortune: Test Title",
    text: "This is a test fortune text...",
  };

  let windowOpenSpy: ReturnType<typeof vi.spyOn>;
  let navigatorShareSpy: ReturnType<typeof vi.fn> | undefined;

  beforeEach(() => {
    windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    
    // Ensure navigator.clipboard exists for spying
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true,
      });
    }
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe("Desktop mode (no native share)", () => {
    let clipboardWriteTextSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Mock navigator.share as undefined
      Object.defineProperty(navigator, "share", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      
      // Create a fresh clipboard mock for desktop mode
      clipboardWriteTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: clipboardWriteTextSpy,
        },
        writable: true,
        configurable: true,
      });
    });

    it("renders copy link button", () => {
      render(<ShareButtons {...mockProps} />);

      expect(screen.getByText("🔗 Copy Link")).toBeInTheDocument();
      
      // Verify the button has the correct class
      const copyButton = screen.getByText("🔗 Copy Link").closest('button');
      expect(copyButton).toHaveClass('share-btn-copy');
    });

    it("shows copied feedback after clicking copy button", async () => {
      const user = userEvent.setup();
      render(<ShareButtons {...mockProps} />);

      const button = screen.getByText("🔗 Copy Link");
      await user.click(button);

      // Button text should change to "Link Copied!" indicating successful copy
      expect(screen.getByText("✓ Link Copied!")).toBeInTheDocument();
      expect(screen.queryByText("🔗 Copy Link")).not.toBeInTheDocument();
    });
  });

  describe("Mobile mode (with native share)", () => {
    beforeEach(() => {
      // Mock navigator.share
      navigatorShareSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "share", {
        value: navigatorShareSpy,
        writable: true,
        configurable: true,
      });
    });

    it("renders native share button", () => {
      render(<ShareButtons {...mockProps} />);

      expect(screen.getByText("📤 Share Fortune")).toBeInTheDocument();
      expect(screen.getByText("🔗 Copy Link")).toBeInTheDocument();
    });

    it("calls navigator.share on button click", async () => {
      const user = userEvent.setup();
      render(<ShareButtons {...mockProps} />);

      await user.click(screen.getByText("📤 Share Fortune"));

      expect(navigatorShareSpy).toHaveBeenCalledWith({
        title: mockProps.title,
        text: mockProps.text,
        url: mockProps.url,
      });
    });

    it("handles share cancellation gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const abortError = new Error("User cancelled");
      abortError.name = "AbortError";
      navigatorShareSpy?.mockRejectedValue(abortError);

      const user = userEvent.setup();
      render(<ShareButtons {...mockProps} />);

      await user.click(screen.getByText("📤 Share Fortune"));

      // Should not log AbortError
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("logs other share errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
      const error = new Error("Share failed");
      navigatorShareSpy?.mockRejectedValue(error);

      const user = userEvent.setup();
      render(<ShareButtons {...mockProps} />);

      await user.click(screen.getByText("📤 Share Fortune"));

      expect(consoleErrorSpy).toHaveBeenCalledWith("Share failed:", error);
      // Should fall back to copy link
      expect(clipboardSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
