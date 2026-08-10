import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "./config";

export interface SessionData {
  answers: { questionId: string; questionText: string; answerId: string; answerText: string }[];
  fortuneId: string;
  fortuneTitle: string;
  fortuneText: string;
}

export interface StoredSession extends SessionData {
  id: string;
  createdAt: Date | null;
}

export async function saveSession(data: SessionData): Promise<string> {
  const docRef = await addDoc(collection(db, "sessions"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getSession(sessionId: string): Promise<StoredSession | null> {
  const docRef = doc(db, "sessions", sessionId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    answers: data.answers,
    fortuneId: data.fortuneId,
    fortuneTitle: data.fortuneTitle,
    fortuneText: data.fortuneText,
    createdAt: data.createdAt?.toDate() ?? null,
  };
}
