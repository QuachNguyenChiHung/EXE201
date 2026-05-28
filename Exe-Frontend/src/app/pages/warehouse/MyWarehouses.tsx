import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { warehousesAPI } from '../../../services/apiClient';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Warehouse, Edit, Plus, MapPin, Thermometer,
  Package, Tag, LayoutGrid, Image as ImageIcon,
  EyeOff, Eye, RotateCcw, AlertTriangle, Clock,
  Upload, FileText, Shield, CheckCircle, X, Loader2, ExternalLink,
  Crown, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { ColdStorage, Certification, SUBSCRIPTION_TIERS, SubscriptionTierLevel } from '../../../types';
import { storageAPI } from '../../../services/apiClient';
import { SubscriptionTierBadge } from '../../components/SubscriptionTierBadge';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMinMaxPrice(warehouse: ColdStorage): { min: number; max: number | null } {
  const monthlyPrices: number[] = [];
  warehouse.sections?.forEach(s =>
    s.priceTiers?.forEach(t => {
      if (t.unit === 'month' && t.value > 0) monthlyPrices.push(t.value);
    }),
  );
  if (monthlyPrices.length > 0) {
    const mn = Math.min(...monthlyPrices);
    const mx = Math.max(...monthlyPrices);
    return { min: mn, max: mn !== mx ? mx : null };
  }
  const tierPrices = (warehouse.priceTiers ?? [])
    .filter(t => t.unit === 'month' && t.value > 0)
    .map(t => t.value);
  if (tierPrices.length > 0) {
    const mn = Math.min(...tierPrices);
    const mx = Math.max(...tierPrices);
    return { min: mn, max: mn !== mx ? mx : null };
  }
  return { min: warehouse.pricePerCubicMeter, max: null };
}

const fmtVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

// ── Thumb: mini thumbnail with broken-image fallback ─────────────────────────
function Thumb({ src, alt = '' }: { src?: string; alt?: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <ImageIcon style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.4)' }} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setErr(true)}
    />
  );
}

// ── Main image with broken-image fallback ────────────────────────────────────
function MainImage({ src, alt }: { src?: string; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2"
        style={{ background: 'var(--color-bg-secondary)' }}
      >
        <ImageIcon className="h-8 w-8" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Chưa có ảnh</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      style={{ position: 'absolute', inset: 0 }}
      onError={() => setErr(true)}
    />
  );
}

// ── Re-upload Certs Modal ────────────────────────────────────────────────────
interface CertUploadSlot {
  cert: Certification;
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  existingUrl?: string;
}

