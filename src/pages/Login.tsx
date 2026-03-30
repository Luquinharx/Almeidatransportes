import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login realizado!");
    } catch (err: unknown) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code?: unknown }).code) : "";
      const msg = code === "auth/wrong-password" || code === "auth/user-not-found"
        ? "Email ou senha incorretos"
        : "Erro ao autenticar. Tente novamente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-slate-900/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-10 lg:grid-cols-2 lg:px-8">
        <section className="hidden h-[640px] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-700 p-8 text-white shadow-2xl lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <img src="/almeida-logo.svg" alt="Almeida Transportes" className="h-14 w-auto rounded-lg bg-white px-2 py-1" />
            <div>
              <h2 className="text-3xl font-extrabold leading-tight">Controle financeiro inteligente para operação de transportes</h2>
              <p className="mt-3 max-w-md text-sm text-white/80">
                Centralize despesas, lançamentos e relatórios em um único painel pensado para rotina operacional.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/70">Lançamentos</p>
              <p className="text-xl font-bold">+1200</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/70">Categorias</p>
              <p className="text-xl font-bold">Dinâmicas</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-white/70">Relatórios</p>
              <p className="text-xl font-bold">Mensais</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md space-y-8 lg:max-w-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-2xl border bg-white p-3 shadow-sm">
              <img src="/almeida-logo.svg" alt="Almeida Transportes" className="h-11 w-auto" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Almeida Transportes</h1>
              <p className="text-sm text-muted-foreground">Gestão Financeira</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card/95 p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-card-foreground">Entrar</h2>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" autoFocus />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : "Entrar"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
