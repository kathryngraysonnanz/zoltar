import { useEffect, useState } from "react";
import { ProgressBar } from '@progress/kendo-react-progressbars';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardBody } from '@progress/kendo-react-layout';
import { Notification, NotificationGroup } from '@progress/kendo-react-notification';
import { Loader } from '@progress/kendo-react-indicators';
import { addDoc, collection } from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase.js";


const STORAGE_KEY = "epson-epos-timeout";

export default function App() {
  const [timeout, setTimeoutValue] = useState("60000");
  const [status, setStatus] = useState("");
  const [statusState, setStatusState] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [printerTarget, setPrinterTarget] = useState({
    host: "192.168.1.123",
    port: 9100,
    deviceId: "local_printer"
  });

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const savedTimeout = restoreSavedTimeout();

      if (savedTimeout) {
        setTimeoutValue(savedTimeout);
      }

      try {
        const response = await fetch("/api/health");
        const result = await response.json();

        if (cancelled) {
          return;
        }

        setPrinterTarget({
          host: result.defaultPrinterHost ?? "192.168.1.123",
          port: result.defaultPrinterPort ?? 9100,
          deviceId: result.defaultEposDeviceId ?? "local_printer"
        });

        if (!savedTimeout && result.defaultEposTimeout) {
          const nextTimeout = `${result.defaultEposTimeout}`;
          setTimeoutValue(nextTimeout);
          localStorage.setItem(STORAGE_KEY, nextTimeout);
        }
      } catch (_error) {
        if (!cancelled) {
          setStatus("Server is not reachable yet.");
          setStatusState("error");
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  async function runPrinterRequest({ endpoint, pendingMessage, failureMessage, extraData }) {
    const payload = buildPayload(timeout);

    if (!payload.ok) {
      setStatus(payload.error);
      setStatusState("error");
      return;
    }

    setStatus(pendingMessage);
    setStatusState("idle");
    setBusy(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...payload.data, ...extraData })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Printing failed.");
      }

      setStatus(result.message);
      setStatusState("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : failureMessage);
      setStatusState("error");
    } finally {
      setBusy(false);
    }
  }

  function handleTimeoutChange(event) {
    const nextTimeout = event.target.value;
    setTimeoutValue(nextTimeout);
    localStorage.setItem(STORAGE_KEY, nextTimeout);
  }

  const [intro, setIntro] = useState(true);
  const [q1, setQ1] = useState(false);
  const [q2, setQ2] = useState(false);
  const [q3, setQ3] = useState(false);
  const [q4, setQ4] = useState(false);
  const [q5, setQ5] = useState(false);
  const [result, setResult] = useState(false);
  const [answers, setAnswers] = useState({});

  function logResult(answer, question) {
    const nextAnswers = { ...answers, [question]: answer };
    setAnswers(nextAnswers);

    if (question === 'q1') {
      setQ1(false);
      setQ2(true);
    }
    if (question === 'q2') {
      setQ2(false);
      setQ3(true);
    }
    if (question === 'q3') {
      setQ3(false);
      setQ4(true);
    }
    if (question === 'q4') {
      setQ4(false);
      setQ5(true);
    }
    if (question === 'q5') {
      setQ5(false);
      setResult(true);
      saveSurveyResults(nextAnswers);
    }
  }

  async function saveSurveyResults(finalAnswers) {
    if (!firebaseEnabled || !db) {
      return;
    }

    try {
      await addDoc(collection(db, "sessions"), {
        answers: finalAnswers,
        createdAt: new Date()
      });
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Unable to save survey results.");
    }
  }

  function restartQuiz() {
    setIntro(true);
    setQ1(false);
    setQ2(false);
    setQ3(false);
    setQ4(false);
    setQ5(false);
    setResult(false);
    setAnswers({});
    setStatus("");
    setStatusState("idle");
  }

  return (
    <main className="shell">

      { intro && 
      <Card className="panel hero">
        <CardBody>
          <h1>The AI Developer Oracle</h1>
          <p className="lede">
           What kind of AI engineer are you? What does the future hold for your projects? 
           Answer five questions and let the Oracle reveal your fortune.
          </p>
          <Button className="primary-action intro-cta" themeColor="primary" size="large" onClick={() => setIntro(false) || setQ1(true)}>Discover Your Future</Button>
        </CardBody>
      </Card>
      }

       { q1 && 
        <Card className="panel hero">
          <CardBody>
            <h1>Question 1</h1>
            <ProgressBar value={20} />
            <p>
            What best describes your current use of AI? 
            </p>
            <Button className="response" onClick={() => logResult('a', 'q1')}>AI is essential to how I work</Button>
            <Button className="response" onClick={() => logResult('b', 'q1')}>AI saves significant time but I could work without it</Button>
            <Button className="response" onClick={() => logResult('c', 'q1')}>AI helps occasionally for specific tasks</Button>
            <Button className="response" onClick={() => logResult('d', 'q1')}>I play around with AI sometimes, but don't use it for real work</Button>
            <Button className="response" onClick={() => logResult('e', 'q1')}>I don't use AI</Button>
          </CardBody>
        </Card>
      }

       { q2 && 
      <Card className="panel hero">
          <CardBody>
            <h1>Question 2</h1>
            <ProgressBar value={40} />
            <p>
            When handling AI-generated output, how often do you verify the response yourself?
            </p>
            <Button className="response" onClick={() => logResult('a', 'q2')}>Every time</Button>
            <Button className="response" onClick={() => logResult('b', 'q2')}>Most of the time</Button>
            <Button className="response" onClick={() => logResult('c', 'q2')}>About half the time</Button>
            <Button className="response" onClick={() => logResult('d', 'q2')}>Rarely</Button>
            <Button className="response" onClick={() => logResult('e', 'q2')}>Never</Button>
          </CardBody>
      </Card>
      }

       { q3 && 
      <Card className="panel hero">
          <CardBody>
            <h1>Question 3</h1>
            <ProgressBar value={60} />
            <p>
            What's your biggest concern about AI governance? 
            </p>
            <Button className="response" onClick={() => logResult('a', 'q3')}>Allowing AI to handle sensitive or proprietary data</Button>
            <Button className="response" onClick={() => logResult('b', 'q3')}>Lack of visibility into how AI outputs are generated</Button>
            <Button className="response" onClick={() => logResult('c', 'q3')}>Complying with legal or regulatory requirements</Button>
            <Button className="response" onClick={() => logResult('d', 'q3')}>Inconsistent quality or accuracy of AI outputs</Button>
            <Button className="response" onClick={() => logResult('e', 'q3')}>I'm not worried about it!</Button>
          </CardBody>
      </Card>
      }

       { q4 && 
     <Card className="panel hero">
          <CardBody>
            <h1>Question 4</h1>
            <ProgressBar value={80} />
            <p>
            What's your most common next step after receiving AI-generated output?
            </p>
            <Button className="response" onClick={() => logResult('a', 'q4')}>I accept it with little or no modification</Button>
            <Button className="response" onClick={() => logResult('b', 'q4')}>I lightly edit it before using it</Button>
            <Button className="response" onClick={() => logResult('c', 'q4')}>I substantially rewrite it</Button>
            <Button className="response" onClick={() => logResult('d', 'q4')}>I use it for ideas, but discard the direct output</Button>
            <Button className="response" onClick={() => logResult('e', 'q4')}>I frequently throw it out and start over (or just do it myself)</Button>
          </CardBody>
     </Card>
      }

       { q5 && 
     <Card className="panel hero">
          <CardBody>
            <h1>Question 5</h1>
            <ProgressBar value={100} />
            <p>
            Where does AI deliver the most actual value for you today? 
            </p>
            <Button className="response" onClick={() => logResult('a', 'q5')}>Reducing time spent on routine tasks</Button>
            <Button className="response" onClick={() => logResult('b', 'q5')}>Improving code or work quality</Button>
            <Button className="response" onClick={() => logResult('c', 'q5')}>Accelerating learning, research, or onboarding</Button>
            <Button className="response" onClick={() => logResult('d', 'q5')}>Helping teams make decisions faster</Button>
            <Button className="response" onClick={() => logResult('e', 'q5')}>None of the above: AI has no measurable value</Button>
          </CardBody>
     </Card>
      }

    { result && 
        <Card className="panel hero">
          <CardBody>
          <h1>Your Fortune Awaits</h1>
          <p className="lede">
           The Oracle has weighed your answers and divined your AI developer archetype. 
           Press the button below to print your personalized fortune.
          </p>
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              runPrinterRequest({
                endpoint: "/api/print-epos",
                pendingMessage: "Sending Epson ePOS print job...",
                failureMessage: "Epson ePOS print failed.",
                extraData: { answers }
              });
            }}
          >
          <div className="actions">
                <Button
                  type="submit"
                  className="primary-action print-cta"
                  themeColor="primary"
                  disabled={busy}
                >
                  {busy ? <Loader size="small" type="pulsing" /> : "Reveal My Future"}
                </Button>
            </div>
          </form>

          <div className="actions restart-actions">
                <Button
                  type="button"
                  className="restart-cta"
                  disabled={busy}
                  onClick={restartQuiz}
                >
                  Start Over
                </Button>
          </div>

          <NotificationGroup className="status-group" style={{ position: "fixed", right: 20, bottom: 20 }}>
            {statusState === "error" && status && (
              <Notification type={{ style: "error", icon: true }} closable={false}>
                <span>{status}</span>
              </Notification>
            )}
          </NotificationGroup>
          </CardBody>
        </Card>
        }
    </main>
  );
}

function buildPayload(timeoutValue) {
  const timeout = Number.parseInt(timeoutValue, 10);

  if (!Number.isInteger(timeout) || timeout <= 0 || timeout > 300000) {
    return {
      ok: false,
      error: "ePOS timeout must be between 1 and 300000 milliseconds."
    };
  }

  return {
    ok: true,
    data: {
      timeout
    }
  };
}

function restoreSavedTimeout() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  const timeout = Number.parseInt(raw, 10);

  if (Number.isInteger(timeout) && timeout > 0 && timeout <= 300000) {
    return `${timeout}`;
  }

  return null;
}