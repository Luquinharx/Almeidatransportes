import { useState, useMemo } from "react";
import { useFinance, FuelPeriod, FuelEntry } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Lock, Unlock, Trash2, Fuel as FuelIcon, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Fuel() {
  const {
    fuelEntries, fuelPeriods,
    addFuelEntry, deleteFuelEntry, updateFuelEntry, openFuelPeriod, closeFuelPeriod,
  } = useFinance();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [liters, setLiters] = useState("");
  const [description, setDescription] = useState("Abastecimento");
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null);
  const [editDate, setEditDate] = useState("");

  const activePeriod = useMemo(() => fuelPeriods.find(p => !p.closed) ?? null, [fuelPeriods]);

  const openNewPeriod = () => {
    openFuelPeriod(new Date().toISOString().slice(0, 10));
  };

  const handleAddEntry = () => {
    const a = parseFloat(amount);
    if (!a || !date) return;
    addFuelEntry({
      date, amount: a, liters: parseFloat(liters) || undefined,
      description, periodId: activePeriod?.id,
    });
    setDialogOpen(false);
    setAmount(""); setLiters(""); setDescription("Abastecimento");
  };

  const getEntriesForPeriod = (periodId: string) =>
    fuelEntries.filter(e => e.periodId === periodId);

  const getPeriodTotal = (periodId: string) =>
    getEntriesForPeriod(periodId).reduce((s, e) => s + e.amount, 0);

  const sortedPeriods = useMemo(() =>
    [...fuelPeriods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
  [fuelPeriods]);

  const orphanEntries = useMemo(() =>
    fuelEntries.filter(e => !e.periodId).sort((a, b) => b.date.localeCompare(a.date)),
  [fuelEntries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">Controle de Combustível</h3>
        <div className="flex gap-2">
          {!activePeriod && (
            <Button variant="outline" onClick={openNewPeriod}>
              <Unlock className="mr-2 h-4 w-4" /> Abrir Período
            </Button>
          )}
          <Button onClick={() => { setDate(new Date().toISOString().slice(0, 10)); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Novo Abastecimento
          </Button>
        </div>
      </div>

      {/* Active period banner */}
      {activePeriod && (
        <div className="flex items-center justify-between rounded-xl border-2 border-pending/30 bg-pending/5 p-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-pending/10 text-pending border-pending/20">Período Aberto</Badge>
              <span className="text-sm text-muted-foreground">
                Desde {format(parseISO(activePeriod.startDate), "dd/MM/yyyy")}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-card-foreground">{fmt(getPeriodTotal(activePeriod.id))}</span>
              <span className="text-sm text-muted-foreground">
                ({getEntriesForPeriod(activePeriod.id).length} lançamentos)
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={() => closeFuelPeriod(activePeriod.id)} className="border-pending/30 text-pending hover:bg-pending/10">
            <Lock className="mr-2 h-4 w-4" /> Fechar Período
          </Button>
        </div>
      )}

      {/* Active period entries */}
      {activePeriod && getEntriesForPeriod(activePeriod.id).length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b bg-secondary/50 px-4 py-3">
            <h4 className="font-medium text-muted-foreground">Lançamentos do período atual</h4>
          </div>
          <div className="divide-y">
            {getEntriesForPeriod(activePeriod.id).sort((a, b) => b.date.localeCompare(a.date)).map(e => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{e.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(e.date), "dd/MM/yyyy")}
                    {e.liters ? ` · ${e.liters}L` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-expense">{fmt(e.amount)}</span>
                  <button onClick={() => { setEditingEntry(e); setEditDate(e.date); }} className="rounded p-1.5 hover:bg-secondary">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteFuelEntry(e.id)} className="rounded p-1.5 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closed periods */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground">Histórico de Períodos</h4>
        {sortedPeriods.filter(p => p.closed).length === 0 && orphanEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum período fechado ainda</p>
        ) : (
          <div className="space-y-3">
            {sortedPeriods.filter(p => p.closed).map(p => (
              <div key={p.id} className="rounded-xl border bg-card p-4 shadow-sm" onClick={() => setSelectedPeriod(selectedPeriod === p.id ? null : p.id)}>
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <FuelIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        {format(parseISO(p.startDate), "dd/MM")} → {p.endDate ? format(parseISO(p.endDate), "dd/MM/yyyy") : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">{getEntriesForPeriod(p.id).length} lançamentos</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-expense">{fmt(getPeriodTotal(p.id))}</span>
                </div>
                {selectedPeriod === p.id && (
                  <div className="mt-3 divide-y border-t pt-2">
                    {getEntriesForPeriod(p.id).map(e => (
                      <div key={e.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-muted-foreground">{format(parseISO(e.date), "dd/MM")} · {e.description}</span>
                        <span className="font-medium text-card-foreground">{fmt(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Abastecimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" autoFocus />
            </div>
            <div>
              <Label>Litros (opcional)</Label>
              <Input type="number" step="0.01" value={liters} onChange={e => setLiters(e.target.value)} placeholder="Ex: 45.5" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            {activePeriod && (
              <p className="text-xs text-muted-foreground">
                Será vinculado ao período aberto desde {format(parseISO(activePeriod.startDate), "dd/MM/yyyy")}
              </p>
            )}
            <Button onClick={handleAddEntry} className="w-full">Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit date dialog */}
      <Dialog open={!!editingEntry} onOpenChange={open => { if (!open) setEditingEntry(null); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Editar Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Data</Label>
              <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
            </div>
            <Button className="w-full" onClick={() => {
              if (editingEntry && editDate) {
                updateFuelEntry({ ...editingEntry, date: editDate });
                setEditingEntry(null);
              }
            }}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
