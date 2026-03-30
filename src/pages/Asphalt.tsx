import { useState, useMemo } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Copy, Trash2, Settings } from "lucide-react";
import { format, parseISO } from "date-fns";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Asphalt() {
  const {
    asphaltEntries, asphaltSettings, categories,
    addAsphaltEntry, updateAsphaltSettings, deleteAsphaltEntry,
  } = useFinance();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tons, setTons] = useState("");
  const [pricePerTon, setPricePerTon] = useState("");

  // Last entry for suggestions
  const lastEntry = useMemo(() => {
    const sorted = [...asphaltEntries].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0] ?? null;
  }, [asphaltEntries]);

  const openNew = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setTons(lastEntry ? String(lastEntry.tons) : "");
    setPricePerTon(String(lastEntry?.pricePerTon ?? asphaltSettings.defaultPricePerTon));
    setDialogOpen(true);
  };

  const duplicateLast = () => {
    if (!lastEntry) return;
    setDate(new Date().toISOString().slice(0, 10));
    setTons(String(lastEntry.tons));
    setPricePerTon(String(lastEntry.pricePerTon));
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const t = parseFloat(tons);
    const p = parseFloat(pricePerTon);
    if (!t || !p || !date) return;
    addAsphaltEntry({ date, tons: t, pricePerTon: p });
    setDialogOpen(false);
  };

  // Settings
  const [settingPrice, setSettingPrice] = useState(String(asphaltSettings.defaultPricePerTon));
  const [settingCat, setSettingCat] = useState(asphaltSettings.categoryId);

  const openSettings = () => {
    setSettingPrice(String(asphaltSettings.defaultPricePerTon));
    setSettingCat(asphaltSettings.categoryId);
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    updateAsphaltSettings({ defaultPricePerTon: parseFloat(settingPrice) || 350, categoryId: settingCat });
    setSettingsOpen(false);
  };

  // Stats
  const stats = useMemo(() => {
    if (asphaltEntries.length === 0) return null;
    const totalTons = asphaltEntries.reduce((s, e) => s + e.tons, 0);
    const totalCost = asphaltEntries.reduce((s, e) => s + e.total, 0);
    const avgPrice = totalCost / totalTons;
    const avgDaily = totalTons / new Set(asphaltEntries.map(e => e.date)).size;
    return { totalTons, totalCost, avgPrice, avgDaily };
  }, [asphaltEntries]);

  const sorted = useMemo(() => [...asphaltEntries].sort((a, b) => b.date.localeCompare(a.date)), [asphaltEntries]);
  const calculatedTotal = useMemo(() => {
    const t = parseFloat(tons);
    const p = parseFloat(pricePerTon);
    return t && p ? t * p : 0;
  }, [tons, pricePerTon]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">Consumo de Asfalto</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openSettings}>
            <Settings className="mr-2 h-4 w-4" /> Configurar
          </Button>
          {lastEntry && (
            <Button variant="outline" size="sm" onClick={duplicateLast}>
              <Copy className="mr-2 h-4 w-4" /> Duplicar Último
            </Button>
          )}
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Toneladas</p>
            <p className="mt-1 text-2xl font-bold text-card-foreground">{stats.totalTons.toFixed(2)}t</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Custo Total</p>
            <p className="mt-1 text-2xl font-bold text-expense">{fmt(stats.totalCost)}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Preço Médio/Ton</p>
            <p className="mt-1 text-2xl font-bold text-card-foreground">{fmt(stats.avgPrice)}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Média Diária</p>
            <p className="mt-1 text-2xl font-bold text-card-foreground">{stats.avgDaily.toFixed(2)}t</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Toneladas</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">R$/Ton</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Nenhum lançamento de asfalto</td></tr>
            )}
            {sorted.map(e => (
              <tr key={e.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 text-card-foreground">{format(parseISO(e.date), "dd/MM/yyyy")}</td>
                <td className="px-4 py-3 text-right font-medium text-card-foreground">{e.tons.toFixed(2)}t</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{fmt(e.pricePerTon)}</td>
                <td className="px-4 py-3 text-right font-semibold text-expense">{fmt(e.total)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteAsphaltEntry(e.id)} className="rounded p-1.5 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Lançamento de Asfalto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Quantidade (toneladas)</Label>
              <Input type="number" step="0.01" value={tons} onChange={e => setTons(e.target.value)} placeholder="Ex: 7.25" autoFocus />
            </div>
            <div>
              <Label>Valor por tonelada (R$)</Label>
              <Input type="number" step="0.01" value={pricePerTon} onChange={e => setPricePerTon(e.target.value)} />
            </div>
            {calculatedTotal > 0 && (
              <div className="rounded-lg bg-secondary/60 p-3 text-center">
                <p className="text-sm text-muted-foreground">Total calculado</p>
                <p className="text-xl font-bold text-card-foreground">{fmt(calculatedTotal)}</p>
              </div>
            )}
            {lastEntry && (
              <p className="text-xs text-muted-foreground">
                Último: {lastEntry.tons}t × {fmt(lastEntry.pricePerTon)} em {format(parseISO(lastEntry.date), "dd/MM")}
              </p>
            )}
            <Button onClick={handleSubmit} className="w-full">Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Configurações de Asfalto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Preço padrão por tonelada (R$)</Label>
              <Input type="number" step="0.01" value={settingPrice} onChange={e => setSettingPrice(e.target.value)} />
            </div>
            <div>
              <Label>Categoria vinculada</Label>
              <Select value={settingCat} onValueChange={setSettingCat}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.type === "saida" || c.type === "ambos").map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveSettings} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
