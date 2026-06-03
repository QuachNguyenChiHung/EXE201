import { useState, useMemo } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useApp } from '../../../context/AppContext';
import {
  SUBSCRIPTION_TIERS,
  SubscriptionTierLevel,
  CompositeWarehouse,
} from '../../../types';
import { Crown } from 'lucide-react';
import { toast } from 'sonner';

import { SubscriptionPricingGrid } from '../../components/owner/SubscriptionPricingGrid';
import { SubscriptionWarehouseList } from '../../components/owner/SubscriptionWarehouseList';
import { SubscriptionTierPicker } from '../../components/owner/SubscriptionTierPicker';
import { SubscriptionConfirmModal } from '../../components/owner/SubscriptionConfirmModal';

export default function SubscriptionManagement() {
  const { user: currentUser, warehouses: allWarehouses, updateWarehouse } = useApp();

  const myWarehouses = useMemo(
    () => allWarehouses.filter(w => w.id_owner === currentUser?.id_user),
    [allWarehouses, currentUser],
  );

  const [selectedWarehouse, setSelectedWarehouse] = useState<CompositeWarehouse | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<{
    warehouse: CompositeWarehouse;
    tier: SubscriptionTierLevel;
  } | null>(null);

  const handleUpgrade = async (warehouse: CompositeWarehouse, tier: SubscriptionTierLevel) => {
    setUpgrading(true);
    try {
      const updated: CompositeWarehouse = {
        ...warehouse,
        subscriptionTier: tier,
        update_at: new Date().toISOString(),
      };
      await updateWarehouse(warehouse.id_warehouse.toString(), updated);
      toast.success(
        `Đã nâng cấp "${warehouse.name}" lên gói ${SUBSCRIPTION_TIERS[tier].labelVi}!`,
      );
      setShowConfirm(null);
    } catch (err: any) {
      toast.error(err ?? 'Không thể nâng cấp. Vui lòng thử lại.');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="bento-container">
        {/* Header */}
        <div className="bento-header">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-[var(--color-accent)] flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
              Gói đăng ký
            </span>
          </div>
          <h1>Nâng cấp kho lạnh</h1>
          <p className="text-[var(--color-text-secondary)] mt-1 max-w-xl">
            Chọn gói phù hợp để tăng hiển thị kho lạnh của bạn trong kết quả tìm kiếm. Gói cao
            hơn = xếp hạng ưu tiên hơn.
          </p>
        </div>

        {/* Pricing grid */}
        <SubscriptionPricingGrid />

        {/* My warehouses + tier status */}
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-1">Kho lạnh của tôi</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Chọn kho để nâng cấp hoặc thay đổi gói đăng ký
          </p>
        </div>

        <SubscriptionWarehouseList
          warehouses={myWarehouses}
          onSelectWarehouse={setSelectedWarehouse}
        />

        {/* Tier upgrade picker for selected warehouse */}
        <SubscriptionTierPicker
          selectedWarehouse={selectedWarehouse}
          onClose={() => setSelectedWarehouse(null)}
          onSelectTier={(warehouse, tier) => setShowConfirm({ warehouse, tier })}
        />
      </div>

      {/* Confirmation modal */}
      <SubscriptionConfirmModal
        showConfirm={showConfirm}
        upgrading={upgrading}
        onClose={() => setShowConfirm(null)}
        onConfirm={() => showConfirm && handleUpgrade(showConfirm.warehouse, showConfirm.tier)}
      />

      <Footer />
    </div>
  );
}
