import { useMemo, useState } from "react";
import { useFinance, Transaction } from "@/contexts/FinanceContext";
import { getTransactionEffectiveType } from "@/lib/finance";
import TransactionDialog from "@/components/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const fmt = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type RowTransaction = Transaction & { effectiveType: "entrada" | "saida" };

export default function Transactions() {
  const { transactions, categories, deleteTransaction } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const rows = useMemo<RowTransaction[]>(() => {
    return transactions
      .map((transaction) => ({
        ...transaction,
        effectiveType: getTransactionEffectiveType(transaction, categories),
      }))
      .filter((transaction) => filterType === "all" || transaction.effectiveType === filterType)
      .filter((transaction) => filterStatus === "all" || transaction.status === filterStatus)
      .filter((transaction) => filterCategory === "all" || transaction.categoryId === filterCategory)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, categories, filterType, filterStatus, filterCategory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">Lancamentos</h3>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Lancamento
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saidas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descricao</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Categoria</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Anexo</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum lancamento encontrado
                </td>
              </tr>
            )}
            {rows.map((transaction) => {
              const category = categories.find((item) => item.id === transaction.categoryId);
              return (
                <tr key={transaction.id} className="border-b transition-colors last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 text-card-foreground">{format(parseISO(transaction.date), "dd/MM/yy")}</td>
                  <td className="px-4 py-3 font-medium text-card-foreground">{transaction.description}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category?.color }} />
                      <span className="text-muted-foreground">{category?.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {transaction.attachmentUrl ? (
                      <a href={transaction.attachmentUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Ver anexo
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <Badge
                      variant={transaction.status === "pago" ? "default" : "secondary"}
                      className={cn(
                        transaction.status === "pago"
                          ? "border-income/20 bg-income/10 text-income"
                          : "border-pending/20 bg-pending/10 text-pending",
                      )}
                    >
                      {transaction.status === "pago" ? "Pago" : "Pendente"}
                    </Badge>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold",
                      transaction.effectiveType === "entrada" ? "text-income" : "text-expense",
                    )}
                  >
                    {transaction.effectiveType === "entrada" ? "+" : "-"}
                    {fmt(transaction.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(transaction);
                          setDialogOpen(true);
                        }}
                        className="rounded p-1.5 hover:bg-secondary"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="rounded p-1.5 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} transaction={editing} />
    </div>
  );
}
