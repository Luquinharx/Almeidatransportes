import { useMemo, useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
    let start: Date, end: Date;
    if (periodType === "custom" && customStart && customEnd) {
      start = parseISO(customStart); end = parseISO(customEnd);
    } else if (periodType === "today") { start = new Date(now.setHours(0,0,0,0)); end = new Date(); }
    else if (periodType === "7days") { start = subDays(new Date(), 7); end = new Date(); }
    else if (periodType === "last") { const m = subMonths(new Date(), 1); start = startOfMonth(m); end = endOfMonth(m); }
    else if (periodType === "year") { start = new Date(new Date().getFullYear(), 0, 1); end = endOfMonth(new Date()); }
    else { start = startOfMonth(new Date()); end = endOfMonth(new Date()); }

    return transactions
      .filter(t => isWithinInterval(parseISO(t.date), { start, end }))
      .filter(t => filterType === "all" || t.type === filterType)
      .filter(t => filterCategory === "all" || t.categoryId === filterCategory)
      .filter(t => filterStatus === "all" || t.status === filterStatus)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, periodType, customStart, customEnd, filterType, filterCategory, filterStatus]);

  const totalIn = filtered.filter(t => t.type === "entrada").reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => t.type === "saida").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-foreground">Relatórios</h3>

      <div className="flex flex-wrap gap-3">
        <Select value={periodType} onValueChange={setPeriodType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="current">Mês atual</SelectItem>
            <SelectItem value="last">Mês anterior</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        {periodType === "custom" && (
          <>
            <div><Label className="text-xs">De</Label><Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-40" /></div>
            <div><Label className="text-xs">Até</Label><Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-40" /></div>
          </>
        )}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Entradas</p>
          <p className="text-xl font-bold text-income">{fmt(totalIn)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Saídas</p>
          <p className="text-xl font-bold text-expense">{fmt(totalOut)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Saldo</p>
          <p className={cn("text-xl font-bold", totalIn - totalOut >= 0 ? "text-income" : "text-expense")}>{fmt(totalIn - totalOut)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descrição</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Pagamento</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum lançamento no período</td></tr>
            )}
            {filtered.map(t => {
              const cat = categories.find(c => c.id === t.categoryId);
              return (
                <tr key={t.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">{format(parseISO(t.date), "dd/MM/yy")}</td>
                  <td className="px-4 py-3 font-medium text-card-foreground">{t.description}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{cat?.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground capitalize">{t.paymentMethod ?? "-"}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="secondary" className={cn(
                      "text-xs",
                      t.status === "pago" ? "bg-income/10 text-income" : "bg-pending/10 text-pending"
                    )}>{t.status === "pago" ? "Pago" : "Pendente"}</Badge>
                  </td>
                  <td className={cn("px-4 py-3 text-right font-semibold", t.type === "entrada" ? "text-income" : "text-expense")}>
                    {t.type === "entrada" ? "+" : "-"}{fmt(t.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} lançamento(s) encontrado(s)</p>
    </div>
  );
}
