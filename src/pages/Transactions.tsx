import { useState, useMemo } from "react";
import { useFinance, Transaction } from "@/contexts/FinanceContext";
import TransactionDialog from "@/components/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Transactions() {
  const { transactions, categories, deleteTransaction } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const filtered = useMemo(() => {
    return transactions
      .filter(t => filterType === "all" || t.type === filterType)
      .filter(t => filterStatus === "all" || t.status === filterStatus)
      .filter(t => filterCategory === "all" || t.categoryId === filterCategory)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filterType, filterStatus, filterCategory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">Lançamentos</h3>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descrição</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Anexo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nenhum lançamento encontrado</td></tr>
            )}
            {filtered.map(t => {
              const cat = categories.find(c => c.id === t.categoryId);
              return (
                <tr key={t.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-card-foreground">{format(parseISO(t.date), "dd/MM/yy")}</td>
                  <td className="px-4 py-3 font-medium text-card-foreground">{t.description}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat?.color }} />
                      <span className="text-muted-foreground">{cat?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {t.attachmentUrl ? (
                      <a
                        href={t.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Ver anexo
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={t.status === "pago" ? "default" : "secondary"} className={cn(
                      t.status === "pago" ? "bg-income/10 text-income border-income/20" : "bg-pending/10 text-pending border-pending/20"
                    )}>{t.status === "pago" ? "Pago" : "Pendente"}</Badge>
                  </td>
                  <td className={cn("px-4 py-3 text-right font-semibold", t.type === "entrada" ? "text-income" : "text-expense")}>
                    {t.type === "entrada" ? "+" : "-"}{fmt(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditing(t); setDialogOpen(true); }} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                      <button onClick={() => deleteTransaction(t.id)} className="rounded p-1.5 hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
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
