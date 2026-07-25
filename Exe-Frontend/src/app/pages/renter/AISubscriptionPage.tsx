import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Sparkles, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { renterService } from '../../../services/renterService';
import { AiSubscriptionTier } from '../../../types/public';
import { AISubscriptionPricingGrid } from '../../components/renter/AISubscriptionPricingGrid';
import { AISubscriptionConfirmModal } from '../../components/renter/AISubscriptionConfirmModal';

export default function AISubscriptionPage() {
  const [aiTiers, setAiTiers] = useState<AiSubscriptionTier[]>([]);
  const [activeTierId, setActiveTierId] = useState<number | undefined>(undefined);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [buying, setBuying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedTier, setSelectedTier] = useState<AiSubscriptionTier | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tiers, aiStatus] = await Promise.all([
          renterService.getAiTiers(),
          renterService.getRenterAiSubscriptionStatus(),
        ]);

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

        setAiTiers(
          [freeTier, ...(Array.isArray(tiers) ? tiers : [])]
            .sort((a, b) => a.price - b.price)
        );
        const matched = tiers.find((t: AiSubscriptionTier) => t.label === aiStatus.tierLabel);
        setActiveTierId(matched ? matched.id_ai_subscription : undefined);
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

  const handleSelectTier = (tier: AiSubscriptionTier) => {
    setSelectedTier(tier);
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await renterService.cancelAiSubscription();
      toast.success('Đã hủy gói AI thành công!');
      const aiStatus = await renterService.getRenterAiSubscriptionStatus();
      const matched = aiTiers.find((t: AiSubscriptionTier) => t.label === aiStatus.tierLabel);
      setActiveTierId(matched ? matched.id_ai_subscription : undefined);
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể hủy gói AI. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedTier) return;
    setBuying(true);
    try {
      if (isDowngrade && selectedTier.price === 0) {
        await renterService.cancelAiSubscription();
        toast.success('Đã hủy gói AI thành công!');
        setSelectedTier(null);
        const aiStatus = await renterService.getRenterAiSubscriptionStatus();
        const matched = aiTiers.find((t: AiSubscriptionTier) => t.label === aiStatus.tierLabel);
        setActiveTierId(matched ? matched.id_ai_subscription : undefined);
      } else {
        const res = await renterService.buyAiTier(selectedTier.id_ai_subscription);
        if (res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else {
          toast.success(`Đăng ký gói "${selectedTier.label}" thành công!`);
          setSelectedTier(null);
          const aiStatus = await renterService.getRenterAiSubscriptionStatus();
          const matched = aiTiers.find((t: AiSubscriptionTier) => t.label === aiStatus.tierLabel);
          setActiveTierId(matched ? matched.id_ai_subscription : undefined);
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
        loading={buying}
        onClose={() => setSelectedTier(null)}
        onConfirm={handleConfirmPurchase}
      />

      <Footer />
    </div>
  );
}
