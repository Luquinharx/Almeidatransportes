import { useMemo, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { getTransactionEffectiveType } from "@/lib/finance";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { endOfMonth, format, isWithinInterval, parseISO, startOfMonth, subDays, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

const fmt = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Reports() {
  const { transactions, categories } = useFinance();
  const [periodType, setPeriodType] = useState("current");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (periodType === "custom" && customStart && customEnd) {
      start = parseISO(customStart);
      end = parseISO(customEnd);
    } else if (periodType === "today") {
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date();
    } else if (periodType === "7days") {
      start = subDays(new Date(), 7);
      end = new Date();
    } else if (periodType === "last") {
      const lastMonth = subMonths(new Date(), 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
    } else if (periodType === "year") {
      start = new Date(new Date().getFullYear(), 0, 1);
      end = endOfMonth(new Date());
    } else {
      start = startOfMonth(new Date());
      end = endOfMonth(new Date());
    }

    return transactions
      .map((transaction) => ({
        ...transaction,
        effectiveType: getTransactionEffectiveType(transaction, categories),
      }))
      .filter((transaction) => isWithinInterval(parseISO(transaction.date), { start, end }))
      .filter((transaction) => filterType === "all" || transaction.effectiveType === filterType)
      .filter((transaction) => filterCategory === "all" || transaction.categoryId === filterCategory)
      .filter((transaction) => filterStatus === "all" || transaction.status === filterStatus)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, categories, periodType, customStart, customEnd, filterType, filterCategory, filterStatus]);

  const totalIn = filtered
    .filter((transaction) => transaction.effectiveType === "entrada")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalOut = filtered
    .filter((transaction) => transaction.effectiveType === "saida")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-foreground">Relatorios</h3>

      <div className="flex flex-wrap gap-3">
        <Select value={periodType} onValueChange={setPeriodType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">Ultimos 7 dias</SelectItem>
            <SelectItem value="current">Mes atual</SelectItem>
            <SelectItem value="last">Mes anterior</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        {periodType === "custom" && (
          <>
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs">Ate</Label>
              <Input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="w-40" />
            </div>
          </>
        )}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saidas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Entradas</p>
          <p className="text-xl font-bold text-income">{fmt(totalIn)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Saidas</p>
          <p className="text-xl font-bold text-expense">{fmt(totalOut)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Saldo</p>
          <p className={cn("text-xl font-bold", totalIn - totalOut >= 0 ? "text-income" : "text-expense")}>{fmt(totalIn - totalOut)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descricao</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Categoria</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Pagamento</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum lancamento no periodo
                </td>
              </tr>
            )}
            {filtered.map((transaction) => {
              const category = categories.find((item) => item.id === transaction.categoryId);
              return (
                <tr key={transaction.id} className="border-b transition-colors last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3">{format(parseISO(transaction.date), "dd/MM/yy")}</td>
                  <td className="px-4 py-3 font-medium text-card-foreground">{transaction.description}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{category?.name}</td>
                  <td className="hidden px-4 py-3 capitalize text-muted-foreground md:table-cell">{transaction.paymentMethod ?? "-"}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        transaction.status === "pago" ? "bg-income/10 text-income" : "bg-pending/10 text-pending",
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} lancamento(s) encontrado(s)</p>
    </div>
  );
}
