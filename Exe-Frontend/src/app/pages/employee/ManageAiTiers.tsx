import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { employeeService } from '../../../services/employeeService';
import { AiTierDTO } from '../../../types/employee';
import {
  ArrowLeft, Plus, Pencil, Sparkles,
  Save, Loader2, Trash2, Users
} from 'lucide-react';
import Modal from '../../components/Modal';
import SearchInput from '../../components/SearchInput';
import ConfirmModal from '../../components/employee/ConfirmModal';
import { toast } from 'sonner';
import { getUser } from '/src/utils/auth';

const EMPTY_FORM: AiTierDTO = {
  label: '',
  description: '',
  tokenInput: 0,
  tokenOutput: 0,
  price: 0,
  unit: 'VND',
};

export default function ManageAiTiers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AiTierDTO>(EMPTY_FORM);

  const [aiTiers, setAiTiers] = useState<AiTierDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    title: string; message: string; confirmLabel: string; confirmColor: string; onConfirm: () => void;
  } | null>(null);

  const filtered = aiTiers.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return t.label.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
  });

  const fetchTiers = useCallback(async () => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'EMPLOYEE') return;
    setLoading(true);
    try {
      const res = await employeeService.getAllAiTiers();
      setAiTiers(res || []);
    } catch (err: any) {
      // silent
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTiers() }, [fetchTiers]);

  const user = getUser();
  useEffect(() => {
    if (!user || user.role !== 'EMPLOYEE') {
      navigate('/login');
    }
  }, [user?.role, user?.id_user, navigate]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  
  const openEdit = (t: AiTierDTO) => {
    setForm({
      label: t.label,
      description: t.description,
      tokenInput: t.tokenInput,
      tokenOutput: t.tokenOutput,
      price: t.price,
      unit: t.unit,
    });
    setEditId(t.id as number);
    setShowForm(true);
  };

  const handleDeleteImmediate = async (id: number) => {
    try {
      await employeeService.deleteAiTier(id);
      toast.success('Đã xóa gói AI thành công!');
      fetchTiers();
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi xóa gói AI');
    }
  };

  const openDelete = (t: AiTierDTO) => {
    setConfirmModal({
      title: 'Xóa gói AI',
      message: `Bạn có chắc muốn xóa gói AI "${t.label}" không?`,
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
    if (form.price < 0) { toast.error('Giá không hợp lệ'); return; }
    
    setSaving(true);
    try {
      if (editId !== null) {
        await employeeService.updateAiTier(editId, form);
        toast.success('Đã cập nhật gói AI');
      } else {
        await employeeService.createAiTier(form);
        toast.success('Đã thêm gói AI mới');
      }
      await fetchTiers();
      setShowForm(false); setEditId(null);
    } catch (err: any) {
      // silent
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
                style={{ background: 'var(--color-primary)' }}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1>Quản lý Gói AI</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Thiết lập các gói đăng ký AI Subscription cho người dùng.
                </p>
              </div>
            </div>
            <button onClick={openCreate}
              className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors"
              style={{ background: 'var(--color-primary)' }}>
              <Plus className="h-4 w-4" /> Thêm gói mới
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên gói AI, mô tả..." />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-[var(--color-border)] p-16 text-center bg-[var(--color-surface)]">
            <Sparkles className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {search ? `Không tìm thấy gói AI nào cho "${search}"` : 'Chưa có gói AI nào'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <div key={t.id} className="border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                style={{ borderTop: `4px solid var(--color-primary)` }}>
                
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg truncate" style={{ color: 'var(--color-text)' }}>{t.label}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                      {new Intl.NumberFormat('vi-VN').format(t.price)} {t.unit} / tháng
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(t)}
                      className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors rounded"
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

                <div className="flex-1">
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{t.description || 'Không có mô tả'}</p>
                  <div className="space-y-1.5">
                    <p className="text-xs flex justify-between" style={{ color: 'var(--color-text-muted)' }}>
                      <span>Token Input:</span> <span className="font-medium font-mono text-[var(--color-text)]">{t.tokenInput.toLocaleString()}</span>
                    </p>
                    <p className="text-xs flex justify-between" style={{ color: 'var(--color-text-muted)' }}>
                      <span>Token Output:</span> <span className="font-medium font-mono text-[var(--color-text)]">{t.tokenOutput.toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex justify-between items-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Đang dùng: <strong className="text-[var(--color-text)]">{t.activeUsersCount ?? 0}</strong> user</span>
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
          title={editId !== null ? 'Chỉnh sửa gói AI' : 'Thêm gói AI mới'}
          onClose={() => setShowForm(false)}
          className="max-w-md"
          footer={(
            <div className="px-0 pb-0 flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2 text-sm border border-[var(--color-border)]"
                style={{ color: 'var(--color-text-secondary)' }}>Huỷ</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white disabled:opacity-50"
                style={{ background: 'var(--color-primary)' }}>
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
                  Tên gói AI *
                </label>
                <input
                  type="text"
                  placeholder="VD: Basic, Pro, Enterprise..."
                  value={form.label}
                  onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                  className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Mô tả
                </label>
                <textarea
                  placeholder="Tính năng nổi bật của gói..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border focus:outline-none focus:border-[var(--color-primary)] resize-none"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      Giới hạn Token Input
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.tokenInput}
                      onChange={e => setForm(p => ({ ...p, tokenInput: Number(e.target.value) }))}
                      className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      Giới hạn Token Output
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.tokenOutput}
                      onChange={e => setForm(p => ({ ...p, tokenOutput: Number(e.target.value) }))}
                      className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      Giá tiền *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                      className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      Đơn vị (VD: VND)
                    </label>
                    <input
                      type="text"
                      value={form.unit}
                      onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                      className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
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
