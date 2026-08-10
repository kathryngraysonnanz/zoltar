import { useState, useCallback } from "react";
import { questions } from "./data/questions";
import { selectFortune, buildTagCounts, type Fortune } from "./data/fortunes";
import { saveSession } from "./firebase/sessions";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { QuestionCard } from "./components/QuestionCard";
import { FortuneCard } from "./components/FortuneCard";
import { ThemeToggle } from "./components/ThemeToggle";
import { QRCode } from "./components/QRCode";
import "./App.css";

type Screen = "welcome" | "quiz" | "fortune";

interface AnswerRecord {
  questionId: string;
  questionText: string;
  answerId: string;
  answerText: string;
  tags: string[];
}

function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleStart = useCallback(() => {
    setScreen("quiz");
    setCurrentIndex(0);
    setAnswers([]);
    setFortune(null);
    setSessionId(null);
  }, []);

  const handleAnswer = useCallback(
    async (answerId: string, tags: string[]) => {
      const question = questions[currentIndex];
      const answerOption = question.answers.find((a) => a.id === answerId)!;
      const newAnswers: AnswerRecord[] = [
        ...answers,
        {
          questionId: question.id,
          questionText: question.text,
          answerId,
          answerText: answerOption.text,
          tags,
        },
      ];
      setAnswers(newAnswers);

      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        const tagCounts = buildTagCounts(newAnswers.map((a) => a.tags));
        const selectedFortune = selectFortune(tagCounts);
        setFortune(selectedFortune);
        setScreen("fortune");

        // Persist to Firebase and capture session ID for sharing
        saveSession({
          answers: newAnswers.map(({ questionId, questionText, answerId, answerText }) => ({
            questionId,
            questionText,
            answerId,
            answerText,
          })),
          fortuneId: selectedFortune.id,
          fortuneTitle: selectedFortune.title,
          fortuneText: selectedFortune.text,
        }).then((id) => {
          setSessionId(id);
        }).catch((err) => {
          console.error("Failed to save session:", err);
        });
      }
    },
    [answers, currentIndex]
  );

  const handlePrint = useCallback(() => {
    if (!fortune) return;
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  }, [fortune]);

  const handleRestart = useCallback(() => {
    setScreen("welcome");
  }, []);

  return (
    <div className="app">
      <div className="app-inner">
        {screen === "welcome" && <WelcomeScreen onStart={handleStart} />}
        {screen === "quiz" && (
          <QuestionCard
            key={currentIndex}
            question={questions[currentIndex]}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
          />
        )}
        {screen === "fortune" && fortune && (
          <FortuneCard
            fortune={fortune}
            onPrint={handlePrint}
            onRestart={handleRestart}
            isPrinting={isPrinting}
            sessionId={sessionId}
          />
        )}
      </div>

      <ThemeToggle />

      {/* Print-only receipt layout */}
      <div className="print-receipt" aria-hidden="true">
        <div className="receipt-header">✦ ZOLTAR SPEAKS ✦</div>
        {fortune && (
          <>
            <div className="receipt-title">{fortune.title}</div>
            <div className="receipt-text">{fortune.text}</div>
            {sessionId && (
              <div className="receipt-qr">
                <QRCode 
                  url={`${window.location.origin}/fortune/${sessionId}`} 
                  size={100}
                  className="receipt-qr-image"
                />
                <div className="receipt-qr-label">Scan to share</div>
              </div>
            )}
            <div className="receipt-footer">
              <div>✦ ✦ ✦</div>
              <div>Keep this fortune close.</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
