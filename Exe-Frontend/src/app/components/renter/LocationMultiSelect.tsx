import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, X, Search } from "lucide-react";
import { Input } from "../ui/input";

interface LocationMultiSelectProps {
    selected: string[];
    onToggle: (value: string) => void;
    onClearAll: () => void;
    provinces: string[];
}

export function LocationMultiSelect({ selected, onToggle, onClearAll, provinces }: LocationMultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (open && searchRef.current) {
            searchRef.current.focus();
        }
    }, [open]);

    const filtered = provinces.filter((p) =>
        p.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] transition-colors"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
                    {selected.length === 0 ? (
                        <span className="text-[var(--color-text-muted)] truncate">
                            Chọn tỉnh/thành phố...
                        </span>
                    ) : (
                        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                            {selected.slice(0, 3).map((p) => (
                                <span
                                    key={p}
                                    className="inline-flex items-center gap-0.5 bg-[var(--color-primary)] text-white text-xs px-2 py-0.5 shrink-0"
                                >
                                    {p}
                                </span>
                            ))}
                            {selected.length > 3 && (
                                <span className="text-xs text-[var(--color-text-muted)] self-center shrink-0">
                                    +{selected.length - 3} khác
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {selected.length > 0 && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); onClearAll(); }}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors p-0.5"
                            title="Xóa tất cả"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg">
                    {/* Search input */}
                    <div className="p-2 border-b border-[var(--color-border)]">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                            <Input
                                ref={searchRef}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm tỉnh/thành..."
                                className="pl-8 h-8 text-sm rounded-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="max-h-64 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="px-3 py-3 text-sm text-[var(--color-text-muted)] text-center">
                                Không tìm thấy tỉnh/thành nào.
                            </p>
                        ) : (
                            filtered.map((province) => {
                                const isSelected = selected.includes(province);
                                return (
                                    <button
                                        key={province}
                                        type="button"
                                        onClick={() => onToggle(province)}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-[var(--color-bg-secondary)] transition-colors ${
                                            isSelected
                                                ? "bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-medium"
                                                : "text-[var(--color-text)]"
                                        }`}
                                    >
                                        <span>{province}</span>
                                        {isSelected && (
                                            <span className="text-[var(--color-primary)] font-bold">✓</span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {selected.length > 0 && (
                        <div className="p-2 border-t border-[var(--color-border)]">
                            <p className="text-xs text-[var(--color-text-muted)] text-center">
                                Đã chọn: <span className="font-medium text-[var(--color-text)]">{selected.length}</span> tỉnh/thành
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
