import React from "react";
import { CompositeContract } from "../../../types";
import {
  Edit3,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";

export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);

export const fmtDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

export const STATUS_CFG: Record<
  CompositeContract["status"],
  {
    label: string;
    color: string;
    icon: React.ReactNode;
  }
> = {
  draft: {
    label: "Bản nháp",
    color: "var(--color-text-muted)",
    icon: <Edit3 className="h-3.5 w-3.5" />,
  },
  pending_renter: {
    label: "Chờ người thuê ký",
    color: "#f59e0b",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  active: {
    label: "Đang hiệu lực",
    color: "var(--color-success, #22c55e)",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  expiring_soon: {
    label: "Sắp hết hạn",
    color: "#f97316",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  expired: {
    label: "Đã hết hạn",
    color: "var(--color-text-muted)",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Đã huỷ",
    color: "var(--color-error, #ef4444)",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};
