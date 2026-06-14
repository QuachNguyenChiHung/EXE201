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
  const { users } = useApp();

  const [tab, setTab] = useState<StatusFilter>('all');
  const [search, setSearch] = useState(location.state?.searchWarehouse || '');
  const [warehouses, setWarehouses] = useState<CompositeWarehouse[]>([]);
  const [loading, setLoading] = useState(false);

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

  const fetchWarehouses = useCallback(async () => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'EMPLOYEE') return;
    setLoading(true);
    try {
      let data: WarehouseEmployeeDTO[] = [];
      if (tab === 'pending') {
        data = await employeeService.getPendingWarehouses();
      } else {
        data = await employeeService.getAllWarehouses();
      }

      const mappedData = (data || []).map((w: WarehouseEmployeeDTO) => {
        let st: string = w.status;
        if (st === 'PENDING') st = 'pending';
        if (st === 'APPROVED' || st === 'ACTIVE') st = 'active';
        if (st === 'HIDDEN' || st === 'INACTIVE') st = 'inactive';
        if (st === 'REJECTED') st = 'rejected';
        return { ...w, status: st } as unknown as CompositeWarehouse;
      });

      if (tab === 'all' || tab === 'pending') {
        setWarehouses(mappedData);
      } else {
        setWarehouses(mappedData.filter(w => w.status === tab));
      }
    } catch (err: any) {
      console.error('Failed to fetch warehouses', err);
      toast.error('Không tải được danh sách kho');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

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
    try {
      await employeeService.acceptWarehouse(w.id_warehouse);
      toast.success('Kho đã được duyệt');
      fetchWarehouses();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi duyệt kho');
    }
  };

  const handleRejectImmediate = async (w: CompositeWarehouse) => {
    try {
      await employeeService.rejectWarehouse(w.id_warehouse);
      toast.success('Kho đã bị từ chối');
      fetchWarehouses();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi từ chối kho');
    }
  };

  const handleDeactivate = async (w: CompositeWarehouse) => {
    try {
      // await employeeService.hideWarehouse(w.id_warehouse);
      toast.info('API ẩn kho chưa được hỗ trợ');
      fetchWarehouses();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi ẩn kho');
    }
  };

  const handleDeleteImmediate = async (w: CompositeWarehouse) => {
    try {
      await employeeService.rejectWarehouse(w.id_warehouse);
      toast.success('Đã xoá / từ chối kho');
      fetchWarehouses();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi xoá kho');
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
        setReviewingCert(null);
        // We probably want to re-fetch or the user will just close the row and reopen it.
        // For now, refreshing the whole list is the safest to keep it in sync.
        fetchWarehouses();
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
                  Xem và quản lý {warehouses.length} kho trên nền tảng
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
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1 text-sm border ${tab === t.key ? 'bg-[var(--color-primary)] text-white' : ''}`}>{t.label}</button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(w => (
            <WarehouseRowComp key={w.id_warehouse} warehouse={w} ownerEmail={ownerEmailMap[w.id_owner || 0]} expandWarehouseId={location.state?.expandWarehouseId} onApprove={handleApprove} onReject={handleReject} onDeactivate={handleDeactivate} onReviewCert={(cert) => setReviewingCert(cert)} onDelete={() => setConfirmModal({
              title: 'Xoá kho',
              message: `Bạn có chắc muốn xoá kho "${w.name}" không?`,
              confirmLabel: 'Xoá',
              confirmColor: 'var(--color-error, #ef4444)',
              onConfirm: () => { handleDeleteImmediate(w); setConfirmModal(null); },
            })} refetchCounter={refetchCounter} />
          ))}
        </div>

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
