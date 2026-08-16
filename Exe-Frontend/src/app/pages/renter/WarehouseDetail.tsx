import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from '../../components/Footer';
import { CompositeWarehouse } from "../../../types";
import { toast } from "sonner";
import { Star, List, ChevronUp, ChevronDown } from "lucide-react";
import { useBookmarks } from "../../../hooks/useBookmarks";
import { renterService } from "../../../services/renterService";
import { useWebSocketMessage } from "../../../hooks/useWebSocket";

import { WarehouseDetailGallery } from "../../components/renter/WarehouseDetailGallery";
import { WarehouseDetailInfo } from "../../components/renter/WarehouseDetailInfo";
import { WarehouseDetailSidebar } from "../../components/renter/WarehouseDetailSidebar";
import { RentalRequestModal } from "../../components/renter/RentalRequestModal";
import { AIChatPanel } from "../../components/renter/AIChatPanel";
import { WarehouseReviewsSection } from "../../components/renter/WarehouseReviewsSection";

const STATUS_CFG: Record<string, { label: string; badgeClass: string }> = {
    PENDING: { label: 'Chờ duyệt', badgeClass: 'bg-[rgba(245,158,11,0.1)] text-[var(--color-warning)]' },
    REJECTED: { label: 'Đã từ chối', badgeClass: 'bg-[rgba(239,68,68,0.1)] text-[var(--color-error)]' },
    ACTIVE: { label: 'Đang hoạt động', badgeClass: 'bg-[rgba(34,197,94,0.1)] text-[var(--color-success)]' },
    RENTED: { label: 'Đã cho thuê hết', badgeClass: 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6]' },
    INACTIVE: { label: 'Ngừng hoạt động', badgeClass: 'bg-[rgba(107,114,128,0.1)] text-[var(--color-text-muted)]' },
};

