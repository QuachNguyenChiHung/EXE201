import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { WarehouseCard } from "../WarehouseCard";
import type { CompositeWarehouse } from "../../../types";

interface FeaturedWarehousesProps {
  warehouses: CompositeWarehouse[];
}

export function FeaturedWarehouses({ warehouses }: FeaturedWarehousesProps) {
  const navigate = useNavigate();

  return (
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
          <WarehouseCard key={w.id_warehouse} warehouse={w} />
        ))}
      </div>
    </div>
  );
}
