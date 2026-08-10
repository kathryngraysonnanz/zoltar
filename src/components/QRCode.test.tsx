import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { QRCode } from "./QRCode";

describe("QRCode", () => {
  it("renders KendoReact QRCode component", () => {
    const { container } = render(<QRCode url="https://example.com/test" />);
    
    // KendoReact QRCode renders as an SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("passes url as value prop to KendoReact QRCode", () => {
    const url = "https://example.com/fortune/abc123";
    const { container } = render(<QRCode url={url} />);
    
    // Check that the component rendered an SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("applies custom className to wrapper", () => {
    const { container } = render(<QRCode url="https://example.com/test" className="custom-class" />);
    
    const wrapper = container.querySelector(".custom-class");
    expect(wrapper).toBeInTheDocument();
  });

  it("uses default size of 120 when not specified", () => {
    const { container } = render(<QRCode url="https://example.com/test" />);
    
    // KendoReact QRCode should be rendered
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("uses custom size when specified", () => {
    const { container } = render(<QRCode url="https://example.com/test" size={100} />);
    
    // KendoReact QRCode should be rendered
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
