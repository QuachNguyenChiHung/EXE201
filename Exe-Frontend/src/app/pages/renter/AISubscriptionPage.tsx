import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Sparkles, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { renterService, RenterStatisticResponseDTO } from '../../../services/renterService';
import { AiSubscriptionTier } from '../../../types/public';
import { AISubscriptionPricingGrid } from '../../components/renter/AISubscriptionPricingGrid';
import { AISubscriptionConfirmModal } from '../../components/renter/AISubscriptionConfirmModal';

export default function AISubscriptionPage() {
  const [aiTiers, setAiTiers] = useState<AiSubscriptionTier[]>([]);
  const [activeTierId, setActiveTierId] = useState<number | undefined>(undefined);
  const [stats, setStats] = useState<RenterStatisticResponseDTO | null>(null);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [buying, setBuying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedTier, setSelectedTier] = useState<AiSubscriptionTier | null>(null);

  const refreshStatus = async (tiers: AiSubscriptionTier[]) => {
    const fetchedStats = await renterService.getDashboardStatistics(0);
    setStats(fetchedStats);
    const matched = tiers.find((t: AiSubscriptionTier) => t.label === fetchedStats.activeAiTierLabel);
    setActiveTierId(matched ? matched.id_ai_subscription : undefined);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tiers = await renterService.getAiTiers();

        const freeTier: AiSubscriptionTier = {
          id_ai_subscription: 0,
          label: 'Mặc định (Miễn phí)',
          desciption: 'Dành cho người dùng chưa đăng ký gói AI nào',
          token_input: 0,
          token_output: 0,
          price: 0,
          unit: '—',
          create_at: '',
          update_at: '',
        };

        const allTiers = [freeTier, ...(Array.isArray(tiers) ? tiers : [])].sort((a, b) => a.price - b.price);
        setAiTiers(allTiers);
        await refreshStatus(tiers);
      } catch {
        setAiTiers([]);
      } finally {
        setLoadingTiers(false);
      }
    };
    fetchData();
  }, []);

  const currentTierIndex = aiTiers.findIndex(t => t.id_ai_subscription === activeTierId);
  const activeTier = aiTiers.find(t => t.id_ai_subscription === activeTierId);
  const isCurrentFreeTier = activeTierId === undefined || (activeTier?.price ?? 0) === 0;
  const isDowngrade = selectedTier !== null && activeTierId !== undefined
    && currentTierIndex > aiTiers.findIndex(t => t.id_ai_subscription === selectedTier.id_ai_subscription);
  // A different (non-free) tier is already active right now — picking anything else should
  // schedule rather than charge immediately, unless the user explicitly forces it.
  const willSchedule = activeTierId !== undefined && !isCurrentFreeTier;
  // "On" (chosen) differs from "active" (actually granting access) — a switch is already
  // scheduled and waiting for the current window to run out.
  const hasScheduledSwitch = !!stats?.activeAiTierLabel && stats.aiSubscriptionInUse !== stats.activeAiTierLabel;
  const isLapsed = !stats?.activeAiTierLabel && !!stats?.aiSubscriptionInUse && stats.aiSubscriptionInUse !== 'Chưa đăng ký';

  const handleSelectTier = (tier: AiSubscriptionTier) => {
    setSelectedTier(tier);
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await renterService.cancelAiSubscription();
      toast.success('Đã hủy gói AI thành công!');
      await refreshStatus(aiTiers);
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể hủy gói AI. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmPurchase = async (force: boolean = false) => {
    if (!selectedTier) return;
    setBuying(true);
    try {
      if (!force && isDowngrade && selectedTier.price === 0) {
        await renterService.cancelAiSubscription();
        toast.success('Đã hủy gói AI thành công!');
        setSelectedTier(null);
        await refreshStatus(aiTiers);
      } else {
        const res = await renterService.buyAiTier(selectedTier.id_ai_subscription, force);
        if (res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else if (!force && willSchedule) {
          toast.success(`Đã lên lịch chuyển sang gói "${selectedTier.label}" — sẽ được thanh toán và áp dụng khi gói hiện tại kết thúc.`);
          setSelectedTier(null);
          await refreshStatus(aiTiers);
        } else {
          toast.success(`Đăng ký gói "${selectedTier.label}" thành công!`);
          setSelectedTier(null);
          await refreshStatus(aiTiers);
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể đăng ký gói AI. Vui lòng thử lại.');
    } finally {
      setBuying(false);
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
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
              Gói AI
            </span>
          </div>
          <h1>Nâng cấp gói AI</h1>
          <p className="text-[var(--color-text-secondary)] mt-1 max-w-xl">
            Chọn gói AI phù hợp để sử dụng trợ lý tìm kiếm kho lạnh thông minh. Gói càng cao =
            token càng nhiều = trải nghiệm tốt hơn.
          </p>
        </div>

        {/* Current tier banner */}
        {activeTierId ? (
          <div className="mb-6 px-4 py-3 bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
              <p className="text-sm text-[var(--color-primary)]">
                {isCurrentFreeTier
                  ? 'Bạn đang dùng gói FREE — nâng cấp ngay để trải nghiệm đầy đủ!'
                  : `Bạn đang sử dụng gói ${activeTier?.label}.`}
              </p>
            </div>
            {!isCurrentFreeTier && (
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 bg-white hover:bg-red-50 transition-colors disabled:opacity-60 shrink-0"
              >
                <XCircle className="h-3.5 w-3.5" />
                {cancelling ? 'Đang hủy...' : 'Hủy gói'}
              </button>
            )}
          </div>
        ) : (
          <div className="mb-6 px-4 py-3 bg-[var(--color-accent-50)] border border-[var(--color-accent-200)] flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
            <p className="text-sm text-[var(--color-accent)]">
              Chưa đăng ký gói AI nào — hãy chọn gói phù hợp để bắt đầu!
            </p>
          </div>
        )}

        {isLapsed && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 flex items-center gap-3">
            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-600">
              Gói {stats?.aiSubscriptionInUse} đã hết hạn — hãy gia hạn để tiếp tục sử dụng Trợ lý AI.
            </p>
          </div>
        )}

        {hasScheduledSwitch && (
          <div className="mb-6 px-4 py-3 bg-[var(--color-accent-50)] border border-[var(--color-accent-200)] flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
            <p className="text-sm text-[var(--color-accent)]">
              Gói {stats?.aiSubscriptionInUse} đã được chọn — sẽ áp dụng khi gói {stats?.activeAiTierLabel} hiện tại kết thúc.
            </p>
          </div>
        )}

        {/* Pricing grid */}
        {loadingTiers ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">Đang tải gói AI...</div>
        ) : aiTiers.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            Hiện không có gói AI nào được cung cấp.
          </div>
        ) : (
          <AISubscriptionPricingGrid
            aiTiers={aiTiers}
            currentTierId={activeTierId}
            currentTierIndex={currentTierIndex}
            isCurrentFreeTier={isCurrentFreeTier}
            activeTierId={activeTierId}
            onSelectTier={handleSelectTier}
            loading={buying}
          />
        )}
      </div>

      {/* Confirmation modal */}
      <AISubscriptionConfirmModal
        tier={selectedTier}
        aiTiers={aiTiers}
        currentTierId={activeTierId}
        isDowngrade={isDowngrade}
        willSchedule={willSchedule && !(isDowngrade && selectedTier?.price === 0)}
        loading={buying}
        onClose={() => setSelectedTier(null)}
        onConfirm={() => handleConfirmPurchase(false)}
        onForceConfirm={() => handleConfirmPurchase(true)}
      />

      <Footer />
    </div>
  );
}
