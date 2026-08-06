# Zoltar 🔮

A React-based fortune-telling kiosk application built for trade show booths. Users answer five multiple-choice questions and receive a personalised fortune, which can be printed on a thermal receipt printer. All responses are saved to Firebase Firestore for later analysis.

## Features

- 🔮 Multi-step multiple-choice questionnaire
- ✨ Fortune generation based on answers
- 🗄 Firebase Firestore persistence
- 🖨 Thermal receipt printer support (via browser print API)
- 📱 Touch-screen optimised UI

## Getting Started

### 1. Clone & install

```bash
npm install
```

### 2. Configure Firebase

Create a `.env` file by copying `.env.example` and filling in your Firebase project values:

```bash
cp .env.example .env
```

You can find these values in the Firebase console under **Project Settings → Your apps**.

Make sure Firestore is enabled in your Firebase project. The app writes to a `sessions` collection with the following shape:

```json
{
  "answers": [
    {
      "questionId": "q1",
      "questionText": "When facing a challenge, you typically…",
      "answerId": "a",
      "answerText": "Charge in headfirst"
    }
  ],
  "fortuneId": "f5",
  "fortuneTitle": "The Catalyst",
  "fortuneText": "…",
  "createdAt": "<server timestamp>"
}
```

### 3. Run locally

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
npm run preview
```

## Thermal Receipt Printing

The app uses the browser's built-in `window.print()` API. The print stylesheet targets an 80 mm receipt width (standard for most thermal printers).

To configure the receipt printer:

1. Connect the thermal printer and install its driver.
2. In the browser, set the printer as the default or select it in the print dialog.
3. Set **Paper size** to match your receipt roll (e.g. 80 mm × continuous).
4. Disable headers and footers in the browser print settings.

## Project Structure

```
src/
├── components/
│   ├── WelcomeScreen.tsx   # Opening screen
│   ├── QuestionCard.tsx    # Multiple-choice question step
│   └── FortuneCard.tsx     # Fortune reveal + print/restart
├── data/
│   ├── questions.ts        # Questions & answers
│   └── fortunes.ts         # Fortune pool & selection logic
├── firebase/
│   ├── config.ts           # Firebase initialisation
│   └── sessions.ts         # Firestore write helper
├── App.tsx
└── App.css                 # Kiosk UI + print receipt styles
```
