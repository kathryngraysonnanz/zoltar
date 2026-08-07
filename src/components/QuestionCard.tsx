import { Button } from "@progress/kendo-react-buttons";
import { ProgressBar } from "@progress/kendo-react-progressbars";
import { Card, CardBody } from "@progress/kendo-react-layout";
import type { Question } from "../data/questions";

interface Props {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answerId: string, tags: string[]) => void;
}

export function QuestionCard({ question, questionNumber, totalQuestions, onAnswer }: Props) {
  const progressValue = (questionNumber / totalQuestions) * 100;

  return (
    <Card className="question-card screen-card">
      <CardBody className="screen-card-body">
        <p className="progress-label">
          Question {questionNumber} of {totalQuestions}
        </p>
        <ProgressBar
          value={progressValue}
          className="quiz-progress"
          animation={{ duration: 400 }}
        />
        <h2 className="question-text">{question.text}</h2>
        <div className="answer-grid">
          {question.answers.map((answer) => (
            <Button
              key={answer.id}
              fillMode="flat"
              className="answer-btn"
              onClick={() => onAnswer(answer.id, answer.tags)}
            >
              {answer.text}
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
