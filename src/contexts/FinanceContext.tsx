import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { findCategoryByKeyword, getFuelTransactionDescription, normalizeFinanceText } from "@/lib/finance";
import { deleteAttachmentByPath } from "@/services/attachmentService";
import { loadFinanceStateFromCache, saveFinanceStateToCache } from "@/services/financeLocalCache";
import { saveFinanceState, subscribeFinanceState } from "@/services/financeFirestoreService";
import type {
  AsphaltEntry,
  AsphaltSettings,
  Category,
  Employee,
  FinanceState,
  FixedExpense,
  FuelEntry,
  FuelPeriod,
  Transaction,
} from "@/types/finance";

export type {
  CategoryType,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
  Recurrence,
  Category,
  Transaction,
  FixedExpense,
  AsphaltEntry,
  FuelEntry,
  FuelPeriod,
  Employee,
  AsphaltSettings,
} from "@/types/finance";

interface FinanceContextType {
  categories: Category[];
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  asphaltEntries: AsphaltEntry[];
  asphaltSettings: AsphaltSettings;
  fuelEntries: FuelEntry[];
  fuelPeriods: FuelPeriod[];
  employees: Employee[];
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addFixedExpense: (f: Omit<FixedExpense, "id">) => void;
  updateFixedExpense: (f: FixedExpense) => void;
  deleteFixedExpense: (id: string) => void;
  addAsphaltEntry: (e: Omit<AsphaltEntry, "id" | "total">) => void;
  updateAsphaltSettings: (s: AsphaltSettings) => void;
  deleteAsphaltEntry: (id: string) => void;
  addFuelEntry: (e: Omit<FuelEntry, "id">) => void;
  deleteFuelEntry: (id: string) => void;
  updateFuelEntry: (e: FuelEntry) => void;
  openFuelPeriod: (startDate: string) => void;
  closeFuelPeriod: (periodId: string) => void;
  addEmployee: (e: Omit<Employee, "id">) => void;
  updateEmployee: (e: Employee) => void;
  deleteEmployee: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

const uid = () => crypto.randomUUID();

function sanitizeFuelAmount(amount: number | undefined) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}

function sanitizeFuelLiters(liters: number | undefined) {
  if (typeof liters !== "number" || !Number.isFinite(liters) || liters <= 0) return undefined;
  return liters;
}

