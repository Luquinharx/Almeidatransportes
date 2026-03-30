import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Tag, CalendarClock, FileText, Menu, X, Fuel, HardHat, Users, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { to: "/asfalto", label: "Asfalto", icon: HardHat },
  { to: "/combustivel", label: "Combustível", icon: Fuel },
  { to: "/funcionarios", label: "Funcionários", icon: Users },
  { to: "/categorias", label: "Categorias", icon: Tag },
  { to: "/despesas-fixas", label: "Despesas Fixas", icon: CalendarClock },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  const closeMobileMenu = () => setOpen(false);

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* Mobile overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )} 
        onClick={() => setOpen(false)} 
      />

      {/* Sidebar */}
      <aside className={cn(
        "fixed z-40 flex h-full w-[280px] flex-col bg-sidebar shadow-2xl transition-all duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-none",
        collapsed ? "lg:w-20" : "lg:w-64",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className={cn("flex items-center justify-between px-5 py-6", collapsed && "lg:justify-center px-4") }>
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="/almeida-favicon.svg" alt="Almeida Transportes" className="h-10 w-10 rounded-lg shadow-sm" />
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-base font-extrabold tracking-tight leading-tight text-sidebar-accent-foreground">Almeida Transportes</h1>
                <p className="text-[11px] font-medium text-sidebar-primary/80 uppercase tracking-widest">Gestão Financeira</p>
              </div>
            )}
          </div>

          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent/50 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-white hover:rotate-90 active:scale-95 lg:hidden"
            onClick={closeMobileMenu}
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "lg:justify-center lg:px-2",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-5 w-5" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t px-3 py-3">
          <button
            onClick={logout}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
              collapsed && "lg:justify-center lg:px-2"
            )}
            title={collapsed ? "Sair" : undefined}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && "Sair"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-auto bg-slate-50/50">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border/50 bg-card/80 px-4 py-4 backdrop-blur-xl lg:justify-start lg:px-8">
          <div className="flex items-center gap-3">
            <button 
              className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary transition-all duration-300 hover:bg-primary/10 hover:shadow-sm active:scale-95 lg:hidden" 
              onClick={() => setOpen(true)} 
              aria-label="Abrir menu"
            >
              <div className="absolute inset-0 rounded-xl bg-primary/20 opacity-0 blur transition-opacity group-hover:opacity-100" />
              <Menu className="relative z-10 h-5 w-5 transition-transform group-hover:scale-110" />
            </button>
            <button
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:flex"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <h2 className="text-lg font-bold tracking-tight text-foreground lg:ml-2">
              {navItems.find(n => n.to === location.pathname)?.label ?? "Almeida Transportes"}
            </h2>
          </div>
          
          {/* Decorative element for mobile to balance the header (optional avatar/notification area) */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 text-secondary-foreground shadow-sm lg:hidden ring-1 ring-border border border-white">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
        </header>
        <div className="flex-1 p-3 sm:p-4 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