function ReuploadCertsModal({
  warehouse,
  onClose,
  onSaved,
}: {
  warehouse: ColdStorage;
  onClose: () => void;
  onSaved: (updated: ColdStorage) => void;
}) {
  const [slots, setSlots] = useState<CertUploadSlot[]>(
    () => (warehouse.certifications ?? []).map(cert => ({
      cert,
      file: null,
      uploading: false,
      uploaded: false,
      existingUrl: cert.documentUrl,
    })),
  );
  const [saving, setSaving] = useState(false);
  const newFileRef = useRef<HTMLInputElement | null>(null);

  const hasPendingFiles = slots.some(s => s.file && !s.uploaded);
  const anyUploading = slots.some(s => s.uploading);

  const handleFileSelect = (certId: string, file: File | null) => {
    setSlots(prev => prev.map(s =>
      s.cert.id === certId ? { ...s, file, uploaded: false } : s,
    ));
  };

  const handleUploadOne = async (certId: string) => {
    const slot = slots.find(s => s.cert.id === certId);
    if (!slot?.file) return;

    setSlots(prev => prev.map(s =>
      s.cert.id === certId ? { ...s, uploading: true } : s,
    ));

    try {
      const url = await storageAPI.uploadDoc(slot.file);
      setSlots(prev => prev.map(s =>
        s.cert.id === certId
          ? { ...s, uploading: false, uploaded: true, file: null, existingUrl: url, cert: { ...s.cert, documentUrl: url } }
          : s,
      ));
      toast.success(`Tải lên "${slot.cert.name}" thành công!`);
    } catch (err: any) {
      console.error(`[ReuploadCerts] Upload failed for ${certId}:`, err);
      setSlots(prev => prev.map(s =>
        s.cert.id === certId ? { ...s, uploading: false } : s,
      ));
      toast.error(`Lỗi tải lên: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleUploadAll = async () => {
    const pending = slots.filter(s => s.file && !s.uploaded);
    for (const slot of pending) {
      await handleUploadOne(slot.cert.id);
    }
  };

  const handleAddNewCert = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newSlots: CertUploadSlot[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type !== 'application/pdf') continue;
      const certName = f.name.replace(/\.pdf$/i, '');
      const newCert: Certification = {
        id: `cert-reup-${Date.now()}-${i}`,
        name: certName,
        issuer: 'Tự khai báo',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };
      newSlots.push({ cert: newCert, file: f, uploading: false, uploaded: false });
    }
    if (newSlots.length === 0) {
      toast.warning('Chỉ chấp nhận file PDF');
      return;
    }
    setSlots(prev => [...prev, ...newSlots]);
  };

  const handleRemoveSlot = (certId: string) => {
    setSlots(prev => prev.filter(s => s.cert.id !== certId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload any remaining files first
      const pending = slots.filter(s => s.file && !s.uploaded);
      for (const slot of pending) {
        await handleUploadOne(slot.cert.id);
      }

      // Build the final cert list from the latest state
      // We need to read from the ref-captured slots since handleUploadOne updates state
      // Use a small delay to let state settle
      await new Promise(r => setTimeout(r, 100));
    } catch (err: any) {
      console.error('[ReuploadCerts] Save error:', err);
      toast.error(`Lỗi: ${err?.message || 'Unknown error'}`);
      setSaving(false);
      return;
    }

    // Read current slots via setState callback to get the latest
    setSlots(currentSlots => {
      const updatedCerts: Certification[] = currentSlots.map(s => ({
        ...s.cert,
        documentUrl: s.existingUrl || s.cert.documentUrl,
      }));

      const updatedWarehouse: ColdStorage = {
        ...warehouse,
        certifications: updatedCerts,
        hasCertification: updatedCerts.length > 0,
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
              key={slot.cert.id}
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
                  {slot.cert.name}
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
                    {(slot.existingUrl || slot.cert.documentUrl) && (
                      <a
                        href={slot.existingUrl || slot.cert.documentUrl}
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
                            // Reset to re-upload state
                            setSlots(prev => prev.map(s =>
                              s.cert.id === slot.cert.id
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
                        onClick={() => handleUploadOne(slot.cert.id)}
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
                            if (f) handleFileSelect(slot.cert.id, f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                    <button
                      onClick={() => handleRemoveSlot(slot.cert.id)}
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MyWarehouses() {
  const navigate  = useNavigate();
  const [user] = useState(() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } });
  const [allWarehouses, setAllWarehouses] = useState<ColdStorage[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [reuploadTarget, setReuploadTarget] = useState<ColdStorage | null>(null);

  useEffect(() => {
    let mounted = true;
    warehousesAPI.getAll().then(items => { if (mounted) setAllWarehouses(items); }).catch(err => console.error('Failed to load warehouses:', err));
    return () => { mounted = false; };
  }, []);

  const myWarehouses = useMemo(
    () => allWarehouses.filter(w => w.ownerId === user?.id),
    [allWarehouses, user],
  );

  const activeWarehouses = useMemo(
    () => myWarehouses.filter(w => w.status !== 'inactive'),
    [myWarehouses],
  );

  const pendingCount = useMemo(
    () => myWarehouses.filter(w => w.status === 'pending').length,
    [myWarehouses],
  );

  const hiddenWarehouses = useMemo(
    () => myWarehouses.filter(w => w.status === 'inactive'),
    [myWarehouses],
  );

  const warehouses = showHidden ? hiddenWarehouses : activeWarehouses;

  const handleHide = async (warehouse: ColdStorage) => {
    if (!confirm(`Ẩn kho "${warehouse.name}"? Kho sẽ không hiển thị cho người thuê nhưng bạn có thể khôi phục bất cứ lúc nào.`)) return;
    try {
      await warehousesAPI.update(warehouse.id, { status: 'inactive', updatedAt: new Date().toISOString() });
      setAllWarehouses(prev => prev.map(w => w.id === warehouse.id ? { ...w, status: 'inactive', updatedAt: new Date().toISOString() } : w));
      toast.success(`Đã ẩn kho "${warehouse.name}".`);
    } catch (err: any) {
      console.error('[MyWarehouses] hide failed', err);
      toast.error('Không thể ẩn kho');
    }
  };

  const handleRestore = async (warehouse: ColdStorage) => {
    try {
      await warehousesAPI.update(warehouse.id, { status: 'active', updatedAt: new Date().toISOString() });
      setAllWarehouses(prev => prev.map(w => w.id === warehouse.id ? { ...w, status: 'active', updatedAt: new Date().toISOString() } : w));
      toast.success(`Đã khôi phục kho "${warehouse.name}".`);
    } catch (err: any) {
      console.error('[MyWarehouses] restore failed', err);
      toast.error('Không thể khôi phục kho');
    }
  };

  const handleCertSaved = async (updated: ColdStorage) => {
    try {
      await warehousesAPI.update(updated.id, updated);
      setAllWarehouses(prev => prev.map(w => w.id === updated.id ? updated : w));
      toast.success(`Đã cập nhật chứng nhận cho kho "${updated.name}".`);
      setReuploadTarget(null);
    } catch (err: any) {
      console.error('[MyWarehouses] cert update failed', err);
      toast.error('Không thể cập nhật chứng nhận');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Kho lạnh của tôi</h1>
            <p className="text-[var(--color-text-secondary)]">
              Quản lý {myWarehouses.length} kho lạnh của bạn
            </p>
          </div>
          <Button onClick={() => navigate('/warehouse/add')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Thêm kho mới
          </Button>
        </div>

        {/* ── Tabs: Active / Hidden ── */}
        <div className="flex items-center gap-1 mb-6 border-b border-[var(--color-border)]">
          <button
            onClick={() => setShowHidden(false)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              !showHidden
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <Eye className="h-4 w-4" />
            Đang hoạt động
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              !showHidden ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
            }`}>
              {activeWarehouses.length}
            </span>
          </button>
          <button
            onClick={() => setShowHidden(true)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              showHidden
                ? 'border-[var(--color-error)] text-[var(--color-error)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <EyeOff className="h-4 w-4" />
            Đã ẩn
            {hiddenWarehouses.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                showHidden ? 'bg-[var(--color-error)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'
              }`}>
                {hiddenWarehouses.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Pending info banner ── */}
        {!showHidden && pendingCount > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 mb-5 border border-blue-200 rounded-lg"
            style={{ background: 'rgba(37,99,235,0.06)' }}
          >
            <Clock className="h-4 w-4 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-700">
              Bạn có <strong>{pendingCount} kho đang chờ duyệt</strong>. Nhân viên Logicha sẽ xem xét và kích hoạt kho của bạn sớm nhất có thể.
            </p>
          </div>
        )}

        {/* ── Hidden tab info banner ── */}
        {showHidden && hiddenWarehouses.length > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 mb-5 border border-amber-200 rounded-lg"
            style={{ background: 'rgba(245,158,11,0.06)' }}
          >
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">
              Các kho đã ẩn sẽ không hiển thị cho người thuê. Bạn có thể khôi phục bất cứ lúc nào.
            </p>
          </div>
        )}

        {warehouses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {warehouses.map((warehouse) => {
              const priceRange  = getMinMaxPrice(warehouse);
              const hasSections = (warehouse.sections?.length ?? 0) > 0;
              const availSects  = warehouse.sections?.filter(s => s.availability !== 'full').length ?? 0;
              const imgs        = warehouse.images ?? [];
              const isHidden    = warehouse.status === 'inactive';
              const isPending   = warehouse.status === 'pending';

              return (
                <Card
                  key={warehouse.id}
                  className={`bento-card overflow-hidden transition-opacity ${isHidden ? 'opacity-60' : ''}`}
                >
                  <div className="flex flex-col md:flex-row">

                    {/* ── Image strip ───────────────────────────────────── */}
                    <div
                      className="md:w-56 flex-shrink-0 relative overflow-hidden"
                      style={{ minHeight: 160, background: 'var(--color-bg-secondary)' }}
                    >
                      {/* Main cover photo */}
                      <MainImage src={imgs[0]} alt={warehouse.name} />

                      {/* Greyscale overlay when hidden */}
                      {isHidden && (
                        <div className="absolute inset-0 bg-black/20" style={{ mixBlendMode: 'saturation' }} />
                      )}

                      {/* Mini thumbnail strip at bottom */}
                      {imgs.length > 1 && (
                        <div
                          className="absolute bottom-0 left-0 right-0 p-1.5 flex gap-1"
                          style={{ background: 'rgba(0,0,0,0.45)' }}
                        >
                          {[1, 2, 3].map(i => (
                            <div
                              key={i}
                              className="w-8 h-8 overflow-hidden border border-white/30 flex-shrink-0"
                            >
                              <Thumb src={imgs[i]} />
                            </div>
                          ))}
                          {imgs.length > 4 && (
                            <div
                              className="w-8 h-8 flex items-center justify-center border border-white/30 flex-shrink-0"
                              style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.6rem', fontWeight: 700 }}
                            >
                              +{imgs.length - 4}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Image count badge (top-right) */}
                      {imgs.length > 0 && (
                        <div
                          className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5"
                          style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.6rem', borderRadius: 2 }}
                        >
                          <ImageIcon style={{ width: 9, height: 9 }} />
                          {imgs.length}
                        </div>
                      )}

                      {/* Status badge (top-left) */}
                      <div className="absolute top-2 left-2">
                        <Badge
                          className={
                            isHidden                                 ? 'bg-gray-500' :
                            warehouse.status === 'pending'          ? 'bg-[var(--color-warning)]' :
                            warehouse.availability === 'available'  ? 'bg-[var(--color-success)]' :
                            warehouse.availability === 'partially'  ? 'bg-[var(--color-warning)]' :
                            'bg-[var(--color-error)]'
                          }
                          style={{ fontSize: '0.65rem' }}
                        >
                          {isHidden                                 ? 'Đã ẩn' :
                           warehouse.status === 'pending'          ? 'Chờ duyệt' :
                           warehouse.availability === 'available'  ? 'Còn trống' :
                           warehouse.availability === 'partially'  ? 'Gần đầy'   : 'Đầy'}
                        </Badge>
                      </div>
                    </div>

                    {/* ── Content ───────────────────────────────────────── */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-lg font-semibold truncate" style={{ color: isHidden ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                              {warehouse.name}
                            </h3>
                            <SubscriptionTierBadge tier={warehouse.subscriptionTier} size="sm" />
                            {isHidden && (
                              <EyeOff className="h-4 w-4 shrink-0 text-gray-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {warehouse.location.address}, {warehouse.location.city}, {warehouse.location.province}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 shrink-0">
                          {isPending && (
                            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-amber-300 text-amber-600 bg-amber-50">
                              <Clock className="h-3.5 w-3.5" /> Chờ duyệt
                            </span>
                          )}
                          {isHidden ? (
                            <Button
                              variant="outline" size="sm"
                              className="flex items-center gap-1.5 text-[var(--color-success)] border-[var(--color-success)] hover:bg-green-50"
                              onClick={() => handleRestore(warehouse)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Khôi phục
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline" size="sm"
                                onClick={() => navigate(`/warehouse/edit/${warehouse.id}`)}
                                className="flex items-center gap-1.5"
                              >
                                <Edit className="h-3.5 w-3.5" /> Sửa
                              </Button>
                              {!isPending && (
                              <Button
                                variant="outline" size="sm"
                                className="text-[var(--color-error)] hover:bg-red-50"
                                onClick={() => handleHide(warehouse)}
                                title="Ẩn kho — không hiển thị cho người thuê"
                              >
                                <EyeOff className="h-3.5 w-3.5" />
                              </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="border border-[var(--color-border)] px-3 py-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Package className="h-3 w-3" style={{ color: 'var(--color-primary)' }} />
                            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Tổng sức chứa</p>
                          </div>
                          <p className="font-semibold text-sm">{warehouse.stats.totalCapacity.toLocaleString()} m³</p>
                        </div>
                        <div className="border border-[var(--color-border)] px-3 py-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Package className="h-3 w-3" style={{ color: 'var(--color-success)' }} />
                            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Còn trống</p>
                          </div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--color-success)' }}>
                            {warehouse.stats.availableCapacity.toLocaleString()} m³
                          </p>
                        </div>
                        <div className="border border-[var(--color-border)] px-3 py-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Thermometer className="h-3 w-3" style={{ color: 'var(--color-info)' }} />
                            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Nhiệt độ</p>
                          </div>
                          <p className="font-semibold text-sm">
                            {warehouse.stats.temperatureMin}°C ~ {warehouse.stats.temperatureMax}°C
                          </p>
                        </div>
                        <div className="border border-[var(--color-border)] px-3 py-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Tag className="h-3 w-3" style={{ color: 'var(--color-primary)' }} />
                            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Giá thuê</p>
                          </div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>
                            {fmtVnd(priceRange.min)}
                            {priceRange.max && (
                              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, fontSize: '0.75rem' }}>
                                {' '}– {fmtVnd(priceRange.max)}
                              </span>
                            )}
                            <span className="font-normal text-[10px]" style={{ color: 'var(--color-text-muted)' }}>/m³</span>
                          </p>
                        </div>
                      </div>

                      {/* Sections info */}
                      {hasSections && (
                        <div
                          className="mt-3 flex items-center gap-2 text-xs px-3 py-1.5"
                          style={{ background: 'rgba(37,99,235,0.06)', color: 'var(--color-primary)' }}
                        >
                          <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            <strong>{availSects}</strong>/{warehouse.sections!.length} phân khu còn trống
                          </span>
                        </div>
                      )}

                      {/* Subscription tier info strip */}
                      {(() => {
                        const tier = warehouse.subscriptionTier ?? 'free';
                        const cfg = SUBSCRIPTION_TIERS[tier];
                        return (
                          <div
                            className="mt-3 flex items-center justify-between gap-3 px-3 py-2"
                            style={{
                              background: cfg.bgColor,
                              borderLeft: `3px solid ${cfg.color}`,
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span style={{ fontSize: '0.9rem' }}>{cfg.icon}</span>
                              <span className="text-xs font-semibold" style={{ color: cfg.color }}>
                                Gói {cfg.label}
                              </span>
                              <span className="text-[10px] opacity-70" style={{ color: cfg.color }}>·</span>
                              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: cfg.color }}>
                                <TrendingUp className="h-3 w-3" />
                                {cfg.boostFactor === 1
                                  ? 'Xếp hạng cơ bản'
                                  : `+${Math.round((cfg.boostFactor - 1) * 100)}% ưu tiên tìm kiếm`}
                              </span>
                            </div>
                            {tier !== 'platinum' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1.5 shrink-0 text-xs"
                                style={{ borderColor: cfg.color, color: cfg.color }}
                                onClick={() => navigate('/warehouse/subscription')}
                              >
                                <Crown className="h-3 w-3" />
                                {tier === 'free' ? 'Nâng cấp' : 'Đổi gói'}
                              </Button>
                            )}
                          </div>
                        );
                      })()}

                      {/* ── Certification status + re-upload for pending warehouses ── */}
                      {isPending && (warehouse.certifications ?? []).length > 0 && (() => {
                        const total = warehouse.certifications.length;
                        const withDoc = warehouse.certifications.filter(c => c.documentUrl).length;
                        const missing = total - withDoc;
                        return (
                          <div
                            className="mt-3 flex items-center justify-between gap-3 px-3 py-2 border"
                            style={{
                              borderColor: missing > 0 ? 'var(--color-warning)' : 'var(--color-success, #22c55e)',
                              background: missing > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)',
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: missing > 0 ? 'var(--color-warning)' : 'var(--color-success, #22c55e)' }} />
                              <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                                {missing > 0
                                  ? `${missing}/${total} chứng nhận thiếu file PDF`
                                  : `${total} chứng nhận đã có file PDF`}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1.5 shrink-0 text-xs"
                              onClick={() => setReuploadTarget(warehouse)}
                            >
                              <Upload className="h-3 w-3" />
                              {missing > 0 ? 'Tải lên PDF' : 'Quản lý'}
                            </Button>
                          </div>
                        );
                      })()}

                      {/* No certifications yet — allow adding for pending */}
                      {isPending && (warehouse.certifications ?? []).length === 0 && (
                        <div
                          className="mt-3 flex items-center justify-between gap-3 px-3 py-2 border border-dashed"
                          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              Chưa có chứng nhận — thêm để đẩy nhanh phê duyệt
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5 shrink-0 text-xs"
                            onClick={() => setReuploadTarget(warehouse)}
                          >
                            <Plus className="h-3 w-3" /> Thêm
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bento-card p-12 text-center">
            {showHidden ? (
              <>
                <EyeOff className="h-16 w-16 mx-auto mb-4 text-[var(--color-text-muted)]" />
                <h3 className="text-xl font-semibold mb-2">Không có kho nào bị ẩn</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  Tất cả kho lạnh của bạn đang hoạt động bình thường
                </p>
                <Button variant="outline" onClick={() => setShowHidden(false)}>
                  Xem kho đang hoạt động
                </Button>
              </>
            ) : (
              <>
                <Warehouse className="h-16 w-16 mx-auto mb-4 text-[var(--color-text-muted)]" />
                <h3 className="text-xl font-semibold mb-2">Chưa có kho lạnh nào</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  Bắt đầu bằng cách thêm kho lạnh đầu tiên
                </p>
                <Button onClick={() => navigate('/warehouse/add')}>
                  Thêm kho mới
                </Button>
              </>
            )}
          </Card>
        )}
      </div>

      {/* ── Re-upload Certs Modal ── */}
      {reuploadTarget && (
        <ReuploadCertsModal
          warehouse={reuploadTarget}
          onClose={() => setReuploadTarget(null)}
          onSaved={handleCertSaved}
        />
      )}
    </div>
  );
}