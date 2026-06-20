import { Link } from "react-router";
import { Package, MessageSquare, Sparkles, TrendingUp, DollarSign, Calendar, Zap, AlertCircle } from "lucide-react";
import { RenterStatisticResponseDTO } from "../../../services/renterService";

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
}

interface RenterStatsProps {
  stats: RenterStatisticResponseDTO;
}

export function RenterStats({ stats }: RenterStatsProps) {
  const statsList: StatItem[] = [
    {
      label: "Hợp đồng hoạt động",
      value: stats.totalActiveContract.toString(),
      icon: <Package className="h-5 w-5" />,
      color: "var(--color-primary)",
    },
    {
      label: "Kho đang thuê",
      value: stats.totalWarehouseWithActiveContract.toString(),
      icon: <Sparkles className="h-5 w-5" />,
      color: "var(--color-secondary)",
    },
    {
      label: "Yêu cầu thuê",
      value: stats.totalRentRequest.toString(),
      icon: <MessageSquare className="h-5 w-5" />,
      color: "var(--color-info, #3b82f6)",
    },
    {
      label: "Gói AI hiện tại",
      value: stats.aiSubscriptionInUse === 'Default' ? 'Cơ bản' : stats.aiSubscriptionInUse,
      icon: <Zap className="h-5 w-5" />,
      color: "var(--color-warning, #f59e0b)",
      href: "/renter/ai-subscription",
    },
    {
      label: "Phiên AI đã dùng",
      value: stats.totalAiConversation.toString(),
      icon: <TrendingUp className="h-5 w-5" />,
      color: "var(--color-success, #22c55e)",
    },
    {
      label: "Token đã sử dụng",
      value: stats.totalTokenUsage.toLocaleString("vi-VN"),
      icon: <Sparkles className="h-5 w-5" />,
      color: "var(--color-error, #ef4444)",
    },
    {
      label: "Tổng chi phí",
      value: stats.totalBilling.toLocaleString("vi-VN") + "đ",
      icon: <DollarSign className="h-5 w-5" />,
      color: "var(--color-accent, #8b5cf6)",
    },
    {
      label: "Sắp hết hạn HĐ",
      value: stats.endOfContract.toString(),
      icon: <Calendar className="h-5 w-5" />,
      color: "var(--color-danger, #f43f5e)",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] mb-8">
      {statsList.map((s) => (
        <div
          key={s.label}
          className="bg-[var(--color-surface)] p-6 flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
              {s.label}
            </p>
            {s.href ? (
              <Link
                to={s.href}
                className="text-2xl font-extrabold truncate max-w-[120px] text-[var(--color-primary)] hover:underline"
                title={s.value}
              >
                {s.value}
              </Link>
            ) : (
              <p className="text-2xl font-extrabold truncate max-w-[120px]" title={s.value}>
                {s.value}
              </p>
            )}
          </div>
          <div
            className="w-10 h-10 flex items-center justify-center shrink-0"
            style={{ background: s.color, color: "#fff" }}
          >
            {s.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
