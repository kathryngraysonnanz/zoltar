import { useState, useCallback } from "react";
import { questions } from "./data/questions";
import { selectFortune, buildTagCounts, type Fortune } from "./data/fortunes";
import { saveSession } from "./firebase/sessions";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { QuestionCard } from "./components/QuestionCard";
import { FortuneCard } from "./components/FortuneCard";
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

  const handleStart = useCallback(() => {
    setScreen("quiz");
    setCurrentIndex(0);
    setAnswers([]);
    setFortune(null);
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

        // Persist to Firebase (fire-and-forget; errors are non-blocking)
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
          />
        )}
      </div>

      {/* Print-only receipt layout */}
      <div className="print-receipt" aria-hidden="true">
        <div className="receipt-header">✦ ZOLTAR SPEAKS ✦</div>
        {fortune && (
          <>
            <div className="receipt-title">{fortune.title}</div>
            <div className="receipt-text">{fortune.text}</div>
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
