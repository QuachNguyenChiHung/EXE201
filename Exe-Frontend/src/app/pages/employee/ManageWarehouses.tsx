import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { CompositeWarehouse, CertificationType, CertificationSubmit } from '../../../types';
import { WarehouseEmployeeDTO } from '../../../types/employee';
import { ArrowLeft } from 'lucide-react';
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
];

export default function ManageWarehouses() {
  const navigate = useNavigate();
  const { users } = useApp();

  const [tab, setTab] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [warehouses, setWarehouses] = useState<CompositeWarehouse[]>([]);
  const [loading, setLoading] = useState(false);

  const [certTypes, setCertTypes] = useState<CertificationType[]>([]);
  const [certTypesLoading, setCertTypesLoading] = useState(false);

  const [reviewingCert, setReviewingCert] = useState<CertificationSubmit | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    title: string; message: string; confirmLabel: string; confirmColor: string; onConfirm: () => void;
  } | null>(null);

  const user = getUser();
  useEffect(() => {
    if (!user || user.role !== 'EMPLOYEE') {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    let mounted = true;
    setCertTypesLoading(true);
    employeeService.getCertTypes().then(res => { if (mounted) setCertTypes(res || []); }).catch(() => { }).finally(() => { if (mounted) setCertTypesLoading(false); });
    return () => { mounted = false; };
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      let data: WarehouseEmployeeDTO[] = [];
      if (tab === 'all') {
        data = await employeeService.getAllWarehouses();
      } else if (tab === 'pending') {
        data = await employeeService.getPendingWarehouses();
      }

      const mappedData = (data || []).map((w: WarehouseEmployeeDTO) => {
        let st: string = w.status;
        if (st === 'PENDING') st = 'pending';
        if (st === 'APPROVED') st = 'active';
        if (st === 'HIDDEN') st = 'inactive';
        if (st === 'REJECTED') st = 'rejected';
        return { ...w, status: st } as unknown as CompositeWarehouse;
      });

      setWarehouses(mappedData);
    } catch (err: any) {
      console.error('Failed to fetch warehouses', err);
      toast.error('Không tải được danh sách kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [tab]);

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

  const handleReviewCert = async (isVerified: boolean, typeId: number | null) => {
    if (!reviewingCert) return;
    try {
        const certId = (reviewingCert as any).id_cerfSubmit || (reviewingCert as any).id;
        await employeeService.reviewWarehouseCertification(certId, {
            isVerified,
            typeId
        });
        toast.success(isVerified ? 'Đã duyệt chứng nhận!' : 'Đã từ chối chứng nhận!');
        setReviewingCert(null);
        // We probably want to re-fetch or the user will just close the row and reopen it.
        // For now, refreshing the whole list is the safest to keep it in sync.
        fetchWarehouses();
    } catch (err) {
        toast.error('Có lỗi xảy ra khi xét duyệt chứng nhận.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quản lý kho</h2>
          <div className="w-80">
            <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc thành phố" />
          </div>
        </div>

        <div className="mb-3 flex gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1 text-sm border ${tab === t.key ? 'bg-[var(--color-primary)] text-white' : ''}`}>{t.label}</button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(w => (
            <WarehouseRowComp key={w.id_warehouse} warehouse={w} ownerEmail={ownerEmailMap[w.id_owner || 0]} onApprove={handleApprove} onReject={handleReject} onDeactivate={handleDeactivate} onReviewCert={(cert) => setReviewingCert(cert)} onDelete={() => setConfirmModal({
              title: 'Xoá kho',
              message: `Bạn có chắc muốn xoá kho "${w.name}" không?`,
              confirmLabel: 'Xoá',
              confirmColor: 'var(--color-error, #ef4444)',
              onConfirm: () => { handleDeleteImmediate(w); setConfirmModal(null); },
            })} />
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