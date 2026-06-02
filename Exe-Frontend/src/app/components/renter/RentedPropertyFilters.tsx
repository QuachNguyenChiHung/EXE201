import { FilterTab, STATUS_CONFIG, TABS } from './RentedPropertyUtils';
import { PenLine } from 'lucide-react';

interface RentedPropertyFiltersProps {
    tab: FilterTab;
    setTab: (tab: FilterTab) => void;
    counts: Record<string, number>;
    pendingSignCount: number;
}

export function RentedPropertyFilters({ tab, setTab, counts, pendingSignCount }: RentedPropertyFiltersProps) {
    return (
        <>
            {/* ── Pending sign banner ── */}
            {pendingSignCount > 0 && (
                <div className="flex items-center gap-4 px-4 py-3 mb-6 border"
                    style={{ background: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.4)' }}>
                    <PenLine className="h-5 w-5 shrink-0" style={{ color: '#f59e0b' }} />
                    <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            Bạn có {pendingSignCount} hợp đồng đang chờ ký xác nhận
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            Xem nội dung và ký kết để hợp đồng có hiệu lực.
                        </p>
                    </div>
                    <button onClick={() => setTab('pending_renter')}
                        className="text-sm px-3 py-1.5 text-white shrink-0"
                        style={{ background: '#f59e0b' }}>
                        Xem ngay
                    </button>
                </div>
            )}

            {/* ── Summary stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] mb-8">
                {[
                    { label: 'Đang thuê', key: 'active', color: 'var(--color-success)' },
                    { label: 'Sắp hết hạn', key: 'expiring_soon', color: 'var(--color-warning)' },
                    { label: 'Đã hết hạn', key: 'expired', color: 'var(--color-text-muted)' },
                    { label: 'Đã huỷ', key: 'cancelled', color: 'var(--color-error)' },
                ].map(s => (
                    <div key={s.label} className="bg-[var(--color-surface)] p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 flex-shrink-0" style={{ background: s.color }} />
                            <p className="text-2xl font-extrabold">{counts[s.key] ?? 0}</p>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-[var(--color-border)] mb-6 overflow-x-auto">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-5 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${tab === t.key
                                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                            }`}
                    >
                        {t.label}
                        {t.key !== 'all' && counts[t.key] ? (
                            <span className="ml-2 text-xs bg-[var(--color-bg-secondary)] px-1.5 py-0.5">
                                {counts[t.key]}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>
        </>
    );
}
