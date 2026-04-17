import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createDefaultFinanceState, type FinanceState } from "@/types/finance";

interface FinanceStateDocument extends FinanceState {
  updatedAt?: unknown;
}

export interface FinanceSnapshotMetadata {
  fromCache: boolean;
  hasPendingWrites: boolean;
}

const FINANCE_SCOPE_MODE = String(import.meta.env.VITE_FINANCE_SCOPE_MODE ?? "shared")
  .trim()
  .toLowerCase();
const FINANCE_SHARED_SCOPE_ID = String(import.meta.env.VITE_FINANCE_SHARED_SCOPE_ID ?? "almeida")
  .trim()
  .toLowerCase() || "almeida";

function stripUndefinedDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeFinanceState(partial: Partial<FinanceState> | null | undefined): FinanceState {
  const defaults = createDefaultFinanceState();
  return {
    categories: Array.isArray(partial?.categories) ? partial.categories : defaults.categories,
    transactions: Array.isArray(partial?.transactions) ? partial.transactions : defaults.transactions,
    fixedExpenses: Array.isArray(partial?.fixedExpenses) ? partial.fixedExpenses : defaults.fixedExpenses,
    asphaltEntries: Array.isArray(partial?.asphaltEntries) ? partial.asphaltEntries : defaults.asphaltEntries,
    asphaltSettings:
      partial?.asphaltSettings &&
      typeof partial.asphaltSettings.defaultPricePerTon === "number" &&
      typeof partial.asphaltSettings.categoryId === "string"
        ? partial.asphaltSettings
        : defaults.asphaltSettings,
    fuelEntries: Array.isArray(partial?.fuelEntries) ? partial.fuelEntries : defaults.fuelEntries,
    fuelPeriods: Array.isArray(partial?.fuelPeriods) ? partial.fuelPeriods : defaults.fuelPeriods,
    employees: Array.isArray(partial?.employees) ? partial.employees : defaults.employees,
  };
}

function financeDocRef(userId: string) {
  if (FINANCE_SCOPE_MODE === "shared") {
    return doc(db, "financeScopes", FINANCE_SHARED_SCOPE_ID, "finance", "state");
  }
  return doc(db, "users", userId, "finance", "state");
}

function legacyUserFinanceDocRef(userId: string) {
  return doc(db, "users", userId, "finance", "state");
}

export function subscribeFinanceState(
  userId: string,
  onData: (state: FinanceState | null, metadata: FinanceSnapshotMetadata) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    financeDocRef(userId),
    (snapshot) => {
      const metadata: FinanceSnapshotMetadata = {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      };

      if (!snapshot.exists()) {
        onData(null, metadata);
        return;
      }

      const data = snapshot.data() as FinanceStateDocument;
      const { updatedAt: _updatedAt, ...state } = data;
      onData(normalizeFinanceState(state), metadata);
    },
    (error) => {
      if (onError) onError(error);
    },
  );
}

export async function saveFinanceState(userId: string, state: FinanceState) {
  const payload = stripUndefinedDeep(normalizeFinanceState(state));
  await setDoc(
    financeDocRef(userId),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function loadLegacyUserFinanceState(userId: string): Promise<FinanceState | null> {
  if (FINANCE_SCOPE_MODE !== "shared") return null;

  const snapshot = await getDoc(legacyUserFinanceDocRef(userId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as FinanceStateDocument;
  const { updatedAt: _updatedAt, ...state } = data;
  return normalizeFinanceState(state);
}
