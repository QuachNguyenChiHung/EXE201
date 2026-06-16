import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { getUser } from "../../../utils/auth";

import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import type { CompositeWarehouse } from "../../../types";
import { WarehouseDashboardStats } from "../../components/owner/WarehouseDashboardStats";
import { WarehouseDashboardActions } from "../../components/owner/WarehouseDashboardActions";
import { WarehouseDashboardList } from "../../components/owner/WarehouseDashboardList";
import { ownerService, OwnerStatisticResponseDTO } from "../../../services/ownerService";

export default function WarehouseDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [warehouses, setWarehouses] = useState<CompositeWarehouse[]>([]);
  const [ownerStats, setOwnerStats] = useState<OwnerStatisticResponseDTO | null>(null);

  useEffect(() => {
    if (!user || user.role !== "OWNER") {
      navigate("/login");
      return;
    }

    ownerService.getMyWarehouses(0, 10, 'all').then(res => setWarehouses(res.content)).catch(err => {
      console.error('Failed to load warehouses:', err);
    });

    ownerService.getOwnerStatistics().then(setOwnerStats).catch(err => {
      console.error('Failed to load owner statistics:', err);
    });
  }, [user?.role, navigate]);



  const totalCapacity = ownerStats?.totalCapacity ?? warehouses.reduce(
    (s, w) => s + (w.sections?.reduce((secSum, sec) => secSum + (sec.total_capacity || 0), 0) || 0),
    0,
  );
  const totalAvailable = ownerStats?.totalAvailable ?? warehouses.reduce(
    (s, w) => s + (w.sections?.reduce((secSum, sec) => secSum + (sec.available_capacity || 0), 0) || 0),
    0,
  );
  const occupancyRate = ownerStats?.occupancyRate !== undefined
    ? ownerStats.occupancyRate.toFixed(1)
    : totalCapacity > 0
      ? (
        ((totalCapacity - totalAvailable) / totalCapacity) *
        100
      ).toFixed(1)
      : "0";

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="bento-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1>Xin chào, {user?.name}!</h1>
          </div>
          <Button
            onClick={() => navigate("/warehouse/add")}
            className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm kho mới
          </Button>
        </div>

        {/* Stats */}
        <WarehouseDashboardStats
          totalWarehouses={ownerStats?.totalWarehouses ?? warehouses.length}
          totalCapacity={totalCapacity}
          totalAvailable={totalAvailable}
          occupancyRate={occupancyRate}
          totalPendingRentRequests={ownerStats?.totalPendingRentRequests ?? 0}
          totalActiveContract={ownerStats?.totalActiveContract ?? 0}
          billingThisMonth={ownerStats?.billingThisMonth ?? 0}
          endingContract={ownerStats?.endingContract ?? 0}
        />

        {/* Quick actions */}
        <WarehouseDashboardActions />

        {/* Warehouse list */}
        <WarehouseDashboardList warehouses={warehouses} />
      </div>
      <Footer />
    </div>
  );
}
