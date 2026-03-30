import { createDefaultFinanceState, DEFAULT_ASPHALT_SETTINGS, DEFAULT_CATEGORIES, type FinanceState } from "@/types/finance";

const FINANCE_STATE_CACHE_KEY = "fin_state_v1";

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadLegacyState(): FinanceState | null {
  const categories = parseJson<FinanceState["categories"]>(localStorage.getItem("fin_categories"));
  const transactions = parseJson<FinanceState["transactions"]>(localStorage.getItem("fin_transactions"));
  const fixedExpenses = parseJson<FinanceState["fixedExpenses"]>(localStorage.getItem("fin_fixed"));
  const asphaltEntries = parseJson<FinanceState["asphaltEntries"]>(localStorage.getItem("fin_asphalt"));
  const asphaltSettings = parseJson<FinanceState["asphaltSettings"]>(localStorage.getItem("fin_asphalt_settings"));
  const fuelEntries = parseJson<FinanceState["fuelEntries"]>(localStorage.getItem("fin_fuel_entries"));
  const fuelPeriods = parseJson<FinanceState["fuelPeriods"]>(localStorage.getItem("fin_fuel_periods"));
  const employees = parseJson<FinanceState["employees"]>(localStorage.getItem("fin_employees"));

  const hasAnyLegacyData = [
    categories,
    transactions,
    fixedExpenses,
    asphaltEntries,
    asphaltSettings,
    fuelEntries,
    fuelPeriods,
    employees,
  ].some(Boolean);

  if (!hasAnyLegacyData) return null;

  return {
    categories: categories ?? DEFAULT_CATEGORIES,
    transactions: transactions ?? [],
    fixedExpenses: fixedExpenses ?? [],
    asphaltEntries: asphaltEntries ?? [],
    asphaltSettings: asphaltSettings ?? DEFAULT_ASPHALT_SETTINGS,
    fuelEntries: fuelEntries ?? [],
    fuelPeriods: fuelPeriods ?? [],
    employees: employees ?? [],
  };
}

export function loadFinanceStateFromCache(): FinanceState {
  const cached = parseJson<FinanceState>(localStorage.getItem(FINANCE_STATE_CACHE_KEY));
  if (cached) return cached;

  const legacy = loadLegacyState();
  if (legacy) {
    saveFinanceStateToCache(legacy);
    return legacy;
  }

  return createDefaultFinanceState();
}

export function saveFinanceStateToCache(state: FinanceState) {
  localStorage.setItem(FINANCE_STATE_CACHE_KEY, JSON.stringify(state));
}
