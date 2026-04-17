export type CategoryType = "entrada" | "saida" | "ambos";
export type TransactionType = "entrada" | "saida";
export type PaymentMethod = "pix" | "dinheiro" | "cartao" | "boleto" | "transferencia";
export type TransactionStatus = "pago" | "pendente";
export type Recurrence = "mensal" | "semanal" | "anual";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  categoryId: string;
  description: string;
  paymentMethod?: PaymentMethod;
  status: TransactionStatus;
  observation?: string;
  attachmentUrl?: string;
  attachmentPath?: string;
  fixedExpenseId?: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  dueDay: number;
  recurrence: Recurrence;
  active: boolean;
}

export interface AsphaltEntry {
  id: string;
  date: string;
  tons: number;
  pricePerTon: number;
  total: number;
  transactionId?: string;
}

export interface FuelEntry {
  id: string;
  date: string;
  amount: number;
  liters?: number;
  description: string;
  periodId?: string;
  transactionId?: string;
}

export interface FuelPeriod {
  id: string;
  startDate: string;
  endDate?: string;
  closed: boolean;
  closedAt?: string;
  consolidatedTransactionId?: string;
}

export interface Employee {
  id: string;
  name: string;
  salary: number;
  active: boolean;
}

export interface AsphaltSettings {
  defaultPricePerTon: number;
  categoryId: string;
}

export interface FinanceState {
  categories: Category[];
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  asphaltEntries: AsphaltEntry[];
  asphaltSettings: AsphaltSettings;
  fuelEntries: FuelEntry[];
  fuelPeriods: FuelPeriod[];
  employees: Employee[];
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat_vendas", name: "Vendas", type: "entrada", color: "#22c55e" },
  { id: "cat_servicos", name: "Serviços", type: "entrada", color: "#3b82f6" },
  { id: "cat_aluguel", name: "Aluguel", type: "saida", color: "#ef4444" },
  { id: "cat_salarios", name: "Salários", type: "saida", color: "#8b5cf6" },
  { id: "cat_marketing", name: "Marketing", type: "saida", color: "#f59e0b" },
  { id: "cat_alimentacao", name: "Alimentação", type: "saida", color: "#ec4899" },
  { id: "cat_transporte", name: "Transporte", type: "saida", color: "#06b6d4" },
  { id: "cat_asfalto", name: "Asfalto", type: "entrada", color: "#374151" },
  { id: "cat_combustivel", name: "Combustível", type: "saida", color: "#d97706" },
  { id: "cat_outros", name: "Outros", type: "ambos", color: "#f97316" },
];

export const DEFAULT_ASPHALT_SETTINGS: AsphaltSettings = {
  defaultPricePerTon: 350,
  categoryId: "cat_asfalto",
};

export function createDefaultFinanceState(): FinanceState {
  return {
    categories: DEFAULT_CATEGORIES,
    transactions: [],
    fixedExpenses: [],
    asphaltEntries: [],
    asphaltSettings: DEFAULT_ASPHALT_SETTINGS,
    fuelEntries: [],
    fuelPeriods: [],
    employees: [],
  };
}
