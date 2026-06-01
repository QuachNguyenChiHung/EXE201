import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../components/ui/button';
import {
  SUBSCRIPTION_TIERS,
  
  SubscriptionTierLevel,
  CompositeWarehouse,
} from '../../../types';
import {
  Crown,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Warehouse,
  Search,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const fmtVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);

const TIER_ICONS: Record<SubscriptionTierLevel, React.ReactNode> = {
  free: <Warehouse className="h-6 w-6" />,
  silver: <Shield className="h-6 w-6" />,
  gold: <Crown className="h-6 w-6" />,
  platinum: <Sparkles className="h-6 w-6" />,
};

export default function SubscriptionManagement() {
  const { user: currentUser, warehouses: allWarehouses, updateWarehouse } = useApp();

  const myWarehouses = useMemo(
    () => allWarehouses.filter(w => w.id_owner === currentUser?.id),
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
        updatedAt: new Date().toISOString(),
      };
      await updateWarehouse(warehouse.id, updated);
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

  const currentTier = (w: CompositeWarehouse) => w.subscriptionTier ?? 'free';
  const tierIdx = (t: SubscriptionTierLevel) => Object.keys(SUBSCRIPTION_TIERS).indexOf(t);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)] border border-[var(--color-border)] mb-8">
          {Object.keys(SUBSCRIPTION_TIERS).map(level => {
            const config = SUBSCRIPTION_TIERS[level];
            const isPopular = level === 'gold';
            return (
              <div
                key={level}
                className="relative bg-[var(--color-surface)] flex flex-col"
                style={isPopular ? { boxShadow: `inset 0 3px 0 ${config.color}` } : {}}
              >
                {isPopular && (
                  <div
                    className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-bold uppercase tracking-wider px-3 py-1 text-white"
                    style={{ background: config.color }}
                  >
                    Phổ biến nhất
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 flex items-center justify-center"
                      style={{ background: config.bgColor, color: config.color }}
                    >
                      {TIER_ICONS[level]}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{config.icon} {config.label}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{config.labelVi}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-2xl font-extrabold" style={{ color: config.color }}>
                      {config.monthlyPrice === 0 ? 'Miễn phí' : fmtVnd(config.monthlyPrice)}
                    </span>
                    {config.monthlyPrice > 0 && (
                      <span className="text-xs text-[var(--color-text-muted)] ml-1">/tháng</span>
                    )}
                  </div>

                  {/* Boost indicator */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 mb-4 text-sm"
                    style={{ background: config.bgColor, color: config.color }}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-semibold">
                      {config.boostFactor === 1
                        ? 'Xếp hạng cơ bản'
                        : `+${Math.round((config.boostFactor - 1) * 100)}% ưu tiên tìm kiếm`}
                    </span>
                  </div>

                  {/* Benefits */}
                  <ul className="space-y-2 flex-1">
                    {config.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle
                          className="h-4 w-4 shrink-0 mt-0.5"
                          style={{ color: config.color }}
                        />
                        <span className="text-[var(--color-text-secondary)]">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* My warehouses + tier status */}
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-1">Kho lạnh của tôi</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Chọn kho để nâng cấp hoặc thay đổi gói đăng ký
          </p>
        </div>

        {myWarehouses.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-12 text-center">
            <Warehouse className="h-10 w-10 mx-auto mb-3 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Bạn chưa có kho lạnh nào. Hãy thêm kho trước khi nâng cấp gói.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
            {myWarehouses.map(wh => {
              const tier = currentTier(wh);
              const config = SUBSCRIPTION_TIERS[tier];
              return (
                <div
                  key={wh.id}
                  className="bg-[var(--color-surface)] p-5 flex flex-col gap-3 cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors"
                  onClick={() => setSelectedWarehouse(wh)}
                >
                  {/* Name + tier badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{wh.name}</h3>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {wh.location.city}, {wh.location.province}
                      </p>
                    </div>
                    <span
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1"
                      style={{
                        background: config.bgColor,
                        color: config.color,
                        border: `1px solid ${config.color}30`,
                      }}
                    >
                      {config.icon} {config.label}
                    </span>
                  </div>

                  {/* Boost info */}
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <Search className="h-3.5 w-3.5 shrink-0" />
                    Boost:
                    <strong style={{ color: config.color }}>×{config.boostFactor}</strong>
                  </div>

                  {/* Upgrade CTA */}
                  {tier !== 'platinum' && (
                    <Button
                      size="sm"
                      className="rounded-none mt-auto bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] text-xs"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedWarehouse(wh);
                      }}
                    >
                      <Zap className="h-3.5 w-3.5 mr-1" />
                      Nâng cấp
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                  {tier === 'platinum' && (
                    <div className="mt-auto flex items-center gap-1 text-xs font-semibold" style={{ color: SUBSCRIPTION_TIERS.platinum.color }}>
                      <CheckCircle className="h-3.5 w-3.5" />
                      Gói cao nhất
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tier upgrade picker for selected warehouse */}
        {selectedWarehouse && (
          <div className="mt-8 bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Chọn gói cho: {selectedWarehouse.name}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Gói hiện tại:{' '}
                  <strong style={{ color: SUBSCRIPTION_TIERS[currentTier(selectedWarehouse)].color }}>
                    {SUBSCRIPTION_TIERS[currentTier(selectedWarehouse)].icon}{' '}
                    {SUBSCRIPTION_TIERS[currentTier(selectedWarehouse)].label}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedWarehouse(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)]">
              {Object.keys(SUBSCRIPTION_TIERS).map(level => {
                const config = SUBSCRIPTION_TIERS[level];
                const isCurrent = currentTier(selectedWarehouse) === level;
                const isDowngrade = tierIdx(level) < tierIdx(currentTier(selectedWarehouse));
                const isUpgrade = tierIdx(level) > tierIdx(currentTier(selectedWarehouse));

                return (
                  <div
                    key={level}
                    className="bg-[var(--color-surface)] p-4 flex flex-col items-center text-center gap-2"
                    style={isCurrent ? { boxShadow: `inset 0 0 0 2px ${config.color}` } : {}}
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center mb-1"
                      style={{ background: config.bgColor, color: config.color }}
                    >
                      {TIER_ICONS[level]}
                    </div>
                    <div className="text-sm font-bold">
                      {config.icon} {config.label}
                    </div>
                    <div className="text-lg font-extrabold" style={{ color: config.color }}>
                      {config.monthlyPrice === 0 ? 'Free' : fmtVnd(config.monthlyPrice)}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      ×{config.boostFactor} boost
                    </div>

                    {isCurrent ? (
                      <div
                        className="mt-auto text-xs font-semibold px-3 py-1.5"
                        style={{ background: config.bgColor, color: config.color }}
                      >
                        Gói hiện tại
                      </div>
                    ) : isUpgrade ? (
                      <Button
                        size="sm"
                        className="mt-auto rounded-none text-xs w-full"
                        style={{ background: config.color, color: '#fff' }}
                        onClick={() =>
                          setShowConfirm({ warehouse: selectedWarehouse, tier: level })
                        }
                      >
                        Nâng cấp
                      </Button>
                    ) : isDowngrade ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-auto rounded-none text-xs w-full border-[var(--color-border)]"
                        onClick={() =>
                          setShowConfirm({ warehouse: selectedWarehouse, tier: level })
                        }
                      >
                        Hạ xuống
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 'var(--z-modal-overlay)', background: 'rgba(0,0,0,0.5)' }}
          onClick={() => !upgrading && setShowConfirm(null)}
        >
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-md"
            style={{ zIndex: 'var(--z-modal)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <h3 className="font-bold">Xác nhận thay đổi gói</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div
                    className="w-12 h-12 mx-auto flex items-center justify-center mb-1"
                    style={{
                      background: SUBSCRIPTION_TIERS[currentTier(showConfirm.warehouse)].bgColor,
                      color: SUBSCRIPTION_TIERS[currentTier(showConfirm.warehouse)].color,
                    }}
                  >
                    {TIER_ICONS[currentTier(showConfirm.warehouse)]}
                  </div>
                  <div className="text-xs font-semibold">
                    {SUBSCRIPTION_TIERS[currentTier(showConfirm.warehouse)].label}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--color-text-muted)]" />
                <div className="text-center">
                  <div
                    className="w-12 h-12 mx-auto flex items-center justify-center mb-1"
                    style={{
                      background: SUBSCRIPTION_TIERS[showConfirm.tier].bgColor,
                      color: SUBSCRIPTION_TIERS[showConfirm.tier].color,
                    }}
                  >
                    {TIER_ICONS[showConfirm.tier]}
                  </div>
                  <div className="text-xs font-semibold">
                    {SUBSCRIPTION_TIERS[showConfirm.tier].label}
                  </div>
                </div>
              </div>

              <div className="bg-[var(--color-bg-secondary)] px-4 py-3 text-sm">
                <p>
                  Kho: <strong>{showConfirm.warehouse.name}</strong>
                </p>
                <p className="mt-1">
                  Phí hàng tháng:{' '}
                  <strong style={{ color: SUBSCRIPTION_TIERS[showConfirm.tier].color }}>
                    {SUBSCRIPTION_TIERS[showConfirm.tier].monthlyPrice === 0
                      ? 'Miễn phí'
                      : fmtVnd(SUBSCRIPTION_TIERS[showConfirm.tier].monthlyPrice)}
                  </strong>
                </p>
                <p className="mt-1">
                  Search boost:{' '}
                  <strong>×{SUBSCRIPTION_TIERS[showConfirm.tier].boostFactor}</strong>
                </p>
              </div>

              <p className="text-xs text-[var(--color-text-muted)]">
                Thanh toán sẽ được xử lý tự động hàng tháng. Bạn có thể thay đổi gói bất kỳ
                lúc nào.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-[var(--color-border)] flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-none"
                disabled={upgrading}
                onClick={() => setShowConfirm(null)}
              >
                Huỷ
              </Button>
              <Button
                className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                disabled={upgrading}
                onClick={() =>
                  handleUpgrade(showConfirm.warehouse, showConfirm.tier)
                }
              >
                {upgrading ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
