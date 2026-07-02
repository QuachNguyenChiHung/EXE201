import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { ownerService } from '../../../services/ownerService';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
  Warehouse, Plus, EyeOff, Eye, AlertTriangle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { CompositeWarehouse } from '../../../types';
import { MyWarehouseCard } from '../../components/owner/MyWarehouseCard';
import { MyWarehouseCertsModal } from '../../components/owner/MyWarehouseCertsModal';
import { useApp } from '../../../context/AppContext';

type StatusFilter = 'all' | 'active' | 'inactive' | 'pending';
const TABS: { key: StatusFilter; label: string; icon: any }[] = [
  { key: 'all', label: 'Tất cả', icon: Warehouse },
  { key: 'active', label: 'Đang hoạt động', icon: Eye },
  { key: 'pending', label: 'Chờ duyệt', icon: Clock },
  { key: 'inactive', label: 'Đã ẩn', icon: EyeOff },
];

export default function MyWarehouses() {
  const navigate  = useNavigate();
  const { warehouseRevision } = useApp();
  const [user] = useState(() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } });
  
  const [tab, setTab] = useState<StatusFilter>('all');
  const [warehouses, setWarehouses] = useState<CompositeWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reuploadTarget, setReuploadTarget] = useState<CompositeWarehouse | null>(null);

  // Pagination & Caching
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [cache, setCache] = useState<Record<string, { list: CompositeWarehouse[], totalPages: number, totalElements: number }>>({});
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0, active: 0, inactive: 0, pending: 0 });

  const fetchPage = useCallback(async (p: number, t: StatusFilter, isPreload: boolean = false, forceRefetch: boolean = false) => {
    const cacheKey = `${t}_${p}`;
    if (!forceRefetch && cache[cacheKey]) {
      if (!isPreload) {
        setWarehouses(cache[cacheKey].list);
        setTotalPages(cache[cacheKey].totalPages);
        setTotalElements(cache[cacheKey].totalElements);
        setLoading(false);
      }
      return cache[cacheKey];
    }

    if (!isPreload) setLoading(true);
    try {
      const dataRes = await ownerService.getMyWarehouses(p, 10, t === 'all' ? undefined : t);
      const newData = { list: dataRes.content, totalPages: dataRes.totalPages, totalElements: dataRes.totalElements };
      setCache(prev => ({ ...prev, [cacheKey]: newData }));

      if (!isPreload) {
        setWarehouses(dataRes.content);
        setTotalPages(dataRes.totalPages);
        setTotalElements(dataRes.totalElements);
      }
      return newData;
    } catch (err: any) {
      if (!isPreload) toast.error('Không tải được danh sách kho');
    } finally {
      if (!isPreload) setLoading(false);
    }
  }, [cache, warehouseRevision]);

  const refreshTabCounts = () => {
    const tabs: StatusFilter[] = ['all', 'active', 'inactive', 'pending'];
    for (const t of tabs) {
      fetchPage(0, t, true, true).then(data => {
        if (data) setCounts(prev => ({ ...prev, [t]: data.totalElements }));
      });
    }
  };

  // Preload tab counts
  useEffect(() => {
    if (!user || user.role !== 'OWNER') return;
    const tabs: StatusFilter[] = ['all', 'active', 'inactive', 'pending'];
    for (const currentTab of tabs) {
      fetchPage(0, currentTab, true, true).then(data => {
        if (data) setCounts(prev => ({ ...prev, [currentTab]: data.totalElements }));
      });
    }
  }, []);

  // Fetch current page and preload next page
  useEffect(() => {
    if (!user || user.role !== 'OWNER') return;
    fetchPage(page, tab, false, true).then(data => {
      if (data && page < data.totalPages - 1) {
        fetchPage(page + 1, tab, true, true);
      }
    });
  }, [page, tab]);

  // Skip the initial mount — the "Preload tab counts" and "Fetch current page" effects handle that.
  // This effect only fires when warehouseRevision increments (i.e. employee changed a status).
  const warehouseRevisionRef = useRef(warehouseRevision);
  useEffect(() => {
    if (!user || user.role !== 'OWNER') return;
    if (warehouseRevision === warehouseRevisionRef.current) return;
    warehouseRevisionRef.current = warehouseRevision;
    setCache({});
    setPage(0);
    refreshTabCounts();
    fetchPage(0, tab, false, true);
  }, [warehouseRevision]);

  const handleHide = async (warehouse: CompositeWarehouse) => {
    if (!confirm(`Ẩn kho "${warehouse.name}"? Kho sẽ không hiển thị cho người thuê nhưng bạn có thể khôi phục bất cứ lúc nào.`)) return;
    try {
      await ownerService.hideWarehouse(warehouse.id_warehouse);
      toast.success(`Đã ẩn kho "${warehouse.name}".`);
      setCache({});
      setPage(0);
      refreshTabCounts();
      fetchPage(0, tab, false, true);
    } catch (err: any) {
      toast.error('Không thể ẩn kho');
    }
  };

  const handleRestore = async (warehouse: CompositeWarehouse) => {
    try {
      await ownerService.restoreWarehouse(warehouse.id_warehouse);
      toast.success(`Đã khôi phục kho "${warehouse.name}".`);
      setCache({});
      setPage(0);
      refreshTabCounts();
      fetchPage(0, tab, false, true);
    } catch (err: any) {
      toast.error('Không thể khôi phục kho');
    }
  };

  const handleCertSaved = async (updated: CompositeWarehouse) => {
    try {
      await ownerService.updateWarehouse(updated.id_warehouse, updated);
      toast.success(`Đã cập nhật chứng nhận cho kho "${updated.name}".`);
      setCache({});
      refreshTabCounts();
      fetchPage(page, tab, false, true);
      setReuploadTarget(null);
    } catch (err: any) {
      toast.error('Không thể cập nhật chứng nhận');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Kho lạnh của tôi</h1>
            <p className="text-[var(--color-text-secondary)]">
              Quản lý {counts.all} kho lạnh của bạn
            </p>
          </div>
          <Button onClick={() => navigate('/warehouse/add')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Thêm kho mới
          </Button>
        </div>

        <div className="flex items-center gap-1 mb-6 border-b border-[var(--color-border)] overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setPage(0); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                  tab === t.key
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
                }`}>
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        {!['inactive', 'pending'].includes(tab) && counts.pending > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 mb-5 border border-blue-200 rounded-lg"
            style={{ background: 'rgba(37,99,235,0.06)' }}
          >
            <Clock className="h-4 w-4 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-700">
              Bạn có <strong>{counts.pending} kho đang chờ duyệt</strong>. Nhân viên Logicha sẽ xem xét và kích hoạt kho của bạn sớm nhất có thể.
            </p>
          </div>
        )}

        {tab === 'inactive' && counts.inactive > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 mb-5 border border-amber-200 rounded-lg"
            style={{ background: 'rgba(245,158,11,0.06)' }}
          >
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">
              Các kho đã ẩn sẽ không hiển thị cho người thuê. Bạn có thể khôi phục bất cứ lúc nào.
            </p>
          </div>
        )}

        {loading ? (
             <div className="flex justify-center items-center py-12 border border-[var(--color-border)] rounded bg-[var(--color-surface)]">
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]"></div>
             </div>
        ) : warehouses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {warehouses.map((warehouse) => (
              <MyWarehouseCard
                key={warehouse.id_warehouse}
                warehouse={warehouse}
                isHidden={warehouse.status === 'inactive' || warehouse.status === 'hidden'}
                isPending={warehouse.status === 'pending'}
                onRestore={handleRestore}
                onHide={handleHide}
                onReuploadCerts={setReuploadTarget}
              />
            ))}
          </div>
        ) : (
          <Card className="bento-card p-12 text-center">
            {tab === 'inactive' ? (
              <>
                <EyeOff className="h-16 w-16 mx-auto mb-4 text-[var(--color-text-muted)]" />
                <h3 className="text-xl font-semibold mb-2">Không có kho nào bị ẩn</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  Tất cả kho lạnh của bạn đang hoạt động bình thường
                </p>
                <Button variant="outline" onClick={() => setTab('active')}>
                  Xem kho đang hoạt động
                </Button>
              </>
            ) : (
              <>
                <Warehouse className="h-16 w-16 mx-auto mb-4 text-[var(--color-text-muted)]" />
                <h3 className="text-xl font-semibold mb-2">Chưa có kho lạnh nào</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  {tab === 'pending' ? 'Bạn không có kho nào đang chờ duyệt' : 'Bắt đầu bằng cách thêm kho lạnh đầu tiên'}
                </p>
                <Button onClick={() => navigate('/warehouse/add')}>
                  Thêm kho mới
                </Button>
              </>
            )}
          </Card>
        )}
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded mt-4">
            <span className="text-sm text-[var(--color-text-secondary)]">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Re-upload Certs Modal ── */}
      {reuploadTarget && (
        <MyWarehouseCertsModal
          warehouse={reuploadTarget}
          onClose={() => setReuploadTarget(null)}
          onSaved={handleCertSaved}
        />
      )}
    </div>
  );
}
