import React from "react";
import { Warehouse, TrendingUp, Package } from "lucide-react";

interface WarehouseDashboardStatsProps {
  totalWarehouses: number;
  totalCapacity: number;
  totalAvailable: number;
  occupancyRate: string;
}

export function WarehouseDashboardStats({
  totalWarehouses,
  totalCapacity,
  totalAvailable,
  occupancyRate,
}: WarehouseDashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)] mb-8">
      {[
        {
          label: "Tổng kho",
          value: totalWarehouses,
          icon: <Warehouse className="h-5 w-5" />,
          color: "var(--color-primary)",
        },
        {
          label: "Tổng công suất",
          value: `${totalCapacity.toLocaleString()} m³`,
          icon: <Package className="h-5 w-5" />,
          color: "var(--color-secondary)",
        },
        {
          label: "Còn trống",
          value: `${totalAvailable.toLocaleString()} m³`,
          icon: <TrendingUp className="h-5 w-5" />,
          color: "var(--color-success)",
        },
        {
          label: "Tỷ lệ lấp đầy",
          value: `${occupancyRate}%`,
          icon: <TrendingUp className="h-5 w-5" />,
          color: "var(--color-warning)",
        },
      ].map((s) => (
        <div
          key={s.label}
          className="bg-[var(--color-surface)] p-6 flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
              {s.label}
            </p>
            <p className="text-2xl font-extrabold">{s.value}</p>
          </div>
          <div
            className="w-10 h-10 flex items-center justify-center text-white"
            style={{ background: s.color }}
          >
            {s.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
