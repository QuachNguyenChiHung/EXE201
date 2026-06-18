import React from "react";
import { Plus, Warehouse, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router";

export function WarehouseDashboardActions() {
  const navigate = useNavigate();

  return (
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
          title: "Yêu cầu thuê",
          desc: "Xem danh sách yêu cầu thuê kho của bạn",
          path: "/warehouse/requests",
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
  );
}
