import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import {
  FileText, Shield, CheckCircle, X, Loader2, ExternalLink, Plus, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { CompositeWarehouse, CertificationSubmit } from '../../../types';
import { storageAPI } from '../../../services/apiClient';

interface CertUploadSlot {
  cert: CertificationSubmit & { label?: string };
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  existingUrl?: string;
}

export function MyWarehouseCertsModal({
  warehouse,
  onClose,
  onSaved,
}: {
  warehouse: CompositeWarehouse;
  onClose: () => void;
  onSaved: (updated: CompositeWarehouse) => void;
}) {
  const [slots, setSlots] = useState<CertUploadSlot[]>(
    () => (warehouse.certifications ?? []).map((cert: any) => ({
      cert,
      file: null,
      uploading: false,
      uploaded: false,
      existingUrl: cert.link || cert.documentUrl,
    })),
  );
  const [saving, setSaving] = useState(false);
  const newFileRef = useRef<HTMLInputElement | null>(null);

  const hasPendingFiles = slots.some(s => s.file && !s.uploaded);
  const anyUploading = slots.some(s => s.uploading);

  const handleFileSelect = (certId: number, file: File | null) => {
    setSlots(prev => prev.map(s =>
      s.cert.id_cerfSubmit === certId ? { ...s, file, uploaded: false } : s,
    ));
  };

  const handleUploadOne = async (certId: number) => {
    const slot = slots.find(s => s.cert.id_cerfSubmit === certId);
    if (!slot?.file) return;

    setSlots(prev => prev.map(s =>
      s.cert.id_cerfSubmit === certId ? { ...s, uploading: true } : s,
    ));

    try {
      const url = await storageAPI.uploadDoc(slot.file);
      setSlots(prev => prev.map(s =>
        s.cert.id_cerfSubmit === certId
          ? { ...s, uploading: false, uploaded: true, file: null, existingUrl: url, cert: { ...s.cert, link: url } }
          : s,
      ));
      toast.success(`Tải lên "${slot.cert.label || 'Chứng nhận'}" thành công!`);
    } catch (err: any) {
      console.error(`[ReuploadCerts] Upload failed for ${certId}:`, err);
      setSlots(prev => prev.map(s =>
        s.cert.id_cerfSubmit === certId ? { ...s, uploading: false } : s,
      ));
      toast.error(`Lỗi tải lên: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleUploadAll = async () => {
    const pending = slots.filter(s => s.file && !s.uploaded);
    for (const slot of pending) {
      await handleUploadOne(slot.cert.id_cerfSubmit);
    }
  };

  const handleAddNewCert = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newSlots: CertUploadSlot[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type !== 'application/pdf') continue;
      const certName = f.name.replace(/\.pdf$/i, '');
      const newCert: CertificationSubmit & { label?: string } = {
        id_cerfSubmit: Date.now() + i, // Temporary mock ID
        link: '',
        isVerified: false,
        label: certName,
      };
      newSlots.push({ cert: newCert, file: f, uploading: false, uploaded: false });
    }
    if (newSlots.length === 0) {
      toast.warning('Chỉ chấp nhận file PDF');
      return;
    }
    setSlots(prev => [...prev, ...newSlots]);
  };

  const handleRemoveSlot = (certId: number) => {
    setSlots(prev => prev.filter(s => s.cert.id_cerfSubmit !== certId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const pending = slots.filter(s => s.file && !s.uploaded);
      for (const slot of pending) {
        await handleUploadOne(slot.cert.id_cerfSubmit);
      }
      await new Promise(r => setTimeout(r, 100));
    } catch (err: any) {
      console.error('[ReuploadCerts] Save error:', err);
      toast.error(`Lỗi: ${err?.message || 'Unknown error'}`);
      setSaving(false);
      return;
    }

    setSlots(currentSlots => {
      const updatedCerts: CertificationSubmit[] = currentSlots.map(s => ({
        ...s.cert,
        link: s.existingUrl || s.cert.link,
      }));

      const updatedWarehouse: CompositeWarehouse = {
        ...warehouse,
        certifications: updatedCerts,
        updatedAt: new Date().toISOString(),
      };

      onSaved(updatedWarehouse);
      return currentSlots;
    });
    setSaving(false);
  };

  const totalSlots = slots.length;
  const completedSlots = slots.filter(s => s.existingUrl || s.uploaded).length;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 'var(--z-modal-backdrop)' }}>
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-[var(--color-border)]"
        style={{ background: 'var(--color-surface)', borderRadius: 8, zIndex: 'var(--z-modal)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              Cập nhật tài liệu chứng nhận
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {warehouse.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--color-bg-secondary)] rounded transition-colors">
            <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {slots.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Chưa có chứng nhận nào. Thêm mới bên dưới.
              </p>
            </div>
          )}

          {slots.map(slot => (
            <div
              key={slot.cert.id_cerfSubmit}
              className="flex items-center gap-3 px-3 py-2.5 border border-[var(--color-border)]"
              style={{
                background: slot.uploaded
                  ? 'rgba(34,197,94,0.06)'
                  : slot.existingUrl
                    ? 'rgba(37,99,235,0.04)'
                    : 'var(--color-bg-secondary)',
              }}
            >
              {/* Icon */}
              <div className="shrink-0">
                {slot.uploaded || slot.existingUrl ? (
                  <CheckCircle className="h-4 w-4" style={{ color: 'var(--color-success, #22c55e)' }} />
                ) : (
                  <Shield className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                )}
              </div>

              {/* Cert info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {slot.cert.label || 'Chứng nhận hệ thống'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  {slot.uploaded
                    ? 'Vừa tải lên thành công'
                    : slot.existingUrl
                      ? 'Đã có file PDF'
                      : slot.file
                        ? `Sẵn sàng: ${slot.file.name}`
                        : 'Chưa có file'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {slot.uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-primary)' }} />
                ) : slot.uploaded || slot.existingUrl ? (
                  <>
                    {(slot.existingUrl || slot.cert.link) && (
                      <a
                        href={slot.existingUrl || slot.cert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] px-2 py-1 text-white hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        Xem
                      </a>
                    )}
                    <label
                      className="text-[10px] px-2 py-1 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Thay đổi
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setSlots(prev => prev.map(s =>
                              s.cert.id_cerfSubmit === slot.cert.id_cerfSubmit
                                ? { ...s, file: f, uploaded: false, existingUrl: undefined }
                                : s,
                            ));
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    {slot.file ? (
                      <button
                        onClick={() => handleUploadOne(slot.cert.id_cerfSubmit)}
                        className="text-[10px] px-2 py-1 text-white hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        Tải lên
                      </button>
                    ) : (
                      <label
                        className="flex items-center gap-1 text-[10px] px-2 py-1 border border-dashed border-[var(--color-primary)] hover:bg-blue-50 transition-colors cursor-pointer"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        <Upload className="h-3 w-3" /> Chọn PDF
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handleFileSelect(slot.cert.id_cerfSubmit, f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                    <button
                      onClick={() => handleRemoveSlot(slot.cert.id_cerfSubmit)}
                      className="p-1 hover:bg-red-50 transition-colors rounded"
                    >
                      <X className="h-3 w-3" style={{ color: 'var(--color-error)' }} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Add new certification */}
          <button
            onClick={() => newFileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 border border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-blue-50/30 transition-colors text-sm"
            style={{ color: 'var(--color-primary)' }}
          >
            <Plus className="h-4 w-4" /> Thêm chứng nhận mới (PDF)
          </button>
          <input
            ref={newFileRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={e => {
              handleAddNewCert(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {completedSlots}/{totalSlots} có file PDF
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={anyUploading || saving}>
              Huỷ
            </Button>
            {hasPendingFiles && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUploadAll}
                disabled={anyUploading}
                className="flex items-center gap-1.5"
              >
                {anyUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Tải lên tất cả
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={anyUploading || saving}
              className="flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
