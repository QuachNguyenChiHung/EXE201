import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { getUser } from "../../../utils/auth";
import { warehousesAPI } from "../../../services/apiClient";
import { Button } from "../../components/ui/button";
import {
  Plus,
  Warehouse,
  TrendingUp,
  Package,
} from "lucide-react";
import type { ColdStorage } from "../../../types";

export default function WarehouseDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [allWarehouses, setAllWarehouses] = useState<ColdStorage[]>([]);

  useEffect(() => {
    if (!user || user.role !== "warehouse") {
      navigate("/login");
      return;
    }

    warehousesAPI.getAll().then(setAllWarehouses).catch(err => {
      console.error('Failed to load warehouses:', err);
    });
  }, [user, navigate]);

  const warehouses = allWarehouses.filter((w) => w.ownerId === user?.id);

  const totalCapacity = warehouses.reduce(
    (s, w) => s + w.stats.totalCapacity,
    0,
  );
  const totalAvailable = warehouses.reduce(
    (s, w) => s + w.stats.availableCapacity,
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)] mb-8">
          {[
            {
              label: "Tổng kho",
              value: warehouses.length,
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
                <p className="text-2xl font-extrabold">
                  {s.value}
                </p>
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

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--color-border)] mb-8">
          {[
            {
              icon: <Plus className="h-7 w-7" />,
              color: "var(--color-primary)",
              title: "Thêm kho mới",
              desc: "Đăng ký kho lạnh mới lên nền tảng",
              path: "/warehouse/add",
            },
            {
              icon: <Warehouse className="h-7 w-7" />,
              color: "var(--color-secondary)",
              title: "Quản lý kho",
              desc: "Xem và chỉnh sửa thông tin kho lạnh",
              path: "/warehouse/my-warehouses",
            },
            {
              icon: <TrendingUp className="h-7 w-7" />,
              color: "var(--color-warning)",
              title: "Báo cáo",
              desc: "Xem thống kê và báo cáo chi tiết",
              path: null,
            },
          ].map((a) => (
            <button
              key={a.title}
              onClick={() => a.path && navigate(a.path)}
              className="bg-[var(--color-surface)] p-6 text-left hover:bg-[var(--color-primary-50)] transition-colors group"
            >
              <div
                className="w-12 h-12 flex items-center justify-center text-white mb-4"
                style={{ background: a.color }}
              >
                {a.icon}
              </div>
              <h3 className="mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                {a.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {a.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Warehouse list */}
        {warehouses.length > 0 ? (
          <div>
            <h2 className="mb-6">Kho lạnh của bạn</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map((w) => (
                <div
                  key={w.id}
                  className="bg-[var(--color-surface)] overflow-hidden"
                >
                  <div className="aspect-video bg-[var(--color-primary-100)] flex items-center justify-center overflow-hidden">
                    {w.images && w.images.length > 0 ? (
                      <img
                        src={w.images[0]}
                        alt={w.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Warehouse className="h-12 w-12 text-[var(--color-primary-300)]" />
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="mb-1">{w.name}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {w.location.city}, {w.location.province}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">
                          Công suất:
                        </span>
                        <span>{w.stats.totalCapacity} m³</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">
                          Còn trống:
                        </span>
                        <span className="text-[var(--color-success)]">
                          {w.stats.availableCapacity} m³
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full rounded-none border border-[var(--color-border)] hover:border-[var(--color-primary)]"
                      onClick={() =>
                        navigate(`/warehouse/edit/${w.id}`)
                      }
                    >
                      Chỉnh sửa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-12 text-center">
            <div className="w-16 h-16 bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-4">
              <Warehouse className="h-8 w-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="mb-2">Chưa có kho lạnh nào</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
              Bắt đầu bằng cách thêm kho lạnh đầu tiên của bạn
            </p>
            <Button
              onClick={() => navigate("/warehouse/add")}
              className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm kho mới
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}