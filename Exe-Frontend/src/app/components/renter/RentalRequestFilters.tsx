import { STATUS_CONFIG, FilterTab, TABS, RequestStatus } from './RentalRequestUtils';

interface RentalRequestFiltersProps {
    activeTab: FilterTab;
    onTabChange: (tab: FilterTab) => void;
    counts: Record<FilterTab, number>;
}

export function RentalRequestFilters({ activeTab, onTabChange, counts }: RentalRequestFiltersProps) {
    return (
        <>
            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[var(--color-border)] mb-6">
                {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((s) => {
                    const c = STATUS_CONFIG[s];
                    return (
                        <button
                            key={s}
                            onClick={() => onTabChange(activeTab === s ? "all" : s)}
                            className="bg-[var(--color-surface)] p-4 text-left hover:bg-[var(--color-bg-secondary)] transition-colors"
                            style={{ outline: activeTab === s ? `2px solid ${c.color}` : "none", outlineOffset: -2 }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 shrink-0" style={{ background: c.color }} />
                                <span className="text-2xl font-extrabold" style={{ color: "var(--color-text)" }}>{counts[s]}</span>
                            </div>
                            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{c.label}</p>
                        </button>
                    );
                })}
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-[var(--color-border)] mb-4 overflow-x-auto">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => onTabChange(t.key)}
                        className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
                        style={{
                            borderBottomColor: activeTab === t.key ? "var(--color-primary)" : "transparent",
                            color: activeTab === t.key ? "var(--color-primary)" : "var(--color-text-secondary)",
                            fontWeight: activeTab === t.key ? 600 : 400,
                        }}
                    >
                        {t.label}
                        {t.key !== "all" && counts[t.key] > 0 && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5" style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>
                                {counts[t.key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </>
    );
}
