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
        <button
          className="btn btn-primary"
          onClick={onPrint}
          disabled={isPrinting}
          type="button"
        >
          {isPrinting ? "Printing…" : "🖨 Print My Fortune"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onRestart}
          type="button"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
