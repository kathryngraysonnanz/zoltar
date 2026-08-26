const ESC = 0x1b;
const GS = 0x1d;

function command(...bytes) {
  return Buffer.from(bytes);
}

function text(value = "") {
  return Buffer.from(value, "ascii");
}

function line(value = "") {
  return text(`${value}\n`);
}

function divider(width = 32) {
  return line("-".repeat(width));
}

export function buildSampleReceipt() {
  const parts = [
    command(ESC, 0x40),
    command(ESC, 0x61, 0x01),
    command(GS, 0x21, 0x11),
    line("NANZ CAFE"),
    command(GS, 0x21, 0x00),
    line("Sample Receipt"),
    line("123 Market Street"),
    line("San Francisco, CA"),
    line("(415) 555-0199"),
    line(""),
    command(ESC, 0x61, 0x00),
    divider(),
    line("1  Drip Coffee         $3.50"),
    line("1  Blueberry Muffin    $4.25"),
    line("1  Orange Juice        $3.00"),
    divider(),
    line("Subtotal              $10.75"),
    line("Tax                    $0.97"),
    command(ESC, 0x45, 0x01),
    line("Total                 $11.72"),
    command(ESC, 0x45, 0x00),
    line(""),
    command(ESC, 0x61, 0x01),
    line("Paid with VISA"),
    line("Auth: 482901"),
    line(""),
    line("Thank you for visiting."),
    line(""),
    line(new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    })),
    line(""),
    line(""),
    command(GS, 0x56, 0x00)
  ];

  return Buffer.concat(parts);
}