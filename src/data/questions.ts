export interface Answer {
  id: string;
  text: string;
  tags: string[];
}

export interface Question {
  id: string;
  text: string;
  answers: Answer[];
}

export const questions: Question[] = [
  {
    id: "q1",
    text: "When facing a challenge, you typically…",
    answers: [
      { id: "a", text: "Charge in headfirst", tags: ["bold", "action"] },
      { id: "b", text: "Make a detailed plan", tags: ["strategic", "steady"] },
      { id: "c", text: "Ask others for input", tags: ["collaborative", "open"] },
      { id: "d", text: "Trust your instincts", tags: ["intuitive", "free"] },
    ],
  },
  {
    id: "q2",
    text: "The quality you value most in your work is…",
    answers: [
      { id: "a", text: "Speed and efficiency", tags: ["action", "driven"] },
      { id: "b", text: "Precision and quality", tags: ["strategic", "steady"] },
      { id: "c", text: "Innovation and creativity", tags: ["bold", "free"] },
      { id: "d", text: "Impact and purpose", tags: ["intuitive", "open"] },
    ],
  },
  {
    id: "q3",
    text: "Your ideal Friday afternoon looks like…",
    answers: [
      { id: "a", text: "Crushing the to-do list", tags: ["driven", "action"] },
      { id: "b", text: "A long brainstorm session", tags: ["free", "bold"] },
      { id: "c", text: "Collaborating with the team", tags: ["collaborative", "open"] },
      { id: "d", text: "Reflecting and recharging", tags: ["intuitive", "steady"] },
    ],
  },
  {
    id: "q4",
    text: "When you imagine success, it looks like…",
    answers: [
      { id: "a", text: "Recognition and achievement", tags: ["bold", "driven"] },
      { id: "b", text: "Balance and fulfillment", tags: ["steady", "intuitive"] },
      { id: "c", text: "Making a difference", tags: ["open", "collaborative"] },
      { id: "d", text: "Continuous growth", tags: ["free", "action"] },
    ],
  },
  {
    id: "q5",
    text: "The superpower you wish you had…",
    answers: [
      { id: "a", text: "The ability to stop time", tags: ["strategic", "steady"] },
      { id: "b", text: "Telepathy", tags: ["intuitive", "open"] },
      { id: "c", text: "Super speed", tags: ["action", "driven"] },
      { id: "d", text: "The power to inspire anyone", tags: ["collaborative", "bold"] },
    ],
  },
];
