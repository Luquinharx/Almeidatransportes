import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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

  const remoteHydrationRef = useRef(false);
  const remoteReadyRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const latestStateRef = useRef<FinanceState>(cachedState);

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
      remoteReadyRef.current = false;
      return;
    }

    remoteReadyRef.current = false;

    const unsubscribe = subscribeFinanceState(
      user.uid,
      (remoteState) => {
        remoteHydrationRef.current = true;

        if (remoteState) {
          setCategories(remoteState.categories);
          setTransactions(remoteState.transactions);
          setFixedExpenses(remoteState.fixedExpenses);
          setAsphaltEntries(remoteState.asphaltEntries);
          setAsphaltSettings(remoteState.asphaltSettings);
          setFuelEntries(remoteState.fuelEntries);
          setFuelPeriods(remoteState.fuelPeriods);
          setEmployees(remoteState.employees);
        } else {
          void saveFinanceState(user.uid, latestStateRef.current);
        }

        remoteHydrationRef.current = false;
        remoteReadyRef.current = true;
      },
      (error) => {
        console.error("Falha ao sincronizar Firestore:", error);
        remoteReadyRef.current = true;
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !remoteReadyRef.current || remoteHydrationRef.current) return;

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      void saveFinanceState(user.uid, currentState);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentState, user?.uid]);

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
    setTransactions((prev) => [...prev, { ...t, id: uid() }]);
  }, []);

  const updateTransaction = useCallback((t: Transaction) => {
    setTransactions((prev) => prev.map((x) => (x.id === t.id ? t : x)));
  }, []);

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
    const catId = asphaltSettings.categoryId || categories.find((c) => c.name === "Asfalto")?.id || "";
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
          type: "saida",
          amount: total,
          date: e.date,
          categoryId: catId,
          description: `Asfalto: ${e.tons}t x R$${e.pricePerTon.toFixed(2)}`,
          paymentMethod: "pix",
          status: "pago",
        },
      ]);
    }
  }, [asphaltSettings.categoryId, categories]);

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
    setFuelEntries((prev) => [...prev, { ...e, id: uid() }]);
  }, []);

  const deleteFuelEntry = useCallback((id: string) => {
    setFuelEntries((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const updateFuelEntry = useCallback((e: FuelEntry) => {
    setFuelEntries((prev) => prev.map((x) => (x.id === e.id ? e : x)));
  }, []);

  const openFuelPeriod = useCallback((startDate: string) => {
    setFuelPeriods((prev) => [...prev, { id: uid(), startDate, closed: false }]);
  }, []);

  const closeFuelPeriod = useCallback((periodId: string) => {
    setFuelPeriods((prev) => {
      const period = prev.find((p) => p.id === periodId);
      if (!period || period.closed) return prev;

      const periodEntries = fuelEntries.filter((e) => e.periodId === periodId);
      const total = periodEntries.reduce((sum, e) => sum + e.amount, 0);
      const fuelCategoryId = categories.find((c) => c.name === "Combustível")?.id || "";

      let consolidatedTransactionId: string | undefined;
      if (total > 0 && fuelCategoryId) {
        consolidatedTransactionId = uid();
        setTransactions((txs) => [
          ...txs,
          {
            id: consolidatedTransactionId,
            type: "saida",
            amount: total,
            date: new Date().toISOString().slice(0, 10),
            categoryId: fuelCategoryId,
            description: `Combustível período ${period.startDate} (${periodEntries.length} lançamentos)`,
            paymentMethod: "pix",
            status: "pago",
          },
        ]);
      }

      return prev.map((p) =>
        p.id === periodId
          ? {
              ...p,
              closed: true,
              closedAt: new Date().toISOString(),
              endDate: new Date().toISOString().slice(0, 10),
              consolidatedTransactionId,
            }
          : p,
      );
    });
  }, [fuelEntries, categories]);

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
