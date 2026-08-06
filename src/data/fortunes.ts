export interface Fortune {
  id: string;
  title: string;
  text: string;
  tags: string[];
}

export const fortunes: Fortune[] = [
  {
    id: "f1",
    title: "The Trailblazer",
    text: "Your boldness lights the path for others. A great opportunity is heading your way — seize it with both hands. Those who dare to act first write the history books. The stars align for those who move without hesitation.",
    tags: ["bold", "action", "driven"],
  },
  {
    id: "f2",
    title: "The Architect",
    text: "Your careful plans will outlast every storm. The foundation you are building now will support towers you cannot yet imagine. Patience is not hesitation — it is wisdom in disguise. Your greatest victory is already in motion.",
    tags: ["strategic", "steady"],
  },
  {
    id: "f3",
    title: "The Connector",
    text: "Your greatest strength flows through the people around you. A partnership on the horizon will unlock a door you didn't know existed. The bridges you build today carry you to destinations beyond your dreams.",
    tags: ["collaborative", "open"],
  },
  {
    id: "f4",
    title: "The Visionary",
    text: "Your instincts are a compass that never lies. Trust the quiet voice that says *this is the way*. A creative spark is about to ignite into something extraordinary. The future belongs to those who can imagine it first.",
    tags: ["intuitive", "free"],
  },
  {
    id: "f5",
    title: "The Catalyst",
    text: "Change follows you like a shadow — and that is your gift. You are on the edge of a breakthrough that will ripple far beyond what you expect. Energy like yours reshapes the world. Keep moving forward.",
    tags: ["action", "bold", "driven"],
  },
  {
    id: "f6",
    title: "The Steady Hand",
    text: "In a world of noise, your clarity is rare and powerful. The calm you bring to chaos makes you indispensable. A long-held goal is closer to fruition than it appears. Stay the course — your moment is almost here.",
    tags: ["steady", "strategic", "intuitive"],
  },
  {
    id: "f7",
    title: "The Explorer",
    text: "Every road you choose leads somewhere worth going. Curiosity is your compass and creativity is your fuel. An unexpected invitation is coming — say yes. The best chapters of your story haven't been written yet.",
    tags: ["free", "open", "collaborative"],
  },
  {
    id: "f8",
    title: "The Luminary",
    text: "People are drawn to your light without knowing why. Your ability to inspire is your most powerful tool. A moment of recognition is approaching — accept it graciously. The impact you have is greater than you know.",
    tags: ["bold", "collaborative", "open"],
  },
];

export function selectFortune(tagCounts: Record<string, number>): Fortune {
  const scored = fortunes.map((fortune) => {
    const score = fortune.tags.reduce(
      (sum, tag) => sum + (tagCounts[tag] ?? 0),
      0
    );
    return { fortune, score };
  });
  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);
  return scored[0].fortune;
}

export function buildTagCounts(selectedTags: string[][]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tags of selectedTags) {
    for (const tag of tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}
