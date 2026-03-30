import { doc, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FinanceState } from "@/types/finance";

interface FinanceStateDocument extends FinanceState {
  updatedAt?: unknown;
}

function stripUndefinedDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function financeDocRef(userId: string) {
  return doc(db, "users", userId, "finance", "state");
}

export function subscribeFinanceState(
  userId: string,
  onData: (state: FinanceState | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    financeDocRef(userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      const data = snapshot.data() as FinanceStateDocument;
      const { updatedAt: _updatedAt, ...state } = data;
      onData(state);
    },
    (error) => {
      if (onError) onError(error);
    },
  );
}

export async function saveFinanceState(userId: string, state: FinanceState) {
  const payload = stripUndefinedDeep(state);
  await setDoc(
    financeDocRef(userId),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
