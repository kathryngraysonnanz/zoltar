import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardBody } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { ThemeToggle } from '../components/ThemeToggle';
import { getSession, type StoredSession } from '../firebase/sessions';
import '../App.css';

type LoadingState = 'loading' | 'success' | 'error' | 'not-found';

export function SharePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');

  useEffect(() => {
    if (!sessionId) {
      setLoadingState('not-found');
      return;
    }

    let cancelled = false;

    async function fetchSession() {
      try {
        const data = await getSession(sessionId!);
        if (cancelled) return;
        
        if (data) {
          setSession(data);
          setLoadingState('success');
        } else {
          setLoadingState('not-found');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch session:', err);
        setLoadingState('error');
      }
    }

    fetchSession();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="app">
      <div className="app-inner">
        {loadingState === 'loading' && <LoadingCard />}
        {loadingState === 'error' && <ErrorCard />}
        {loadingState === 'not-found' && <NotFoundCard />}
        {loadingState === 'success' && session && (
          <FortuneDisplay session={session} />
        )}
      </div>
      <ThemeToggle />
    </div>
  );
}

function LoadingCard() {
  return (
    <Card className="fortune-card screen-card">
      <CardBody className="screen-card-body">
        <div className="crystal-ball" aria-hidden="true">🔮</div>
        <p className="fortune-eyebrow">Consulting the spirits...</p>
        <h2 className="fortune-title">Loading</h2>
      </CardBody>
    </Card>
  );
}

function ErrorCard() {
  return (
    <Card className="fortune-card screen-card">
      <CardBody className="screen-card-body">
        <div className="crystal-ball" aria-hidden="true">💫</div>
        <p className="fortune-eyebrow">Something went wrong</p>
        <h2 className="fortune-title">Unable to retrieve fortune</h2>
        <p className="fortune-text">Please try again later.</p>
        <div className="fortune-actions">
          <Button 
            themeColor="primary" 
            className="fortune-btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function NotFoundCard() {
  return (
    <Card className="fortune-card screen-card">
      <CardBody className="screen-card-body">
        <div className="crystal-ball" aria-hidden="true">🌙</div>
        <p className="fortune-eyebrow">Fortune not found</p>
        <h2 className="fortune-title">This fortune has faded</h2>
        <p className="fortune-text">The spirits cannot locate this fortune. Perhaps you'd like to discover your own?</p>
        <div className="fortune-actions">
          <Link to="/">
            <Button themeColor="primary" className="fortune-btn">
              Get Your Fortune
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

interface FortuneDisplayProps {
  session: StoredSession;
}

function FortuneDisplay({ session }: FortuneDisplayProps) {
  return (
    <Card className="fortune-card screen-card">
      <CardBody className="screen-card-body">
        <div className="crystal-ball" aria-hidden="true">🔮</div>
        <p className="fortune-eyebrow">Your Fortune</p>
        <h2 className="fortune-title">{session.fortuneTitle}</h2>
        <p className="fortune-text">{session.fortuneText}</p>
        <div className="fortune-actions">
          <Link to="/">
            <Button themeColor="primary" className="fortune-btn">
              Get Your Own Fortune
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
