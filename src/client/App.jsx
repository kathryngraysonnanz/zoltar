import { useEffect, useState } from "react";
import { ProgressBar } from '@progress/kendo-react-progressbars';


const STORAGE_KEY = "epson-epos-timeout";

export default function App() {
  const [timeout, setTimeoutValue] = useState("60000");
  const [status, setStatus] = useState("");
  const [statusState, setStatusState] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [printerTarget, setPrinterTarget] = useState({
    host: "192.168.1.121",
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
          host: result.defaultPrinterHost ?? "192.168.1.121",
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

  async function runPrinterRequest({ endpoint, pendingMessage, failureMessage }) {
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
        body: JSON.stringify(payload.data)
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

  function logResult(answer, question) {
    console.log(`Answer: ${answer}`);
    
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
    }
  }


  return (
    <main className="shell">

      { intro && 
      <section className="panel hero">
        <h1>The AI Developer Oracle</h1>
        <p className="lede">
         What kind of AI engineer are you? What does the future hold for your projects? 
         Answer five questions and let the Oracle reveal your fortune.
        </p>
        <button onClick={() => setIntro(false) || setQ1(true)}>Discover Your Future</button>
      </section>
      }

       { q1 && 
        <section className="panel hero">
          <h1>Question 1</h1>
          <ProgressBar value={20} />
          <p>
          On a scale of 0 to 100, how much of your development process is AI-automated?
          </p>
          <button className='response' onClick={() => logResult('a', 'q1')}>0% – No AI use here</button>
          <button className='response' onClick={() => logResult('b', 'q1')}>25% – It handles some specific tasks, but most things are still human-generated. </button>
          <button className='response' onClick={() => logResult('c', 'q1')}>50% – It's a full partner</button>
          <button className='response' onClick={() => logResult('d', 'q1')}>75% – It owns most of the process, and I double-check what's generated</button>
          <button className='response' onClick={() => logResult('e', 'q1')}>100% – It's completely automated, and I rarely intervene</button>
        </section>
      }

       { q2 && 
      <section className="panel hero">
        <h1>The AI Developer Oracle</h1>
        <p className="lede">
         What kind of AI engineer are you? What does the future hold for your projects? 
         Answer five questions and let the Oracle reveal your fortune.
        </p>
      </section>
      }

       { q3 && 
      <section className="panel hero">
        <h1>The AI Developer Oracle</h1>
        <p className="lede">
         What kind of AI engineer are you? What does the future hold for your projects? 
         Answer five questions and let the Oracle reveal your fortune.
        </p>
      </section>
      }

       { q4 && 
      <section className="panel hero">
        <h1>The AI Developer Oracle</h1>
        <p className="lede">
         What kind of AI engineer are you? What does the future hold for your projects? 
         Answer five questions and let the Oracle reveal your fortune.
        </p>
      </section>
      }

       { q5 && 
      <section className="panel hero">
        <h1>The AI Developer Oracle</h1>
        <p className="lede">
         What kind of AI engineer are you? What does the future hold for your projects? 
         Answer five questions and let the Oracle reveal your fortune.
        </p>
      </section>
      }

    { result && 
        <section className="panel form-panel">
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              runPrinterRequest({
                endpoint: "/api/print-sample",
                pendingMessage: "Sending sample receipt...",
                failureMessage: "Printing failed."
              });
            }}
          >
          <div className="actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    runPrinterRequest({
                      endpoint: "/api/test-connection",
                      pendingMessage: "Testing printer connection...",
                      failureMessage: "Connection test failed."
                    });
                  }}
                >
                  Test connection
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    runPrinterRequest({
                      endpoint: "/api/print-epos",
                      pendingMessage: "Sending Epson ePOS print job...",
                      failureMessage: "Epson ePOS print failed."
                    });
                  }}
                >
                  Print via Epson ePOS
                </button>
            </div>
          </form>

          <p className="status" role="status" aria-live="polite" data-state={statusState}>
            {status}
          </p>
        </section>
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