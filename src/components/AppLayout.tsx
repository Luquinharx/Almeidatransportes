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
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        "fixed z-40 flex h-full w-64 flex-col bg-sidebar transition-all duration-300 lg:static lg:translate-x-0",
        collapsed ? "lg:w-20" : "lg:w-64",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className={cn("flex items-center px-4 py-5", collapsed ? "justify-center" : "justify-between") }>
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="/almeida-favicon.svg" alt="Almeida Transportes" className="h-10 w-10 rounded-lg" />
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold leading-tight text-sidebar-accent-foreground">Almeida Transportes</h1>
                <p className="text-[11px] text-sidebar-foreground">Gestão Financeira</p>
              </div>
            )}
          </div>

          <button
            className="rounded p-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            onClick={closeMobileMenu}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
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
      <main className="flex flex-1 flex-col overflow-auto">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b bg-card px-4 py-3 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <button
            className="hidden rounded p-1.5 text-foreground transition-colors hover:bg-secondary lg:inline-flex"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          <h2 className="truncate text-lg font-semibold text-foreground">
            {navItems.find(n => n.to === location.pathname)?.label ?? "Almeida Transportes"}
          </h2>
        </header>
        <div className="flex-1 p-3 sm:p-4 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
