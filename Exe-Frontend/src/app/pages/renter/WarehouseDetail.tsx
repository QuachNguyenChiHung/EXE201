import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from '../../components/Footer';
import { CompositeWarehouse } from "../../../types";
import { useApp } from "../../../context/AppContext";
import { toast } from "sonner";
import { Star, List, ChevronUp, ChevronDown } from "lucide-react";

import { WarehouseDetailGallery } from "../../components/renter/WarehouseDetailGallery";
import { WarehouseDetailInfo } from "../../components/renter/WarehouseDetailInfo";
import { WarehouseDetailSidebar } from "../../components/renter/WarehouseDetailSidebar";
import { AIChatPanel } from "../../components/renter/AIChatPanel";

export default function WarehouseDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { bookmarkedIds, toggleBookmark, warehouses: warehouseList, ratings: allRatings } = useApp();

    const [warehouse, setWarehouse] = useState<CompositeWarehouse | null>(null);
    const [loading, setLoading] = useState(true);
    const [quickNavOpen, setQuickNavOpen] = useState(false);

    // Ratings for this warehouse
    const warehouseRatings = allRatings.filter(r => r.warehouse_id?.toString() === id);
    const avgRating = warehouseRatings.length
        ? warehouseRatings.reduce((sum, r) => sum + r.rate, 0) / warehouseRatings.length
        : 0;

    useEffect(() => {
        if (!id) return;
        const fromStore = (warehouseList as any[]).find(w => w.id_warehouse?.toString() === id);
        if (fromStore) {
            setWarehouse(fromStore);
            setLoading(false);
            return;
        }
        // Fallback to API if not in store
        import("../../../services/apiClient").then(({ warehousesAPI }) => {
            warehousesAPI.getById(id)
                .then(data => {
                    if (data) setWarehouse(data);
                    else { toast.error("Không tìm thấy kho lạnh"); navigate("/renter/search"); }
                })
                .catch(() => { toast.error("Không tìm thấy kho lạnh"); navigate("/renter/search"); })
                .finally(() => setLoading(false));
        });
    }, [id, warehouseList, navigate]);

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
                            {warehouse.status === 'active' ? (
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-sm uppercase tracking-wide bg-[rgba(34,197,94,0.1)] text-[var(--color-success)]">
                                    Đang hoạt động
                                </span>
                            ) : (
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-sm uppercase tracking-wide bg-[rgba(245,158,11,0.1)] text-[var(--color-warning)]">
                                    Bảo trì
                                </span>
                            )}
                            <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                                {warehouse.ownerName}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Đánh giá</p>
                        <p className="font-bold flex items-center gap-1 mt-0.5">
                            {warehouseRatings.length > 0 ? (
                                <>
                                    <Star className="h-4 w-4 text-[#f59e0b] fill-[#f59e0b]" />
                                    {avgRating.toFixed(1)}{' '}
                                    <span className="text-xs font-normal text-[var(--color-text-muted)]">({warehouseRatings.length})</span>
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
                    <div className="lg:col-span-3">
                        <WarehouseDetailInfo warehouse={warehouse} />
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div className="lg:col-span-2">
                        <WarehouseDetailSidebar warehouse={warehouse} />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}