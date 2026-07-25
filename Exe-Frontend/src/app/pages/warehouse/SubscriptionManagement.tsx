import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useApp } from '../../../context/AppContext';
import { useSearchParams } from 'react-router';
import {
  SUBSCRIPTION_TIERS,
  SubscriptionTierLevel,
  CompositeWarehouse,
  SponsorTierDTO
} from '../../../types';
import { Crown } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from "../../../utils/auth";
import { SubscriptionPricingGrid } from '../../components/owner/SubscriptionPricingGrid';
import { SubscriptionWarehouseList } from '../../components/owner/SubscriptionWarehouseList';
import { SubscriptionTierPicker } from '../../components/owner/SubscriptionTierPicker';
import { SubscriptionConfirmModal } from '../../components/owner/SubscriptionConfirmModal';
import { ownerService } from '../../../services/ownerService';

export default function SubscriptionManagement() {
  const user = getUser();

  const [myWarehouses, setMyWarehouses] = useState<CompositeWarehouse[]>([]);

  const [selectedWarehouse, setSelectedWarehouse] = useState<CompositeWarehouse | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [sponsorTiers, setSponsorTiers] = useState<SponsorTierDTO[]>([]);

  const [showConfirm, setShowConfirm] = useState<{
    warehouse: CompositeWarehouse;
    tier: SponsorTierDTO;
  } | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [paymentResult, setPaymentResult] = useState<'success' | 'fail' | null>(null);

  useEffect(() => {
    const status = searchParams.get('payment');
    if (status === 'success' || status === 'fail') {
      setPaymentResult(status);
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const backendTiers = await ownerService.getSponsorTiers();

        // Add "Free" default tier
        const freeTier: SponsorTierDTO = {
          id: 0,
          priorityLevel: 0,
          pricingPerMonth: 0,
          yearPackSale: 0,
          label: 'Mặc định (Miễn phí)',
          activeWarehousesCount: 0,
          isActive: true
        };

        setSponsorTiers([freeTier, ...backendTiers]);
      } catch (err) {
        // silent
      }
    };

    const fetchWarehouses = async () => {
      try {
        const response = await ownerService.getMyWarehouses(0, 100);
        setMyWarehouses(response.content || []);
      } catch (err) {
        // silent
      }
    };

    fetchTiers();
    fetchWarehouses();
  }, []);

  const handleUpgrade = async (warehouse: CompositeWarehouse, tier: SponsorTierDTO) => {
    setUpgrading(true);
    try {
      if (tier.id === 0) {
        await ownerService.cancelSponsorTier(warehouse.id_warehouse);
        toast.success(`Đã hủy gói đăng ký cho kho "${warehouse.name}"`);
        setShowConfirm(null);
        setSelectedWarehouse(null);
        const response = await ownerService.getMyWarehouses(0, 100);
        setMyWarehouses(response.content || []);
      } else {
        const res = await ownerService.buySponsorTier(warehouse.id_warehouse, tier.id);
        if (res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else {
          toast.success(`Đã nâng cấp "${warehouse.name}" lên ${tier.label}!`);
          setShowConfirm(null);
          setSelectedWarehouse(null);
          const response = await ownerService.getMyWarehouses(0, 100);
          setMyWarehouses(response.content || []);
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể nâng cấp. Vui lòng thử lại.');
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
            <br />
            <span className="text-xs italic mt-1 inline-block">
              *Lưu ý: Kho lạnh chỉ được ưu tiên hiển thị khi thông tin kho phù hợp với các tiêu chí tìm kiếm của người dùng.
            </span>
          </p>
        </div>

        {/* Pricing grid */}
        <SubscriptionPricingGrid sponsorTiers={sponsorTiers} />

        {/* My warehouses + tier status */}
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-1">Kho lạnh của tôi</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Chọn kho để nâng cấp hoặc thay đổi gói đăng ký
          </p>
        </div>

        <SubscriptionWarehouseList
          warehouses={myWarehouses}
          sponsorTiers={sponsorTiers}
          onSelectWarehouse={setSelectedWarehouse}
        />

        {/* Tier upgrade picker for selected warehouse */}
        <SubscriptionTierPicker
          sponsorTiers={sponsorTiers}
          selectedWarehouse={selectedWarehouse}
          onClose={() => setSelectedWarehouse(null)}
          onSelectTier={(warehouse, tier) => setShowConfirm({ warehouse, tier })}
        />
      </div>

      {/* Confirmation modal */}
      <SubscriptionConfirmModal
        sponsorTiers={sponsorTiers}
        showConfirm={showConfirm}
        upgrading={upgrading}
        onClose={() => setShowConfirm(null)}
        onConfirm={() => showConfirm && handleUpgrade(showConfirm.warehouse, showConfirm.tier)}
      />

      {/* Payment Result Modal */}
      {paymentResult && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 'var(--z-modal-overlay)', background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-sm text-center p-6">
            {paymentResult === 'success' ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Thanh toán thành công!</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">Gói đăng ký của bạn đã được cập nhật thành công.</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Thanh toán thất bại</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">Giao dịch đã bị huỷ hoặc có lỗi xảy ra. Vui lòng thử lại.</p>
              </>
            )}
            <button
              onClick={() => setPaymentResult(null)}
              className="bg-[var(--color-primary)] text-white px-6 py-2 w-full hover:bg-[var(--color-primary-dark)]"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
