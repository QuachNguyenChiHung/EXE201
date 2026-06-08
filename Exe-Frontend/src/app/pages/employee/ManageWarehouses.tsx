import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { CompositeWarehouse } from '../../../types';
import {
  ArrowLeft,
} from 'lucide-react';
import SearchInput from '../../components/SearchInput';
import WarehouseRowComp from '../../components/employee/WarehouseRow';
import ApproveModal from '../../components/employee/ApproveModal';
import ConfirmModal from '../../components/employee/ConfirmModal';
import useWarehouses from '../../hooks/useWarehouses';
import { getUser } from '/src/utils/auth';

// ── Types & constants ───────────────────────────────────────────────────────
type StatusFilter = 'all' | CompositeWarehouse['status'];
const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'active', label: 'Đang hoạt động' },
  { key: 'inactive', label: 'Đã ẩn' },
];

export default function ManageWarehouses() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
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
  const {
    certTypes, certTypesLoading, approveTarget, setApproveTarget,
    ownerEmailMap, filtered, handleApprove, handleDeactivate, handleDeleteImmediate, handleApproveConfirm,
  } = useWarehouses(tab, search);

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
            <WarehouseRowComp key={w.id_warehouse} warehouse={w} ownerEmail={ownerEmailMap[w.id_owner || 0]} onApprove={handleApprove} onDeactivate={handleDeactivate} onDelete={() => setConfirmModal({
              title: 'Xoá kho',
              message: `Bạn có chắc muốn xoá kho "${w.name}" không?`,
              confirmLabel: 'Xoá',
              confirmColor: 'var(--color-error, #ef4444)',
              onConfirm: () => { handleDeleteImmediate(w); setConfirmModal(null); },
            })} />
          ))}
        </div>

        {approveTarget && (
          <ApproveModal warehouse={approveTarget} certTypes={certTypes} certTypesLoading={certTypesLoading} onConfirm={handleApproveConfirm} onCancel={() => setApproveTarget(null)} />
        )}

        {confirmModal && (
          <ConfirmModal title={confirmModal.title} message={confirmModal.message} confirmLabel={confirmModal.confirmLabel} confirmColor={confirmModal.confirmColor} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />
        )}
      </div>
    </div>
  );
}