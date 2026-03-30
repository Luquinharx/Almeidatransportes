import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant?: "income" | "expense" | "primary" | "pending";
}

export default function KpiCard({ title, value, icon: Icon, variant = "primary" }: KpiCardProps) {
  return (
    <div className="rounded-xl bg-card p-5 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-card-foreground">{value}</p>
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          variant === "income" && "gradient-income",
          variant === "expense" && "gradient-expense",
          variant === "primary" && "gradient-primary",
          variant === "pending" && "gradient-pending",
        )}>
          <Icon className={cn(
            "h-6 w-6",
            variant === "income" && "text-income-foreground",
            variant === "expense" && "text-expense-foreground",
            variant === "primary" && "text-primary-foreground",
            variant === "pending" && "text-pending-foreground",
          )} />
        </div>
      </div>
    </div>
  );
}
