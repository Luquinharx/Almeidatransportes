import { useState } from "react";
import { useFinance, Category, CategoryType } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

const COLORS = ["#22c55e","#ef4444","#3b82f6","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#f97316","#14b8a6","#6366f1"];
const typeLabels: Record<CategoryType, string> = { entrada: "Entrada", saida: "Saída", ambos: "Ambos" };

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("saida");
  const [color, setColor] = useState(COLORS[0]);

  const openDialog = (cat?: Category) => {
    if (cat) { setEditing(cat); setName(cat.name); setType(cat.type); setColor(cat.color); }
    else { setEditing(null); setName(""); setType("saida"); setColor(COLORS[0]); }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name) return;
    if (editing) updateCategory({ ...editing, name, type, color });
    else addCategory({ name, type, color });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">Categorias</h3>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
              <div>
                <p className="font-medium text-card-foreground">{cat.name}</p>
                <Badge variant="secondary" className="mt-1 text-xs">{typeLabels[cat.type]}</Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openDialog(cat)} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
              <button onClick={() => deleteCategory(cat.id)} className="rounded p-1.5 hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Marketing" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={v => setType(v as CategoryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor</Label>
              <div className="mt-1 flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: c === color ? "hsl(222 59% 22%)" : "transparent" }} />
                ))}
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full">{editing ? "Salvar" : "Adicionar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
