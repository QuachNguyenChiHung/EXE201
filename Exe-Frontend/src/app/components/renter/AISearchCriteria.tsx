import { useState } from "react";
import { Sparkles, RotateCcw, ChevronDown, ChevronUp, Info, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Attribute, AttrOption, SelectMode, getAttributes, CustomComponentProps } from "../../pages/renter/aiSearchData";
import { FilterMetaResponseDTO } from "../../../services/renterService";
import { buildCriteriaPrompt } from "../../pages/renter/aiSearchUtils";

function OptionChip({ option, selected, onClick }: { option: AttrOption; selected: boolean; onClick: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div className="relative">
            <button
                type="button"
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={`px-3 py-2 text-sm border transition-colors text-left w-full leading-tight ${selected
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                    }`}
            >
                {option.label}
            </button>
            {hovered && (
                <div
                    className="absolute z-20 bottom-full left-0 mb-2 bg-[var(--color-text)] text-white text-xs px-3 py-2 w-64 pointer-events-none"
                    style={{ lineHeight: 1.5 }}
                >
                    {option.hint}
                    <div className="absolute top-full left-5 border-4 border-transparent border-t-[var(--color-text)]" />
                </div>
            )}
        </div>
    );
}

function AttrSection({ attr, selections, onToggle }: { attr: Attribute; selections: Record<string, string[]>; onToggle: (id: string, v: string, m: SelectMode) => void }) {
    const [collapsed, setCollapsed] = useState(false);
    const selected = selections[attr.id] ?? [];

    return (
        <div className="border-b border-[var(--color-border)] last:border-b-0">
            <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="w-full flex items-center justify-between px-5 py-4 text-left bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 flex items-center justify-center text-white shrink-0 ${selected.length > 0 ? "bg-[var(--color-primary)]" : "bg-[var(--color-text-muted)]"}`}>
                        {attr.icon}
                    </div>
                    <span className="text-sm font-semibold">{attr.label}</span>
                    {selected.length > 0 && (
                        <span className="bg-[var(--color-primary)] text-white text-xs px-1.5 py-0.5 leading-none">{selected.length}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text-muted)] shrink-0">
                    <span className="text-xs hidden sm:inline">{attr.mode === "multi" ? "Chọn nhiều" : "Chọn một"}</span>
                    {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
            </button>
            {!collapsed && (
                <div className="px-5 pb-5 bg-[var(--color-surface)]">
                    <div className="flex items-start gap-2 mt-0 mb-4 bg-[var(--color-bg-secondary)] px-3 py-2.5">
                        <Info className="h-3.5 w-3.5 text-[var(--color-info)] shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{attr.explanation}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {attr.options.map((opt) => (
                            <OptionChip key={opt.value} option={opt} selected={selected.includes(opt.value)} onClick={() => onToggle(attr.id, opt.value, attr.mode)} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CustomAttrSection({ attr, selections, onToggle, onReset }: {
    attr: Attribute;
    selections: Record<string, string[]>;
    onToggle: (id: string, v: string, m: SelectMode) => void;
    onReset: () => void;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const selected = selections[attr.id] ?? [];
    const Component = attr.customComponent!;

    const handleCustomToggle = (value: string) => onToggle(attr.id, value, attr.mode);
    const handleClearAll = () => {
        selected.forEach((v) => onToggle(attr.id, v, attr.mode));
    };

    return (
        <div className="border-b border-[var(--color-border)] last:border-b-0">
            <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="w-full flex items-center justify-between px-5 py-4 text-left bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 flex items-center justify-center text-white shrink-0 ${selected.length > 0 ? "bg-[var(--color-primary)]" : "bg-[var(--color-text-muted)]"}`}>
                        {attr.icon}
                    </div>
                    <span className="text-sm font-semibold">{attr.label}</span>
                    {selected.length > 0 && (
                        <span className="bg-[var(--color-primary)] text-white text-xs px-1.5 py-0.5 leading-none">{selected.length}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text-muted)] shrink-0">
                    <span className="text-xs hidden sm:inline">Chọn nhiều</span>
                    {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
            </button>
            {!collapsed && (
                <div className="px-5 pb-5 bg-[var(--color-surface)]">
                    <div className="flex items-start gap-2 mt-0 mb-4 bg-[var(--color-bg-secondary)] px-3 py-2.5">
                        <Info className="h-3.5 w-3.5 text-[var(--color-info)] shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{attr.explanation}</p>
                    </div>
                    <Component
                        selected={selected}
                        onToggle={handleCustomToggle}
                        onClearAll={handleClearAll}
                        provinces={[]}
                    />
                </div>
            )}
        </div>
    );
}

function RangeAttrSection({ attr, selections, onSetSelection, validationErrors }: {
    attr: Attribute;
    selections: Record<string, string[]>;
    onSetSelection: (id: string, v: string[]) => void;
    validationErrors?: Record<string, string>;
}) {
    const [collapsed, setCollapsed] = useState(false);

    if (!attr.rangeIds) return null;
    const minId = attr.rangeIds[0];
    const maxId = attr.rangeIds[1];

    const minVal = selections[minId]?.[0] || "";
    const maxVal = selections[maxId]?.[0] || "";

    const hasValue = minVal !== "" || maxVal !== "";
    const minError = validationErrors?.[minId];
    const maxError = validationErrors?.[maxId];
    const isPrice = minId === "minPrice";
    const step = isPrice ? "1000" : "1";

    return (
        <div className="border-b border-[var(--color-border)] last:border-b-0">
            <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="w-full flex items-center justify-between px-5 py-4 text-left bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 flex items-center justify-center text-white shrink-0 ${hasValue ? "bg-[var(--color-primary)]" : "bg-[var(--color-text-muted)]"}`}>
                        {attr.icon}
                    </div>
                    <span className="text-sm font-semibold">{attr.label}</span>
                    {hasValue && (
                        <span className="bg-[var(--color-primary)] text-white text-xs px-1.5 py-0.5 leading-none">✓</span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-[var(--color-text-muted)] shrink-0">
                    <span className="text-xs hidden sm:inline">Nhập khoảng</span>
                    {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </div>
            </button>
            {!collapsed && (
                <div className="px-5 pb-5 bg-[var(--color-surface)]">
                    <div className="flex items-start gap-2 mt-0 mb-4 bg-[var(--color-bg-secondary)] px-3 py-2.5">
                        <Info className="h-3.5 w-3.5 text-[var(--color-info)] shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{attr.explanation}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                        <div>
                            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Tối thiểu</label>
                            <Input
                                type="number"
                                step={step}
                                placeholder="0"
                                value={minVal}
                                onChange={(e) => onSetSelection(minId, e.target.value ? [e.target.value] : [])}
                                className={minError ? "border-[var(--color-error)] focus:border-[var(--color-error)]" : ""}
                            />
                            {minError && <p className="text-xs text-[var(--color-error)] mt-1">{minError}</p>}
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Tối đa</label>
                            <Input
                                type="number"
                                step={step}
                                placeholder="Không giới hạn"
                                value={maxVal}
                                onChange={(e) => onSetSelection(maxId, e.target.value ? [e.target.value] : [])}
                                className={maxError ? "border-[var(--color-error)] focus:border-[var(--color-error)]" : ""}
                            />
                            {maxError && <p className="text-xs text-[var(--color-error)] mt-1">{maxError}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface AISearchCriteriaProps {
    selections: Record<string, string[]>;
    usage: { monthlyQueries: number; monthlyCost: number } | null;
    totalSelected: number;
    onToggle: (id: string, v: string, m: SelectMode) => void;
    onSetSelection?: (id: string, v: string[]) => void;
    onReset: () => void;
    onSearch: () => void;
    onSearchResult?: (responseText: string) => void;
    filterMeta: FilterMetaResponseDTO | null;
    validationErrors?: Record<string, string>;
}

export function AISearchCriteria({ selections, usage, totalSelected, onToggle, onSetSelection, onReset, onSearch, onSearchResult, filterMeta, validationErrors }: AISearchCriteriaProps) {
    const attributes = filterMeta ? getAttributes(filterMeta) : [];
    const fmtCurrency = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
    const hasValidationErrors = Object.keys(validationErrors ?? {}).length > 0;
    const [searchLoading, setSearchLoading] = useState(false);

    const handleSearch = async () => {
        if (searchLoading) return;
        const prompt = buildCriteriaPrompt(selections, filterMeta ?? {} as FilterMetaResponseDTO);
        console.log("prompt: "+ prompt);
        onSearch();
        setSearchLoading(true);
        try {
            const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
            const token = user?.token;
            const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
            const res = await fetch(`${API_BASE}/ai/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ query: prompt }),
            });
            if (res.ok) {
                const data = await res.json();
                onSearchResult?.(data.response);
            }
        } catch {
            // search continues with normal flow
        } finally {
            setSearchLoading(false);
        }
    };

    return (
        <div className="bento-container">
            <div className="bento-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-[var(--color-accent)] flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">Bước 1 / 2</span>
                    </div>
                    <h1>Chọn tiêu chí kho lạnh</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1 max-w-lg">
                        Chọn các thuộc tính phù hợp với nhu cầu của bạn. Mỗi lựa chọn có giải thích chi tiết. Sau đó AI sẽ lọc kết quả và bạn có thể chat để phân tích sâu hơn.
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2 max-w-lg border-l-2 border-[var(--color-border)] pl-3 leading-relaxed">
                        <span className="font-medium text-[var(--color-text-secondary)]">Mẹo tiết kiệm:</span> Càng cung cấp nhiều tiêu chí và thông tin chi tiết ở bước này, AI càng lọc chính xác ngay từ đầu — giúp <span className="font-medium text-[var(--color-text-secondary)]">giảm chi phí sử dụng AI</span> do hạn chế các lượt chat phân tích lặp lại ở bước sau.
                    </p>
                </div>
                {usage && (
                    <div className="flex gap-px bg-[var(--color-border)] shrink-0">
                        <div className="bg-[var(--color-surface)] px-4 py-3 text-center">
                            <p className="text-xs text-[var(--color-text-muted)]">Truy vấn tháng</p>
                            <p className="font-extrabold text-lg">{usage.monthlyQueries}</p>
                        </div>
                        <div className="bg-[var(--color-surface)] px-4 py-3 text-center">
                            <p className="text-xs text-[var(--color-text-muted)]">Chi phí tháng</p>
                            <p className="font-extrabold text-lg">{fmtCurrency(usage.monthlyCost)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-0 mb-6 justify-between">
                <div className="flex items-center gap-0">
                    <div className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 text-sm">
                        <span className="w-5 h-5 border border-white flex items-center justify-center text-xs font-bold">1</span>
                        Chọn tiêu chí
                    </div>
                    <div className="w-8 h-0.5 bg-[var(--color-border)]" />
                    <div className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] px-4 py-2 text-sm">
                        <span className="w-5 h-5 border border-[var(--color-border)] flex items-center justify-center text-xs">2</span>
                        Kết quả + Chat AI
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {totalSelected > 0 && (
                        <button onClick={onReset} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1 transition-colors">
                            <RotateCcw className="h-3 w-3" /> Đặt lại
                        </button>
                    )}
                    <Button onClick={handleSearch} disabled={hasValidationErrors || searchLoading} className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] h-9 text-sm px-4 disabled:opacity-50">
                        {searchLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang gửi…</> : totalSelected === 0 ? "Tiếp →" : `Xem kết quả (${totalSelected} tiêu chí) →`}
                    </Button>
                </div>
            </div>

            {/* Attributes */}
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] mb-6">
                {attributes.map((attr) => {
                    if (attr.mode === "range" && onSetSelection) {
                        return <RangeAttrSection key={attr.id} attr={attr} selections={selections} onSetSelection={onSetSelection} validationErrors={validationErrors} />;
                    }
                    if (attr.customComponent) {
                        return <CustomAttrSection key={attr.id} attr={attr} selections={selections} onToggle={onToggle} onReset={onReset} />;
                    }
                    return <AttrSection key={attr.id} attr={attr} selections={selections} onToggle={onToggle} />;
                })}
            </div>

            {/* Action bar */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {totalSelected > 0 ? (
                            <>Đã chọn <span className="font-bold text-[var(--color-text)]">{totalSelected}</span> tiêu chí</>
                        ) : (
                            <span className="text-[var(--color-text-muted)]">Chưa chọn tiêu chí nào — sẽ hiển thị tất cả kho</span>
                        )}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Kết quả sẽ được lọc ngay lập tức — không mất phí AI ở bước này</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onReset} disabled={totalSelected === 0} className="rounded-none border border-[var(--color-border)]">
                        <RotateCcw className="h-4 w-4 mr-2" /> Đặt lại
                    </Button>
                    <Button onClick={handleSearch} disabled={hasValidationErrors || searchLoading} className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
                        {searchLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang gửi…</> : totalSelected === 0 ? "Tiếp →" : "Xem kết quả & Chat AI →"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
