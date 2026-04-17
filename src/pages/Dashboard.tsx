import { useMemo, useState } from "react";
import { useFinance, Transaction } from "@/contexts/FinanceContext";
import { findCategoryByKeyword, getTransactionEffectiveType } from "@/lib/finance";
import KpiCard from "@/components/KpiCard";
import { TrendingUp, TrendingDown, Wallet, Clock, CalendarClock, ArrowUpRight, ArrowDownRight, Minus, Users } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  differenceInDays,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
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
  if (period === "last") {
    const lastMonth = subMonths(now, 1);
    return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
  }
  if (period === "3months") return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
  return { start: new Date(now.getFullYear(), 0, 1), end: endOfMonth(now) };
}

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <ArrowUpRight className="h-4 w-4 text-muted-foreground" />;
  if (value < 0) return <ArrowDownRight className="h-4 w-4 text-muted-foreground" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default function Dashboard() {
  const { transactions, categories, fixedExpenses, asphaltEntries, employees } = useFinance();
  const [period, setPeriod] = useState("current");

  const { start, end } = useMemo(() => getRange(period), [period]);

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) =>
        isWithinInterval(parseISO(transaction.date), { start, end }),
      ),
    [transactions, start, end],
  );

  const filteredWithType = useMemo(
    () =>
      filtered.map((transaction) => ({
        transaction,
        type: getTransactionEffectiveType(transaction, categories),
      })),
    [filtered, categories],
  );

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.active), [employees]);
  const monthlyPayroll = useMemo(
    () => activeEmployees.reduce((sum, employee) => sum + employee.salary, 0),
    [activeEmployees],
  );
  const monthsInRange = useMemo(
    () => eachMonthOfInterval({ start: startOfMonth(start), end: startOfMonth(end) }).length,
    [start, end],
  );
  const payrollExpenseInRange = monthlyPayroll * monthsInRange;

  const salaryCategory = useMemo(
    () =>
      categories.find((category) => category.id === "cat_salarios") ??
      findCategoryByKeyword(categories, "salario"),
    [categories],
  );

  const expenseTransactions = useMemo(
    () =>
      filteredWithType
        .filter((item) => item.type === "saida")
        .map((item) => item.transaction),
    [filteredWithType],
  );

  const totalIncome = useMemo(
    () =>
      filteredWithType
        .filter((item) => item.type === "entrada")
        .reduce((sum, item) => sum + item.transaction.amount, 0),
    [filteredWithType],
  );

  const transactionExpenseTotal = useMemo(
    () =>
      filteredWithType
        .filter((item) => item.type === "saida")
        .reduce((sum, item) => sum + item.transaction.amount, 0),
    [filteredWithType],
  );

  const totalExpense = transactionExpenseTotal + payrollExpenseInRange;
  const balance = totalIncome - totalExpense;
  const pendingCount = useMemo(
    () => filteredWithType.filter((item) => item.transaction.status === "pendente").length,
    [filteredWithType],
  );
  const fixedExpensesTotal = useMemo(
    () => fixedExpenses.filter((expense) => expense.active).reduce((sum, expense) => sum + expense.amount, 0),
    [fixedExpenses],
  );

  const analytics = useMemo(() => {
    const days = Math.max(1, differenceInDays(end, start) + 1);
    const avgDailyCost = (transactionExpenseTotal + payrollExpenseInRange) / days;

    const catMap = new Map<string, { total: number; name: string; color: string }>();

    expenseTransactions.forEach((transaction) => {
      const category = categories.find((item) => item.id === transaction.categoryId);
      const key = category?.id ?? "none";
      const current = catMap.get(key) ?? {
        total: 0,
        name: category?.name ?? "Outros",
        color: category?.color ?? "#94a3b8",
      };
      current.total += transaction.amount;
      catMap.set(key, current);
    });

    if (payrollExpenseInRange > 0) {
      const payrollKey = salaryCategory?.id ?? "payroll";
      const payroll = catMap.get(payrollKey) ?? {
        total: 0,
        name: salaryCategory?.name ?? "Salarios",
        color: salaryCategory?.color ?? "#8b5cf6",
      };
      payroll.total += payrollExpenseInRange;
      catMap.set(payrollKey, payroll);
    }

    const avgByCategory = Array.from(catMap.values())
      .map((item) => ({ ...item, avg: item.total / days }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const periodAsphalt = asphaltEntries.filter((entry) =>
      isWithinInterval(parseISO(entry.date), { start, end }),
    );
    const totalAsphaltTons = periodAsphalt.reduce((sum, entry) => sum + entry.tons, 0);
    const avgAsphaltDaily =
      periodAsphalt.length > 0
        ? totalAsphaltTons / new Set(periodAsphalt.map((entry) => entry.date)).size
        : 0;
    const avgPricePerTon =
      periodAsphalt.length > 0 && totalAsphaltTons > 0
        ? periodAsphalt.reduce((sum, entry) => sum + entry.total, 0) / totalAsphaltTons
        : 0;

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);

    const thisWeekExpense = transactions
      .filter((transaction) => {
        const type = getTransactionEffectiveType(transaction, categories);
        return type === "saida" && isWithinInterval(parseISO(transaction.date), { start: thisWeekStart, end: thisWeekEnd });
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const lastWeekExpense = transactions
      .filter((transaction) => {
        const type = getTransactionEffectiveType(transaction, categories);
        return type === "saida" && isWithinInterval(parseISO(transaction.date), { start: lastWeekStart, end: lastWeekEnd });
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const weekTrend = lastWeekExpense > 0 ? ((thisWeekExpense - lastWeekExpense) / lastWeekExpense) * 100 : 0;

    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthExpense =
      transactions
        .filter((transaction) => {
          const type = getTransactionEffectiveType(transaction, categories);
          return type === "saida" && isWithinInterval(parseISO(transaction.date), { start: thisMonthStart, end: thisMonthEnd });
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0) +
      monthlyPayroll;

    const lastMonthExpense =
      transactions
        .filter((transaction) => {
          const type = getTransactionEffectiveType(transaction, categories);
          return type === "saida" && isWithinInterval(parseISO(transaction.date), { start: lastMonthStart, end: lastMonthEnd });
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0) +
      monthlyPayroll;

    const monthTrend = lastMonthExpense > 0 ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;

    return {
      avgDailyCost,
      avgByCategory,
      avgAsphaltDaily,
      avgPricePerTon,
      weekTrend,
      monthTrend,
      thisWeekExpense,
    };
  }, [
    asphaltEntries,
    categories,
    end,
    expenseTransactions,
    monthlyPayroll,
    payrollExpenseInRange,
    salaryCategory?.color,
    salaryCategory?.id,
    salaryCategory?.name,
    start,
    transactionExpenseTotal,
    transactions,
  ]);

  const pieData = useMemo(() => {
    const map = new Map<string, { value: number; color: string }>();

    expenseTransactions.forEach((transaction) => {
      const category = categories.find((item) => item.id === transaction.categoryId);
      const name = category?.name ?? "Sem categoria";
      const current = map.get(name) ?? { value: 0, color: category?.color ?? "#94a3b8" };
      current.value += transaction.amount;
      map.set(name, current);
    });

    if (payrollExpenseInRange > 0) {
      const name = salaryCategory?.name ?? "Salarios";
      const current = map.get(name) ?? { value: 0, color: salaryCategory?.color ?? "#8b5cf6" };
      current.value += payrollExpenseInRange;
      map.set(name, current);
    }

    return Array.from(map.entries())
      .map(([name, item]) => ({ name, value: item.value, color: item.color }))
      .sort((a, b) => b.value - a.value);
  }, [categories, expenseTransactions, payrollExpenseInRange, salaryCategory?.color, salaryCategory?.name]);

  const barData = useMemo(() => {
    const monthStarts = Array.from({ length: 6 }, (_, index) => startOfMonth(subMonths(new Date(), 5 - index)));
    const months = new Map<string, { entradas: number; saidas: number }>();

    monthStarts.forEach((monthStart) => {
      const key = format(monthStart, "MMM/yy", { locale: ptBR });
      months.set(key, { entradas: 0, saidas: monthlyPayroll });
    });

    transactions.forEach((transaction) => {
      const monthKey = format(parseISO(transaction.date), "MMM/yy", { locale: ptBR });
      const current = months.get(monthKey);
      if (!current) return;
      const type = getTransactionEffectiveType(transaction, categories);
      if (type === "entrada") current.entradas += transaction.amount;
      else current.saidas += transaction.amount;
    });

    return monthStarts.map((monthStart) => {
      const key = format(monthStart, "MMM/yy", { locale: ptBR });
      const value = months.get(key) ?? { entradas: 0, saidas: 0 };
      return { name: key, ...value };
    });
  }, [transactions, categories, monthlyPayroll]);

  const payrollTopExpense = useMemo<Transaction | null>(() => {
    if (payrollExpenseInRange <= 0) return null;
    return {
      id: `payroll-${period}`,
      type: "saida",
      amount: payrollExpenseInRange,
      date: end.toISOString().slice(0, 10),
      categoryId: salaryCategory?.id ?? "cat_salarios",
      description: `Folha salarial (${monthsInRange} mes(es), ${activeEmployees.length} funcionario(s))`,
      status: "pago",
      paymentMethod: "transferencia",
    };
  }, [activeEmployees.length, end, monthsInRange, payrollExpenseInRange, period, salaryCategory?.id]);

  const topExpenses = useMemo(() => {
    const list = payrollTopExpense ? [...expenseTransactions, payrollTopExpense] : [...expenseTransactions];
    return list.sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [expenseTransactions, payrollTopExpense]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">Visao Geral</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard title="Entradas" value={fmt(totalIncome)} icon={TrendingUp} valueColor={totalIncome > 0 ? "green" : "black"} />
        <KpiCard title="Saidas" value={fmt(totalExpense)} icon={TrendingDown} valueColor={totalExpense > 0 ? "red" : "black"} />
        <KpiCard title="Saldo" value={fmt(balance)} icon={Wallet} valueColor={balance > 0 ? "green" : balance < 0 ? "red" : "black"} />
        <KpiCard title="Pendentes" value={String(pendingCount)} icon={Clock} valueColor="black" />
        <KpiCard title="Folha salarial/mes" value={fmt(monthlyPayroll)} icon={Users} valueColor={monthlyPayroll > 0 ? "red" : "black"} />
        <KpiCard title="Despesas fixas/mes" value={fmt(fixedExpensesTotal)} icon={CalendarClock} valueColor={fixedExpensesTotal > 0 ? "red" : "black"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Custo Medio Diario</p>
          <p className="mt-2 text-xl font-bold text-card-foreground">{fmt(analytics.avgDailyCost)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Asfalto Medio/Dia</p>
          <p className="mt-2 text-xl font-bold text-card-foreground">
            {analytics.avgAsphaltDaily > 0 ? `${analytics.avgAsphaltDaily.toFixed(2)}t` : "—"}
          </p>
          {analytics.avgPricePerTon > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">{fmt(analytics.avgPricePerTon)}/ton</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Semana vs Anterior</p>
            <TrendIcon value={analytics.weekTrend} />
          </div>
          <p
            className={cn(
              "mt-2 text-xl font-bold",
              analytics.weekTrend > 0 ? "text-rose-500" : analytics.weekTrend < 0 ? "text-emerald-500" : "text-foreground",
            )}
          >
            {analytics.weekTrend !== 0 ? `${analytics.weekTrend > 0 ? "+" : ""}${analytics.weekTrend.toFixed(1)}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{fmt(analytics.thisWeekExpense)} esta semana</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mes vs Anterior</p>
            <TrendIcon value={analytics.monthTrend} />
          </div>
          <p
            className={cn(
              "mt-2 text-xl font-bold",
              analytics.monthTrend > 0 ? "text-rose-500" : analytics.monthTrend < 0 ? "text-emerald-500" : "text-foreground",
            )}
          >
            {analytics.monthTrend !== 0 ? `${analytics.monthTrend > 0 ? "+" : ""}${analytics.monthTrend.toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      {analytics.avgByCategory.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h4 className="mb-4 font-semibold text-card-foreground">Media de Custo por Categoria (diario)</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analytics.avgByCategory.map((item) => (
              <div key={item.name} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Total: {fmt(item.total)}</p>
                </div>
                <span className="text-sm font-semibold text-card-foreground">{fmt(item.avg)}/dia</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h4 className="mb-4 font-semibold text-card-foreground">Despesas por Categoria</h4>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma despesa no periodo</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={12}
                >
                  {pieData.map((item, index) => (
                    <Cell key={index} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => fmt(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h4 className="mb-4 font-semibold text-card-foreground">Evolucao Mensal</h4>
          {barData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Sem dados para exibir</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Bar dataKey="entradas" fill="hsl(160 64% 43%)" radius={[4, 4, 0, 0]} name="Entradas" />
                <Bar dataKey="saidas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} name="Saidas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h4 className="mb-4 font-semibold text-card-foreground">Maiores Despesas do Periodo</h4>
        {topExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma despesa encontrada</p>
        ) : (
          <div className="space-y-3">
            {topExpenses.map((transaction) => {
              const category = categories.find((item) => item.id === transaction.categoryId);
              return (
                <div key={transaction.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category?.color ?? "#94a3b8" }} />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {category?.name} · {format(parseISO(transaction.date), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-expense">{fmt(transaction.amount)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
