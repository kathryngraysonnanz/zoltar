import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QRCode } from "./QRCode";

// Mock the qrcode library
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

import QRCodeLib from "qrcode";

describe("QRCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading placeholder while generating", () => {
    vi.mocked(QRCodeLib.toDataURL).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<QRCode url="https://example.com/test" />);
    
    const placeholder = document.querySelector(".qr-placeholder");
    expect(placeholder).toBeInTheDocument();
  });

  it("renders QR code image when generation succeeds", async () => {
    const mockDataUrl = "data:image/png;base64,mock-qr-code-data";
    (vi.mocked(QRCodeLib.toDataURL) as any).mockResolvedValue(mockDataUrl);

    render(<QRCode url="https://example.com/test" />);

    const img = await waitFor(() => screen.getByAltText(/QR code linking to/));
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", mockDataUrl);
    expect(img).toHaveAttribute("width", "120");
    expect(img).toHaveAttribute("height", "120");
  });

  it("calls toDataURL with correct parameters", async () => {
    (vi.mocked(QRCodeLib.toDataURL) as any).mockResolvedValue("data:image/png;base64,test");

    render(<QRCode url="https://example.com/fortune/abc123" size={100} />);

    await waitFor(() => {
      expect(QRCodeLib.toDataURL).toHaveBeenCalledWith(
        "https://example.com/fortune/abc123",
        {
          width: 100,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        }
      );
    });
  });

  it("applies custom className", async () => {
    (vi.mocked(QRCodeLib.toDataURL) as any).mockResolvedValue("data:image/png;base64,test");

    render(<QRCode url="https://example.com/test" className="custom-class" />);

    const img = await waitFor(() => screen.getByAltText(/QR code linking to/));
    expect(img).toHaveClass("custom-class");
  });

  it("hides component on generation error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (vi.mocked(QRCodeLib.toDataURL) as any).mockRejectedValue(new Error("Generation failed"));

    const { container } = render(<QRCode url="https://example.com/test" />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "QR code generation failed:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it("uses default size of 120 when not specified", async () => {
    (vi.mocked(QRCodeLib.toDataURL) as any).mockResolvedValue("data:image/png;base64,test");

    render(<QRCode url="https://example.com/test" />);

    await waitFor(() => {
      expect(QRCodeLib.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ width: 120 })
      );
    });
  });
});
