import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { requestsAPI, warehousesAPI, contractsAPI } from '../../../services/apiClient';
import { RentalContract } from '../../../types';
import {
  ArrowLeft, FileText, Upload, Save, Send, X, CheckCircle,
  Building, User, Phone, Mail, Hash, MapPin, Package,
  Calendar, DollarSign, ClipboardList, AlertCircle, Snowflake,
  File, Trash2, Eye, Edit3, LayoutGrid, Globe,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
const fmtBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};
const today = () => new Date().toISOString().slice(0, 10);
const genRef = () => `LGC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

type InputMode = 'form' | 'pdf';

interface FormState {
  contractTitle: string;
  // Party A
  ownerLegalName: string;
  ownerTaxCode: string;
  ownerAddress: string;
  ownerPhone: string;
  ownerEmail: string;
  // Party B
  renterLegalName: string;
  renterTaxCode: string;
  renterAddress: string;
  renterPhone: string;
  renterEmail: string;
  renterCompany: string;
  // Contract details
  startDate: string;
  endDate: string;
  rentedCapacity: string;
  monthlyRate: string;
  cargoDescription: string;
  // Terms
  paymentTerms: string;
  penaltyClause: string;
  specialTerms: string;
  notes: string;
}

// ── Section label helper ──────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>
        {title}
      </span>
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
        {required && <span className="ml-1" style={{ color: 'var(--color-error)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS = "w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors";
const INPUT_STYLE = { borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' };
const TEXTAREA_CLS = "w-full px-3 py-2 text-sm border resize-none focus:outline-none focus:border-[var(--color-primary)] transition-colors";

// ── Preview modal ─────────────────────────────────────────────────────────────
function PreviewModal({ form, onClose }: { form: FormState; onClose: () => void }) {
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '___';
  const capacity = Number(form.rentedCapacity) || 0;
  const rate = Number(form.monthlyRate) || 0;
  const months = form.startDate && form.endDate
    ? Math.max(1, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (30 * 86400000)))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]"
          style={{ background: 'var(--color-primary)' }}>
          <div className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5" />
            <span className="font-semibold">Xem trước hợp đồng</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-sm" style={{ color: 'var(--color-text)' }}>
          {/* Title */}
          <div className="text-center pb-4 border-b border-[var(--color-border)]">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Độc lập – Tự do – Hạnh phúc
            </p>
            <h2 className="text-base font-bold uppercase" style={{ color: 'var(--color-text)' }}>
              {form.contractTitle || 'HỢP ĐỒNG THUÊ KHO LẠNH'}
            </h2>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--color-primary)' }}>
                BÊN A — CHỦ KHO
              </p>
              <dl className="space-y-1.5 text-xs">
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 80 }}>Tên:</dt><dd className="font-semibold">{form.ownerLegalName || '___'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 80 }}>MST:</dt><dd className="font-mono">{form.ownerTaxCode || '___'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 80 }}>Địa chỉ:</dt><dd>{form.ownerAddress || '___'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 80 }}>ĐT:</dt><dd>{form.ownerPhone || '___'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 80 }}>Email:</dt><dd>{form.ownerEmail || '___'}</dd></div>
              </dl>
            </div>
            <div className="p-4 border border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--color-success, #22c55e)' }}>
                BÊN B — NGƯỜI THUÊ
              </p>
              <dl className="space-y-1.5 text-xs">
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 80 }}>Tên:</dt><dd className="font-semibold">{form.renterLegalName || '___'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 80 }}>Công ty:</dt><dd>{form.renterCompany || '___'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 80 }}>MST:</dt><dd className="font-mono">{form.renterTaxCode || '___'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 80 }}>Địa chỉ:</dt><dd>{form.renterAddress || '___'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 80 }}>ĐT:</dt><dd>{form.renterPhone || '___'}</dd></div>
                <div className="flex gap-2"><dt style={{ color: 'var(--color-text-muted)', minWidth: 80 }}>Email:</dt><dd>{form.renterEmail || '___'}</dd></div>
              </dl>
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              ĐIỀU KHOẢN HỢP ĐỒNG
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Bắt đầu', value: fmtDate(form.startDate) },
                { label: 'Kết thúc', value: fmtDate(form.endDate) },
                { label: 'Dung tích', value: `${Number(form.rentedCapacity).toLocaleString()} m³` },
                { label: 'Đơn giá/m³/tháng', value: fmtCurrency(rate) },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 border border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
                  <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                  <p className="font-semibold text-xs" style={{ color: 'var(--color-text)' }}>{value}</p>
                </div>
              ))}
            </div>
            {months > 0 && (
              <div className="flex items-center justify-between px-4 py-3"
                style={{ background: 'rgba(37,99,235,0.07)', borderLeft: '3px solid var(--color-primary)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Tổng giá trị hợp đồng ({months} tháng):
                </span>
                <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
                  {fmtCurrency(capacity * rate * months)}
                </span>
              </div>
            )}
            {form.cargoDescription && (
              <div><p className="text-[10px] uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Loại hàng hóa</p>
                <p className="text-xs">{form.cargoDescription}</p></div>
            )}
            {form.paymentTerms && (
              <div><p className="text-[10px] uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Điều khoản thanh toán</p>
                <p className="text-xs">{form.paymentTerms}</p></div>
            )}
            {form.penaltyClause && (
              <div><p className="text-[10px] uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Điều khoản phạt</p>
                <p className="text-xs">{form.penaltyClause}</p></div>
            )}
            {form.specialTerms && (
              <div><p className="text-[10px] uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Điều khoản đặc biệt</p>
                <p className="text-xs">{form.specialTerms}</p></div>
            )}
          </div>

          {/* Signature placeholders */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-[var(--color-border)]">
            <div className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <p className="font-semibold mb-12" style={{ color: 'var(--color-text)' }}>ĐẠI DIỆN BÊN A</p>
              <p className="border-t border-dashed border-[var(--color-border)] pt-2">(Ký và ghi rõ họ tên)</p>
            </div>
            <div className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <p className="font-semibold mb-12" style={{ color: 'var(--color-text)' }}>ĐẠI DIỆN BÊN B</p>
              <p className="border-t border-dashed border-[var(--color-border)] pt-2">(Ký và ghi rõ họ tên)</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--color-border)] flex justify-end" style={{ background: 'var(--color-bg-secondary)' }}>
          <button onClick={onClose}
            className="px-5 py-2 text-sm border transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreateContract() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  const [user] = useState(() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } });
  const [request, setRequest] = useState<any | undefined>(undefined);
  const [warehouse, setWarehouse] = useState<any | undefined>(undefined);
  const [existingDraft, setExistingDraft] = useState<RentalContract | undefined>(undefined);

  useEffect(() => {
    if (!requestId) return;
    let mounted = true;
    const load = async () => {
      try {
        const req = await requestsAPI.getById(requestId);
        if (!mounted) return;
        setRequest(req);
        try {
          const wh = await warehousesAPI.getById(req.warehouseId);
          if (mounted) setWarehouse(wh);
        } catch (e) {
          // ignore
        }
        const allContracts = await contractsAPI.getAll();
        const draft = allContracts.find(c => c.requestId === requestId && (c.status === 'draft' || c.status === 'pending_renter')) as RentalContract | undefined;
        if (draft && mounted) setExistingDraft(draft);
      } catch (err) {
        console.warn('[CreateContract] load data failed', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [requestId]);

  const [inputMode, setInputMode] = useState<InputMode>('form');
  const [showPreview, setShowPreview] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Derived contract ref ──────────────────────────────────────────────────
  const contractRef = existingDraft?.contractRef ?? genRef();
  const contractId = existingDraft?.id ?? `contract-new-${requestId}`;

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>({
    contractTitle: '',
    ownerLegalName: '',
    ownerTaxCode: '',
    ownerAddress: '',
    ownerPhone: '',
    ownerEmail: '',
    renterLegalName: '',
    renterTaxCode: '',
    renterAddress: '',
    renterPhone: '',
    renterEmail: '',
    renterCompany: '',
    startDate: today(),
    endDate: '',
    rentedCapacity: '',
    monthlyRate: '',
    cargoDescription: '',
    paymentTerms: 'Thanh toán trước ngày 05 hàng tháng. Hình thức: chuyển khoản ngân hàng.',
    penaltyClause: 'Phạt 5% tổng giá trị hợp đồng còn lại nếu một bên huỷ trước thời hạn mà không thông báo trước 30 ngày.',
    specialTerms: '',
    notes: '',
  });

  // Prefill form when user/request/warehouse/ existingDraft are available
  useEffect(() => {
    if (!user && !request && !existingDraft) return;
    setForm(prev => ({
      ...prev,
      ownerLegalName: existingDraft?.ownerLegalName ?? user?.name ?? prev.ownerLegalName,
      ownerPhone: existingDraft?.ownerPhone ?? user?.phone ?? prev.ownerPhone,
      ownerEmail: existingDraft?.ownerEmail ?? user?.email ?? prev.ownerEmail,
      renterLegalName: existingDraft?.renterLegalName ?? request?.renterName ?? prev.renterLegalName,
      renterPhone: existingDraft?.renterPhone ?? request?.renterPhone ?? prev.renterPhone,
      renterEmail: existingDraft?.renterEmail ?? request?.renterEmail ?? prev.renterEmail,
      renterCompany: existingDraft?.renterCompany ?? request?.renterCompany ?? prev.renterCompany,
      startDate: existingDraft?.startDate ?? request?.startDate ?? prev.startDate,
      endDate: existingDraft?.endDate ?? prev.endDate,
      rentedCapacity: String(existingDraft?.rentedCapacity ?? request?.requestedCapacity ?? prev.rentedCapacity),
      monthlyRate: String(existingDraft?.monthlyRate ?? request?.offeredPrice ?? request?.priceTierValue ?? prev.monthlyRate),
      cargoDescription: existingDraft?.cargoDescription ?? request?.cargoType ?? prev.cargoDescription,
      notes: existingDraft?.notes ?? request?.message ?? prev.notes,
    }));
  }, [user, request, existingDraft]);

  // ── Pre-fill from existing draft ──────────────────���───────────────────────
  useEffect(() => {
    if (!existingDraft) return;
    setInputMode(existingDraft.inputMode ?? 'form');
    setForm({
      contractTitle: existingDraft.contractTitle ?? '',
      ownerLegalName: existingDraft.ownerLegalName ?? existingDraft.ownerName ?? '',
      ownerTaxCode: existingDraft.ownerTaxCode ?? '',
      ownerAddress: existingDraft.ownerAddress ?? '',
      ownerPhone: existingDraft.ownerPhone ?? '',
      ownerEmail: existingDraft.ownerEmail ?? '',
      renterLegalName: existingDraft.renterLegalName ?? '',
      renterTaxCode: existingDraft.renterTaxCode ?? '',
      renterAddress: existingDraft.renterAddress ?? '',
      renterPhone: existingDraft.renterPhone ?? '',
      renterEmail: existingDraft.renterEmail ?? '',
      renterCompany: existingDraft.renterCompany ?? '',
      startDate: existingDraft.startDate,
      endDate: existingDraft.endDate,
      rentedCapacity: String(existingDraft.rentedCapacity),
      monthlyRate: String(existingDraft.monthlyRate),
      cargoDescription: existingDraft.cargoDescription ?? '',
      paymentTerms: existingDraft.paymentTerms ?? '',
      penaltyClause: existingDraft.penaltyClause ?? '',
      specialTerms: existingDraft.specialTerms ?? '',
      notes: existingDraft.notes ?? '',
    });
    if (existingDraft.pdfFileName) {
      // Simulate that a PDF was already uploaded
      setPdfFile(new File([], existingDraft.pdfFileName, { type: 'application/pdf' }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm(f => ({ ...f, [key]: e.target.value }));

  // ── Validation ────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    if (inputMode === 'form') {
      if (!form.ownerLegalName.trim()) { toast.error('Vui lòng nhập tên đầy đủ Bên A'); return false; }
      if (!form.ownerTaxCode.trim()) { toast.error('Vui lòng nhập MST Bên A'); return false; }
      if (!form.renterLegalName.trim()) { toast.error('Vui lòng nhập tên đầy đủ Bên B'); return false; }
      if (!form.renterTaxCode.trim()) { toast.error('Vui lòng nhập MST Bên B'); return false; }
      if (!form.startDate) { toast.error('Vui lòng chọn ngày bắt đầu'); return false; }
      if (!form.endDate) { toast.error('Vui lòng chọn ngày kết thúc'); return false; }
      if (!form.rentedCapacity || Number(form.rentedCapacity) <= 0) { toast.error('Vui lòng nhập dung tích thuê'); return false; }
      if (!form.monthlyRate || Number(form.monthlyRate) <= 0) { toast.error('Vui lòng nhập đơn giá'); return false; }
    } else {
      if (!pdfFile) { toast.error('Vui lòng tải lên file PDF hợp đồng'); return false; }
      if (!form.ownerLegalName.trim()) { toast.error('Vui lòng nhập tên Bên A'); return false; }
      if (!form.ownerTaxCode.trim()) { toast.error('Vui lòng nhập MST Bên A'); return false; }
      if (!form.renterLegalName.trim()) { toast.error('Vui lòng nhập tên Bên B'); return false; }
      if (!form.renterTaxCode.trim()) { toast.error('Vui lòng nhập MST Bên B'); return false; }
      if (!form.startDate) { toast.error('Vui lòng nhập ngày bắt đầu'); return false; }
      if (!form.endDate) { toast.error('Vui lòng nhập ngày kết thúc'); return false; }
    }
    return true;
  };

  // ── Build contract object ─────────────────────────────────────────────────
  const buildContract = (status: 'draft' | 'pending_renter'): RentalContract => ({
    id: contractId,
    requestId: requestId ?? undefined,
    renterId: request?.renterId ?? '',
    ownerId: user?.id ?? '',
    warehouseId: request?.warehouseId ?? '',
    sectionId: request?.sectionId,
    sectionIds: request?.sectionIds,
    isWholeWarehouse: request?.isWholeWarehouse,
    contractRef,
    inputMode,
    status,
    contractTitle: form.contractTitle || `Hợp đồng thuê kho lạnh${warehouse ? ` – ${warehouse.name}` : ''}`,
    ownerLegalName: form.ownerLegalName,
    ownerTaxCode: form.ownerTaxCode,
    ownerAddress: form.ownerAddress,
    ownerName: form.ownerLegalName,
    ownerPhone: form.ownerPhone,
    ownerEmail: form.ownerEmail,
    renterLegalName: form.renterLegalName,
    renterTaxCode: form.renterTaxCode,
    renterAddress: form.renterAddress,
    renterCompany: form.renterCompany,
    renterPhone: form.renterPhone,
    renterEmail: form.renterEmail,
    rentedCapacity: Number(form.rentedCapacity) || 0,
    startDate: form.startDate,
    endDate: form.endDate,
    monthlyRate: Number(form.monthlyRate) || 0,
    cargoDescription: form.cargoDescription,
    paymentTerms: form.paymentTerms,
    penaltyClause: form.penaltyClause,
    specialTerms: form.specialTerms,
    notes: form.notes,
    pdfFileName: pdfFile?.name,
    pdfFileSize: pdfFile?.size,
    sentAt: status === 'pending_renter' ? new Date().toISOString() : undefined,
  });

  const handleSaveDraft = async () => {
    try {
      await contractsAPI.create(buildContract('draft'));
      toast.success('Đã lưu bản nháp hợp đồng!');
      navigate('/warehouse/contracts');
    } catch (err: any) {
      console.error('[CreateContract] createContract failed:', err);
      toast.error(err?.message ?? 'Không thể lưu hợp đồng');
      return;
    }
  };

  const handleSendToRenter = async () => {
    if (!validateForm()) return;
    try {
      await contractsAPI.create(buildContract('pending_renter'));
      if (requestId) {
        try {
          await requestsAPI.update(requestId, { status: 'contracted' });
        } catch (err: any) {
          console.error('[CreateContract] requestsAPI.update failed:', err);
        }
      }
      toast.success('Đã gửi hợp đồng cho người thuê ký xác nhận!');
      navigate('/warehouse/contracts');
    } catch (err: any) {
      console.error('[CreateContract] createContract failed:', err);
      toast.error(err?.message ?? 'Không thể gửi hợp đồng');
      return;
    }
  };

  // ── PDF drop handlers ─────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') {
      setPdfFile(file);
      toast.success(`Đã tải lên: ${file.name}`);
    } else {
      toast.error('Chỉ chấp nhận file PDF.');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === 'application/pdf') {
      setPdfFile(file);
      toast.success(`Đã tải lên: ${file.name}`);
    } else if (file) {
      toast.error('Chỉ chấp nhận file PDF.');
    }
  };


  const capacity = Number(form.rentedCapacity) || 0;
  const rate = Number(form.monthlyRate) || 0;
  const months = form.startDate && form.endDate
    ? Math.max(1, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (30 * 86400000)))
    : 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {showPreview && <PreviewModal form={form} onClose={() => setShowPreview(false)} />}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Back nav ── */}
        <button
          onClick={() => navigate('/warehouse/contracts')}
          className="flex items-center gap-2 text-sm mb-5 hover:underline"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách hợp đồng
        </button>

        {/* ── Page header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-text)' }}>
              <ClipboardList className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
              {existingDraft ? 'Chỉnh sửa hợp đồng' : 'Soạn hợp đồng mới'}
            </h1>
            {request && (
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Từ yêu cầu #{requestId?.toUpperCase()} · {request.renterName}
                {warehouse && ` · Kho: ${warehouse.name}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-2 border border-[var(--color-border)]"
            style={{ background: 'var(--color-surface)' }}>
            <Hash className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>Mã HĐ:</span>
            <span className="font-mono font-semibold" style={{ color: 'var(--color-primary)' }}>{contractRef}</span>
          </div>
        </div>

        {/* ── Renter rejection note ── */}
        {existingDraft?.renterRejectionReason && (
          <div className="flex items-start gap-3 px-4 py-3 mb-5 text-sm border"
            style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
            <div>
              <p className="font-semibold mb-0.5" style={{ color: 'var(--color-error)' }}>
                Người thuê đã từ chối — hãy chỉnh sửa và gửi lại
              </p>
              <p style={{ color: 'var(--color-text)' }}>"{existingDraft.renterRejectionReason}"</p>
            </div>
          </div>
        )}

        {/* ── Section / Scope info from request ── */}
        {request && (request.sectionIds?.length || request.isWholeWarehouse || request.sectionId) && (() => {
          const sections = warehouse?.sections ?? [];
          const isWhole = request.isWholeWarehouse;
          const ids = request.sectionIds ?? (request.sectionId ? [request.sectionId] : []);
          const selectedSections = sections.filter(s => ids.includes(s.id));
          return (
            <div className="mb-5 border border-[var(--color-border)] overflow-hidden"
              style={{ background: 'var(--color-surface)' }}>
              <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center gap-2"
                style={{ background: 'rgba(37,99,235,0.05)' }}>
                {isWhole
                  ? <Globe className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                  : <LayoutGrid className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />}
                <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {isWhole ? 'Người thuê yêu cầu thuê toàn bộ kho' : `Phân khu được yêu cầu (${ids.length} khu)`}
                </span>
              </div>
              <div className="px-4 py-3">
                {isWhole ? (
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Người thuê muốn thuê toàn bộ kho <strong>{warehouse?.name}</strong>. Chủ kho cần thương lượng và điền đơn giá vào hợp đồng.
                  </p>
                ) : selectedSections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedSections.map(sec => (
                      <div key={sec.id} className="flex items-center gap-2 px-3 py-1.5 border border-[var(--color-border)] text-xs"
                        style={{ background: 'var(--color-bg-secondary)' }}>
                        <Snowflake className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-info, #3b82f6)' }} />
                        <span style={{ color: 'var(--color-text)' }}>{sec.name}</span>
                        <span className="font-mono" style={{ color: 'var(--color-text-muted)' }}>{sec.capacity.toLocaleString()} m³</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {ids.length} phân khu (ID: {ids.join(', ')})
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Input mode toggle ── */}
        <div className="flex border border-[var(--color-border)] mb-6 overflow-hidden"
          style={{ background: 'var(--color-surface)' }}>
          {([
            { key: 'form' as InputMode, icon: <Edit3 className="h-4 w-4" />, label: 'Nhập liệu thủ công' },
            { key: 'pdf' as InputMode, icon: <Upload className="h-4 w-4" />, label: 'Tải lên PDF / Scan' },
          ]).map(({ key, icon, label }) => (
            <button key={key}
              onClick={() => setInputMode(key)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors border-b-2"
              style={{
                borderBottomColor: inputMode === key ? 'var(--color-primary)' : 'transparent',
                color: inputMode === key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: inputMode === key ? 600 : 400,
                background: inputMode === key ? 'rgba(37,99,235,0.05)' : 'transparent',
              }}>
              {icon} {label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {/* ── PDF upload mode ── */}
          {inputMode === 'pdf' && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
              <SectionHeader icon={<Upload className="h-4 w-4" />} title="Tải lên hợp đồng PDF / Scan" />

              {!pdfFile ? (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-14 transition-colors"
                  style={{
                    borderColor: isDragging ? 'var(--color-primary)' : 'var(--color-border)',
                    background: isDragging ? 'rgba(37,99,235,0.04)' : 'var(--color-bg-secondary)',
                  }}
                >
                  <File className="h-10 w-10 mb-3" style={{ color: isDragging ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                    Kéo & thả file PDF vào đây
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    hoặc <span style={{ color: 'var(--color-primary)' }}>click để chọn file</span>
                  </p>
                  <p className="text-[10px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
                    Hỗ trợ: PDF (hợp đồng scan hoặc soạn sẵn) · Tối đa 20 MB
                  </p>
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />
                </div>
              ) : (
                <div className="flex items-center gap-4 px-4 py-3 border border-[var(--color-border)]"
                  style={{ background: 'rgba(37,99,235,0.05)' }}>
                  <div className="w-10 h-10 flex items-center justify-center"
                    style={{ background: 'var(--color-primary)' }}>
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{pdfFile.name}</p>
                    {pdfFile.size > 0 && (
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{fmtBytes(pdfFile.size)}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-8 h-8 flex items-center justify-center border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                      title="Thay file khác">
                      <Upload className="h-3.5 w-3.5" style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                    <button
                      onClick={() => setPdfFile(null)}
                      className="w-8 h-8 flex items-center justify-center border transition-colors"
                      style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                      title="Xóa file">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />
                </div>
              )}

              <p className="text-xs mt-3 flex items-center gap-1.5"
                style={{ color: 'var(--color-text-muted)' }}>
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Hãy điền thêm thông tin cơ bản bên dưới để hệ thống lưu trữ và thông báo chính xác.
              </p>
            </div>
          )}

          {/* ── Contract title ── */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
            <SectionHeader icon={<FileText className="h-4 w-4" />} title="Tên hợp đồng" />
            <Field label="Tiêu đề hợp đồng">
              <input
                type="text"
                className={INPUT_CLS}
                style={INPUT_STYLE}
                placeholder={`Hợp đồng thuê kho lạnh${warehouse ? ` – ${warehouse.name}` : ''}`}
                value={form.contractTitle}
                onChange={set('contractTitle')}
              />
            </Field>
          </div>

          {/* ── Party A ── */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
            <SectionHeader icon={<Building className="h-4 w-4" />} title="Bên A — Chủ kho (Bên cho thuê)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tên đầy đủ / Tên công ty" required>
                <input type="text" className={INPUT_CLS} style={INPUT_STYLE}
                  placeholder="CÔNG TY TNHH KHO LẠNH ABC" value={form.ownerLegalName} onChange={set('ownerLegalName')} />
              </Field>
              <Field label="Mã số thuế (MST)" required>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="text" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                    placeholder="0123456789" value={form.ownerTaxCode} onChange={set('ownerTaxCode')} />
                </div>
              </Field>
              <Field label="Địa chỉ đăng ký kinh doanh">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="text" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                    placeholder="Số 1, Đường ABC, Quận 1, TP.HCM" value={form.ownerAddress} onChange={set('ownerAddress')} />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Số điện thoại">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    <input type="tel" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                      placeholder="+84 9xx..." value={form.ownerPhone} onChange={set('ownerPhone')} />
                  </div>
                </Field>
                <Field label="Email">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                    <input type="email" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                      placeholder="owner@email.com" value={form.ownerEmail} onChange={set('ownerEmail')} />
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* ── Party B ── */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
            <SectionHeader icon={<User className="h-4 w-4" />} title="Bên B — Người thuê (Bên thuê)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tên đầy đủ / Người đại diện" required>
                <input type="text" className={INPUT_CLS} style={INPUT_STYLE}
                  placeholder="NGUYỄN VĂN A" value={form.renterLegalName} onChange={set('renterLegalName')} />
              </Field>
              <Field label="Mã số thuế (MST)" required>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="text" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                    placeholder="0987654321" value={form.renterTaxCode} onChange={set('renterTaxCode')} />
                </div>
              </Field>
              <Field label="Tên công ty">
                <input type="text" className={INPUT_CLS} style={INPUT_STYLE}
                  placeholder="CÔNG TY CP THỰC PHẨM XYZ" value={form.renterCompany} onChange={set('renterCompany')} />
              </Field>
              <Field label="Địa chỉ">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="text" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                    placeholder="Số 99, Đường DEF, Quận 7, TP.HCM" value={form.renterAddress} onChange={set('renterAddress')} />
                </div>
              </Field>
              <Field label="Số điện thoại">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="tel" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                    placeholder="+84 9xx..." value={form.renterPhone} onChange={set('renterPhone')} />
                </div>
              </Field>
              <Field label="Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="email" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                    placeholder="renter@email.com" value={form.renterEmail} onChange={set('renterEmail')} />
                </div>
              </Field>
            </div>
          </div>

          {/* ── Contract details ── */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
            <SectionHeader icon={<Package className="h-4 w-4" />} title="Chi tiết hợp đồng" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Ngày bắt đầu" required>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="date" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                    value={form.startDate} onChange={set('startDate')} />
                </div>
              </Field>
              <Field label="Ngày kết thúc" required>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="date" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                    value={form.endDate} onChange={set('endDate')} min={form.startDate} />
                </div>
              </Field>
              <Field label="Dung tích thuê (m³)" required>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="number" min="1" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                    placeholder="500" value={form.rentedCapacity} onChange={set('rentedCapacity')} />
                </div>
              </Field>
              <Field label="Đơn giá (VND/m³/tháng)" required>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <input type="number" min="0" className={INPUT_CLS + ' pl-8'} style={INPUT_STYLE}
                    placeholder="350000" value={form.monthlyRate} onChange={set('monthlyRate')} />
                </div>
              </Field>
            </div>

            {/* Cost summary */}
            {capacity > 0 && rate > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--color-border)] mb-4">
                {[
                  { label: 'Chi phí / tháng', value: fmtCurrency(capacity * rate) },
                  { label: 'Thời hạn', value: months > 0 ? `${months} tháng` : '—' },
                  { label: 'Tổng giá trị HĐ', value: months > 0 ? fmtCurrency(capacity * rate * months) : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4" style={{ background: 'var(--color-bg-secondary)' }}>
                    <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                    <p className="font-bold" style={{ color: 'var(--color-primary)' }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            <Field label="Mô tả hàng hóa / loại hàng">
              <input type="text" className={INPUT_CLS} style={INPUT_STYLE}
                placeholder="Thực phẩm đông lạnh, hải sản, sữa & chế phẩm..." value={form.cargoDescription} onChange={set('cargoDescription')} />
            </Field>
          </div>

          {/* ── Terms & conditions ── */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
            <SectionHeader icon={<ClipboardList className="h-4 w-4" />} title="Điều khoản & điều kiện" />
            <div className="space-y-4">
              <Field label="Điều khoản thanh toán">
                <textarea rows={2} className={TEXTAREA_CLS} style={INPUT_STYLE}
                  value={form.paymentTerms} onChange={set('paymentTerms')} />
              </Field>
              <Field label="Điều khoản phạt hợp đồng">
                <textarea rows={2} className={TEXTAREA_CLS} style={INPUT_STYLE}
                  value={form.penaltyClause} onChange={set('penaltyClause')} />
              </Field>
              <Field label="Điều khoản đặc biệt khác">
                <textarea rows={3} className={TEXTAREA_CLS} style={INPUT_STYLE}
                  placeholder="Ví dụ: Nhiệt độ bảo quản yêu cầu ≤ -18°C, kiểm tra 3 lần/ngày..."
                  value={form.specialTerms} onChange={set('specialTerms')} />
              </Field>
              <Field label="Ghi chú thêm">
                <textarea rows={2} className={TEXTAREA_CLS} style={INPUT_STYLE}
                  placeholder="Thông tin khác cần lưu ý..."
                  value={form.notes} onChange={set('notes')} />
              </Field>
            </div>
          </div>

          {/* ── Action bar ── */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex flex-wrap items-center gap-3">
            {/* Preview (form mode only) */}
            {inputMode === 'form' && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm border transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <Eye className="h-4 w-4" /> Xem trước hợp đồng
              </button>
            )}

            <div className="flex-1" />

            {/* Save draft */}
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-4 py-2.5 text-sm border transition-colors"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
              <Save className="h-4 w-4" /> Lưu bản nháp
            </button>

            {/* Send to renter */}
            <button
              onClick={handleSendToRenter}
              className="flex items-center gap-2 px-5 py-2.5 text-sm text-white transition-colors"
              style={{ background: 'var(--color-primary)' }}>
              <Send className="h-4 w-4" /> Gửi cho người thuê ký
            </button>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 text-xs px-4 py-3"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--color-success, #22c55e)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Sau khi gửi, người thuê sẽ nhận được hợp đồng để xem xét và ký xác nhận. Hợp đồng chỉ có hiệu lực
              khi người thuê bấm <strong>"Xác nhận ký kết"</strong>. Bạn có thể lưu bản nháp để chỉnh sửa sau.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}