# Epson TM-m30III Web Printer Demo

This project is a small Node.js web app that prints a sample receipt to an Epson TM-m30III over Wi-Fi.

## How it works

- The browser loads a React UI for a fixed printer target.
- A small Node HTTP server accepts the print request.
- The server can either open a raw TCP socket to the printer on port `9100` or send an Epson ePOS-Print request to the printer's HTTP service.
- Raw TCP sends ESC/POS bytes directly. Epson ePOS-Print sends a SOAP XML print request.

This project is currently locked to:

- Printer IP: `192.168.1.123`
- Printer port: `9100`
- ePOS device ID: `local_printer`
- Optional Bluetooth test device: configured separately with `BLUETOOTH_DEVICE`

## Requirements

- Node.js 18 or newer
- Epson TM-m30III reachable on your local network
- The printer configured to accept raw TCP print jobs on port `9100`

## Install

Install the app and frontend tooling:

```bash
npm install
```

## Run

```bash
npm start
```

`npm start` builds the React frontend and then runs the Node server at `http://localhost:3000`.

For local development, run:

```bash
npm run dev
```

That starts Vite on `http://localhost:5173` and proxies `/api` calls to the Node server.

## GitHub Pages

Push the `main` branch to GitHub. The workflow in `.github/workflows/deploy-pages.yml` builds and deploys the static frontend automatically. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

The site will be available at `https://<owner>.github.io/zoltar/`. The quiz and Firebase survey storage can run on Pages, but printer, Bluetooth, and admin test actions require the local Node server because GitHub Pages cannot access a local printer or run server-side code. The admin page on Pages is available at `/#/admin` and explains this limitation.

If Firebase is needed on the deployed site, add these as repository or environment variables under **Settings → Secrets and variables → Actions → Variables**: `VITE_FIREBASE_ENABLED`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID`. Add `VITE_KENDO_UI_LICENSE` as an Actions secret if the deployed build should use the licensed Kendo UI key.

## Optional environment variables

- `PORT`: web server port
- `EPOS_TIMEOUT`: ePOS request timeout in milliseconds, default `60000`
- `BLUETOOTH_DEVICE`: paired macOS serial device path, usually `/dev/cu.*`; used only by the admin Bluetooth test print
- `BLUETOOTH_BAUD_RATE`: Bluetooth serial speed, default `115200`

## Using the app

1. Open the app in your browser.
2. Click **Test connection** to verify the locked printer target is reachable.
3. Click **Print via Epson ePOS** to print the sample receipt.
4. Optionally adjust only the ePOS timeout value if needed.

### Bluetooth admin test

Pair the printer with macOS first. The Bluetooth serial device should appear under `/dev/cu.*`. Set that path in `.env`, for example:

```bash
BLUETOOTH_DEVICE=/dev/cu.EPSON_TM-m30III
BLUETOOTH_BAUD_RATE=115200
```

Restart the server, open `/admin`, and click **Bluetooth Test Print**. This sends the same sample ESC/POS receipt over Bluetooth. It does not change or replace `PRINTER_HOST`, `PRINTER_PORT`, or the guest-facing Wi-Fi print flow.

## Troubleshooting

- If **Test connection** fails, confirm the printer IP address and verify that Epson raw TCP printing is enabled on port `9100`.
- If **Test connection** succeeds but no receipt prints, the next most likely issue is the printer interface mode on the TM-m30III.
- Print the printer network status sheet and confirm the current IP address and enabled protocols.
- Try **Print via Epson ePOS** with device ID `local_printer`. If that fails, the response usually includes an Epson error code that is more actionable than a silent raw TCP failure.
- If `local_printer` fails, check the printer's WebConfig for the configured ePOS device ID.
- On this printer, the ePOS service accepts SOAP-wrapped requests for `local_printer`. If you see `EX_TIMEOUT`, the request shape was accepted but the printer did not complete the job, which usually points to printer state or ePOS configuration rather than network reachability.

## Notes

- This starter uses plain ASCII text for the sample receipt to avoid code page issues.
- The **Print via Epson ePOS** sample includes a QR code that points to `https://www.telerik.com/devcraft`.
- The React UI source lives in [index.html](index.html) and [src/client/App.jsx](src/client/App.jsx).
- If your printer does not accept raw TCP on `9100`, you may need to enable it in the Epson network settings.
- If you want browser-side direct printing later, the next step would be Epson ePOS-Print support instead of raw TCP.