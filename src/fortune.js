const USAGE_INTENSITY = { a: 100, b: 75, c: 50, d: 25, e: 0 };
const VERIFICATION_SKIP = { a: 0, b: 25, c: 50, d: 75, e: 100 };
const ACCEPTANCE_RATE = { a: 100, b: 75, c: 50, d: 25, e: 0 };
const VALUE_REALIZED = { a: 60, b: 90, c: 70, d: 80, e: 0 };

// Ordered from most AI-forward (high overall score) to most AI-skeptical (low).
const ARCHETYPE_TIERS = [
  {
    minScore: 80,
    name: "THE AUTOPILOT ENGINEER",
    fortune: ["Untested paths open", "Walk boldly ahead."],
    luckyCommand: "git commit -m 'yolo'"
  },
  {
    minScore: 60,
    name: "THE PRODUCTION GUARDIAN",
    fortune: ["An agent stirs soon", "and fixes an old backlog bug."],
    luckyCommand: "git diff --stat"
  },
  {
    minScore: 40,
    name: "THE PRAGMATIC HYBRID",
    fortune: ["A black box cracks open", "revealing reasoning you missed."],
    luckyCommand: "git blame --line-porcelain"
  },
  {
    minScore: 20,
    name: "THE QUALITY INQUISITOR",
    fortune: ["Before celebrating, check", "it solved your actual problem."],
    luckyCommand: "npm test -- --watch"
  },
  {
    minScore: -Infinity,
    name: "THE ANALOG PURIST",
    fortune: ["A shortcut will tempt you", "to hand off work it shouldn't do."],
    luckyCommand: "chmod 600 secrets.env"
  }
];

const GOVERNANCE_FLAVOR = {
  a: "Guard your data closely.",
  b: "Demand to see the logic.",
  c: "Compliance rewards patience.",
  d: "Trust, then check.",
  e: "Worry less; back up more."
};

function average(...values) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function pickTier(overallScore) {
  return ARCHETYPE_TIERS.find((tier) => overallScore >= tier.minScore);
}

function buildBaseFortune(answers) {
  const automation = average(USAGE_INTENSITY[answers.q1] ?? 50, ACCEPTANCE_RATE[answers.q4] ?? 50);
  const aiTrust = average(VERIFICATION_SKIP[answers.q2] ?? 50, ACCEPTANCE_RATE[answers.q4] ?? 50);
  const roiClarity = average(VALUE_REALIZED[answers.q5] ?? 50, USAGE_INTENSITY[answers.q1] ?? 50);
  const overallScore = average(automation, aiTrust, roiClarity);
  const tier = pickTier(overallScore);
  const governanceLine = GOVERNANCE_FLAVOR[answers.q3] ?? GOVERNANCE_FLAVOR.c;

  return {
    archetypeName: tier.name,
    fortuneLines: [...tier.fortune, governanceLine],
    luckyCommand: tier.luckyCommand,
    automation,
    aiTrust,
    roiClarity
  };
}

const AI_TIMEOUT_MS = 6000;
const MAX_LINE_LENGTH = 32;
const MAX_ARCHETYPE_LENGTH = 24;

// Fast local backstop in case the moderation call fails or is slow; the moderation
// API is the primary defense against inappropriate content.
const BLOCKED_WORDS_PATTERN =
  /\b(fuck|shit|bitch|asshole|dick|pussy|cunt|bastard|damn|hell|sex|porn|nazi|slur|kill\s?yourself)\b/i;

function containsBlockedContent(text) {
  return BLOCKED_WORDS_PATTERN.test(text);
}

async function isFlaggedByModeration(text, apiKey, signal) {
  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text })
    });

    if (!response.ok) {
      return true;
    }

    const payload = await response.json();
    return payload.results?.[0]?.flagged !== false;
  } catch (_error) {
    return true;
  }
}

async function generateAiFlavor(fortune, answers) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write short, witty fortune-cookie style messages for a novelty receipt printer at a professional software trade show booth. " +
              "Audience is software developers of all ages and backgrounds. Tone: clever, cheeky, geeky humor is welcome. " +
              "Strict rules: no profanity or cursing, no sexual content or innuendo, no slurs, no references to violence, drugs, alcohol, politics, or religion, " +
              "and nothing that could embarrass someone reading it aloud in a crowded booth. Respond only with JSON."
          },
          {
            role: "user",
            content:
              `Invent a punchy, all-caps developer archetype name in the spirit of "${fortune.archetypeName}" ` +
              `and write a fortune for it (their survey answers were: ${JSON.stringify(answers)}). ` +
              `Return JSON of the form {"archetypeName": "THE SOMETHING", "fortuneLines": ["line1", "line2", "line3"], "luckyCommand": "some-shell-command"}. ` +
              `archetypeName must be plain text, at most ${MAX_ARCHETYPE_LENGTH} characters. ` +
              `Each fortuneLines entry must be plain text, at most ${MAX_LINE_LENGTH} characters, no markdown. ` +
              `luckyCommand should be a short, funny, dev-themed shell command (max ${MAX_LINE_LENGTH} characters).`
          }
        ]
      })
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}");

    if (
      typeof parsed.archetypeName !== "string" ||
      parsed.archetypeName.length === 0 ||
      parsed.archetypeName.length > MAX_ARCHETYPE_LENGTH ||
      !Array.isArray(parsed.fortuneLines) ||
      parsed.fortuneLines.length === 0 ||
      !parsed.fortuneLines.every((line) => typeof line === "string" && line.length <= MAX_LINE_LENGTH) ||
      typeof parsed.luckyCommand !== "string" ||
      parsed.luckyCommand.length === 0 ||
      parsed.luckyCommand.length > MAX_LINE_LENGTH
    ) {
      return null;
    }

    const combinedText = [parsed.archetypeName, ...parsed.fortuneLines, parsed.luckyCommand].join(" ");

    if (containsBlockedContent(combinedText)) {
      return null;
    }

    if (await isFlaggedByModeration(combinedText, apiKey, controller.signal)) {
      return null;
    }

    return {
      archetypeName: parsed.archetypeName,
      fortuneLines: parsed.fortuneLines,
      luckyCommand: parsed.luckyCommand
    };
  } catch (_error) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function buildFortune(answers) {
  const fortune = buildBaseFortune(answers);
  const aiFlavor = await generateAiFlavor(fortune, answers);

  if (aiFlavor) {
    return { ...fortune, ...aiFlavor };
  }

  return fortune;
}
