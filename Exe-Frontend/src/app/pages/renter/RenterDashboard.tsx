import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { getUser } from "../../../utils/auth";
import { warehousesAPI, aiAPI } from "../../../services/apiClient";
import type { CompositeWarehouse } from "../../../types";
import { RenterQuickActions } from "../../components/renter/RenterQuickActions";
import { RenterStats } from "../../components/renter/RenterStats";
import { FeaturedWarehouses } from "../../components/renter/FeaturedWarehouses";

export default function RenterDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [warehouses, setWarehouses] = useState<CompositeWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenStats, setTokenStats] = useState<{
    totalConversations: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalMessages: number;
  }>({ totalConversations: 0, totalInputTokens: 0, totalOutputTokens: 0, totalMessages: 0 });

  useEffect(() => {
    if (!user || user.role !== "RENTER") {
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
          totalInputTokens: acc.totalInputTokens + (c.total_input_tokens ?? 0),
          totalOutputTokens: acc.totalOutputTokens + (c.total_output_tokens ?? 0),
          totalMessages: acc.totalMessages + (Array.isArray(c.message) ? c.message.length : 0),
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

  const activeWarehouseCount = warehouses.filter(w => w.status === 'active').length;

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
        <RenterQuickActions />

        {/* Stats */}
        <RenterStats 
          activeWarehouseCount={activeWarehouseCount} 
          tokenStats={tokenStats} 
        />

        {/* Featured warehouses */}
        <FeaturedWarehouses warehouses={warehouses} />
      </div>
      <Footer />
    </div>
  );
}