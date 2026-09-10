import { useEffect, useState } from "react";
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardBody } from '@progress/kendo-react-layout';
import { Loader } from '@progress/kendo-react-indicators';
import { firebaseEnabled } from "./firebase.js";

export default function AdminPage() {
  const staticDeployment = import.meta.env.VITE_STATIC_DEPLOYMENT === "true";
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState("");
  const [status, setStatus] = useState("");
  const [statusState, setStatusState] = useState("idle");
  const [busyAction, setBusyAction] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      if (staticDeployment) {
        setHealthError("Printer controls are available when the app runs locally.");
        return;
      }

      try {
        const response = await fetch("/api/health");
        const result = await response.json();

        if (!cancelled) {
          setHealth(result);
        }
      } catch (error) {
        if (!cancelled) {
          setHealthError(error instanceof Error ? error.message : "Unable to reach server.");
        }
      }
    }

    loadHealth();

    return () => {
      cancelled = true;
    };
  }, [staticDeployment]);

  async function runAction(action, endpoint) {
    setBusyAction(action);
    setStatus(`Running ${action}...`);
    setStatusState("idle");

    try {
      const response = await fetch(endpoint, { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? `${action} failed.`);
      }

      setStatus(result.message);
      setStatusState("success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `${action} failed.`);
      setStatusState("error");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="shell">
      <Card className="panel hero">
        <CardBody>
          <h1>Admin / Troubleshooting</h1>

          <div className="actions">
            <Button
              className="response"
              disabled={staticDeployment || busyAction !== null}
              onClick={() => runAction("Test connection", "/api/test-connection")}
            >
              {busyAction === "Test connection" ? <Loader size="small" type="pulsing" /> : "Test Connection"}
            </Button>
            <Button
              className="response"
              disabled={staticDeployment || busyAction !== null}
              onClick={() => runAction("Test print", "/api/print-sample")}
            >
              {busyAction === "Test print" ? <Loader size="small" type="pulsing" /> : "Test Print"}
            </Button>
            <Button
              className="response"
              disabled={busyAction !== null}
              onClick={() => runAction("Bluetooth test print", "/api/print-bluetooth")}
            >
              {busyAction === "Bluetooth test print" ? <Loader size="small" type="pulsing" /> : "Bluetooth Test Print"}
            </Button>
          </div>

          {status && (
            <p className={statusState === "error" ? "status-error" : "status-success"}>{status}</p>
          )}

          {staticDeployment && <p className="status-error">GitHub Pages hosts the interface only. Run the local Node server for printer tests.</p>}

          <h2>Server Config</h2>
          {healthError && <p className="status-error">{healthError}</p>}
          {health && (
            <dl>
              <dt>Printer host</dt>
              <dd>{health.defaultPrinterHost}</dd>
              <dt>Printer port</dt>
              <dd>{health.defaultPrinterPort}</dd>
              <dt>ePOS device ID</dt>
              <dd>{health.defaultEposDeviceId}</dd>
              <dt>ePOS timeout (ms)</dt>
              <dd>{health.defaultEposTimeout}</dd>
              <dt>Bluetooth device</dt>
              <dd>{health.bluetoothDevice || "not configured"}</dd>
              <dt>Bluetooth baud rate</dt>
              <dd>{health.bluetoothBaudRate}</dd>
            </dl>
          )}

          <h2>Client Info</h2>
          <dl>
            <dt>Firebase enabled</dt>
            <dd>{firebaseEnabled ? "yes" : "no"}</dd>
            <dt>User agent</dt>
            <dd>{navigator.userAgent}</dd>
            <dt>Page URL</dt>
            <dd>{window.location.href}</dd>
          </dl>
        </CardBody>
      </Card>
    </main>
  );
}
