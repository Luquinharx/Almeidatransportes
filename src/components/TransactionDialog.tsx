import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFinance, Transaction, TransactionType, PaymentMethod, TransactionStatus } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { replaceTransactionAttachment, uploadTransactionAttachment } from "@/services/attachmentService";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
];

export default function TransactionDialog({ open, onOpenChange, transaction }: Props) {
  const { categories, addTransaction, updateTransaction } = useFinance();
  const { user } = useAuth();
  const [type, setType] = useState<TransactionType>("saida");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [status, setStatus] = useState<TransactionStatus>("pendente");
  const [observation, setObservation] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentPath, setAttachmentPath] = useState("");

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setDate(transaction.date);
      setCategoryId(transaction.categoryId);
      setDescription(transaction.description);
      setPaymentMethod(transaction.paymentMethod ?? "pix");
      setStatus(transaction.status);
      setObservation(transaction.observation ?? "");
      setAttachmentUrl(transaction.attachmentUrl ?? "");
      setAttachmentPath(transaction.attachmentPath ?? "");
      setSelectedFile(null);
    } else {
      setType("saida"); setAmount(""); setDate(new Date().toISOString().slice(0, 10));
      setCategoryId(""); setDescription(""); setPaymentMethod("pix"); setStatus("pendente"); setObservation("");
      setAttachmentUrl(""); setAttachmentPath(""); setSelectedFile(null);
    }
  }, [transaction, open]);

  const filteredCats = categories.filter(c => c.type === type || c.type === "ambos");

  const handleSubmit = async () => {
    if (!amount || !categoryId || !description) return;

    const numericAmount = Number.parseFloat(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Informe um valor válido maior que zero.");
      return;
    }

    let nextAttachmentUrl = attachmentUrl;
    let nextAttachmentPath = attachmentPath;

    if (selectedFile) {
      if (!user?.uid) {
        toast.error("Usuário não autenticado para upload.");
        return;
      }

      setUploading(true);
      try {
        const uploaded = transaction
          ? await replaceTransactionAttachment({
              userId: user.uid,
              file: selectedFile,
              oldPath: attachmentPath || undefined,
              transactionId: transaction.id,
            })
          : await uploadTransactionAttachment({
              userId: user.uid,
              file: selectedFile,
            });
        nextAttachmentUrl = uploaded.url;
        nextAttachmentPath = uploaded.path;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao enviar anexo.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const data = {
      type,
      amount: numericAmount,
      date,
      categoryId,
      description,
      paymentMethod,
      status,
      observation,
      attachmentUrl: nextAttachmentUrl || undefined,
      attachmentPath: nextAttachmentPath || undefined,
    };

    if (transaction) updateTransaction({ ...data, id: transaction.id });
    else addTransaction(data);

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => { setType(v as TransactionType); setCategoryId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Venda de produto" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {filteredCats.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pagamento</Label>
              <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as TransactionStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea value={observation} onChange={e => setObservation(e.target.value)} placeholder="Opcional" rows={2} />
          </div>
          <div>
            <Label htmlFor="attachment">Anexo</Label>
            <Input
              id="attachment"
              type="file"
              accept="image/*,application/pdf"
              onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            {(attachmentUrl || selectedFile) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedFile ? `Arquivo selecionado: ${selectedFile.name}` : "Este lançamento já possui anexo salvo."}
              </p>
            )}
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
            {uploading ? "Enviando anexo..." : transaction ? "Salvar" : "Adicionar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
