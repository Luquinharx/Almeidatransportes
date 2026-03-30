import type { FinanceState, Transaction } from "@/types/finance";

export interface PeriodSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pendingCount: number;
}

export function filterTransactionsByDateRange(transactions: Transaction[], start: string, end: string) {
  return transactions.filter((t) => t.date >= start && t.date <= end);
}

export function summarizeTransactions(transactions: Transaction[]): PeriodSummary {
  const totalIncome = transactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    pendingCount: transactions.filter((t) => t.status === "pendente").length,
  };
}

export function buildCashFlowSeries(state: FinanceState) {
  const map = new Map<string, { entradas: number; saidas: number }>();

  for (const tx of state.transactions) {
    const key = tx.date.slice(0, 7);
    const current = map.get(key) ?? { entradas: 0, saidas: 0 };
    if (tx.type === "entrada") current.entradas += tx.amount;
    else current.saidas += tx.amount;
    map.set(key, current);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({ month, ...values }));
}
