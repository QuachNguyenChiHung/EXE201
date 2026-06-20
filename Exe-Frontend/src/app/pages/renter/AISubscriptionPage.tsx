import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../../../utils/auth';
import { renterService } from '../../../services/renterService';
import { AiSubscriptionTier } from '../../../types/public';
import { AISubscriptionPricingGrid } from '../../components/renter/AISubscriptionPricingGrid';
import { AISubscriptionConfirmModal } from '../../components/renter/AISubscriptionConfirmModal';

export default function AISubscriptionPage() {
  const currentUser = getUser();

  const [aiTiers, setAiTiers] = useState<AiSubscriptionTier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedTier, setSelectedTier] = useState<AiSubscriptionTier | null>(null);

  const activeTierId = currentUser?.ai_tier ?? undefined;

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const tiers = await renterService.getAiTiers();
        setAiTiers(tiers);
      } catch (err) {
        console.error('Failed to load AI tiers:', err);
        toast.error('Không thể tải danh sách gói AI.');
      } finally {
        setLoadingTiers(false);
      }
    };
    fetchTiers();
  }, []);

  const handleSelectTier = (tier: AiSubscriptionTier) => {
    setSelectedTier(tier);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedTier) return;
    setBuying(true);
    try {
      const res = await renterService.buyAiTier(selectedTier.id_ai_subscription);
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        toast.success(`Đăng ký gói "${selectedTier.label}" thành công!`);
        setSelectedTier(null);
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
        {activeTierId && (
          <div className="mb-6 px-4 py-3 bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
            <p className="text-sm text-[var(--color-primary)]">
              Bạn đang sử dụng gói AI — có thể nâng cấp bất cứ lúc nào.
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
            onSelectTier={handleSelectTier}
            loading={buying}
          />
        )}
      </div>

      {/* Confirmation modal */}
      <AISubscriptionConfirmModal
        tier={selectedTier}
        loading={buying}
        onClose={() => setSelectedTier(null)}
        onConfirm={handleConfirmPurchase}
      />

      <Footer />
    </div>
  );
}
