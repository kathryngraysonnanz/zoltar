import fs from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSampleReceipt } from "./receipt.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");
const defaultPrinterHost = "192.168.1.121";
const defaultPrinterPort = 9100;
const defaultEposDeviceId = "local_printer";
const defaultEposTimeout = Number.parseInt(process.env.EPOS_TIMEOUT ?? "60000", 10);
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `localhost:${port}`}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        defaultPrinterHost,
        defaultPrinterPort,
        defaultEposDeviceId,
        defaultEposTimeout
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/print-sample") {
      const printerHost = defaultPrinterHost;
      const printerPort = defaultPrinterPort;

      const validationError = validatePrinterTarget(printerHost, printerPort);

      if (validationError) {
        sendJson(res, 400, { error: validationError });
        return;
      }

      try {
        await printToPrinter({
          host: printerHost,
          port: printerPort,
          payload: buildSampleReceipt()
        });

        sendJson(res, 200, {
          ok: true,
          message: `Sample receipt sent to ${printerHost}:${printerPort}.`
        });
      } catch (error) {
        sendJson(res, 502, {
          error: error instanceof Error ? error.message : "Unable to reach printer."
        });
      }

      return;
    }

    if (req.method === "POST" && url.pathname === "/api/test-connection") {
      const printerHost = defaultPrinterHost;
      const printerPort = defaultPrinterPort;

      const validationError = validatePrinterTarget(printerHost, printerPort);

      if (validationError) {
        sendJson(res, 400, { error: validationError });
        return;
      }

      try {
        await testPrinterConnection({ host: printerHost, port: printerPort });
        sendJson(res, 200, {
          ok: true,
          message: `Connected to ${printerHost}:${printerPort}. The printer accepted a TCP connection.`
        });
      } catch (error) {
        sendJson(res, 502, {
          error: error instanceof Error ? error.message : "Unable to reach printer."
        });
      }

      return;
    }

    if (req.method === "POST" && url.pathname === "/api/print-epos") {
      const body = await readJsonBody(req);
      const printerHost = defaultPrinterHost;
      const deviceId = defaultEposDeviceId;
      const timeout = Number.parseInt(`${body?.timeout ?? defaultEposTimeout}`, 10);

      if (!printerHost) {
        sendJson(res, 400, { error: "Printer host is required." });
        return;
      }

      if (!deviceId) {
        sendJson(res, 400, { error: "ePOS device ID is required." });
        return;
      }

      if (!Number.isInteger(timeout) || timeout <= 0 || timeout > 300000) {
        sendJson(res, 400, { error: "ePOS timeout must be between 1 and 300000 milliseconds." });
        return;
      }

      try {
        const result = await printViaEpos({
          host: printerHost,
          deviceId,
          timeout,
          receiptXml: buildSampleReceiptEposXml()
        });

        sendJson(res, 200, {
          ok: true,
          message: `ePOS print request accepted by ${printerHost} for device ${deviceId}.`,
          result
        });
      } catch (error) {
        sendJson(res, 502, {
          error: error instanceof Error ? error.message : "Unable to print through Epson ePOS-Print."
        });
      }

      return;
    }

    if (req.method === "GET") {
      await sendStaticFile(res, url.pathname);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error."
    });
  }
});

server.listen(port, () => {
  console.log(`Receipt app listening on http://localhost:${port}`);
});

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function sendStaticFile(res, pathname) {
  const normalizedPath = pathname === "/" ? "/index.html" : pathname;
  const requestedPath = path.normalize(normalizedPath).replace(/^([.][.][\/\\])+/, "");
  const filePath = path.join(publicDir, requestedPath);

  try {
    const fileContents = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
    res.end(fileContents);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      sendJson(res, 404, { error: "Not found." });
      return;
    }

    throw error;
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".css") {
    return "text/css; charset=utf-8";
  }

  if (extension === ".js") {
    return "application/javascript; charset=utf-8";
  }

  if (extension === ".html") {
    return "text/html; charset=utf-8";
  }

  return "text/plain; charset=utf-8";
}

function validatePrinterTarget(host, port) {
  if (!host) {
    return "Printer host is required.";
  }

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    return "Printer port must be a valid TCP port.";
  }

  return null;
}

function testPrinterConnection({ host, port }) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(5000);

    socket.once("connect", () => {
      settled = true;
      socket.end();
      resolve();
    });

    socket.once("timeout", () => {
      socket.destroy();

      if (!settled) {
        reject(new Error(`Timed out while connecting to ${host}:${port}.`));
      }
    });

    socket.once("error", (error) => {
      socket.destroy();

      if (!settled) {
        reject(error);
      }
    });

    socket.connect(port, host);
  });
}

function printToPrinter({ host, port, payload }) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();

    socket.setTimeout(5000);

    socket.once("connect", () => {
      socket.write(payload, (error) => {
        if (error) {
          socket.destroy();
          reject(error);
          return;
        }

        socket.end();
      });
    });

    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("Timed out while connecting to the printer."));
    });

    socket.once("error", (error) => {
      socket.destroy();
      reject(error);
    });

    socket.once("close", (hadError) => {
      if (!hadError) {
        resolve();
      }
    });

    socket.connect(port, host);
  });
}

