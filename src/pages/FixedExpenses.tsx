import { useState } from "react";
import { useFinance, FixedExpense, Recurrence } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Play } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const recLabels: Record<Recurrence, string> = { mensal: "Mensal", semanal: "Semanal", anual: "Anual" };

export default function FixedExpenses() {
  const { fixedExpenses, categories, addFixedExpense, updateFixedExpense, deleteFixedExpense, addTransaction } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FixedExpense | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [recurrence, setRecurrence] = useState<Recurrence>("mensal");
  const [active, setActive] = useState(true);

  const openDialog = (f?: FixedExpense) => {
    if (f) { setEditing(f); setName(f.name); setAmount(String(f.amount)); setCategoryId(f.categoryId); setDueDay(String(f.dueDay)); setRecurrence(f.recurrence); setActive(f.active); }
    else { setEditing(null); setName(""); setAmount(""); setCategoryId(""); setDueDay("1"); setRecurrence("mensal"); setActive(true); }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name || !amount || !categoryId) return;
    const data = { name, amount: parseFloat(amount), categoryId, dueDay: parseInt(dueDay), recurrence, active };
    if (editing) updateFixedExpense({ ...data, id: editing.id });
    else addFixedExpense(data);
    setDialogOpen(false);
  };

  const generateTransaction = (f: FixedExpense) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), f.dueDay).toISOString().slice(0, 10);
    addTransaction({ type: "saida", amount: f.amount, date, categoryId: f.categoryId, description: f.name, status: "pendente", fixedExpenseId: f.id });
  };

  const expenseCats = categories.filter(c => c.type === "saida" || c.type === "ambos");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">Despesas Fixas</h3>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nova Despesa Fixa
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fixedExpenses.length === 0 && (
          <p className="col-span-full py-10 text-center text-muted-foreground">Nenhuma despesa fixa cadastrada</p>
        )}
        {fixedExpenses.map(f => {
          const cat = categories.find(c => c.id === f.categoryId);
          return (
            <div key={f.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-card-foreground">{f.name}</p>
                  <p className="text-lg font-bold text-expense">{fmt(f.amount)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs">{cat?.name}</Badge>
                    <Badge variant="secondary" className="text-xs">Dia {f.dueDay}</Badge>
                    <Badge variant="secondary" className="text-xs">{recLabels[f.recurrence]}</Badge>
                    <Badge variant={f.active ? "default" : "secondary"} className={f.active ? "bg-income/10 text-income border-income/20 text-xs" : "text-xs"}>
                      {f.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => generateTransaction(f)} title="Gerar lançamento" className="rounded p-1.5 hover:bg-secondary"><Play className="h-4 w-4 text-accent" /></button>
                  <button onClick={() => openDialog(f)} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                  <button onClick={() => deleteFixedExpense(f.id)} className="rounded p-1.5 hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Editar Despesa Fixa" : "Nova Despesa Fixa"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Aluguel" /></div>
            <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{expenseCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Dia vencimento</Label><Input type="number" min={1} max={31} value={dueDay} onChange={e => setDueDay(e.target.value)} /></div>
              <div>
                <Label>Recorrência</Label>
                <Select value={recurrence} onValueChange={v => setRecurrence(v as Recurrence)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label>Ativa</Label>
            </div>
            <Button onClick={handleSubmit} className="w-full">{editing ? "Salvar" : "Adicionar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
