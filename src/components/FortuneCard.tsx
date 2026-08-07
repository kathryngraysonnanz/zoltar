import { Button } from "@progress/kendo-react-buttons";
import type { Fortune } from "../data/fortunes";

interface Props {
  fortune: Fortune;
  onPrint: () => void;
  onRestart: () => void;
  isPrinting: boolean;
}

export function FortuneCard({ fortune, onPrint, onRestart, isPrinting }: Props) {
  return (
    <div className="fortune-card">
      <div className="crystal-ball" aria-hidden="true">🔮</div>
      <p className="fortune-eyebrow">Your Fortune</p>
      <h2 className="fortune-title">{fortune.title}</h2>
      <p className="fortune-text">{fortune.text}</p>
      <div className="fortune-actions">
        <Button
          themeColor="primary"
          className="fortune-btn"
          onClick={onPrint}
          disabled={isPrinting}
        >
          {isPrinting ? "Printing…" : "🖨 Print My Fortune"}
        </Button>
        <Button
          themeColor="secondary"
          fillMode="outline"
          className="fortune-btn-secondary"
          onClick={onRestart}
        >
          Start Over
        </Button>
      </div>
    </div>
  );
}
