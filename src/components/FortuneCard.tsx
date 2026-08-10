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
  const shareUrl = sessionId 
    ? `${window.location.origin}/fortune/${sessionId}`
    : null;
  const shareTitle = `My Zoltar Fortune: ${fortune.title}`;
  const shareText = fortune.text.slice(0, 100) + '...';

  return (
    <Card className="fortune-card screen-card">
      <CardBody className="screen-card-body">
        <div className="crystal-ball" aria-hidden="true">🔮</div>
        <p className="fortune-eyebrow">Your Fortune</p>
        <h2 className="fortune-title">{fortune.title}</h2>
        <p className="fortune-text">{fortune.text}</p>
        
        <div className="fortune-actions" style={{ marginTop: shareUrl ? '1rem' : '0' }}>
          <Button
            themeColor="primary"
            className="fortune-btn"
            onClick={onPrint}
            disabled={isPrinting || !sessionId}
          >
            {isPrinting ? "Printing…" : !sessionId ? "Preparing…" : "🖨 Print My Fortune"}
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
