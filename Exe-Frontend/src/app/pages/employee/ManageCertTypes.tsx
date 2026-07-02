import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { employeeService } from '../../../services/employeeService';
import { CertificationType } from '../../../types';
import {
  ArrowLeft, Plus, Pencil, Shield,
  Save, Loader2, Trash2
} from 'lucide-react';
import Modal from '../../components/Modal';
import SearchInput from '../../components/SearchInput';
import ConfirmModal from '../../components/employee/ConfirmModal';
import { toast } from 'sonner';
import { getUser } from '/src/utils/auth';

const EMPTY_FORM = {
  label: '',
  law_references: '',
  pdfLink: '',
  update: new Date().toISOString().split('T')[0],
};

export default function ManageCertTypes() {

  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [certTypes, setCertTypes] = useState<CertificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    title: string; message: string; confirmLabel: string; confirmColor: string; onConfirm: () => void;
  } | null>(null);

  const filtered = certTypes.filter(ct => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return ct.label.toLowerCase().includes(q) || (ct.labelDesc && ct.labelDesc.toLowerCase().includes(q)) || (ct.law_references && ct.law_references.toLowerCase().includes(q));
  });

  const fetchCerts = useCallback(async () => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'EMPLOYEE') return;
    setLoading(true);
    try {
      const res = await employeeService.getCertTypes();
      const items = (res || []).map((d: any, idx: number) => ({
        id_certification: d.id_certification ?? (d.certID ? Number(d.certID) : idx + 1),
        certID: d.certID ?? String(d.id_certification ?? (d.certID ? Number(d.certID) : idx + 1)),
        label: d.label,
        law_references: d.labelDesc ?? d.law_references ?? '',
        update: d.update ?? new Date().toISOString(),
        pdfLink: d.pdfLink ?? null,
      }));
      setCertTypes(items.sort((a, b) => a.label.localeCompare(b.label)));
    } catch (err: any) {
      toast.error('Không tải được danh sách loại chứng nhận');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCerts() }, [fetchCerts]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const user = getUser();
  useEffect(() => {
    if (!user || user.role !== 'EMPLOYEE') {
      navigate('/login');
    }
  }, [user?.role, user?.id_user, navigate]);
  const openEdit = (ct: CertificationType) => {
    let updateValue = new Date().toISOString().split('T')[0];
    if (ct.update) {
      if (typeof ct.update === 'string' && /\d{2}\/\d{2}\/\d{4}/.test(ct.update)) {
        updateValue = ct.update.split('/').reverse().join('-');
      } else {
        try {
          updateValue = new Date(ct.update).toISOString().split('T')[0];
        } catch (e) { }
      }
    }

    setForm({
      label: ct.label,
      law_references: ct.law_references,
      pdfLink: (ct as any).pdfLink || '',
      update: updateValue,
    });
    setEditId(ct.id_certification);
    setShowForm(true);
  };

  const toDDMMYYYY = (value: string) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      return `${d}/${m}/${y}`;
    }
    return value;
  };

  const displayDate = (value: string) => {
    // ensure display uses dd/mm/yyyy
    return toDDMMYYYY(value);
  }

  const handleDeleteImmediate = async (certID: string) => {
    try {
      await employeeService.deleteCertType(certID);
      toast.success('Đã xóa chứng chỉ thành công!');
      fetchCerts();
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi xóa chứng chỉ');
    }
  };

  const openDelete = (ct: CertificationType) => {
    setConfirmModal({
      title: 'Xóa chứng nhận',
      message: `Bạn có chắc muốn xóa loại chứng nhận "${ct.label}" không?`,
      confirmLabel: 'Xóa',
      confirmColor: 'var(--color-error, #ef4444)',
      onConfirm: () => { 
        handleDeleteImmediate(String(ct.certID ?? ct.id_certification)); 
        setConfirmModal(null); 
      },
    });
  };

  const handleSave = async () => {
    if (!form.label.trim()) { toast.error('Tên chứng nhận là bắt buộc'); return; }
    setSaving(true);
    try {
      if (editId !== null) {
        // update
        const existing = certTypes.find(c => c.id_certification === editId);
        const certID = existing?.certID ?? String(editId);
        const payload = {
          certID: String(certID),
          label: form.label,
          labelDesc: form.law_references,
          update: toDDMMYYYY(form.update),
          pdfLink: (form as any).pdfLink || existing?.pdfLink || null,
        };
        await employeeService.updateCertType(certID, payload);
        toast.success('Đã cập nhật loại chứng nhận');
      } else {
        // create
        const payload = {
          label: form.label,
          labelDesc: form.law_references,
          update: toDDMMYYYY(form.update),
          pdfLink: (form as any).pdfLink || null,
        };
        await employeeService.createCertType(payload);
        toast.success('Đã thêm loại chứng nhận mới');
      }
      await fetchCerts();
      setShowForm(false); setEditId(null);
    } catch (err: any) {
      toast.error(`Lỗi: ${err?.message || err}`);
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
              <div key={ct.id_certification} className="border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-3 px-4 py-3"
                style={{ borderLeft: `3px solid var(--color-primary)` }}>
                
                <div className="flex items-start justify-between gap-4">
                  {/* Badge */}
                  <span className="inline-flex items-center gap-1.5 text-white text-[11px] px-2.5 py-1 shrink-0 font-semibold max-w-full"
                    style={{ background: 'var(--color-primary)' }}>
                    <Shield className="h-3 w-3 shrink-0" />
                    <span className="truncate">{ct.label}</span>
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(ct)}
                      className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                      title="Chỉnh sửa">
                      <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                    <button onClick={() => openDelete(ct)}
                      className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-error)] transition-colors"
                      title="Xóa">
                      <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{ct.label}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{ct.law_references}</p>
                  {(ct as any).pdfLink && (
                    <p className="text-xs truncate mt-1">
                      <a href={(ct as any).pdfLink} target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--color-primary)' }}>Xem PDF</a>
                    </p>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Cập nhật: {displayDate(ct.update)}</p>
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
                  Link PDF (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="https://.../doc.pdf"
                  value={(form as any).pdfLink}
                  onChange={e => setForm(p => ({ ...p, pdfLink: e.target.value }))}
                  className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)]"
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


    </div>
  );
}
