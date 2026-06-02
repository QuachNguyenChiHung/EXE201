import { Package, MessageSquare, Sparkles, TrendingUp } from "lucide-react";

interface TokenStats {
  totalConversations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalMessages: number;
}

interface RenterStatsProps {
  activeWarehouseCount: number;
  tokenStats: TokenStats;
}

export function RenterStats({ activeWarehouseCount, tokenStats }: RenterStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] mb-8">
      {[
        {
          label: "Tổng kho",
          value: activeWarehouseCount.toString(),
          icon: <Package className="h-5 w-5" />,
          color: "var(--color-primary)",
        },
        {
          label: "Phiên AI đã dùng",
          value: tokenStats.totalConversations.toString(),
          icon: <MessageSquare className="h-5 w-5" />,
          color: "var(--color-secondary)",
        },
        {
          label: "Token đã sử dụng",
          value: (tokenStats.totalInputTokens + tokenStats.totalOutputTokens).toLocaleString("vi-VN"),
          icon: <Sparkles className="h-5 w-5" />,
          color: "var(--color-accent, #f59e0b)",
        },
        {
          label: "Tin nhắn AI",
          value: tokenStats.totalMessages.toString(),
          icon: <TrendingUp className="h-5 w-5" />,
          color: "var(--color-success, #22c55e)",
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
            <p className="text-2xl font-extrabold">
              {s.value}
            </p>
          </div>
          <div
            className="w-10 h-10 flex items-center justify-center"
            style={{ background: s.color, color: "#fff" }}
          >
            {s.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