function buildStateHash(state: FinanceState) {
  return JSON.stringify(state);
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const cachedState = useMemo(() => loadFinanceStateFromCache(), []);

  const [categories, setCategories] = useState<Category[]>(cachedState.categories);
  const [transactions, setTransactions] = useState<Transaction[]>(cachedState.transactions);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(cachedState.fixedExpenses);
  const [asphaltEntries, setAsphaltEntries] = useState<AsphaltEntry[]>(cachedState.asphaltEntries);
  const [asphaltSettings, setAsphaltSettings] = useState<AsphaltSettings>(cachedState.asphaltSettings);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>(cachedState.fuelEntries);
  const [fuelPeriods, setFuelPeriods] = useState<FuelPeriod[]>(cachedState.fuelPeriods);
  const [employees, setEmployees] = useState<Employee[]>(cachedState.employees);

  const [remoteReady, setRemoteReady] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const latestStateRef = useRef<FinanceState>(cachedState);
  const syncedStateHashRef = useRef(buildStateHash(cachedState));

  const currentState = useMemo<FinanceState>(
    () => ({
      categories,
      transactions,
      fixedExpenses,
      asphaltEntries,
      asphaltSettings,
      fuelEntries,
      fuelPeriods,
      employees,
    }),
    [categories, transactions, fixedExpenses, asphaltEntries, asphaltSettings, fuelEntries, fuelPeriods, employees],
  );

  useEffect(() => {
    saveFinanceStateToCache(currentState);
    latestStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    if (!user?.uid) {
      setRemoteReady(false);
      return;
    }

    setRemoteReady(false);

    const unsubscribe = subscribeFinanceState(
      user.uid,
      (remoteState) => {
        if (remoteState) {
          const remoteHash = buildStateHash(remoteState);
          syncedStateHashRef.current = remoteHash;

          const localHash = buildStateHash(latestStateRef.current);
          if (remoteHash !== localHash) {
            setCategories(remoteState.categories);
            setTransactions(remoteState.transactions);
            setFixedExpenses(remoteState.fixedExpenses);
            setAsphaltEntries(remoteState.asphaltEntries);
            setAsphaltSettings(remoteState.asphaltSettings);
            setFuelEntries(remoteState.fuelEntries);
            setFuelPeriods(remoteState.fuelPeriods);
            setEmployees(remoteState.employees);
          }
        } else {
          const localState = latestStateRef.current;
          syncedStateHashRef.current = buildStateHash(localState);
          void saveFinanceState(user.uid, localState).catch((error) => {
            console.error("Falha ao salvar estado inicial no Firestore:", error);
          });
        }

        setRemoteReady(true);
      },
      (error) => {
        console.error("Falha ao sincronizar Firestore:", error);
        setRemoteReady(true);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !remoteReady) return;

    const currentHash = buildStateHash(currentState);
    if (currentHash === syncedStateHashRef.current) return;

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      void saveFinanceState(user.uid, currentState)
        .then(() => {
          syncedStateHashRef.current = currentHash;
        })
        .catch((error) => {
          console.error("Falha ao salvar estado no Firestore:", error);
        });
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentState, remoteReady, user?.uid]);

  const resolveAsphaltCategoryId = useCallback(() => {
    const configured = categories.find(
      (category) => category.id === asphaltSettings.categoryId && category.type !== "saida",
    );
    if (configured) return configured.id;

    const defaultById = categories.find((category) => category.id === "cat_asfalto" && category.type !== "saida");
    if (defaultById) return defaultById.id;

    const byKeyword = findCategoryByKeyword(categories, "asfalto");
    if (byKeyword && byKeyword.type !== "saida") return byKeyword.id;

    const fallback = categories.find((category) => category.type === "entrada" || category.type === "ambos");
    return fallback?.id ?? categories[0]?.id ?? "";
  }, [asphaltSettings.categoryId, categories]);

  const resolveFuelCategoryId = useCallback(() => {
    const defaultById = categories.find((category) => category.id === "cat_combustivel" && category.type !== "entrada");
    if (defaultById) return defaultById.id;

    const byKeyword = findCategoryByKeyword(categories, "combust");
    if (byKeyword && byKeyword.type !== "entrada") return byKeyword.id;

    const fallback = categories.find((category) => category.type === "saida" || category.type === "ambos");
    return fallback?.id ?? categories[0]?.id ?? "";
  }, [categories]);

  const normalizeTransaction = useCallback((tx: Omit<Transaction, "id"> & { id?: string }) => {
    const category = categories.find((item) => item.id === tx.categoryId);
    const categoryName = normalizeFinanceText(category?.name ?? "");
    if (categoryName.includes("asfalto")) {
      return {
        ...tx,
        type: "entrada" as const,
      };
    }
    if (categoryName.includes("combust")) {
      return {
        ...tx,
        type: "saida" as const,
      };
    }
    const normalizedType = !category || category.type === "ambos" ? tx.type : category.type;
    return {
      ...tx,
      type: normalizedType,
    };
  }, [categories]);

  useEffect(() => {
    const nextCategories = categories.map((category) => {
      const name = normalizeFinanceText(category.name);
      const isAsphaltCategory =
        category.id === asphaltSettings.categoryId ||
        category.id === "cat_asfalto" ||
        name.includes("asfalto");

      if (!isAsphaltCategory || category.type !== "saida") {
        return category;
      }

      return {
        ...category,
        type: "entrada" as const,
      };
    });

    const hasChanged = nextCategories.some((category, index) => category.type !== categories[index].type);
    if (hasChanged) {
      setCategories(nextCategories);
    }
  }, [asphaltSettings.categoryId, categories]);

  const addCategory = useCallback((c: Omit<Category, "id">) => {
    setCategories((prev) => [...prev, { ...c, id: uid() }]);
  }, []);

  const updateCategory = useCallback((c: Category) => {
    setCategories((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    const normalized = normalizeTransaction(t);
    setTransactions((prev) => [...prev, { ...normalized, id: uid() }]);
  }, [normalizeTransaction]);

  const updateTransaction = useCallback((t: Transaction) => {
    const normalized = normalizeTransaction(t);
    setTransactions((prev) => prev.map((x) => (x.id === t.id ? { ...normalized, id: t.id } : x)));
  }, [normalizeTransaction]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const existing = prev.find((x) => x.id === id);
      if (existing?.attachmentPath) {
        void deleteAttachmentByPath(existing.attachmentPath).catch(() => undefined);
      }
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const addFixedExpense = useCallback((f: Omit<FixedExpense, "id">) => {
    setFixedExpenses((prev) => [...prev, { ...f, id: uid() }]);
  }, []);

  const updateFixedExpense = useCallback((f: FixedExpense) => {
    setFixedExpenses((prev) => prev.map((x) => (x.id === f.id ? f : x)));
  }, []);

  const deleteFixedExpense = useCallback((id: string) => {
    setFixedExpenses((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addAsphaltEntry = useCallback((e: Omit<AsphaltEntry, "id" | "total">) => {
    const total = e.tons * e.pricePerTon;
    const catId = resolveAsphaltCategoryId();
    const txId = catId ? uid() : undefined;

    const entry: AsphaltEntry = {
      ...e,
      id: uid(),
      total,
      transactionId: txId,
    };

    setAsphaltEntries((prev) => [...prev, entry]);

    if (txId) {
      setTransactions((prev) => [
        ...prev,
        {
          id: txId,
          type: "entrada",
          amount: total,
          date: e.date,
          categoryId: catId,
          description: `Asfalto: ${e.tons}t x R$${e.pricePerTon.toFixed(2)}`,
          paymentMethod: "pix",
          status: "pago",
        },
      ]);
    }
  }, [resolveAsphaltCategoryId]);

  const updateAsphaltSettings = useCallback((s: AsphaltSettings) => {
    setAsphaltSettings(s);
  }, []);

  const deleteAsphaltEntry = useCallback((id: string) => {
    setAsphaltEntries((prev) => {
      const entry = prev.find((x) => x.id === id);
      if (entry?.transactionId) {
        setTransactions((txs) => txs.filter((x) => x.id !== entry.transactionId));
      }
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const addFuelEntry = useCallback((e: Omit<FuelEntry, "id">) => {
    const fuelCategoryId = resolveFuelCategoryId();
    const amount = sanitizeFuelAmount(e.amount);
    const liters = sanitizeFuelLiters(e.liters);
    const transactionId = fuelCategoryId ? uid() : undefined;

    const entry: FuelEntry = {
      ...e,
      id: uid(),
      amount,
      liters,
      description: e.description.trim() || "Abastecimento",
      transactionId,
    };

    setFuelEntries((prev) => [...prev, entry]);

    if (!transactionId) return;

    setTransactions((prev) => [
      ...prev,
      {
        id: transactionId,
        type: "saida",
        amount,
        date: entry.date,
        categoryId: fuelCategoryId,
        description: getFuelTransactionDescription(entry.description, entry.liters),
        paymentMethod: "pix",
        status: amount > 0 ? "pago" : "pendente",
      },
    ]);
  }, [resolveFuelCategoryId]);

  const deleteFuelEntry = useCallback((id: string) => {
    setFuelEntries((prev) => {
      const entry = prev.find((item) => item.id === id);
      if (entry?.transactionId) {
        setTransactions((txs) => txs.filter((tx) => tx.id !== entry.transactionId));
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const updateFuelEntry = useCallback((e: FuelEntry) => {
    const fuelCategoryId = resolveFuelCategoryId();
    const amount = sanitizeFuelAmount(e.amount);
    const liters = sanitizeFuelLiters(e.liters);
    const transactionId = e.transactionId ?? (fuelCategoryId ? uid() : undefined);

    const entry: FuelEntry = {
      ...e,
      amount,
      liters,
      description: e.description.trim() || "Abastecimento",
      transactionId,
    };

    setFuelEntries((prev) => prev.map((item) => (item.id === entry.id ? entry : item)));

    if (!transactionId) return;

    setTransactions((prev) => {
      const existing = prev.find((tx) => tx.id === transactionId);
      const categoryId = existing?.categoryId || fuelCategoryId;
      if (!categoryId) return prev;

      const nextTx: Transaction = {
        ...(existing ?? {}),
        id: transactionId,
        type: "saida",
        amount,
        date: entry.date,
        categoryId,
        description: getFuelTransactionDescription(entry.description, entry.liters),
        paymentMethod: existing?.paymentMethod ?? "pix",
        status: amount > 0 ? "pago" : "pendente",
      };

      if (existing) {
        return prev.map((tx) => (tx.id === transactionId ? nextTx : tx));
      }

      return [...prev, nextTx];
    });
  }, [resolveFuelCategoryId]);

  const openFuelPeriod = useCallback((startDate: string) => {
    setFuelPeriods((prev) => [...prev, { id: uid(), startDate, closed: false }]);
  }, []);

  const closeFuelPeriod = useCallback((periodId: string) => {
    setFuelPeriods((prev) => {
      const period = prev.find((p) => p.id === periodId);
      if (!period || period.closed) return prev;

      const periodEntries = fuelEntries.filter((entry) => entry.periodId === periodId);
      const endDate = periodEntries.length > 0
        ? [...periodEntries].sort((a, b) => b.date.localeCompare(a.date))[0].date
        : new Date().toISOString().slice(0, 10);

      return prev.map((p) =>
        p.id === periodId
          ? {
              ...p,
              closed: true,
              closedAt: new Date().toISOString(),
              endDate,
              consolidatedTransactionId: undefined,
            }
          : p,
      );
    });
  }, [fuelEntries]);

  useEffect(() => {
    const asphaltCategoryId = resolveAsphaltCategoryId();
    const fuelCategoryId = resolveFuelCategoryId();

    const txMap = new Map(transactions.map((tx) => [tx.id, tx]));
    let transactionsChanged = false;

    const upsertTransaction = (candidate: Transaction) => {
      const existing = txMap.get(candidate.id);
      if (!existing) {
        txMap.set(candidate.id, candidate);
        transactionsChanged = true;
        return;
      }

      const merged: Transaction = {
        ...existing,
        ...candidate,
        paymentMethod: existing.paymentMethod ?? candidate.paymentMethod,
      };

      const hasChanged =
        existing.type !== merged.type ||
        existing.amount !== merged.amount ||
        existing.date !== merged.date ||
        existing.categoryId !== merged.categoryId ||
        existing.description !== merged.description ||
        existing.status !== merged.status ||
        existing.paymentMethod !== merged.paymentMethod;

      if (!hasChanged) return;

      txMap.set(candidate.id, merged);
      transactionsChanged = true;
    };

    let asphaltChanged = false;
    const nextAsphaltEntries = asphaltEntries.map((entry) => {
      const total = Number.isFinite(entry.total) ? entry.total : entry.tons * entry.pricePerTon;
      const transactionId = entry.transactionId ?? (asphaltCategoryId ? uid() : undefined);
      const nextEntry: AsphaltEntry = {
        ...entry,
        total,
        transactionId,
      };

      if (
        entry.total !== nextEntry.total ||
        entry.transactionId !== nextEntry.transactionId
      ) {
        asphaltChanged = true;
      }

      if (transactionId && asphaltCategoryId) {
        upsertTransaction({
          id: transactionId,
          type: "entrada",
          amount: total,
          date: entry.date,
          categoryId: asphaltCategoryId,
          description: `Asfalto: ${entry.tons}t x R$${entry.pricePerTon.toFixed(2)}`,
          paymentMethod: "pix",
          status: "pago",
        });
      }

      return nextEntry;
    });

    const consolidatedIds = new Set(
      fuelPeriods.map((period) => period.consolidatedTransactionId).filter((id): id is string => Boolean(id)),
    );
    if (consolidatedIds.size > 0) {
      consolidatedIds.forEach((id) => {
        if (txMap.delete(id)) {
          transactionsChanged = true;
        }
      });
    }

    let fuelChanged = false;
    const nextFuelEntries = fuelEntries.map((entry) => {
      const amount = sanitizeFuelAmount(entry.amount);
      const liters = sanitizeFuelLiters(entry.liters);
      const description = entry.description.trim() || "Abastecimento";
      const transactionId = entry.transactionId ?? (fuelCategoryId ? uid() : undefined);

      const nextEntry: FuelEntry = {
        ...entry,
        amount,
        liters,
        description,
        transactionId,
      };

      if (
        entry.amount !== nextEntry.amount ||
        entry.liters !== nextEntry.liters ||
        entry.description !== nextEntry.description ||
        entry.transactionId !== nextEntry.transactionId
      ) {
        fuelChanged = true;
      }

      if (transactionId && fuelCategoryId) {
        upsertTransaction({
          id: transactionId,
          type: "saida",
          amount,
          date: entry.date,
          categoryId: fuelCategoryId,
          description: getFuelTransactionDescription(description, liters),
          paymentMethod: "pix",
          status: amount > 0 ? "pago" : "pendente",
        });
      }

      return nextEntry;
    });

    let fuelPeriodsChanged = false;
    const nextFuelPeriods = fuelPeriods.map((period) => {
      if (!period.consolidatedTransactionId) return period;
      fuelPeriodsChanged = true;
      return {
        ...period,
        consolidatedTransactionId: undefined,
      };
    });

    if (asphaltChanged) {
      setAsphaltEntries(nextAsphaltEntries);
    }
    if (fuelChanged) {
      setFuelEntries(nextFuelEntries);
    }
    if (fuelPeriodsChanged) {
      setFuelPeriods(nextFuelPeriods);
    }
    if (transactionsChanged) {
      setTransactions(Array.from(txMap.values()));
    }
  }, [
    asphaltEntries,
    fuelEntries,
    fuelPeriods,
    transactions,
    resolveAsphaltCategoryId,
    resolveFuelCategoryId,
  ]);

  const addEmployee = useCallback((e: Omit<Employee, "id">) => {
    setEmployees((prev) => [...prev, { ...e, id: uid() }]);
  }, []);

  const updateEmployee = useCallback((e: Employee) => {
    setEmployees((prev) => prev.map((x) => (x.id === e.id ? e : x)));
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const value: FinanceContextType = {
    categories,
    transactions,
    fixedExpenses,
    asphaltEntries,
    asphaltSettings,
    fuelEntries,
    fuelPeriods,
    employees,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    addAsphaltEntry,
    updateAsphaltSettings,
    deleteAsphaltEntry,
    addFuelEntry,
    deleteFuelEntry,
    updateFuelEntry,
    openFuelPeriod,
    closeFuelPeriod,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}

