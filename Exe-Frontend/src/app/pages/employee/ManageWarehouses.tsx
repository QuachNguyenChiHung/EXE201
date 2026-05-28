import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { ColdStorage, CertificationType, Certification } from '../../../types';
import { certTypesAPI } from '../../../services/apiClient';
import {
  Warehouse, CheckCircle, XCircle, Trash2,
  MapPin, Package, Thermometer, Clock, Search,
  ChevronDown, ChevronUp, AlertCircle, ArrowLeft,
  Building, DollarSign, Shield, LayoutGrid,
  Loader2, FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
type StatusFilter = 'all' | ColdStorage['status'];
const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all',      label: 'Tất cả'       },
  { key: 'pending',  label: 'Chờ duyệt'    },
  { key: 'active',   label: 'Đang hoạt động' },
  { key: 'inactive', label: 'Đã ẩn'        },
];

const STATUS_CFG: Record<ColdStorage['status'], { label: string; color: string }> = {
  pending:  { label: 'Chờ duyệt',       color: 'var(--color-warning, #f59e0b)' },
  active:   { label: 'Đang hoạt động',  color: 'var(--color-success, #22c55e)' },
  inactive: { label: 'Đã ẩn / vô hiệu', color: 'var(--color-text-muted)'       },
};

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({
  title, message, confirmLabel, confirmColor, onConfirm, onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', zIndex: 'var(--z-modal-backdrop)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-sm border border-[var(--color-border)] bg-[var(--color-surface)]"
        style={{ zIndex: 'var(--z-modal)' }}>
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{title}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2 text-sm border border-[var(--color-border)]"
            style={{ color: 'var(--color-text-secondary)' }}>
            Huỷ
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2 text-sm text-white"
            style={{ background: confirmColor }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approve modal with certification selection ────────────────────────────────
function ApproveModal({
  warehouse, certTypes, certTypesLoading, onConfirm, onCancel,
}: {
  warehouse: ColdStorage;
  certTypes: CertificationType[];
  certTypesLoading: boolean;
  onConfirm: (selectedCerts: Certification[]) => void;
  onCancel: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const existing = new Set(warehouse.certifications.map(c => c.name));
    const ids = new Set<string>();
    certTypes.forEach(ct => { if (existing.has(ct.name) || existing.has(ct.code)) ids.add(ct.id); });
    return ids;
  });

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const certs: Certification[] = certTypes
      .filter(ct => selectedIds.has(ct.id))
      .map(ct => ({
        id: ct.id,
        name: ct.name,
        issuer: 'Verified by Logicha',
        issueDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      }));
    onConfirm(certs);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', zIndex: 'var(--z-modal-backdrop)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-lg border border-[var(--color-border)] bg-[var(--color-surface)] max-h-[90vh] flex flex-col"
        style={{ zIndex: 'var(--z-modal)' }}>
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" style={{ color: 'var(--color-success, #22c55e)' }} />
            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Duyệt & Xác nhận chứng nhận</p>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Kho: <strong>{warehouse.name}</strong>
          </p>
        </div>

        <div className="px-5 py-3 border-b border-[var(--color-border)]"
          style={{ background: 'rgba(37,99,235,0.04)' }}>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Dựa trên tài liệu PDF mà chủ kho đã nộp, hãy chọn các chứng nhận đã được xác minh.
              Kho sẽ được kích hoạt và hiển thị trên nền tảng với các chứng nhận đã chọn.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {certTypesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : certTypes.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Chưa có loại chứng nhận nào. Vui lòng thêm tại trang quản lý chứng nhận.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {certTypes.map(ct => {
                const isSelected = selectedIds.has(ct.id);
                return (
                  <label key={ct.id}
                    className="flex items-start gap-3 p-3 border cursor-pointer transition-colors select-none"
                    style={{
                      borderColor: isSelected ? 'var(--color-success, #22c55e)' : 'var(--color-border)',
                      background: isSelected ? 'rgba(34,197,94,0.05)' : 'transparent',
                    }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggle(ct.id)}
                      className="w-4 h-4 mt-0.5 accent-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-white text-[10px] px-1.5 py-0.5 font-semibold shrink-0"
                          style={{ background: isSelected ? 'var(--color-success, #22c55e)' : 'var(--color-text-muted)' }}>
                          <Shield className="h-2.5 w-2.5" /> {ct.code}
                        </span>
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{ct.name}</span>
                      </div>
                      <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>{ct.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {warehouse.certifications.length > 0 && (
          <div className="px-5 py-2 border-t border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-muted)' }}>Chứng nhận hiện tại</p>
            <div className="flex flex-wrap gap-1">
              {warehouse.certifications.map(cert => (
                <span key={cert.id} className="text-[10px] px-1.5 py-0.5 border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>{cert.name}</span>
              ))}
            </div>
          </div>
        )}

        <div className="px-5 py-4 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{selectedIds.size} chứng nhận được chọn</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-sm border border-[var(--color-border)]"
              style={{ color: 'var(--color-text-secondary)' }}>Huỷ</button>
            <button onClick={handleConfirm} className="flex items-center gap-2 px-4 py-2 text-sm text-white"
              style={{ background: 'var(--color-success, #22c55e)' }}>
              <CheckCircle className="h-4 w-4" /> Duyệt & Kích hoạt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Warehouse row card ─────────────────────────────────────────────────────────
function WarehouseRow({
  warehouse, ownerEmail, onApprove, onDeactivate, onDelete,
}: {
  warehouse: ColdStorage;
  ownerEmail?: string;
  onApprove: (w: ColdStorage) => void;
  onDeactivate: (w: ColdStorage) => void;
  onDelete: (w: ColdStorage) => void;
}) {
  const [expanded, setExpanded] = useState(warehouse.status === 'pending');
  const cfg = STATUS_CFG[warehouse.status];

  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ borderLeft: `3px solid ${cfg.color}` }}>

      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="inline-flex items-center gap-1 text-white text-[11px] px-2 py-0.5 shrink-0"
          style={{ background: cfg.color }}>
          {warehouse.status === 'pending'  && <Clock className="h-3 w-3" />}
          {warehouse.status === 'active'   && <CheckCircle className="h-3 w-3" />}
          {warehouse.status === 'inactive' && <XCircle className="h-3 w-3" />}
          {cfg.label}
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{warehouse.name}</p>
          <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{warehouse.location.address}, {warehouse.location.city}, {warehouse.location.province}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {warehouse.status === 'pending' && (
            <button onClick={() => onApprove(warehouse)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 text-white transition-colors"
              style={{ background: 'var(--color-success, #22c55e)' }}>
              <CheckCircle className="h-3.5 w-3.5" /> Duyệt
            </button>
          )}
          {warehouse.status === 'active' && (
            <button onClick={() => onDeactivate(warehouse)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-warning)] transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}>
              <XCircle className="h-3.5 w-3.5" /> Tạm ẩn
            </button>
          )}
          {warehouse.status === 'inactive' && (
            <button onClick={() => onApprove(warehouse)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-success)] transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}>
              <CheckCircle className="h-3.5 w-3.5" /> Kích hoạt lại
            </button>
          )}
          <button onClick={() => onDelete(warehouse)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-error)] transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setExpanded(p => !p)}
            className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
            {expanded
              ? <ChevronUp   className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
              : <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 py-4 space-y-4"
          style={{ background: 'var(--color-bg-secondary)' }}>

          {warehouse.status === 'pending' && (
            <div className="flex items-start gap-2 px-3 py-2 border text-sm"
              style={{ background: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.3)', color: 'var(--color-text)' }}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-warning, #f59e0b)' }} />
              <span>Kho lạnh này đang chờ bạn xem xét và duyệt. Hãy kiểm tra thông tin kỹ trước khi kích hoạt.</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
              <div className="flex items-center gap-1 mb-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Package className="h-3 w-3" /> Công suất
              </div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                {warehouse.stats.totalCapacity.toLocaleString()} m³
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-success, #22c55e)' }}>
                Còn: {warehouse.stats.availableCapacity.toLocaleString()} m³
              </p>
            </div>
            <div className="bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
              <div className="flex items-center gap-1 mb-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Thermometer className="h-3 w-3" /> Nhiệt độ
              </div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                {warehouse.stats.temperatureMin}°C ~ {warehouse.stats.temperatureMax}°C
              </p>
            </div>
            <div className="bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
              <div className="flex items-center gap-1 mb-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <DollarSign className="h-3 w-3" /> Giá thuê
              </div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>
                {fmtCurrency(warehouse.pricePerCubicMeter)}/m³
              </p>
            </div>
            <div className="bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
              <div className="flex items-center gap-1 mb-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Shield className="h-3 w-3" /> Bảo mật
              </div>
              <p className="font-semibold text-sm capitalize" style={{ color: 'var(--color-text)' }}>
                {{basic: 'Cơ bản', medium: 'Trung bình', high: 'Cao'}[warehouse.stats.securityLevel]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center" style={{ background: 'var(--color-primary-100)' }}>
              <Building className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Chủ kho</p>
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{warehouse.ownerName}</p>
              {ownerEmail && (
                <a href={`mailto:${ownerEmail}`} className="text-xs hover:underline" style={{ color: 'var(--color-primary)' }}>
                  {ownerEmail}
                </a>
              )}
            </div>
          </div>

          {warehouse.sections && warehouse.sections.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <LayoutGrid className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                  {warehouse.sections.length} phân khu
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {warehouse.sections.map(sec => (
                  <div key={sec.id} className="border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{sec.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {sec.temperatureMin}°C ~ {sec.temperatureMax}°C · {sec.capacity.toLocaleString()} m³
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certification documents section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>Tài liệu chứng nhận (PDF)</p>
            {warehouse.certifications.length > 0 ? (
              <div className="space-y-1.5">
                {warehouse.certifications.map(cert => (
                  <div key={cert.id} className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-success, #22c55e)' }} />
                    <span className="text-xs flex-1 truncate" style={{ color: 'var(--color-text)' }}>{cert.name}</span>
                    {cert.documentUrl ? (
                      <a
                        href={cert.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] px-2 py-1 text-white shrink-0 hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        <FileCheck className="h-3 w-3" /> Xem PDF
                      </a>
                    ) : (
                      <span className="text-[10px] px-2 py-1 border border-dashed shrink-0"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                        Không có file
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-[var(--color-border)]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Chủ kho chưa nộp tài liệu chứng nhận nào.
                </span>
              </div>
            )}
          </div>

          {warehouse.description && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{warehouse.description}</p>
          )}

          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            Tạo lúc: {new Date(warehouse.createdAt).toLocaleString('vi-VN')} ·
            Cập nhật: {new Date(warehouse.updatedAt).toLocaleString('vi-VN')}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ManageWarehouses() {
  const navigate = useNavigate();
  const { users, warehouses: warehouseList, updateWarehouse, deleteWarehouse } = useApp();

  const [tab,    setTab]    = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    title: string; message: string; confirmLabel: string; confirmColor: string; onConfirm: () => void;
  } | null>(null);

  // ── Certification types from backend ────────────────────────────────────────
  const [certTypes, setCertTypes] = useState<CertificationType[]>([]);
  const [certTypesLoading, setCertTypesLoading] = useState(false);
  const [approveTarget, setApproveTarget] = useState<ColdStorage | null>(null);

  useEffect(() => {
    setCertTypesLoading(true);
    certTypesAPI.getAll()
      .then(items => setCertTypes(items.sort((a, b) => a.code.localeCompare(b.code))))
      .catch(err => console.error('Failed to load cert types:', err))
      .finally(() => setCertTypesLoading(false));
  }, []);

  const ownerEmailMap = useMemo(() =>
    Object.fromEntries(users.map(u => [u.id, u.email])),
  [users]);

  const filtered = useMemo(() => {
    let list = warehouseList;
    if (tab !== 'all') list = list.filter(w => w.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.location.province.toLowerCase().includes(q) ||
        w.location.city.toLowerCase().includes(q) ||
        w.ownerName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [warehouseList, tab, search]);

  const counts: Record<StatusFilter, number> = useMemo(() => ({
    all:      warehouseList.length,
    pending:  warehouseList.filter(w => w.status === 'pending').length,
    active:   warehouseList.filter(w => w.status === 'active').length,
    inactive: warehouseList.filter(w => w.status === 'inactive').length,
  }), [warehouseList]);

  const confirm = (opts: typeof confirmModal) => setConfirmModal(opts);

  // ── Approve: open the certification selection modal ─────────────────────────
  const handleApprove = (w: ColdStorage) => {
    setApproveTarget(w);
  };

  const handleApproveConfirm = async (selectedCerts: Certification[]) => {
    if (!approveTarget) return;
    const updated: ColdStorage = {
      ...approveTarget,
      status: 'active',
      certifications: selectedCerts,
      hasCertification: selectedCerts.length > 0,
      updatedAt: new Date().toISOString(),
    };
    await updateWarehouse(approveTarget.id, updated);
    toast.success(
      `Đã kích hoạt kho "${approveTarget.name}" với ${selectedCerts.length} chứng nhận.`,
    );
    setApproveTarget(null);
  };

  const handleDeactivate = (w: ColdStorage) =>
    confirm({
      title: 'Tạm ẩn kho lạnh',
      message: `Kho "${w.name}" sẽ bị ẩn khỏi danh sách tìm kiếm. Chủ kho vẫn có thể thấy kho của họ.`,
      confirmLabel: 'Tạm ẩn',
      confirmColor: 'var(--color-warning, #f59e0b)',
      onConfirm: async () => {
        await updateWarehouse(w.id, { status: 'inactive' });
        toast.success(`Đã ẩn kho "${w.name}".`);
        setConfirmModal(null);
      },
    });

  const handleDelete = (w: ColdStorage) =>
    confirm({
      title: 'Xoá kho lạnh vĩnh viễn',
      message: `Hành động này không thể hoàn tác! Kho "${w.name}" và toàn bộ dữ liệu liên quan sẽ bị xoá.`,
      confirmLabel: 'Xoá vĩnh viễn',
      confirmColor: 'var(--color-error, #ef4444)',
      onConfirm: async () => {
        await deleteWarehouse(w.id);
        toast.success(`Đã xoá kho "${w.name}".`);
        setConfirmModal(null);
      },
    });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {confirmModal && (
        <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)} />
      )}

      {approveTarget && (
        <ApproveModal
          warehouse={approveTarget}
          certTypes={certTypes}
          certTypesLoading={certTypesLoading}
          onConfirm={handleApproveConfirm}
          onCancel={() => setApproveTarget(null)}
        />
      )}

      <div className="bento-container">
        {/* Header */}
        <div className="bento-header">
          <button onClick={() => navigate('/employee')}
            className="flex items-center gap-1 text-sm mb-2 hover:underline"
            style={{ color: 'var(--color-text-secondary)' }}>
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-primary)' }}>
                <Warehouse className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1>Quản lý kho lạnh</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Duyệt, kích hoạt và quản lý tất cả kho lạnh trên nền tảng
                </p>
              </div>
            </div>
            {counts.pending > 0 && (
              <div className="shrink-0 flex items-center gap-2 px-3 py-2 text-sm"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--color-warning, #f59e0b)' }}>
                <Clock className="h-4 w-4" />
                {counts.pending} kho đang chờ duyệt
              </div>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] mb-6">
          {TABS.filter(t => t.key !== 'all').map(t => {
            const cfg = STATUS_CFG[t.key as ColdStorage['status']];
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="bg-[var(--color-surface)] p-5 text-left hover:bg-[var(--color-bg-secondary)] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 shrink-0" style={{ background: cfg.color }} />
                  <p className="text-2xl font-extrabold" style={{ color: cfg.color }}>{counts[t.key]}</p>
                </div>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{t.label}</p>
              </button>
            );
          })}
          <div className="bg-[var(--color-surface)] p-5">
            <p className="text-2xl font-extrabold" style={{ color: 'var(--color-primary)' }}>{counts.all}</p>
            <p className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>Tổng cộng</p>
          </div>
        </div>

        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            <input type="text" placeholder="Tìm theo tên kho, tỉnh thành, chủ kho…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
        </div>

        <div className="flex border-b border-[var(--color-border)] mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === t.key ? 'var(--color-primary)' : 'transparent',
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: tab === t.key ? 600 : 400,
              }}>
              {t.label}
              <span className="text-xs px-1.5 py-0.5"
                style={{
                  background: tab === t.key ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                  color: tab === t.key ? 'white' : 'var(--color-text-muted)',
                }}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="border border-[var(--color-border)] p-16 text-center"
            style={{ background: 'var(--color-surface)' }}>
            <Warehouse className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {search ? `Không tìm thấy kho nào phù hợp với "${search}"` : 'Không có kho nào trong mục này.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {counts.pending > 0 && tab === 'all' && (
              <div className="flex items-start gap-3 px-4 py-3 border text-sm"
                style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.3)', color: 'var(--color-text)' }}>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-warning, #f59e0b)' }} />
                Có <strong className="mx-1">{counts.pending} kho đang chờ duyệt</strong> — hãy xem xét và kích hoạt để chủ kho có thể nhận đặt hàng.
              </div>
            )}
            {filtered.map(w => (
              <WarehouseRow
                key={w.id}
                warehouse={w}
                ownerEmail={ownerEmailMap[w.ownerId]}
                onApprove={handleApprove}
                onDeactivate={handleDeactivate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}