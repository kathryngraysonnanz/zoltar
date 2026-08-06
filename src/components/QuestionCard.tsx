import type { Question } from "../data/questions";

interface Props {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answerId: string, tags: string[]) => void;
}

export function QuestionCard({ question, questionNumber, totalQuestions, onAnswer }: Props) {
  return (
    <div className="question-card">
      <p className="progress-label">
        Question {questionNumber} of {totalQuestions}
      </p>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>
      <h2 className="question-text">{question.text}</h2>
      <div className="answer-grid">
        {question.answers.map((answer) => (
          <button
            key={answer.id}
            className="answer-btn"
            onClick={() => onAnswer(answer.id, answer.tags)}
            type="button"
          >
            {answer.text}
          </button>
        ))}
      </div>
    </div>
  );
}
