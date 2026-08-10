import { useParams } from 'react-router-dom';
import { Card, CardBody } from '@progress/kendo-react-layout';
import { ThemeToggle } from '../components/ThemeToggle';
import '../App.css';

export function SharePage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <div className="app">
      <div className="app-inner">
        <Card className="fortune-card screen-card">
          <CardBody className="screen-card-body">
            <div className="crystal-ball" aria-hidden="true">🔮</div>
            <p className="fortune-eyebrow">Shared Fortune</p>
            <h2 className="fortune-title">Loading...</h2>
            <p className="fortune-text">Session: {sessionId}</p>
          </CardBody>
        </Card>
      </div>
      <ThemeToggle />
    </div>
  );
}
