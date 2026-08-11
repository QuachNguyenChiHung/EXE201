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
import { Crown, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from "../../../utils/auth";
import { SubscriptionPricingGrid } from '../../components/owner/SubscriptionPricingGrid';
import { SubscriptionWarehouseList } from '../../components/owner/SubscriptionWarehouseList';
import { SubscriptionTierPicker } from '../../components/owner/SubscriptionTierPicker';
import { SubscriptionConfirmModal } from '../../components/owner/SubscriptionConfirmModal';
import { ownerService } from '../../../services/ownerService';
import type { SponsorRenewal } from '../../../types/public';

export default function SubscriptionManagement() {
  const user = getUser();

  const [myWarehouses, setMyWarehouses] = useState<CompositeWarehouse[]>([]);

  const [selectedWarehouse, setSelectedWarehouse] = useState<CompositeWarehouse | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [sponsorTiers, setSponsorTiers] = useState<SponsorTierDTO[]>([]);
  const [sponsorRenewals, setSponsorRenewals] = useState<SponsorRenewal[]>([]);

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

    const fetchRenewals = async () => {
      try {
        const renewals = await ownerService.getSponsorRenewals();
        setSponsorRenewals(renewals);
      } catch (err) {
        // silent
      }
    };

    fetchTiers();
    fetchWarehouses();
    fetchRenewals();
  }, []);

  const refreshWarehouses = async () => {
    const [response, renewals] = await Promise.all([
      ownerService.getMyWarehouses(0, 100),
      ownerService.getSponsorRenewals(),
    ]);
    setMyWarehouses(response.content || []);
    setSponsorRenewals(renewals);
  };

  // A warehouse's currently chosen sponsor tier stopped actually billing (the
  // owner never auto-loses the ranking boost, but the tier needs renewing to
  // keep paying for it going forward).
  const isLapsed = (warehouse: CompositeWarehouse) =>
    sponsorRenewals.some(r => r.warehouseId === warehouse.id_warehouse);

  // A different, still-billing sponsor tier is already active on this warehouse —
  // picking another real tier should schedule the switch rather than charge now.
  const willScheduleFor = (warehouse: CompositeWarehouse, tier: SponsorTierDTO) =>
    !!warehouse.isSponsor && tier.id !== 0 && !isLapsed(warehouse);

  const handleUpgrade = async (warehouse: CompositeWarehouse, tier: SponsorTierDTO, force: boolean = false) => {
    setUpgrading(true);
    try {
      if (tier.id === 0) {
        await ownerService.cancelSponsorTier(warehouse.id_warehouse);
        toast.success(`Đã hủy gói đăng ký cho kho "${warehouse.name}"`);
        setShowConfirm(null);
        setSelectedWarehouse(null);
        await refreshWarehouses();
      } else {
        const willSchedule = !force && willScheduleFor(warehouse, tier);
        const res = await ownerService.buySponsorTier(warehouse.id_warehouse, tier.id, force);
        if (res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else if (willSchedule) {
          toast.success(`Đã lên lịch chuyển kho "${warehouse.name}" sang ${tier.label} — sẽ được thanh toán và áp dụng khi gói hiện tại kết thúc.`);
          setShowConfirm(null);
          setSelectedWarehouse(null);
          await refreshWarehouses();
        } else {
          toast.success(`Đã nâng cấp "${warehouse.name}" lên ${tier.label}!`);
          setShowConfirm(null);
          setSelectedWarehouse(null);
          await refreshWarehouses();
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

        {sponsorRenewals.length > 0 && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 flex items-start gap-3">
            <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-600 space-y-1">
              <p>
                {sponsorRenewals.length === 1
                  ? `Gói tài trợ của kho "${sponsorRenewals[0].warehouseName}" đã hết hạn — hãy gia hạn để tiếp tục được ưu tiên hiển thị.`
                  : `${sponsorRenewals.length} kho có gói tài trợ đã hết hạn — hãy gia hạn để tiếp tục được ưu tiên hiển thị:`}
              </p>
              {sponsorRenewals.length > 1 && (
                <ul className="list-disc list-inside">
                  {sponsorRenewals.map(r => (
                    <li key={r.warehouseId}>{r.warehouseName}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

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
          isLapsed={!!selectedWarehouse && isLapsed(selectedWarehouse)}
          onClose={() => setSelectedWarehouse(null)}
          onSelectTier={(warehouse, tier) => setShowConfirm({ warehouse, tier })}
        />
      </div>

      {/* Confirmation modal */}
      <SubscriptionConfirmModal
        sponsorTiers={sponsorTiers}
        showConfirm={showConfirm}
        upgrading={upgrading}
        willSchedule={!!showConfirm && willScheduleFor(showConfirm.warehouse, showConfirm.tier)}
        onClose={() => setShowConfirm(null)}
        onConfirm={() => showConfirm && handleUpgrade(showConfirm.warehouse, showConfirm.tier, false)}
        onForceConfirm={() => showConfirm && handleUpgrade(showConfirm.warehouse, showConfirm.tier, true)}
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
