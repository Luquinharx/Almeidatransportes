import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  valueColor?: "green" | "red" | "black" | "default";
}

export default function KpiCard({ title, value, icon: Icon, valueColor = "default" }: KpiCardProps) {
  return (
    <div className="rounded-xl bg-card p-5 shadow-sm border transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "mt-1 text-2xl font-bold",
            valueColor === "green" && "text-emerald-500",
            valueColor === "red" && "text-rose-500",
            valueColor === "black" && "text-foreground",
            valueColor === "default" && "text-card-foreground"
          )}>{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
