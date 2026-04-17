import { useMemo, useState } from "react";
import { useFinance, FuelEntry } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Lock, Unlock, Trash2, Fuel as FuelIcon, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";

const fmt = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function parseOptionalAmount(value: string) {
  if (!value.trim()) return 0;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export default function Fuel() {
  const {
    fuelEntries,
    fuelPeriods,
    addFuelEntry,
    deleteFuelEntry,
    updateFuelEntry,
    openFuelPeriod,
    closeFuelPeriod,
  } = useFinance();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [liters, setLiters] = useState("");
  const [description, setDescription] = useState("Abastecimento");
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editLiters, setEditLiters] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const activePeriod = useMemo(() => fuelPeriods.find((period) => !period.closed) ?? null, [fuelPeriods]);

  const openNewPeriod = () => {
    openFuelPeriod(new Date().toISOString().slice(0, 10));
  };

  const openNewEntry = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setAmount("");
    setLiters("");
    setDescription("Abastecimento");
    setDialogOpen(true);
  };

  const handleAddEntry = () => {
    const parsedLiters = Number.parseFloat(liters);
    if (!date || !Number.isFinite(parsedLiters) || parsedLiters <= 0) return;

    addFuelEntry({
      date,
      amount: parseOptionalAmount(amount),
      liters: parsedLiters,
      description: description.trim() || "Abastecimento",
      periodId: activePeriod?.id,
    });

    setDialogOpen(false);
  };

  const openEdit = (entry: FuelEntry) => {
    setEditingEntry(entry);
    setEditDate(entry.date);
    setEditAmount(entry.amount > 0 ? String(entry.amount) : "");
    setEditLiters(entry.liters ? String(entry.liters) : "");
    setEditDescription(entry.description);
  };

  const handleSaveEdit = () => {
    if (!editingEntry || !editDate) return;
    const parsedLiters = Number.parseFloat(editLiters);
    if (!Number.isFinite(parsedLiters) || parsedLiters <= 0) return;

    updateFuelEntry({
      ...editingEntry,
      date: editDate,
      amount: parseOptionalAmount(editAmount),
      liters: parsedLiters,
      description: editDescription.trim() || "Abastecimento",
    });
    setEditingEntry(null);
  };

  const getEntriesForPeriod = (periodId: string) => fuelEntries.filter((entry) => entry.periodId === periodId);

  const getPeriodTotal = (periodId: string) =>
    getEntriesForPeriod(periodId).reduce((sum, entry) => sum + entry.amount, 0);

  const sortedPeriods = useMemo(
    () => [...fuelPeriods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [fuelPeriods],
  );

  const orphanEntries = useMemo(
    () => fuelEntries.filter((entry) => !entry.periodId).sort((a, b) => b.date.localeCompare(a.date)),
    [fuelEntries],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">Controle de Combustivel</h3>
        <div className="flex gap-2">
          {!activePeriod && (
            <Button variant="outline" onClick={openNewPeriod}>
              <Unlock className="mr-2 h-4 w-4" /> Abrir Periodo
            </Button>
          )}
          <Button onClick={openNewEntry}>
            <Plus className="mr-2 h-4 w-4" /> Novo Abastecimento
          </Button>
        </div>
      </div>

      {activePeriod && (
        <div className="flex items-center justify-between rounded-xl border-2 border-pending/30 bg-pending/5 p-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="border-pending/20 bg-pending/10 text-pending">Periodo Aberto</Badge>
              <span className="text-sm text-muted-foreground">
                Desde {format(parseISO(activePeriod.startDate), "dd/MM/yyyy")}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-card-foreground">{fmt(getPeriodTotal(activePeriod.id))}</span>
              <span className="text-sm text-muted-foreground">({getEntriesForPeriod(activePeriod.id).length} lancamentos)</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => closeFuelPeriod(activePeriod.id)}
            className="border-pending/30 text-pending hover:bg-pending/10"
          >
            <Lock className="mr-2 h-4 w-4" /> Fechar Periodo
          </Button>
        </div>
      )}

      {activePeriod && getEntriesForPeriod(activePeriod.id).length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b bg-secondary/50 px-4 py-3">
            <h4 className="font-medium text-muted-foreground">Lancamentos do periodo atual</h4>
          </div>
          <div className="divide-y">
            {getEntriesForPeriod(activePeriod.id)
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(entry.date), "dd/MM/yyyy")} · {entry.liters ?? 0}L
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={entry.amount > 0 ? "font-semibold text-expense" : "text-sm text-muted-foreground"}>
                      {entry.amount > 0 ? fmt(entry.amount) : "Aguardando valor"}
                    </span>
                    <button onClick={() => openEdit(entry)} className="rounded p-1.5 hover:bg-secondary">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteFuelEntry(entry.id)} className="rounded p-1.5 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="font-semibold text-foreground">Historico de Periodos</h4>
        {sortedPeriods.filter((period) => period.closed).length === 0 && orphanEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum periodo fechado ainda</p>
        ) : (
          <div className="space-y-3">
            {sortedPeriods
              .filter((period) => period.closed)
              .map((period) => (
                <div
                  key={period.id}
                  className="rounded-xl border bg-card p-4 shadow-sm"
                  onClick={() => setSelectedPeriod(selectedPeriod === period.id ? null : period.id)}
                >
                  <div className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          <FuelIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-card-foreground">
                            {format(parseISO(period.startDate), "dd/MM")} →{" "}
                            {period.endDate ? format(parseISO(period.endDate), "dd/MM/yyyy") : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{getEntriesForPeriod(period.id).length} lancamentos</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-expense">{fmt(getPeriodTotal(period.id))}</span>
                    </div>
                  </div>
                  {selectedPeriod === period.id && (
                    <div className="mt-3 divide-y border-t pt-2">
                      {getEntriesForPeriod(period.id).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between py-2 text-sm">
                          <span className="text-muted-foreground">
                            {format(parseISO(entry.date), "dd/MM")} · {entry.description} · {entry.liters ?? 0}L
                          </span>
                          <span className={entry.amount > 0 ? "font-medium text-card-foreground" : "text-muted-foreground"}>
                            {entry.amount > 0 ? fmt(entry.amount) : "Aguardando valor"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            {orphanEntries.length > 0 && (
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="mb-2 text-sm font-medium text-card-foreground">Lancamentos sem periodo</p>
                <div className="space-y-2">
                  {orphanEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {format(parseISO(entry.date), "dd/MM/yyyy")} · {entry.description} · {entry.liters ?? 0}L
                      </span>
                      <span className={entry.amount > 0 ? "font-medium text-card-foreground" : "text-muted-foreground"}>
                        {entry.amount > 0 ? fmt(entry.amount) : "Aguardando valor"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Abastecimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div>
              <Label>Litros</Label>
              <Input
                type="number"
                step="0.01"
                value={liters}
                onChange={(event) => setLiters(event.target.value)}
                placeholder="Ex: 45.5"
                autoFocus
              />
            </div>
            <div>
              <Label>Valor (R$, opcional)</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Pode preencher depois"
              />
            </div>
            <div>
              <Label>Descricao</Label>
              <Input value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            {activePeriod && (
              <p className="text-xs text-muted-foreground">
                Sera vinculado ao periodo aberto desde {format(parseISO(activePeriod.startDate), "dd/MM/yyyy")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Esse lancamento ja vai para a dashboard usando esta data. O valor pode ser atualizado depois.
            </p>
            <Button onClick={handleAddEntry} className="w-full">
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingEntry}
        onOpenChange={(open) => {
          if (!open) setEditingEntry(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Abastecimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} />
            </div>
            <div>
              <Label>Litros</Label>
              <Input
                type="number"
                step="0.01"
                value={editLiters}
                onChange={(event) => setEditLiters(event.target.value)}
                placeholder="Ex: 45.5"
              />
            </div>
            <div>
              <Label>Valor (R$, opcional)</Label>
              <Input
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(event) => setEditAmount(event.target.value)}
                placeholder="Pode deixar em branco"
              />
            </div>
            <div>
              <Label>Descricao</Label>
              <Input value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
            </div>
            <Button className="w-full" onClick={handleSaveEdit}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
