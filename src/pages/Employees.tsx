import { useState } from "react";
import { useFinance, Employee } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [name, setName] = useState("");
  const [salary, setSalary] = useState("");

  const openNew = () => {
    setEditing(null);
    setName("");
    setSalary("");
    setDialogOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setName(e.name);
    setSalary(String(e.salary));
    setDialogOpen(true);
  };

  const handleSave = () => {
    const s = parseFloat(salary);
    if (!name.trim() || isNaN(s)) return;
    if (editing) {
      updateEmployee({ ...editing, name: name.trim(), salary: s });
    } else {
      addEmployee({ name: name.trim(), salary: s, active: true });
    }
    setDialogOpen(false);
  };

  const sorted = [...employees].sort((a, b) => a.name.localeCompare(b.name));
  const totalSalaries = employees.filter(e => e.active).reduce((s, e) => s + e.salary, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">Funcionários</h3>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
        </Button>
      </div>

      {/* Summary card */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total de Funcionários</p>
          <p className="mt-1 text-2xl font-bold text-card-foreground">{employees.filter(e => e.active).length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Folha Salarial</p>
          <p className="mt-1 text-2xl font-bold text-expense">{fmt(totalSalaries)}</p>
        </div>
      </div>

      {/* Employee list */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center shadow-sm">
          <Users className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhum funcionário cadastrado</p>
          <Button variant="outline" className="mt-4" onClick={openNew}>Cadastrar Primeiro</Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm divide-y">
          {sorted.map(emp => (
            <div key={emp.id} className={cn("flex items-center justify-between px-4 py-3", !emp.active && "opacity-50")}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.active ? "Ativo" : "Inativo"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-card-foreground">{fmt(emp.salary)}</span>
                <button onClick={() => openEdit(emp)} className="rounded p-1.5 hover:bg-secondary">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button onClick={() => deleteEmployee(emp.id)} className="rounded p-1.5 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do funcionário" autoFocus />
            </div>
            <div>
              <Label>Valor Recebido (R$)</Label>
              <Input type="number" step="0.01" value={salary} onChange={e => setSalary(e.target.value)} placeholder="0,00" />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
