import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { getUser } from "../../../utils/auth";
import { warehousesAPI } from "../../../services/apiClient";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import type { CompositeWarehouse } from "../../../types";
import { WarehouseDashboardStats } from "../../components/owner/WarehouseDashboardStats";
import { WarehouseDashboardActions } from "../../components/owner/WarehouseDashboardActions";
import { WarehouseDashboardList } from "../../components/owner/WarehouseDashboardList";

export default function WarehouseDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [allWarehouses, setAllWarehouses] = useState<CompositeWarehouse[]>([]);

  useEffect(() => {
    if (!user || user.role !== "warehouse") {
      navigate("/login");
      return;
    }

    warehousesAPI.getAll().then(setAllWarehouses).catch(err => {
      console.error('Failed to load warehouses:', err);
    });
  }, [user, navigate]);

  const warehouses = allWarehouses.filter((w) => w.id_owner === user?.id_user);

  const totalCapacity = warehouses.reduce(
    (s, w) => s + (w.sections?.reduce((secSum, sec) => secSum + (sec.total_capacity || 0), 0) || 0),
    0,
  );
  const totalAvailable = warehouses.reduce(
    (s, w) => s + (w.sections?.reduce((secSum, sec) => secSum + (sec.available_capacity || 0), 0) || 0),
    0,
  );
  const occupancyRate =
    totalCapacity > 0
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
          totalWarehouses={warehouses.length}
          totalCapacity={totalCapacity}
          totalAvailable={totalAvailable}
          occupancyRate={occupancyRate}
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
