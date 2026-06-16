import React, { useState } from "react";
import { Warehouse, TrendingUp, Package, FileText, ClipboardList, AlertTriangle, DollarSign, Eye, EyeOff } from "lucide-react";

interface WarehouseDashboardStatsProps {
  totalWarehouses: number;
  totalCapacity: number;
  totalAvailable: number;
  occupancyRate: string;
  totalPendingRentRequests: number;
  totalActiveContract: number;
  billingThisMonth: number;
  endingContract: number;
}

export function WarehouseDashboardStats({
  totalWarehouses,
  totalCapacity,
  totalAvailable,
  occupancyRate,
  totalPendingRentRequests,
  totalActiveContract,
  billingThisMonth,
  endingContract,
}: WarehouseDashboardStatsProps) {
  const [showBilling, setShowBilling] = useState(false);

  const stats = [
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
    {
      label: "Yêu cầu chờ duyệt",
      value: totalPendingRentRequests,
      icon: <FileText className="h-5 w-5" />,
      color: "#3b82f6", // var(--color-info)
    },
    {
      label: "HĐ đang hoạt động",
      value: totalActiveContract,
      icon: <ClipboardList className="h-5 w-5" />,
      color: "var(--color-success)",
    },
    {
      label: "HĐ sắp hết hạn",
      value: endingContract,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "#ef4444", // var(--color-danger)
    },
    {
      label: "Tiền mua gói (tháng)",
      value: showBilling ? `${billingThisMonth.toLocaleString()} VNĐ` : "****** VNĐ",
      icon: <DollarSign className="h-5 w-5" />,
      color: "#f59e0b", // var(--color-warning alt)
      action: (
        <button
          onClick={() => setShowBilling(!showBilling)}
          className="ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors inline-flex items-center justify-center"
          title={showBilling ? "Ẩn số tiền" : "Hiện số tiền"}
        >
          {showBilling ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)] mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-[var(--color-surface)] p-6 flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
              {s.label}
            </p>
            <div className="flex items-center">
              <p className="text-2xl font-extrabold">{s.value}</p>
              {s.action && s.action}
            </div>
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
