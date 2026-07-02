import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { getUser } from "../../../utils/auth";
import { aiAPI } from "../../../services/apiClient";
import type { CompositeWarehouse } from "../../../types";
import { RenterQuickActions } from "../../components/renter/RenterQuickActions";
import { RenterStats } from "../../components/renter/RenterStats";
import { FeaturedWarehouses } from "../../components/renter/FeaturedWarehouses";
import { renterService, RenterStatisticResponseDTO } from "../../../services/renterService";

export default function RenterDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [warehouses, setWarehouses] = useState<CompositeWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RenterStatisticResponseDTO | null>(null);

  useEffect(() => {
    if (!user || user.role !== "RENTER") {
      navigate("/login");
      return;
    }

    Promise.all([
      renterService.getPopularWarehouses(0, 4),
      renterService.getDashboardStatistics(30)
    ]).then(([activeWhsData, fetchedStats]) => {
      setWarehouses(activeWhsData.content);
      setStats(fetchedStats);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [user?.email, user?.role, navigate]);

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

  // Stats are now fully fetched from backend, so we don't need activeWarehouseCount manually here
  // We can pass the array directly since the endpoint already filters active warehouses.

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
        {stats && <RenterStats stats={stats} />}

        {/* Featured warehouses */}
        <FeaturedWarehouses warehouses={warehouses} />
      </div>
      <Footer />
    </div>
  );
}