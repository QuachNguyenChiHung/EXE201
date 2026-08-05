import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { WarehouseCard } from '../../components/WarehouseCard';
import { Button } from '../../components/ui/button';
import { useApp } from '../../../context/AppContext';
import { CompositeWarehouse } from '../../../types';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBookmarks, clearBookmarksState } from '../../../hooks/useBookmarks';
import { renterService } from '../../../services/renterService';

import { BookmarksHeader } from '../../components/renter/BookmarksHeader';
import { CompareTable } from '../../components/renter/CompareTable';

type ViewMode = 'list' | 'compare';

export default function Bookmarks() {
    const navigate = useNavigate();
    const { compareWarehouses, toggleCompare, clearCompare, loading: appLoading } = useApp();
    const { bookmarkedIds } = useBookmarks();

    const [view, setView] = useState<ViewMode>('list');

    const [bookmarkedWarehouses, setBookmarkedWarehouses] = useState<CompositeWarehouse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        renterService.getMyBookmarks()
            .then(setBookmarkedWarehouses)
            .finally(() => setLoading(false));
    }, [bookmarkedIds]); // Re-fetch or locally filter when bookmarkedIds changes

    const handleClearAll = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa tất cả kho đã lưu?')) return;
        try {
            clearBookmarksState();
            setBookmarkedWarehouses([]);
            toast.success('Đã xóa tất cả kho lưu (local)');
        } catch {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleToggleCompare = (id: number) => {
        // Find warehouse by id from compareWarehouses
        const w = compareWarehouses.find(cw => cw.id_warehouse === id);
        if (w) toggleCompare(w);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
            <Navbar />

            <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8">
                <BookmarksHeader
                    viewMode={view}
                    setViewMode={setView}
                    bookmarkCount={bookmarkedWarehouses.length}
                    compareCount={compareWarehouses.length}
                    onClearAll={handleClearAll}
                />

                {/* ── Compare Toolbar ── */}
                {view === 'compare' && compareWarehouses.length >= 2 && (
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-sm font-semibold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1.5">
                            Đang so sánh: <span className="text-[var(--color-primary)]">{compareWarehouses.length}</span> kho
                        </span>
                        <button
                            onClick={clearCompare}
                            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] underline"
                        >
                            Bỏ chọn tất cả
                        </button>
                    </div>
                )}

                {/* ── Empty State ── */}
                {!loading && bookmarkedWarehouses.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div
                            className="w-20 h-20 flex items-center justify-center bg-[rgba(239,68,68,0.08)]"
                        >
                            <Heart className="h-10 w-10 text-[var(--color-error)] opacity-50" />
                        </div>
                        <p className="text-lg font-semibold text-[var(--color-text)]">
                            Chưa có kho nào được lưu
                        </p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Nhấn vào biểu tượng ♥ trên thẻ kho lạnh để lưu vào đây
                        </p>
                        <Button
                            onClick={() => navigate('/renter/search')}
                            className="rounded-none bg-[var(--color-primary)] text-white mt-2"
                        >
                            Tìm kiếm kho lạnh
                        </Button>
                    </div>
                )}

                {/* ── Loading ── */}
                {loading && (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                    </div>
                )}

                {/* ── List View ── */}
                {!loading && view === 'list' && bookmarkedWarehouses.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bookmarkedWarehouses.map((w) => (
                            <WarehouseCard key={w.id_warehouse} warehouse={w} compact />
                        ))}
                    </div>
                )}

                {/* ── Compare View ── */}
                {!loading && view === 'compare' && (
                    <>
                        {compareWarehouses.length < 2 ? (
                            <div className="text-center py-16">
                                <p className="text-[var(--color-text-secondary)]">
                                    Chọn ít nhất 2 kho trong danh sách để xem bảng so sánh.
                                </p>
                                <Button className="mt-4 rounded-none" onClick={() => setView('list')}>
                                    Quay lại danh sách
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-0 border border-[var(--color-border)] min-h-[600px] bg-[var(--color-surface)] shadow-sm">
                                <CompareTable
                                    warehouses={compareWarehouses}
                                    onRemove={handleToggleCompare}
                                />
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}