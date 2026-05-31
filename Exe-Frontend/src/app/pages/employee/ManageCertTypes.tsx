import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import useCertTypes from '../../hooks/useCertTypes';
import { CertificationType } from '../../../types';
import {
  ArrowLeft, Plus, Pencil, Trash2, Shield,
  X, Save, Loader2, AlertCircle,
} from 'lucide-react';
import Modal from '../../components/Modal';
import SearchInput from '../../components/SearchInput';
import { toast } from 'sonner';

const EMPTY_FORM = {
  label: '',
  law_references: '',
  update: new Date().toISOString().split('T')[0],
};

export default function ManageCertTypes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { certTypes, loading, saving, createType, updateType, deleteType, filtered } = useCertTypes(search);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (ct: CertificationType) => { 
    setForm({ 
      label: ct.label, 
      law_references: ct.law_references, 
      update: ct.update.split('T')[0] 
    }); 
    setEditId(ct.id); 
    setShowForm(true); 
  };

  const handleSave = async () => {
    if (!form.label.trim()) { toast.error('Tên chứng nhận là bắt buộc'); return; }
    if (editId !== null) {
      await updateType(editId, { ...form });
    } else {
      const id = certTypes.length > 0 ? Math.max(...certTypes.map(c => c.id)) + 1 : 1;
      await createType({ id, ...form } as CertificationType);
    }
    setShowForm(false); setEditId(null);
  };

  const handleDelete = async (id: number) => { await deleteType(id); setDeleteConfirm(null); };

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
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1>Quản lý loại chứng nhận</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Danh sách chứng nhận dùng khi duyệt kho lạnh (ISO, HACCP, GDP, ATTP...)
                </p>
              </div>
            </div>
            <button onClick={openCreate}
              className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm text-white transition-colors"
              style={{ background: 'var(--color-primary)' }}>
              <Plus className="h-4 w-4" /> Thêm loại mới
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên chứng nhận, tham chiếu luật..." />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-[var(--color-border)] p-16 text-center bg-[var(--color-surface)]">
            <Shield className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {search ? `Không tìm thấy chứng nhận nào cho "${search}"` : 'Chưa có loại chứng nhận nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(ct => (
              <div key={ct.id} className="border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-3 px-4 py-3"
                style={{ borderLeft: `3px solid var(--color-primary)` }}>
                {/* Badge */}
                <span className="inline-flex items-center gap-1.5 text-white text-[11px] px-2.5 py-1 shrink-0 font-semibold"
                  style={{ background: 'var(--color-primary)' }}>
                  <Shield className="h-3 w-3" />
                  {ct.label}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{ct.label}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{ct.law_references}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Cập nhật: {new Date(ct.update).toLocaleDateString('vi-VN')}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(ct)}
                    className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                    title="Chỉnh sửa">
                    <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                  <button onClick={() => setDeleteConfirm(ct.id)}
                    className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-error)] transition-colors"
                    title="Xóa">
                    <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit modal ─────────────────────────────────────────────── */}
      {showForm && (
        <Modal
          title={editId !== null ? 'Chỉnh sửa chứng nhận' : 'Thêm loại chứng nhận mới'}
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
                  Tên chứng nhận *
                </label>
                <input
                  type="text"
                  placeholder="VD: ISO 22000, HACCP..."
                  value={form.label}
                  onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                  className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Tham chiếu luật / Mô tả
                </label>
                <textarea
                  placeholder="Các tham chiếu luật liên quan hoặc mô tả ngắn..."
                  value={form.law_references}
                  onChange={e => setForm(p => ({ ...p, law_references: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border focus:outline-none focus:border-[var(--color-primary)] resize-none"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Ngày cập nhật
                </label>
                <input
                  type="date"
                  value={form.update}
                  onChange={e => setForm(p => ({ ...p, update: e.target.value }))}
                  className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm ──────────────────────────────────────────────────── */}
      {deleteConfirm !== null && (
        <Modal title="Xóa loại chứng nhận" onClose={() => setDeleteConfirm(null)} className="max-w-sm" footer={(
          <div className="px-0 pb-0 flex gap-3">
            <button onClick={() => setDeleteConfirm(null)}
              className="flex-1 py-2 text-sm border border-[var(--color-border)]"
              style={{ color: 'var(--color-text-secondary)' }}>Huỷ</button>
            <button onClick={() => handleDelete(deleteConfirm)}
              className="flex-1 py-2 text-sm text-white"
              style={{ background: 'var(--color-error, #ef4444)' }}>Xóa vĩnh viễn</button>
          </div>
        )}>
          <div className="px-0 py-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--color-error, #ef4444)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Loại chứng nhận này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
