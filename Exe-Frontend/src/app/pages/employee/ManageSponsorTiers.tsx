import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { employeeService } from '../../../services/employeeService';
import { SponsorTierDTO } from '../../../types/employee';
import {
  ArrowLeft, Plus, Pencil, Star,
  Save, Loader2, Trash2, Warehouse
} from 'lucide-react';
import Modal from '../../components/Modal';
import SearchInput from '../../components/SearchInput';
import ConfirmModal from '../../components/employee/ConfirmModal';
import { toast } from 'sonner';
import { getUser } from '/src/utils/auth';

const EMPTY_FORM: SponsorTierDTO = {
  label: '',
  priorityLevel: 1,
  pricingPerMonth: 0,
  yearPackSale: 0,
};

export default function ManageSponsorTiers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<SponsorTierDTO>(EMPTY_FORM);

  const [sponsorTiers, setSponsorTiers] = useState<SponsorTierDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    title: string; message: string; confirmLabel: string; confirmColor: string; onConfirm: () => void;
  } | null>(null);

  const filtered = sponsorTiers.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return t.label.toLowerCase().includes(q);
  });

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const res = await employeeService.getAllSponsorTiers();
      setSponsorTiers(res || []);
    } catch (err: any) {
      console.error('Failed to fetch sponsor tiers', err);
      toast.error('Không tải được danh sách gói Tài trợ');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTiers() }, []);

  const user = getUser();
  useEffect(() => {
    if (!user || user.role !== 'EMPLOYEE') {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  
  const openEdit = (t: SponsorTierDTO) => {
    setForm({
      label: t.label,
      priorityLevel: t.priorityLevel,
      pricingPerMonth: t.pricingPerMonth,
      yearPackSale: t.yearPackSale,
    });
    setEditId(t.id as number);
    setShowForm(true);
  };

  const handleDeleteImmediate = async (id: number) => {
    try {
      await employeeService.deleteSponsorTier(id);
      toast.success('Đã xóa gói Tài trợ thành công!');
      fetchTiers();
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi xóa gói Tài trợ');
    }
  };

  const openDelete = (t: SponsorTierDTO) => {
    setConfirmModal({
      title: 'Xóa gói Tài trợ',
      message: `Bạn có chắc muốn xóa gói Tài trợ "${t.label}" không?`,
      confirmLabel: 'Xóa',
      confirmColor: 'var(--color-error, #ef4444)',
      onConfirm: () => { 
        handleDeleteImmediate(t.id as number); 
        setConfirmModal(null); 
      },
    });
  };

  const handleSave = async () => {
    if (!form.label.trim()) { toast.error('Tên gói là bắt buộc'); return; }
    if (form.pricingPerMonth < 0) { toast.error('Giá không hợp lệ'); return; }
    
    setSaving(true);
    try {
      if (editId !== null) {
        await employeeService.updateSponsorTier(editId, form);
        toast.success('Đã cập nhật gói Tài trợ');
      } else {
        await employeeService.createSponsorTier(form);
        toast.success('Đã thêm gói Tài trợ mới');
      }
      await fetchTiers();
      setShowForm(false); setEditId(null);
    } catch (err: any) {
      console.error('Save failed', err);
      toast.error(`Lỗi: ${err?.response?.data?.message || err?.message || err}`);
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

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
                style={{ background: 'var(--color-warning)' }}>
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1>Quản lý Gói Tài Trợ</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Thiết lập các gói tài trợ để nổi bật kho bãi của chủ kho.
                </p>
              </div>
            </div>
            <button onClick={openCreate}
              className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors"
              style={{ background: 'var(--color-warning)' }}>
              <Plus className="h-4 w-4" /> Thêm gói mới
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên gói tài trợ..." />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-warning)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-[var(--color-border)] p-16 text-center bg-[var(--color-surface)]">
            <Star className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {search ? `Không tìm thấy gói Tài trợ nào cho "${search}"` : 'Chưa có gói Tài trợ nào'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <div key={t.id} className="border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                style={{ borderTop: `4px solid var(--color-warning)` }}>
                
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg truncate flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                      {t.label} 
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-warning)] text-white">Mức ưu tiên: {t.priorityLevel}</span>
                    </h3>
                    <p className="text-sm mt-2" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                      {new Intl.NumberFormat('vi-VN').format(t.pricingPerMonth)} VND / tháng
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(t)}
                      className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-warning)] transition-colors rounded"
                      title="Chỉnh sửa">
                      <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                    <button onClick={() => openDelete(t)}
                      className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-error)] transition-colors rounded"
                      title="Xóa">
                      <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 mt-1 mb-4">
                    <p className="text-xs flex justify-between" style={{ color: 'var(--color-text-muted)' }}>
                      <span>Giá gói Năm:</span> <span className="font-medium font-mono text-[var(--color-success)]">{new Intl.NumberFormat('vi-VN').format(t.yearPackSale)} VND</span>
                    </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex justify-between items-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-1.5">
                        <Warehouse className="w-3.5 h-3.5" />
                        <span>Kho áp dụng: <strong className="text-[var(--color-text)]">{t.activeWarehousesCount ?? 0}</strong> kho</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit modal ─────────────────────────────────────────────── */}
      {confirmModal && (
        <ConfirmModal title={confirmModal.title} message={confirmModal.message} confirmLabel={confirmModal.confirmLabel} confirmColor={confirmModal.confirmColor} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />
      )}
      {showForm && (
        <Modal
          title={editId !== null ? 'Chỉnh sửa gói Tài trợ' : 'Thêm gói Tài trợ mới'}
          onClose={() => setShowForm(false)}
          className="max-w-md"
          footer={(
            <div className="px-0 pb-0 flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2 text-sm border border-[var(--color-border)]"
                style={{ color: 'var(--color-text-secondary)' }}>Huỷ</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white disabled:opacity-50"
                style={{ background: 'var(--color-warning)' }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editId !== null ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          )}
        >
          <div className="px-0">
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Tên gói Tài trợ *
                </label>
                <input
                  type="text"
                  placeholder="VD: Gói Bạc, Gói Vàng, Gói Kim Cương..."
                  value={form.label}
                  onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                  className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-warning)]"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Mức độ ưu tiên (Càng cao càng xếp trên)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.priorityLevel}
                  onChange={e => setForm(p => ({ ...p, priorityLevel: Number(e.target.value) }))}
                  className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-warning)]"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      Giá / Tháng (VND) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.pricingPerMonth}
                      onChange={e => setForm(p => ({ ...p, pricingPerMonth: Number(e.target.value) }))}
                      className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-warning)]"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      Giá gói Năm (VND)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.yearPackSale}
                      onChange={e => setForm(p => ({ ...p, yearPackSale: Number(e.target.value) }))}
                      className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-warning)]"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    />
                  </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
