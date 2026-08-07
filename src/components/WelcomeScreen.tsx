import { Button } from "@progress/kendo-react-buttons";

interface Props {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: Props) {
  return (
    <div className="welcome-screen">
      <div className="crystal-ball large" aria-hidden="true">🔮</div>
      <h1 className="welcome-title">Zoltar Speaks</h1>
      <p className="welcome-subtitle">
        Answer five questions and discover what the future holds for you.
      </p>
      <Button
        themeColor="primary"
        size="large"
        className="welcome-btn"
        onClick={onStart}
      >
        Reveal My Fortune
      </Button>
    </div>
  );
}