async function printViaEpos({ host, deviceId, timeout, receiptXml }) {
  const endpoint = new URL(`http://${host}/cgi-bin/epos/service.cgi`);
  endpoint.searchParams.set("devid", deviceId);
  endpoint.searchParams.set("timeout", `${timeout}`);
  const body = wrapEposEnvelope(receiptXml);

  const response = await postXml(endpoint, body, timeout + 2000);

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`ePOS request failed with HTTP ${response.statusCode}. ${response.body.slice(0, 200)}`.trim());
  }

  return parseEposResponse(response.body);
}

function postXml(url, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 80,
      path: `${url.pathname}${url.search}`,
      method: "POST",
      timeout: timeoutMs,
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: '""',
        "Content-Length": Buffer.byteLength(body, "utf8")
      }
    }, (response) => {
      const chunks = [];

      response.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      response.on("end", () => {
        resolve({
          statusCode: response.statusCode ?? 0,
          body: Buffer.concat(chunks).toString("utf8")
        });
      });
    });

    request.once("timeout", () => {
      request.destroy(new Error("Timed out while waiting for the Epson ePOS service."));
    });

    request.once("error", (error) => {
      reject(error);
    });

    request.write(body);
    request.end();
  });
}

function wrapEposEnvelope(receiptXml) {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">',
    "<soapenv:Body>",
    '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">',
    receiptXml,
    "</epos-print>",
    "</soapenv:Body>",
    "</soapenv:Envelope>"
  ].join("");
}

function buildSampleReceiptEposXml() {
  return [
    '<text align="center" smooth="true" width="2" height="2">NANZ CAFE&#10;</text>',
    '<text align="center">Sample Receipt via Epson ePOS&#10;</text>',
    '<feed line="1"/>',
    '<text>--------------------------------&#10;</text>',
    '<text>Order: #1042&#10;</text>',
    '<text>Server: Web Demo&#10;</text>',
    '<text>Date: 2026-08-26&#10;</text>',
    '<text>--------------------------------&#10;</text>',
    '<text>1  Drip Coffee         $3.50&#10;</text>',
    '<text>1  Blueberry Muffin    $4.25&#10;</text>',
    '<text>1  Orange Juice        $3.00&#10;</text>',
    '<text>--------------------------------&#10;</text>',
    '<text>Subtotal             $10.75&#10;</text>',
    '<text>Tax                   $0.97&#10;</text>',
    '<text width="2" height="2">TOTAL: $11.72&#10;</text>',
    '<feed line="1"/>',
    '<text align="center">+----------------------+&#10;</text>',
    '<text align="center">|      THANK YOU!      |&#10;</text>',
    '<text align="center">|   VISIT AGAIN SOON   |&#10;</text>',
    '<text align="center">+----------------------+&#10;</text>',
    '<feed line="2"/>',
    '<cut type="feed"/>'
  ].join("");
}

function parseEposResponse(responseText) {
  const responseTagMatch = responseText.match(/<response\b([^>]*)\/?>(?:<\/response>)?/i);

  if (!responseTagMatch) {
    throw new Error(`Printer returned an unexpected ePOS response. ${responseText.slice(0, 200)}`.trim());
  }

  const attributes = parseXmlAttributes(responseTagMatch[1] ?? "");
  const successValue = `${attributes.success ?? ""}`.toLowerCase();
  const success = successValue === "true" || successValue === "1";
  const code = attributes.code ?? "";
  const status = attributes.status ?? "";
  const statusDetails = decodeEposStatus(status);

  if (!success) {
    throw new Error(buildEposFailureMessage({ code, status, statusDetails }));
  }

  return {
    success,
    code,
    status,
    statusDetails,
    raw: responseText
  };
}

function buildEposFailureMessage({ code, status, statusDetails }) {
  const parts = ["ePOS print failed"];

  if (code) {
    parts.push(`: ${code}`);
  }

  if (status) {
    parts.push(` (status ${status}`);

    if (statusDetails) {
      parts.push(`, ${statusDetails.hex}`);

      if (statusDetails.bits.length > 0) {
        parts.push(`, bits ${statusDetails.bits.join(",")}`);
      }
    }

    parts.push(")");
  }

  if (code === "EX_TIMEOUT") {
    parts.push(". Printer accepted ePOS but did not complete printing in time.");
    parts.push(" Check paper loaded, cover closed, and printer not paused.");
    parts.push(" In Epson WebConfig (admin), verify ePOS-Print is enabled for device ID local_printer.");
  }

  return parts.join("");
}

function decodeEposStatus(status) {
  const numericStatus = Number.parseInt(`${status}`, 10);

  if (!Number.isInteger(numericStatus) || numericStatus < 0) {
    return null;
  }

  const bits = [];

  for (let bit = 0; bit < 32; bit += 1) {
    if ((numericStatus & (1 << bit)) !== 0) {
      bits.push(bit);
    }
  }

  return {
    value: numericStatus,
    hex: `0x${numericStatus.toString(16).toUpperCase()}`,
    bits
  };
}

function parseXmlAttributes(source) {
  const attributes = {};
  const pattern = /(\w+)="([^"]*)"/g;
  let match = pattern.exec(source);

  while (match) {
    attributes[match[1]] = match[2];
    match = pattern.exec(source);
  }

  return attributes;
}