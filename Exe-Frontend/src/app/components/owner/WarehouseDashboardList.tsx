import React from "react";
import { Plus, Warehouse } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import type { CompositeWarehouse } from "../../../types";
import { formatShortAddress } from "../../utils/addressFormat";
import { SponsorBadge } from "../SubscriptionTierBadge";

interface WarehouseDashboardListProps {
  warehouses: CompositeWarehouse[];
}

export function WarehouseDashboardList({ warehouses }: WarehouseDashboardListProps) {
  const navigate = useNavigate();

  if (warehouses.length === 0) {
    return (
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
    );
  }

  return (
    <div>
      <h2 className="mb-6">Kho lạnh của bạn</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((w) => (
          <div
            key={w.id_warehouse}
            className="bg-[var(--color-surface)] overflow-hidden"
          >
            <div className="aspect-video bg-[var(--color-primary-100)] flex items-center justify-center overflow-hidden">
              {w.images && w.images.length > 0 ? (
                <img
                  src={
                    typeof w.images[0] === "string"
                      ? w.images[0]
                      : (w.images[0] as any).image_url
                  }
                  alt={w.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Warehouse className="h-12 w-12 text-[var(--color-primary-300)]" />
              )}
            </div>
            <div className="p-5 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="">{w.name}</h3>
                <SponsorBadge sponsorType={w.sponsor_type} size="sm" label={w.sponsorTierLabel} />
              </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {formatShortAddress({
                    province: w.location_province,
                    commune: w.location_commune,
                    locationAddressText: w.location_address_text,
                  })}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">
                    Công suất:
                  </span>
                  <span>
                    {w.sections?.reduce(
                      (s, sec) => s + (sec.total_capacity || 0),
                      0
                    ) || 0}{" "}
                    m³
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">
                    Còn trống:
                  </span>
                  <span className="text-[var(--color-success)]">
                    {w.sections?.reduce(
                      (s, sec) => s + (sec.available_capacity || 0),
                      0
                    ) || 0}{" "}
                    m³
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-none border border-[var(--color-border)] hover:border-[var(--color-primary)]"
                  onClick={() => navigate(`/warehouse/detail/${w.id_warehouse}`)}
                >
                  Chi tiết
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-none border border-[var(--color-border)] hover:border-[var(--color-primary)]"
                  onClick={() => navigate(`/warehouse/edit/${w.id_warehouse}`)}
                >
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
