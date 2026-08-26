# Epson TM-m30III Web Printer Demo

This project is a small Node.js web app that prints a sample receipt to an Epson TM-m30III over Wi-Fi.

## How it works

- The browser loads a simple action panel for a fixed printer target.
- A small Node HTTP server accepts the print request.
- The server can either open a raw TCP socket to the printer on port `9100` or send an Epson ePOS-Print request to the printer's HTTP service.
- Raw TCP sends ESC/POS bytes directly. Epson ePOS-Print sends a SOAP XML print request.

This project is currently locked to:

- Printer IP: `192.168.1.121`
- Printer port: `9100`
- ePOS device ID: `local_printer`

## Requirements

- Node.js 18 or newer
- Epson TM-m30III reachable on your local network
- The printer configured to accept raw TCP print jobs on port `9100`

## Install

This starter currently runs on the built-in Node.js runtime and does not require any packages.

If you add dependencies later, this project is already configured to install from the Harness npm registry via `.npmrc`.

```bash
npm install
```

## Run

```bash
npm start
```

The app runs at `http://localhost:3000`.

## Optional environment variables

- `PORT`: web server port
- `EPOS_TIMEOUT`: ePOS request timeout in milliseconds, default `60000`

## Using the app

1. Open the app in your browser.
2. Click **Test connection** to verify the locked printer target is reachable.
3. Click **Print via Epson ePOS** to print the sample receipt.
4. Optionally adjust only the ePOS timeout value if needed.

## Troubleshooting

- If **Test connection** fails, confirm the printer IP address and verify that Epson raw TCP printing is enabled on port `9100`.
- If **Test connection** succeeds but no receipt prints, the next most likely issue is the printer interface mode on the TM-m30III.
- Print the printer network status sheet and confirm the current IP address and enabled protocols.
- Try **Print via Epson ePOS** with device ID `local_printer`. If that fails, the response usually includes an Epson error code that is more actionable than a silent raw TCP failure.
- If `local_printer` fails, check the printer's WebConfig for the configured ePOS device ID.
- On this printer, the ePOS service accepts SOAP-wrapped requests for `local_printer`. If you see `EX_TIMEOUT`, the request shape was accepted but the printer did not complete the job, which usually points to printer state or ePOS configuration rather than network reachability.

## Notes

- This starter uses plain ASCII text for the sample receipt to avoid code page issues.
- If your printer does not accept raw TCP on `9100`, you may need to enable it in the Epson network settings.
- If you want browser-side direct printing later, the next step would be Epson ePOS-Print support instead of raw TCP.