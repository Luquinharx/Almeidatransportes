import { useMemo, useState } from "react";
import { useFinance, Transaction } from "@/contexts/FinanceContext";
import KpiCard from "@/components/KpiCard";
import { TrendingUp, TrendingDown, Wallet, Clock, CalendarClock, BarChart3, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, subWeeks, isWithinInterval, parseISO, differenceInDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PERIODS = [
  { value: "current", label: "Mês atual" },
  { value: "last", label: "Mês anterior" },
  { value: "3months", label: "Últimos 3 meses" },
  { value: "year", label: "Este ano" },
];

function getRange(period: string) {
  const now = new Date();
  if (period === "current") return { start: startOfMonth(now), end: endOfMonth(now) };
  if (period === "last") { const m = subMonths(now, 1); return { start: startOfMonth(m), end: endOfMonth(m) }; }
  if (period === "3months") return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
  return { start: new Date(now.getFullYear(), 0, 1), end: endOfMonth(now) };
}

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <ArrowUpRight className="h-4 w-4 text-muted-foreground" />;
  if (value < 0) return <ArrowDownRight className="h-4 w-4 text-muted-foreground" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default function Dashboard() {
  const { transactions, categories, fixedExpenses, asphaltEntries } = useFinance();
  const [period, setPeriod] = useState("current");

  const { start, end } = useMemo(() => getRange(period), [period]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const d = parseISO(t.date);
      return isWithinInterval(d, { start, end });
    });
  }, [transactions, start, end]);

  const totalIncome = useMemo(() => filtered.filter(t => t.type === "entrada").reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter(t => t.type === "saida").reduce((s, t) => s + t.amount, 0), [filtered]);
  const balance = totalIncome - totalExpense;
  const pendingCount = useMemo(() => filtered.filter(t => t.status === "pendente").length, [filtered]);
  const fixedTotal = useMemo(() => fixedExpenses.filter(f => f.active).reduce((s, f) => s + f.amount, 0), [fixedExpenses]);

  // Analytics
  const analytics = useMemo(() => {
    const days = Math.max(1, differenceInDays(end, start) + 1);
    const expenses = filtered.filter(t => t.type === "saida");
    const avgDailyCost = expenses.reduce((s, t) => s + t.amount, 0) / days;

    // Average by category
    const catMap = new Map<string, { total: number; name: string; color: string }>();
    expenses.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const key = cat?.id ?? "none";
      const curr = catMap.get(key) ?? { total: 0, name: cat?.name ?? "Outros", color: cat?.color ?? "#94a3b8" };
      curr.total += t.amount;
      catMap.set(key, curr);
    });
    const avgByCategory = Array.from(catMap.values()).map(c => ({
      ...c, avg: c.total / days
    })).sort((a, b) => b.total - a.total).slice(0, 5);

    // Asphalt stats
    const periodAsphalt = asphaltEntries.filter(e => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start, end });
    });
    const totalAsphaltTons = periodAsphalt.reduce((s, e) => s + e.tons, 0);
    const avgAsphaltDaily = periodAsphalt.length > 0
      ? totalAsphaltTons / new Set(periodAsphalt.map(e => e.date)).size
      : 0;
    const avgPricePerTon = periodAsphalt.length > 0 && totalAsphaltTons > 0
      ? periodAsphalt.reduce((s, e) => s + e.total, 0) / totalAsphaltTons
      : 0;

    // Week comparison
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);

    const thisWeekExpense = transactions
      .filter(t => t.type === "saida" && isWithinInterval(parseISO(t.date), { start: thisWeekStart, end: thisWeekEnd }))
      .reduce((s, t) => s + t.amount, 0);
    const lastWeekExpense = transactions
      .filter(t => t.type === "saida" && isWithinInterval(parseISO(t.date), { start: lastWeekStart, end: lastWeekEnd }))
      .reduce((s, t) => s + t.amount, 0);
    const weekTrend = lastWeekExpense > 0
      ? ((thisWeekExpense - lastWeekExpense) / lastWeekExpense) * 100
      : 0;

    // Month comparison
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthExpense = transactions
      .filter(t => t.type === "saida" && isWithinInterval(parseISO(t.date), { start: thisMonthStart, end: thisMonthEnd }))
      .reduce((s, t) => s + t.amount, 0);
    const lastMonthExpense = transactions
      .filter(t => t.type === "saida" && isWithinInterval(parseISO(t.date), { start: lastMonthStart, end: lastMonthEnd }))
      .reduce((s, t) => s + t.amount, 0);
    const monthTrend = lastMonthExpense > 0
      ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100
      : 0;

    return { avgDailyCost, avgByCategory, avgAsphaltDaily, avgPricePerTon, weekTrend, monthTrend, thisWeekExpense, lastWeekExpense };
  }, [filtered, categories, asphaltEntries, transactions, start, end]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.filter(t => t.type === "saida").forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const name = cat?.name ?? "Sem categoria";
      map.set(name, (map.get(name) ?? 0) + t.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name, value, color: categories.find(c => c.name === name)?.color ?? "#94a3b8"
    })).sort((a, b) => b.value - a.value);
  }, [filtered, categories]);

  const barData = useMemo(() => {
    const months = new Map<string, { entradas: number; saidas: number }>();
    const ordered = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    ordered.forEach(t => {
      const key = format(parseISO(t.date), "MMM/yy", { locale: ptBR });
      const curr = months.get(key) ?? { entradas: 0, saidas: 0 };
      if (t.type === "entrada") curr.entradas += t.amount;
      else curr.saidas += t.amount;
      months.set(key, curr);
    });
    return Array.from(months.entries()).slice(-6).map(([name, v]) => ({ name, ...v }));
  }, [transactions]);

  const topExpenses = useMemo(() =>
    filtered.filter(t => t.type === "saida").sort((a, b) => b.amount - a.amount).slice(0, 5),
  [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">Visão Geral</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Entradas" value={fmt(totalIncome)} icon={TrendingUp} valueColor={totalIncome > 0 ? "green" : "black"} />
        <KpiCard title="Saídas" value={fmt(totalExpense)} icon={TrendingDown} valueColor={totalExpense > 0 ? "red" : "black"} />
        <KpiCard title="Saldo" value={fmt(balance)} icon={Wallet} valueColor={balance > 0 ? "green" : balance < 0 ? "red" : "black"} />
        <KpiCard title="Pendentes" value={String(pendingCount)} icon={Clock} valueColor={pendingCount > 0 ? "black" : "black"} />
        <KpiCard title="Fixas/mês" value={fmt(fixedTotal)} icon={CalendarClock} valueColor={fixedTotal > 0 ? "red" : "black"} />
      </div>

      {/* Insights Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custo Médio Diário</p>
          <p className="mt-2 text-xl font-bold text-card-foreground">{fmt(analytics.avgDailyCost)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asfalto Médio/Dia</p>
          <p className="mt-2 text-xl font-bold text-card-foreground">
            {analytics.avgAsphaltDaily > 0 ? `${analytics.avgAsphaltDaily.toFixed(2)}t` : "—"}
          </p>
          {analytics.avgPricePerTon > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{fmt(analytics.avgPricePerTon)}/ton</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Semana vs Anterior</p>
            <TrendIcon value={analytics.weekTrend} />
          </div>
          <p className={cn(
            "mt-2 text-xl font-bold",
            analytics.weekTrend > 0 ? "text-rose-500" : analytics.weekTrend < 0 ? "text-emerald-500" : "text-foreground"
          )}>
            {analytics.weekTrend !== 0 ? `${analytics.weekTrend > 0 ? "+" : ""}${analytics.weekTrend.toFixed(1)}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{fmt(analytics.thisWeekExpense)} esta semana</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mês vs Anterior</p>
            <TrendIcon value={analytics.monthTrend} />
          </div>
          <p className={cn(
            "mt-2 text-xl font-bold",
            analytics.monthTrend > 0 ? "text-rose-500" : analytics.monthTrend < 0 ? "text-emerald-500" : "text-foreground"
          )}>
            {analytics.monthTrend !== 0 ? `${analytics.monthTrend > 0 ? "+" : ""}${analytics.monthTrend.toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      {/* Average by category */}
      {analytics.avgByCategory.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h4 className="mb-4 font-semibold text-card-foreground">Média de Custo por Categoria (diário)</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analytics.avgByCategory.map(c => (
              <div key={c.name} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">Total: {fmt(c.total)}</p>
                </div>
                <span className="text-sm font-semibold text-card-foreground">{fmt(c.avg)}/dia</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h4 className="mb-4 font-semibold text-card-foreground">Despesas por Categoria</h4>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma despesa no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={12}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h4 className="mb-4 font-semibold text-card-foreground">Evolução Mensal</h4>
          {barData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Sem dados para exibir</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="entradas" fill="hsl(160 64% 43%)" radius={[4, 4, 0, 0]} name="Entradas" />
                <Bar dataKey="saidas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top expenses */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h4 className="mb-4 font-semibold text-card-foreground">Maiores Despesas do Período</h4>
        {topExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma despesa encontrada</p>
        ) : (
          <div className="space-y-3">
            {topExpenses.map(t => {
              const cat = categories.find(c => c.id === t.categoryId);
              return (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat?.color ?? "#94a3b8" }} />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{cat?.name} · {format(parseISO(t.date), "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-expense">{fmt(t.amount)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
