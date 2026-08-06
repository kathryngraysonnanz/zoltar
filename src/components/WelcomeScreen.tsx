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
      <button className="btn btn-primary large" onClick={onStart} type="button">
        Reveal My Fortune
      </button>
    </div>
  );
}
