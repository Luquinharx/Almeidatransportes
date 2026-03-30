import { useState, useEffect } from "react";
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
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Smoother and more subtle parallax values
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setParallax({ x, y });
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#0B1220] transition-opacity duration-1000"
      style={{ opacity: mounted ? 1 : 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
    >
      <style>{`
        @keyframes fadeZoom {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatMedium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes floatFast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 1; box-shadow: 0 0 10px rgba(20, 184, 166, 0.8); }
        }
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-entry {
          animation: fadeZoom 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Camada 1: Fundo distante (Gradiente Escuro + Grid Sutil) */}
      <div 
        className="absolute inset-0 opacity-40 transition-transform duration-300 ease-out"
        style={{
          background: "radial-gradient(circle at 50% 0%, #0c4a6e 0%, transparent 60%), radial-gradient(circle at 80% 80%, #064e3b 0%, transparent 50%)",
          transform: `translate3d(${parallax.x * -5}px, ${parallax.y * -5}px, 0)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-10 transition-transform duration-300 ease-out"
        style={{
          backgroundImage: "linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          transform: `translate3d(${parallax.x * -2}px, ${parallax.y * -2}px, 0)`,
        }}
      />

      {/* Camada 2: Gráfico animado (Medium layer) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[45vh] opacity-70 transition-transform duration-300 ease-out"
        style={{ transform: `translate3d(${parallax.x * 12}px, ${parallax.y * 8}px, 0)` }}
      >
        <svg viewBox="0 0 1200 400" className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(20, 184, 166, 0.1)" />
              <stop offset="50%" stopColor="rgba(20, 184, 166, 1)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 1)" />
            </linearGradient>
            <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(20, 184, 166, 0.25)" />
              <stop offset="100%" stopColor="rgba(20, 184, 166, 0)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Base Grid for Chart */}
          <g stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4">
            <line x1="0" y1="100" x2="1200" y2="100" />
            <line x1="0" y1="200" x2="1200" y2="200" />
            <line x1="0" y1="300" x2="1200" y2="300" />
          </g>

          <path
            d="M0,350 Q60,330 150,340 T300,280 T450,250 T600,160 T750,190 T900,100 T1050,130 T1200,60 L1200,400 L0,400 Z"
            fill="url(#fillGrad)"
            className="animate-[fadeZoom_2s_ease-out]"
          />
          <path
            d="M0,350 Q60,330 150,340 T300,280 T450,250 T600,160 T750,190 T900,100 T1050,130 T1200,60"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="3"
            filter="url(#glow)"
            strokeDasharray="2000"
            strokeDashoffset="2000"
            style={{ animation: "drawLine 3s ease-out forwards" }}
            strokeLinecap="round"
          />
          
          {/* Secondary subtle line */}
          <path
            d="M0,380 Q100,360 250,350 T500,300 T750,320 T1000,260 T1200,220"
            fill="none"
            stroke="rgba(56, 189, 248, 0.4)"
            strokeWidth="2"
            strokeDasharray="2000"
            strokeDashoffset="2000"
            style={{ animation: "drawLine 4s ease-out forwards" }}
            strokeLinecap="round"
          />

          <circle cx="300" cy="280" r="4" fill="#14B8A6" className="origin-center" style={{ animation: "pulseDot 3s infinite 0.5s" }} />
          <circle cx="600" cy="160" r="4" fill="#14B8A6" className="origin-center" style={{ animation: "pulseDot 3s infinite 1.5s" }} />
          <circle cx="900" cy="100" r="5" fill="#38BDF8" className="origin-center" style={{ animation: "pulseDot 3s infinite 2.5s" }} />
        </svg>
      </div>

      {/* Camada 3: Cards Flutuantes (Foreground layer) */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block overflow-hidden">
        {/* Card Receita */}
        <div 
          className="absolute top-[20%] left-[10%] w-64 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl transition-transform duration-200 ease-out"
          style={{ 
            animation: "floatSlow 8s ease-in-out infinite",
            transform: `translate3d(${parallax.x * 30}px, ${parallax.y * 20}px, 0)` 
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <p className="text-sm font-medium text-slate-300">Receita Estimada</p>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">R$ 184.200</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> +14,2% hoje
          </p>
        </div>

        {/* Card Caixa */}
        <div 
          className="absolute bottom-[25%] left-[15%] w-56 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl transition-transform duration-200 ease-out"
          style={{ 
            animation: "floatMedium 9s ease-in-out infinite 1s",
            transform: `translate3d(${parallax.x * 45}px, ${parallax.y * 35}px, 0)` 
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <p className="text-sm font-medium text-slate-300">Caixa Atual</p>
          </div>
          <p className="text-xl font-bold text-white tracking-tight">R$ 342.900</p>
        </div>

        {/* Card Despesas */}
        <div 
          className="absolute top-[35%] right-[10%] w-60 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl transition-transform duration-200 ease-out"
          style={{ 
            animation: "floatFast 10s ease-in-out infinite 2s",
            transform: `translate3d(${parallax.x * 25}px, ${parallax.y * 15}px, 0)` 
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 18 18M21 9v12H9"/></svg>
            </div>
            <p className="text-sm font-medium text-slate-300">Despesas (Mês)</p>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">R$ 68.450</p>
          <p className="text-xs text-rose-400 mt-1">-2.1% da meta</p>
        </div>
      </div>

      {/* Camada de Vignette e Blur central para destacar o login */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#0B1220_100%)] pointer-events-none" />

      {/* Camada 4: Card de Login (Centro) */}
      <div className="relative mx-auto flex min-h-screen w-full items-center justify-center px-4 py-10 lg:px-8">
        <section 
          className="w-full max-w-sm animate-entry z-10"
          style={{
            transform: `translate3d(${parallax.x * -10}px, ${parallax.y * -10}px, 0)`,
            transition: "transform 200ms ease-out"
          }}
        >
          <form 
            onSubmit={handleSubmit} 
            className="group relative space-y-5 rounded-2xl border border-white/10 bg-[#0B1220]/60 p-8 shadow-[0_0_50px_-12px_rgba(20,184,166,0.25)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_0_60px_-15px_rgba(20,184,166,0.35)] before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:box-shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
          >
            <div className="flex flex-col items-center gap-4 pb-4 text-center">
              <div className="relative flex h-16 w-auto items-center justify-center rounded-xl bg-white/5 p-3 ring-1 ring-white/10 backdrop-blur-sm">
                <img src="/almeida-logo.svg" alt="Almeida Transportes" className="h-10 w-auto" />
                <div className="absolute -inset-1 -z-10 rounded-xl bg-emerald-500/20 blur-xl opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Bem-vindo</h1>
                <p className="text-sm text-slate-400 mt-1">Acesse sua gestão financeira</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5 focus-within:text-emerald-400 transition-colors">
                <Label className="text-xs font-medium text-slate-300">Email corporativo</Label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="voce@almeidatransportes.com" 
                  className="h-11 bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all hover:bg-black/30"
                  autoFocus 
                />
              </div>
              <div className="space-y-1.5 focus-within:text-emerald-400 transition-colors">
                <Label className="text-xs font-medium text-slate-300 flex justify-between">
                  Senha
                  <a href="#" className="text-emerald-400 hover:text-emerald-300 hover:underline">Esqueceu?</a>
                </Label>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="h-11 bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all hover:bg-black/30"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="group relative w-full h-11 overflow-hidden rounded-lg bg-transparent text-white font-medium border-0 transition-transform active:scale-[0.98]" 
              disabled={loading}
            >
              <div 
                className="absolute inset-0 bg-[length:200%_auto] transition-all duration-500"
                style={{
                  backgroundImage: "linear-gradient(90deg, #0d9488 0%, #0369a1 50%, #0d9488 100%)",
                  animation: "gradientFlow 4s linear infinite"
                }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? "Aguarde..." : (
                  <>
                    Acessar painel
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </>
                )}
              </span>
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
