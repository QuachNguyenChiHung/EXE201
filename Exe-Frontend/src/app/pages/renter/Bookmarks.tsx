import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { WarehouseCard } from '../../components/WarehouseCard';
import { Button } from '../../components/ui/button';
import { useApp } from '../../../context/AppContext';
import { CompositeWarehouse } from '../../../types';
import { Heart, Loader2, Sparkles, MessageSquare, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

import { BookmarksHeader } from '../../components/renter/BookmarksHeader';
import { CompareTable } from '../../components/renter/CompareTable';
import { AIPromptModal } from '../../components/renter/AIPromptModal';
import { AIChatCompareSidebar } from '../../components/renter/AIChatCompareSidebar';

type ViewMode = 'list' | 'compare';

export default function Bookmarks() {
    const navigate = useNavigate();
    const { warehouses: allWarehouses, bookmarkedIds, compareIds, toggleCompare, clearCompare, clearAllBookmarks, loading } = useApp();

    const [view, setView] = useState<ViewMode>('list');
    const [showAI, setShowAI] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [aiInitialReq, setAiInitialReq] = useState<string | undefined>();
    const [bestId, setBestId] = useState<number | null>(null);

    const bookmarkedWarehouses = allWarehouses.filter((w) => bookmarkedIds.includes(w.id_warehouse));
    const compareWarehouses = allWarehouses.filter((w) => compareIds.includes(w.id_warehouse));

    const handleClearAll = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa tất cả kho đã lưu?')) return;
        try {
            await clearAllBookmarks();
            toast.success('Đã xóa tất cả kho lưu');
        } catch {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleAnalyze = (req: string) => {
        setAiInitialReq(req);
        setShowPrompt(false);
        setShowAI(true);
    };

    const handleToggleCompare = (id: number) => {
        toggleCompare(id);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
            <Navbar />

            <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8">
                <BookmarksHeader
                    viewMode={view}
                    setViewMode={(v) => {
                        setView(v);
                        if (v === 'compare' && compareWarehouses.length >= 2 && !showAI) {
                            setShowPrompt(true);
                        }
                    }}
                    bookmarkCount={bookmarkedWarehouses.length}
                    compareCount={compareWarehouses.length}
                    onClearAll={handleClearAll}
                />

                {/* ── Compare Toolbar ── */}
                {view === 'compare' && compareWarehouses.length >= 2 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
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
                        {showAI ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowPrompt(true)}
                                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[var(--color-primary)] transition-colors"
                                    style={{ color: 'var(--color-primary)' }}
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Phân tích lại
                                </button>
                                <button
                                    onClick={() => setShowAI(false)}
                                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 border transition-colors border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                                >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Ẩn AI <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAI(true)}
                                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border transition-colors border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                            >
                                <MessageSquare className="h-3.5 w-3.5" />
                                Hiện AI <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}

                {/* ── Empty State ── */}
                {!loading.warehouses && bookmarkedWarehouses.length === 0 && (
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
                {loading.warehouses && (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                    </div>
                )}

                {/* ── List View ── */}
                {!loading.warehouses && view === 'list' && bookmarkedWarehouses.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bookmarkedWarehouses.map((w) => (
                            <WarehouseCard key={w.id_warehouse} warehouse={w} compact />
                        ))}
                    </div>
                )}

                {/* ── Compare View ── */}
                {!loading.warehouses && view === 'compare' && (
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
                                    bestId={bestId}
                                    onRemove={handleToggleCompare}
                                />
                                {showAI && (
                                    <AIChatCompareSidebar
                                        warehouses={compareWarehouses}
                                        initialReq={aiInitialReq}
                                        bestId={bestId}
                                        onBestChange={setBestId}
                                        onClose={() => setShowAI(false)}
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Prompt Modal */}
            {showPrompt && (
                <AIPromptModal
                    count={compareWarehouses.length}
                    onSkip={() => setShowPrompt(false)}
                    onAnalyze={handleAnalyze}
                    onClose={() => setShowPrompt(false)}
                />
            )}

            <Footer />
        </div>
    );
}