import type { Category, Transaction, TransactionType } from "@/types/finance";

export function normalizeFinanceText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function findCategoryByKeyword(categories: Category[], keyword: string) {
  const normalizedKeyword = normalizeFinanceText(keyword);
  return categories.find((category) => normalizeFinanceText(category.name).includes(normalizedKeyword));
}

export function getTransactionEffectiveType(
  transaction: Pick<Transaction, "type" | "categoryId">,
  categories: Category[],
): TransactionType {
  const category = categories.find((item) => item.id === transaction.categoryId);
  const categoryName = normalizeFinanceText(category?.name ?? "");
  if (categoryName.includes("asfalto")) return "entrada";
  if (categoryName.includes("combust")) return "saida";
  if (!category || category.type === "ambos") return transaction.type;
  return category.type;
}

export function getFuelTransactionDescription(description: string, liters?: number) {
  const cleanDescription = description.trim() || "Abastecimento";
  if (!liters || liters <= 0) return cleanDescription;
  return `${cleanDescription} (${liters.toFixed(2)}L)`;
}
