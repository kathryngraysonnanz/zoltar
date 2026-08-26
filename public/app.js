const form = document.querySelector("#print-form");
const eposTimeoutInput = document.querySelector("#epos-timeout");
const status = document.querySelector("#status");
const testButton = document.querySelector("#test-connection");
const printButton = form.querySelector('button[type="submit"]');
const eposButton = document.querySelector("#print-epos");
const STORAGE_KEY = "epson-epos-timeout";

initialize();

testButton.addEventListener("click", async () => {
  await runPrinterRequest({
    endpoint: "/api/test-connection",
    pendingMessage: "Testing printer connection...",
    failureMessage: "Connection test failed."
  });
});

eposButton.addEventListener("click", async () => {
  await runPrinterRequest({
    endpoint: "/api/print-epos",
    pendingMessage: "Sending Epson ePOS print job...",
    failureMessage: "Epson ePOS print failed."
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  await runPrinterRequest({
    endpoint: "/api/print-sample",
    pendingMessage: "Sending sample receipt...",
    failureMessage: "Printing failed."
  });
});

async function runPrinterRequest({ endpoint, pendingMessage, failureMessage }) {
  const payload = buildPayload();

  if (!payload.ok) {
    setStatus(payload.error, "error");
    return;
  }

  setStatus(pendingMessage);
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

    setStatus(result.message, "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : failureMessage, "error");
  } finally {
    setBusy(false);
  }
}

async function initialize() {
  try {
    restoreSavedTimeout();

    const response = await fetch("/api/health");
    const result = await response.json();

    if (result.defaultEposTimeout) {
      eposTimeoutInput.value = result.defaultEposTimeout;
    }

    persistTimeout();
  } catch (_error) {
    setStatus("Server is not reachable yet.", "error");
  }
}

function setStatus(message, state = "idle") {
  status.textContent = message;
  status.dataset.state = state;
}

function setBusy(isBusy) {
  testButton.disabled = isBusy;
  printButton.disabled = isBusy;
  eposButton.disabled = isBusy;
}

function buildPayload() {
  const timeout = Number.parseInt(eposTimeoutInput.value, 10);

  if (!Number.isInteger(timeout) || timeout <= 0 || timeout > 300000) {
    return {
      ok: false,
      error: "ePOS timeout must be between 1 and 300000 milliseconds."
    };
  }

  persistTimeout();

  return {
    ok: true,
    data: {
      timeout
    }
  };
}

function persistTimeout() {
  localStorage.setItem(STORAGE_KEY, eposTimeoutInput.value);
}

function restoreSavedTimeout() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return;
  }

  const timeout = Number.parseInt(raw, 10);

  if (Number.isInteger(timeout) && timeout > 0 && timeout <= 300000) {
    eposTimeoutInput.value = `${timeout}`;
  }
}