import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession, saveSession } from "./sessions";
import type { SessionData } from "./sessions";

// Mock Firebase
vi.mock("./config", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

import { addDoc, doc, getDoc } from "firebase/firestore";

describe("saveSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves session data and returns document ID", async () => {
    const mockDocRef = { id: "test-session-123" };
    vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

    const sessionData: SessionData = {
      answers: [
        {
          questionId: "q1",
          questionText: "Test question?",
          answerId: "a1",
          answerText: "Test answer",
        },
      ],
      fortuneId: "f1",
      fortuneTitle: "Test Fortune",
      fortuneText: "This is a test fortune.",
    };

    const sessionId = await saveSession(sessionData);

    expect(sessionId).toBe("test-session-123");
    expect(addDoc).toHaveBeenCalledTimes(1);
  });
});

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session data for valid session ID", async () => {
    const mockData = {
      answers: [
        {
          questionId: "q1",
          questionText: "Test question?",
          answerId: "a1",
          answerText: "Test answer",
        },
      ],
      fortuneId: "f1",
      fortuneTitle: "Test Fortune",
      fortuneText: "This is a test fortune.",
      createdAt: {
        toDate: () => new Date("2024-01-01T00:00:00Z"),
      },
    };

    const mockDocSnap = {
      exists: () => true,
      id: "test-session-123",
      data: () => mockData,
    };

    vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

    const result = await getSession("test-session-123");

    expect(result).toEqual({
      id: "test-session-123",
      answers: mockData.answers,
      fortuneId: "f1",
      fortuneTitle: "Test Fortune",
      fortuneText: "This is a test fortune.",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    expect(doc).toHaveBeenCalledWith(expect.anything(), "sessions", "test-session-123");
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it("returns null for non-existent session ID", async () => {
    const mockDocSnap = {
      exists: () => false,
    };

    vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

    const result = await getSession("non-existent-id");

    expect(result).toBeNull();
    expect(getDoc).toHaveBeenCalledTimes(1);
  });

  it("handles missing createdAt timestamp", async () => {
    const mockData = {
      answers: [],
      fortuneId: "f1",
      fortuneTitle: "Test Fortune",
      fortuneText: "This is a test fortune.",
      createdAt: null,
    };

    const mockDocSnap = {
      exists: () => true,
      id: "test-session-456",
      data: () => mockData,
    };

    vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

    const result = await getSession("test-session-456");

    expect(result?.createdAt).toBeNull();
  });
});
