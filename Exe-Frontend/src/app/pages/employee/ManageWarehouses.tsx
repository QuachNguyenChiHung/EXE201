import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { CompositeWarehouse, CertificationType, CertificationSubmit } from '../../../types';
import { WarehouseEmployeeDTO } from '../../../types/employee';
import { ArrowLeft, Warehouse } from 'lucide-react';
import SearchInput from '../../components/SearchInput';
import WarehouseRowComp from '../../components/employee/WarehouseRow';
import ConfirmModal from '../../components/employee/ConfirmModal';
import { getUser } from '/src/utils/auth';
import { employeeService } from '../../../services/employeeService';
import ApproveModal from '../../components/employee/ApproveModal';
import { toast } from 'sonner';

// ── Types & constants ───────────────────────────────────────────────────────
type StatusFilter = 'all' | CompositeWarehouse['status'];
const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'active', label: 'Đang hoạt động' },
  { key: 'rejected', label: 'Đã từ chối' },
];

export default function ManageWarehouses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { users, incrementWarehouseRevision } = useApp();

  const [tab, setTab] = useState<StatusFilter>('all');
  const [search, setSearch] = useState(location.state?.searchWarehouse || '');
  const [warehouses, setWarehouses] = useState<CompositeWarehouse[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination & Caching
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [cache, setCache] = useState<Record<string, { list: CompositeWarehouse[], totalPages: number, totalElements: number }>>({});
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0, pending: 0, active: 0, rejected: 0 });

  const [confirmModal, setConfirmModal] = useState<{
    title: string; message: string; confirmLabel: string; confirmColor: string; onConfirm: () => void;
  } | null>(null);

  const [reviewingCert, setReviewingCert] = useState<CertificationSubmit | null>(null);
  const [certTypes, setCertTypes] = useState<CertificationType[]>([]);
  const [certTypesLoading, setCertTypesLoading] = useState(false);
  const [refetchCounter, setRefetchCounter] = useState(0);

  const user = getUser();
  useEffect(() => {
    if (!user || user.role !== 'EMPLOYEE') {
      navigate('/login');
      return;
    }
  }, [user?.role, user?.id_user, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'EMPLOYEE') return;
    let mounted = true;
    setCertTypesLoading(true);
    employeeService.getCertTypes().then(res => { if (mounted) setCertTypes(res || []); }).catch(() => { }).finally(() => { if (mounted) setCertTypesLoading(false); });
    return () => { mounted = false; };
  }, []);

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
      // Map frontend tab key → backend WarehouseStatus enum (must be UPPERCASE)
      const statusParam = t === 'all' ? undefined : t.toUpperCase();
      const dataRes = await employeeService.getAllWarehouses(p, 10, statusParam);

      const mappedData = (dataRes.content || []).map((w: WarehouseEmployeeDTO) => {
        let st: string = w.status;
        if (st === 'PENDING' || st === 'pending') st = 'pending';
        if (st === 'APPROVED' || st === 'ACTIVE' || st === 'active') st = 'active';
        if (st === 'HIDDEN' || st === 'INACTIVE' || st === 'inactive') st = 'inactive';
        if (st === 'REJECTED' || st === 'rejected') st = 'rejected';
        return { ...w, status: st } as unknown as CompositeWarehouse;
      });

      const newData = { list: mappedData, totalPages: dataRes.totalPages, totalElements: dataRes.totalElements };
      setCache(prev => ({ ...prev, [cacheKey]: newData }));

      if (!isPreload) {
        setWarehouses(mappedData);
        setTotalPages(dataRes.totalPages);
        setTotalElements(dataRes.totalElements);
      }
      return newData;
    } catch (err: any) {
      console.error('Failed to fetch warehouses', err);
      if (!isPreload) toast.error('Không tải được danh sách kho');
    } finally {
      if (!isPreload) setLoading(false);
    }
  }, [cache]);


  // Preload tab counts
  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'EMPLOYEE') return;

    const tabs: StatusFilter[] = ['all', 'pending', 'active', 'rejected'];
    for (const currentTab of tabs) {
      fetchPage(0, currentTab, true).then(data => {
        if (data) setCounts(prev => ({ ...prev, [currentTab]: data.totalElements }));
      });
    }
  }, []);

  // Fetch current page and preload next page
  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'EMPLOYEE') return;

    fetchPage(page, tab).then(data => {
      if (data && page < data.totalPages - 1) {
        fetchPage(page + 1, tab, true);
      }
    });
  }, [page, tab]);

  const ownerEmailMap = useMemo(() => {
    const m: Record<string, string> = {};
    users.forEach(u => { if (u.id_user) m[u.id_user] = u.email || ''; });
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    if (!search) return warehouses;
    const q = search.toLowerCase();
    return warehouses.filter(w =>
      w.name.toLowerCase().includes(q) || (w.location_province || '').toLowerCase().includes(q)
    );
  }, [warehouses, search]);

  const handleApprove = (w: CompositeWarehouse) => {
    setConfirmModal({
      title: 'Duyệt kho',
      message: `Bạn có chắc muốn duyệt kho "${w.name}" và kích hoạt cho thuê không?`,
      confirmLabel: 'Duyệt',
      confirmColor: 'var(--color-success, #22c55e)',
      onConfirm: () => { handleApproveImmediate(w); setConfirmModal(null); },
    });
  };

  const handleReject = (w: CompositeWarehouse) => {
    setConfirmModal({
      title: 'Từ chối kho',
      message: `Bạn có chắc muốn từ chối phê duyệt kho "${w.name}" không?`,
      confirmLabel: 'Từ chối',
      confirmColor: 'var(--color-error, #ef4444)',
      onConfirm: () => { handleRejectImmediate(w); setConfirmModal(null); },
    });
  };

  const handleApproveImmediate = async (w: CompositeWarehouse) => {
    const prevStatus = w.status;
    // Optimistic update
    setWarehouses(prev => prev.map(wh =>
      wh.id_warehouse === w.id_warehouse ? { ...wh, status: 'active' } : wh
    ));
    try {
      await employeeService.acceptWarehouse(w.id_warehouse);
      toast.success('Kho đã được duyệt');
      incrementWarehouseRevision();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi duyệt kho');
      // Rollback on failure
      setWarehouses(prev => prev.map(wh =>
        wh.id_warehouse === w.id_warehouse ? { ...wh, status: prevStatus } : wh
      ));
      return;
    }
    setCache({});
    setPage(0);
    refreshTabCounts();
    fetchPage(0, tab, false, true);
  };

  const handleRejectImmediate = async (w: CompositeWarehouse) => {
    const prevStatus = w.status;
    // Optimistic update
    setWarehouses(prev => prev.map(wh =>
      wh.id_warehouse === w.id_warehouse ? { ...wh, status: 'rejected' } : wh
    ));
    try {
      await employeeService.rejectWarehouse(w.id_warehouse);
      toast.success('Kho đã bị từ chối');
      incrementWarehouseRevision();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi từ chối kho');
      // Rollback on failure
      setWarehouses(prev => prev.map(wh =>
        wh.id_warehouse === w.id_warehouse ? { ...wh, status: prevStatus } : wh
      ));
      return;
    }
    setCache({});
    setPage(0);
    refreshTabCounts();
    fetchPage(0, tab, false, true);
  };

  const handleDeactivate = async (w: CompositeWarehouse) => {
    const prevStatus = w.status;
    // Optimistic update
    setWarehouses(prev => prev.map(wh =>
      wh.id_warehouse === w.id_warehouse ? { ...wh, status: 'inactive' } : wh
    ));
    try {
      // await employeeService.hideWarehouse(w.id_warehouse);
      toast.info('API ẩn kho chưa được hỗ trợ');
    } catch (err) {
      toast.error('Có lỗi xảy ra khi ẩn kho');
      // Rollback
      setWarehouses(prev => prev.map(wh =>
        wh.id_warehouse === w.id_warehouse ? { ...wh, status: prevStatus } : wh
      ));
      return;
    }
    setCache({});
    refreshTabCounts();
    fetchPage(page, tab);
  };

  const handleDeleteImmediate = async (w: CompositeWarehouse) => {
    const prevStatus = w.status;
    // Optimistic update
    setWarehouses(prev => prev.map(wh =>
      wh.id_warehouse === w.id_warehouse ? { ...wh, status: 'rejected' } : wh
    ));
    try {
      await employeeService.rejectWarehouse(w.id_warehouse);
      toast.success('Đã xoá / từ chối kho');
      incrementWarehouseRevision();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi xoá kho');
      // Rollback on failure
      setWarehouses(prev => prev.map(wh =>
        wh.id_warehouse === w.id_warehouse ? { ...wh, status: prevStatus } : wh
      ));
      return;
    }
    setCache({});
    setPage(0);
    refreshTabCounts();
    fetchPage(0, tab, false, true);
  };

  const refreshTabCounts = () => {
    const tabs: StatusFilter[] = ['all', 'pending', 'active', 'rejected'];
    for (const t of tabs) {
      fetchPage(0, t, true).then(data => {
        if (data) setCounts(prev => ({ ...prev, [t]: data.totalElements }));
      });
    }
  };

  const handleReviewCert = async (status: string, typeId: number | null, rejectReason?: string) => {
    if (!reviewingCert) return;
    try {
        const certId = (reviewingCert as any).id_cerfSubmit || (reviewingCert as any).id;
        await employeeService.reviewWarehouseCertification(certId, {
            status,
            typeId,
            rejectReason
        });
        toast.success(status === 'VERIFIED' ? 'Đã duyệt chứng nhận!' : 'Đã từ chối chứng nhận!');
        incrementWarehouseRevision();
        setReviewingCert(null);
        setCache({});
        refreshTabCounts();
        fetchPage(page, tab, false, true);
        setRefetchCounter(prev => prev + 1);
    } catch (err) {
        toast.error('Có lỗi xảy ra khi xét duyệt chứng nhận.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="bento-container">
        <div className="bento-header">
          <button onClick={() => navigate('/employee')}
            className="flex items-center gap-1 text-sm mb-2 hover:underline transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}>
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-primary)' }}>
                <Warehouse className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Quản lý kho</h1>
                <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
                  Xem và quản lý {totalElements} kho trên nền tảng
                </p>
              </div>
            </div>
            <div className="w-full sm:w-80">
              <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc thành phố" />
            </div>
          </div>
        </div>

        <div className="mb-3 flex gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(0); }} className={`px-3 py-1 text-sm border flex items-center gap-1 ${tab === t.key ? 'bg-[var(--color-primary)] text-white' : ''}`}>
              {t.label} <span className="bg-white/20 px-1 rounded text-xs">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
             <div className="flex justify-center items-center py-12 border border-[var(--color-border)] rounded bg-[var(--color-surface)]">
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]"></div>
             </div>
          ) : filtered.length === 0 ? (
             <div className="border border-[var(--color-border)] p-16 text-center" style={{ background: 'var(--color-surface)' }}>
                <Warehouse className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>Không có kho nào.</p>
             </div>
          ) : filtered.map(w => (
            <WarehouseRowComp key={w.id_warehouse} warehouse={w} ownerEmail={ownerEmailMap[w.id_owner || 0]} expandWarehouseId={location.state?.expandWarehouseId} onApprove={handleApprove} onReject={handleReject} onDeactivate={handleDeactivate} onReviewCert={(cert) => setReviewingCert(cert)} onDelete={() => setConfirmModal({
              title: 'Xoá kho',
              message: `Bạn có chắc muốn xoá kho "${w.name}" không?`,
              confirmLabel: 'Xoá',
              confirmColor: 'var(--color-error, #ef4444)',
              onConfirm: () => { handleDeleteImmediate(w); setConfirmModal(null); },
            })} refetchCounter={refetchCounter} />
          ))}
        </div>
        
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

        {confirmModal && (
          <ConfirmModal title={confirmModal.title} message={confirmModal.message} confirmLabel={confirmModal.confirmLabel} confirmColor={confirmModal.confirmColor} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />
        )}

        {reviewingCert && (
            <ApproveModal 
                cert={reviewingCert} 
                certTypes={certTypes} 
                certTypesLoading={certTypesLoading} 
                onConfirm={handleReviewCert} 
                onCancel={() => setReviewingCert(null)} 
            />
        )}
      </div>
    </div>
  );
}
