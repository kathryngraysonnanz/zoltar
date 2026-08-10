import { Button } from "@progress/kendo-react-buttons";
import { Card, CardBody } from "@progress/kendo-react-layout";
import type { Fortune } from "../data/fortunes";

interface Props {
  fortune: Fortune;
  onPrint: () => void;
  onRestart: () => void;
  isPrinting: boolean;
  sessionId: string | null;
}

export function FortuneCard({ fortune, onPrint, onRestart, isPrinting, sessionId }: Props) {
  return (
    <Card className="fortune-card screen-card">
      <CardBody className="screen-card-body">
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
            themeColor="primary"
            className="fortune-btn"
            onClick={onRestart}
          >
            Start Over
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
