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
  let navigatorShareSpy: ReturnType<typeof vi.spyOn> | undefined;
  let clipboardWriteTextSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    
    // Mock clipboard API
    clipboardWriteTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: clipboardWriteTextSpy,
      },
      configurable: true,
    });
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
    if (navigatorShareSpy) {
      navigatorShareSpy.mockRestore();
    }
  });

  describe("Desktop mode (no native share)", () => {
    beforeEach(() => {
      // Mock navigator.share as undefined
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true,
      });
      
      // Ensure clipboard is mocked for this context
      clipboardWriteTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: clipboardWriteTextSpy,
        },
        configurable: true,
      });
    });

    it("renders desktop share buttons", () => {
      render(<ShareButtons {...mockProps} />);

      expect(screen.getByText("𝕏 Share")).toBeInTheDocument();
      const shareButtons = screen.getAllByText("Share");
      expect(shareButtons.length).toBeGreaterThan(0);
      expect(screen.getByText("in Share")).toBeInTheDocument(); // LinkedIn
      expect(screen.getByText("🔗 Copy Link")).toBeInTheDocument();
    });

    it("opens Twitter share window on click", async () => {
      const user = userEvent.setup();
      render(<ShareButtons {...mockProps} />);

      await user.click(screen.getByText("𝕏 Share"));

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining("twitter.com/intent/tweet"),
        "_blank",
        "noopener,noreferrer,width=550,height=420"
      );
    });

    it("opens Facebook share window on click", async () => {
      const user = userEvent.setup();
      render(<ShareButtons {...mockProps} />);

      const facebookButtons = screen.getAllByText("Share");
      const facebookButton = facebookButtons.find(
        (btn) => btn.classList.contains("share-btn-facebook") || 
                 btn.closest(".share-btn-facebook")
      );

      if (facebookButton) {
        await user.click(facebookButton);
      }

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining("facebook.com/sharer"),
        "_blank",
        "noopener,noreferrer,width=550,height=420"
      );
    });

    it("opens LinkedIn share window on click", async () => {
      const user = userEvent.setup();
      render(<ShareButtons {...mockProps} />);

      await user.click(screen.getByText("in Share"));

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining("linkedin.com/sharing"),
        "_blank",
        "noopener,noreferrer,width=550,height=420"
      );
    });

    it("renders copy link button", () => {
      render(<ShareButtons {...mockProps} />);

      const copyButtons = screen.getAllByText("🔗 Copy Link");
      expect(copyButtons.length).toBeGreaterThan(0);
      
      // Verify the button has the correct class
      const copyButton = copyButtons[0].closest('button');
      expect(copyButton).toHaveClass('share-btn-copy');
    });
  });

  describe("Mobile mode (with native share)", () => {
    beforeEach(() => {
      // Mock navigator.share
      navigatorShareSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "share", {
        value: navigatorShareSpy,
        configurable: true,
      });
    });

    it("renders native share button", () => {
      render(<ShareButtons {...mockProps} />);

      expect(screen.getByText("📤 Share Fortune")).toBeInTheDocument();
      expect(screen.getByText("🔗 Copy Link")).toBeInTheDocument();
    });

    it("does not render desktop share buttons", () => {
      render(<ShareButtons {...mockProps} />);

      expect(screen.queryByText("𝕏 Share")).not.toBeInTheDocument();
      expect(screen.queryByText("in Share")).not.toBeInTheDocument();
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
      const error = new Error("Share failed");
      navigatorShareSpy?.mockRejectedValue(error);

      const user = userEvent.setup();
      render(<ShareButtons {...mockProps} />);

      await user.click(screen.getByText("📤 Share Fortune"));

      expect(consoleErrorSpy).toHaveBeenCalledWith("Share failed:", error);

      consoleErrorSpy.mockRestore();
    });
  });
});
