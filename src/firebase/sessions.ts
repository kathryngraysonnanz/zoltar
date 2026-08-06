import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

export interface SessionData {
  answers: { questionId: string; questionText: string; answerId: string; answerText: string }[];
  fortuneId: string;
  fortuneTitle: string;
  fortuneText: string;
}

export async function saveSession(data: SessionData): Promise<string> {
  const docRef = await addDoc(collection(db, "sessions"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
