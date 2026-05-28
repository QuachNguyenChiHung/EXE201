import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { certTypesAPI } from '../../../services/apiClient';
import { CertificationType, CertTypeCategory } from '../../../types';
import {
  ArrowLeft, Plus, Pencil, Trash2, Shield, Search,
  X, Save, Loader2, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_LABELS: Record<CertTypeCategory, string> = {
  food_safety:    'An toàn thực phẩm',
  quality:        'Chất lượng',
  environment:    'Môi trường',
  distribution:   'Phân phối',
  manufacturing:  'Sản xuất',
  other:          'Khác',
};

const CATEGORY_COLORS: Record<CertTypeCategory, string> = {
  food_safety:    '#22c55e',
  quality:        '#3b82f6',
  environment:    '#06b6d4',
  distribution:   '#f59e0b',
  manufacturing:  '#8b5cf6',
  other:          '#6b7280',
};

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  category: 'food_safety' as CertTypeCategory,
};

export default function ManageCertTypes() {
  const navigate = useNavigate();
  const [certTypes, setCertTypes] = useState<CertificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const items = await certTypesAPI.getAll();
      setCertTypes(items.sort((a, b) => a.code.localeCompare(b.code)));
    } catch (err: any) {
      console.error('Failed to fetch cert types:', err);
      toast.error('Không tải được danh sách loại chứng nhận');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (ct: CertificationType) => {
    setForm({ code: ct.code, name: ct.name, description: ct.description, category: ct.category });
    setEditId(ct.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Mã và tên chứng nhận là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await certTypesAPI.update(editId, { ...form } as any);
        toast.success('Đã cập nhật loại chứng nhận');
      } else {
        const id = `ct-${form.code.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`;
        await certTypesAPI.create({
          id,
          ...form,
          createdAt: new Date().toISOString(),
        } as CertificationType);
        toast.success('Đã thêm loại chứng nhận mới');
      }
      setShowForm(false);
      setEditId(null);
      await fetchData();
    } catch (err: any) {
      console.error('Save cert type error:', err);
      toast.error(`Lỗi: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await certTypesAPI.delete(id);
      toast.success('Đã xóa loại chứng nhận');
      setDeleteConfirm(null);
      await fetchData();
    } catch (err: any) {
      toast.error(`Lỗi xóa: ${err.message}`);
    }
  };

  const filtered = certTypes.filter(ct => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return ct.code.toLowerCase().includes(q) || ct.name.toLowerCase().includes(q) || ct.description.toLowerCase().includes(q);
  });

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
                style={{ background: 'var(--color-success, #22c55e)' }}>
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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm theo mã, tên chứng nhận..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] mb-6">
          {(['food_safety', 'quality', 'distribution', 'manufacturing'] as CertTypeCategory[]).map(cat => (
            <div key={cat} className="bg-[var(--color-surface)] p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 shrink-0" style={{ background: CATEGORY_COLORS[cat] }} />
                <p className="text-xl font-extrabold" style={{ color: CATEGORY_COLORS[cat] }}>
                  {certTypes.filter(ct => ct.category === cat).length}
                </p>
              </div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                {CATEGORY_LABELS[cat]}
              </p>
            </div>
          ))}
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
                style={{ borderLeft: `3px solid ${CATEGORY_COLORS[ct.category]}` }}>
                {/* Badge */}
                <span className="inline-flex items-center gap-1.5 text-white text-[11px] px-2.5 py-1 shrink-0 font-semibold"
                  style={{ background: CATEGORY_COLORS[ct.category] }}>
                  <Shield className="h-3 w-3" />
                  {ct.code}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{ct.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{ct.description}</p>
                </div>

                {/* Category tag */}
                <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 shrink-0"
                  style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>
                  {CATEGORY_LABELS[ct.category]}
                </span>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {editId ? 'Chỉnh sửa chứng nhận' : 'Thêm loại chứng nhận mới'}
              </p>
              <button onClick={() => setShowForm(false)}
                className="p-1 hover:bg-[var(--color-bg-secondary)] transition-colors">
                <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Mã chứng nhận *
                </label>
                <input
                  type="text"
                  placeholder="VD: ISO 22000, HACCP..."
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                  className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Tên đầy đủ *
                </label>
                <input
                  type="text"
                  placeholder="VD: ISO 22000 - An toàn thực phẩm"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Mô tả
                </label>
                <textarea
                  placeholder="Mô tả ngắn về chứng nhận..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border focus:outline-none focus:border-[var(--color-primary)] resize-none"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Danh mục
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value as CertTypeCategory }))}
                  className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2 text-sm border border-[var(--color-border)]"
                style={{ color: 'var(--color-text-secondary)' }}>
                Huỷ
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white disabled:opacity-50"
                style={{ background: 'var(--color-primary)' }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editId ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ──────────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}>
          <div className="w-full max-w-sm border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Xóa loại chứng nhận</p>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--color-error, #ef4444)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Loại chứng nhận này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 text-sm border border-[var(--color-border)]"
                style={{ color: 'var(--color-text-secondary)' }}>
                Huỷ
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 text-sm text-white"
                style={{ background: 'var(--color-error, #ef4444)' }}>
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
