import { useEffect, useState } from "react";

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

  return (
    <main className="shell">
      <section className="panel hero">
        <p className="eyebrow">Epson TM-m30III</p>
        <h1>Print a sample receipt from the browser.</h1>
        <p className="lede">
          This React app sends a sample ESC/POS receipt through a Node server to your printer over Wi-Fi.
        </p>
      </section>

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
          <p className="target">
            Locked printer target: <strong>{printerTarget.host}:{printerTarget.port}</strong> and ePOS device
            <strong> {printerTarget.deviceId}</strong>.
          </p>

          <label>
            <span>ePOS timeout (ms)</span>
            <input
              name="timeout"
              type="number"
              min="1"
              max="300000"
              value={timeout}
              onChange={handleTimeoutChange}
            />
          </label>

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
            <button type="submit" disabled={busy}>
              Print sample receipt
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