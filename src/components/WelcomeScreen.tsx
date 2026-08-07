import { Button } from "@progress/kendo-react-buttons";
import { Card, CardBody } from "@progress/kendo-react-layout";

interface Props {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: Props) {
  return (
    <Card className="welcome-screen screen-card">
      <CardBody className="screen-card-body">
        <div className="crystal-ball large" aria-hidden="true">🔮</div>
        <h1 className="welcome-title">Zoltar Speaks</h1>
        <p className="welcome-subtitle">
          Answer five questions and discover what the future holds for you.
        </p>
        <div className="decorative-divider" aria-hidden="true">
          <span className="divider-star">✦</span>
          <span className="divider-line"></span>
          <span className="divider-star">✦</span>
        </div>
        <Button
          themeColor="primary"
          size="large"
          className="welcome-btn"
          onClick={onStart}
        >
          Reveal My Fortune
        </Button>
      </CardBody>
    </Card>
  );
}
