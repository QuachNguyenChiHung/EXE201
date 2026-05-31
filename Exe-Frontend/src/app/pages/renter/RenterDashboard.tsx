import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { getUser } from "../../../utils/auth";
import { warehousesAPI, aiAPI } from "../../../services/apiClient";
import { Button } from "../../components/ui/button";
import { WarehouseCard } from "../../components/WarehouseCard";
import {
  Search,
  Sparkles,
  TrendingUp,
  Package,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import type { ColdStorage } from "../../../types";

export default function RenterDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [warehouses, setWarehouses] = useState<ColdStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenStats, setTokenStats] = useState<{
    totalConversations: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalMessages: number;
  }>({ totalConversations: 0, totalInputTokens: 0, totalOutputTokens: 0, totalMessages: 0 });

  useEffect(() => {
    if (!user || user.role !== "renter") {
      navigate("/login");
      return;
    }

    Promise.all([
      warehousesAPI.getAll(),
      user?.id_user ? aiAPI.getConversationsByUser(user.id_user) : Promise.resolve([])
    ]).then(([whs, convs]) => {
      setWarehouses(whs);
      const stats = convs.reduce(
        (acc, c) => ({
          totalConversations: acc.totalConversations + 1,
          totalInputTokens: acc.totalInputTokens + (c.totalInputTokens ?? 0),
          totalOutputTokens: acc.totalOutputTokens + (c.totalOutputTokens ?? 0),
          totalMessages: acc.totalMessages + c.messages.length,
        }),
        { totalConversations: 0, totalInputTokens: 0, totalOutputTokens: 0, totalMessages: 0 },
      );
      setTokenStats(stats);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load dashboard:', err);
      setLoading(false);
    });
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[var(--color-primary)] border-t-transparent animate-spin mx-auto" />
            <p className="mt-4 text-[var(--color-text-secondary)] text-sm">
              Đang tải...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="bento-container">
        {/* Header */}
        <div className="bento-header">
          <h1>Xin chào, {user?.name}!</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Chào mừng trở lại với Logicha
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--color-border)] mb-8">
          {/* Traditional search */}
          <button
            onClick={() => navigate("/renter/search")}
            className="bg-[var(--color-surface)] p-8 text-left hover:bg-[var(--color-primary-50)] transition-colors group"
          >
            <div className="w-12 h-12 bg-[var(--color-primary)] flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 group-hover:text-[var(--color-primary)] transition-colors">
              Tìm kiếm truyền thống
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-5">
              Sử dụng bộ lọc chi tiết để tìm kho lạnh phù hợp
            </p>
            <span className="inline-block bg-[var(--color-primary)] text-white text-sm px-4 py-2">
              Bắt đầu tìm kiếm →
            </span>
          </button>

          {/* AI search */}
          <button
            onClick={() => navigate("/renter/ai-search")}
            className="bg-[var(--color-text)] p-8 text-left hover:bg-[var(--color-primary-900)] transition-colors group"
          >
            <div className="w-12 h-12 bg-[var(--color-primary)] flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2" style={{ color: "white" }}>
              Tìm kiếm bằng AI
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              Mô tả nhu cầu của bạn bằng ngôn ngữ tự nhiên
            </p>
            <span className="inline-block bg-[var(--color-primary)] text-white text-sm px-4 py-2">
              Thử AI Search →
            </span>
          </button>

          {/* Rented properties */}
          <button
            onClick={() => navigate("/renter/rented")}
            className="bg-[var(--color-surface)] p-8 text-left hover:bg-[var(--color-primary-50)] transition-colors group border-t border-[var(--color-border)] md:border-t-0"
          >
            <div className="w-12 h-12 bg-[var(--color-secondary)] flex items-center justify-center mb-4">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 group-hover:text-[var(--color-secondary)] transition-colors">
              Kho đang thuê
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-5">
              Xem và quản lý các hợp đồng thuê kho hiện tại
            </p>
            <span className="inline-block bg-[var(--color-secondary)] text-white text-sm px-4 py-2">
              Quản lý hợp đồng →
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] mb-8">
          {[
            {
              label: "Tổng kho",
              value: warehouses.filter(w => w.status === 'active').length.toString(),
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

        {/* Featured warehouses */}
        <div className="bento-section">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2>Kho lạnh nổi bật</h2>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                Các kho lạnh phổ biến và đáng tin cậy
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-none border border-[var(--color-border)] hover:border-[var(--color-primary)]"
              onClick={() => navigate("/renter/search")}
            >
              Xem tất cả
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
            {warehouses.filter(w => w.status === 'active').slice(0, 6).map((w) => (
              <WarehouseCard key={w.id} warehouse={w} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}