export default function WarehouseDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { bookmarkedIds, toggleBookmark } = useBookmarks();

    const [warehouse, setWarehouse] = useState<CompositeWarehouse | null>(null);
    const [loading, setLoading] = useState(true);
    const [quickNavOpen, setQuickNavOpen] = useState(false);
    /** sectionId → selected tier index in that section's priceTiers array */
    const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>({});
    /** IDs of sections the user has checked in the sidebar form */
    const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
    /** sectionId → capacity string for the rental form */
    const [sectionCapacities, setSectionCapacities] = useState<Record<string, string>>({});
    /** Whether the rental request modal is open */
    const [rentalModalOpen, setRentalModalOpen] = useState(false);
    /** Whether the current renter can review this warehouse (has a contract for it) */
    const [canReview, setCanReview] = useState(false);
    const [contractsLoading, setContractsLoading] = useState(false);
    const [reviewContractId, setReviewContractId] = useState<string | undefined>();
    const [reviewContractRef, setReviewContractRef] = useState<string | undefined>();
    const [reviewRefreshKey, setReviewRefreshKey] = useState(0);

    const fetchWarehouse = useCallback((opts?: { silent?: boolean }) => {
        if (!id) return;
        if (!opts?.silent) setLoading(true);
        return renterService.getWarehouseDetail(id)
            .then(data => {
                if (data) {
                    setWarehouse(data);
                } else if (!opts?.silent) {
                    toast.error("Không tìm thấy kho lạnh"); navigate("/renter/search");
                }
            })
            .catch(() => {
                if (!opts?.silent) { toast.error("Không tìm thấy kho lạnh"); navigate("/renter/search"); }
            })
            .finally(() => { if (!opts?.silent) setLoading(false); });
    }, [id, navigate]);

    useEffect(() => {
        fetchWarehouse();
    }, [fetchWarehouse]);

    // Check if the logged-in renter has any contract for this warehouse
    useEffect(() => {
        if (!warehouse?.id_warehouse || !warehouse?.name) return;
        setContractsLoading(true);
        renterService.getMyContracts(0, 100)
            .then(res => {
                const matched = (res.content || []).find(
                    (c: any) => c.warehouseName === warehouse.name
                );
                setCanReview(!!matched);
                if (matched) {
                    setReviewContractId(String(matched.id_contract));
                    setReviewContractRef(matched.contractRef ?? String(matched.id_contract));
                }
            })
            .catch(() => setCanReview(false))
            .finally(() => setContractsLoading(false));
    }, [warehouse?.id_warehouse]);

    useWebSocketMessage('WAREHOUSE_STATUS_CHANGED', useCallback((msg: any) => {
        if (!id || String(msg.warehouseId) !== String(id)) return;
        setWarehouse(prev => (prev ? { ...prev, status: msg.status } : prev));
    }, [id]));

    // Any other detail change (name, description, sections, price tiers,
    // images, certificates, ...) — refetch the full record silently rather
    // than trying to merge a partial payload over the socket.
    useWebSocketMessage('WAREHOUSE_UPDATED', useCallback((msg: any) => {
        if (!id || String(msg.warehouseId) !== String(id)) return;
        fetchWarehouse({ silent: true });
    }, [id, fetchWarehouse]));

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-[var(--color-text-secondary)] font-medium">Đang tải thông tin kho...</p>
            </div>
        );
    }

    if (!warehouse) return null;

    const isBookmarked = bookmarkedIds.includes(warehouse.id_warehouse);
    const handleToggleBookmark = () => toggleBookmark(warehouse.id_warehouse);

    const statusKey = String(warehouse.status || '').toUpperCase();
    const statusCfg = STATUS_CFG[statusKey] ?? { label: warehouse.status ?? 'Unknown', badgeClass: 'bg-[rgba(107,114,128,0.1)] text-[var(--color-text-muted)]' };

    // Sum up remaining capacity across all sections — a warehouse is rentable
    // as long as it is approved for operation AND there is at least some
    // capacity left. RENTED with a few empty sections still allows booking.
    const totalAvailableCapacity = (warehouse.sections || []).reduce(
        (sum, s: any) => {
            const avail = Number(s?.availableCapacity ?? s?.available_capacity ?? 0);
            return sum + (Number.isFinite(avail) && avail > 0 ? avail : 0);
        },
        0
    );
    const isOperationallyOpen = statusKey === 'ACTIVE' || statusKey === 'RENTED';
    const isRentable = isOperationallyOpen && totalAvailableCapacity > 0;

    return (
        <div className="min-h-screen bg-[var(--color-bg)] relative">
            <Navbar />



            <WarehouseDetailGallery
                warehouse={warehouse}
                isBookmarked={isBookmarked}
                onToggleBookmark={handleToggleBookmark}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
                {/* ── Title & Quick Nav Row ── */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-4 border-b border-[var(--color-border)] pb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-sm uppercase tracking-wide ${statusCfg.badgeClass}`}>
                                {statusCfg.label}
                            </span>
                            {warehouse.ownerName && (
                                <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                                    {warehouse.ownerName}
                                </span>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Đánh giá</p>
                        <p className="font-bold flex items-center gap-1 mt-0.5">
                            {(warehouse.ratingScore ?? 0) > 0 ? (
                                <>
                                    <Star className="h-4 w-4 text-[#f59e0b] fill-[#f59e0b]" />
                                    {warehouse.ratingScore?.toFixed(1)}{' '}
                                    <span className="text-xs font-normal text-[var(--color-text-muted)]">({warehouse.ratingCount ?? 0})</span>
                                </>
                            ) : (
                                <span className="text-sm font-normal text-[var(--color-text-muted)]">Chưa có đánh giá</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* ── Quick Nav (Mobile only) ── */}
                <div className="lg:hidden mb-6 bento-card overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setQuickNavOpen(v => !v)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-secondary)]"
                    >
                        <List className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                        <span className="font-semibold text-sm flex-1 text-[var(--color-text)]">Điều hướng nhanh</span>
                        {quickNavOpen ? <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />}
                    </button>
                    {quickNavOpen && (
                        <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-[var(--color-border)]">
                            {[
                                { id: 'section-stats', label: 'Thống kê' },
                                { id: 'section-description', label: 'Mô tả' },
                                { id: 'section-location', label: 'Vị trí' },
                                { id: 'section-sections', label: 'Phân khu' },
                                { id: 'section-certifications', label: 'Chứng chỉ' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        setQuickNavOpen(false);
                                    }}
                                    className="px-3 py-2 text-sm text-left border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Main Layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left Column (Info) */}
                    <div className="lg:col-span-3 space-y-6">
                        <WarehouseDetailInfo
                            warehouse={warehouse}
                            selectedTiers={selectedTiers}
                            selectedSectionIds={selectedSectionIds}
                        />

                        {/* ── Reviews Section ── */}
                        <WarehouseReviewsSection
                            warehouseId={warehouse.id_warehouse}
                            warehouseName={warehouse.name}
                            contractId={reviewContractId}
                            contractRef={reviewContractRef}
                            canReview={canReview}
                            refreshKey={reviewRefreshKey}
                            onReviewSubmitted={() => setReviewRefreshKey(k => k + 1)}
                        />
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="lg:col-span-2">
                        <WarehouseDetailSidebar
                            warehouse={warehouse}
                            selectedTiers={selectedTiers}
                            selectedSectionIds={selectedSectionIds}
                            onSelectSectionIds={(ids, clearedTierIds) => {
                                const tierCopy = { ...selectedTiers };
                                clearedTierIds.forEach(id => { delete tierCopy[id]; });
                                setSelectedTiers(tierCopy);
                                setSelectedSectionIds(ids);
                            }}
                            sectionCapacities={sectionCapacities}
                            onSectionCapacitiesChange={setSectionCapacities}
                            onSelectedTiersChange={setSelectedTiers}
                            onOpenRentalModal={() => isRentable && setRentalModalOpen(true)}
                            isRentable={isRentable}
                        />
                    </div>
                </div>
            </div>

            {/* ── Rental Request Modal ── */}
            <RentalRequestModal
                open={rentalModalOpen}
                onOpenChange={setRentalModalOpen}
                warehouse={warehouse}
                selectedSections={(warehouse.sections || []).filter(s =>
                    selectedSectionIds.includes(s.id_section?.toString() || '')
                )}
                selectedTiers={selectedTiers}
                onSelectedTiersChange={setSelectedTiers}
                sectionCapacities={sectionCapacities}
                onSectionCapacitiesChange={setSectionCapacities}
                onRequestSubmitted={() => {
                    setSelectedTiers({});
                    setSelectedSectionIds([]);
                    setSectionCapacities({});
                }}
            />
            <Footer />
        </div>
    );
}