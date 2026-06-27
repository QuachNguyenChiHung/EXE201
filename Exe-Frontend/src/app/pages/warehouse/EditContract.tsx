import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { ownerService } from '../../../services/ownerService';
import { CreateContractParties } from '../../components/owner/CreateContractParties';
import { CreateContractTerms } from '../../components/owner/CreateContractTerms';
import { CreateContractPreviewModal } from '../../components/owner/CreateContractPreviewModal';
import {
  ArrowLeft, ClipboardList, Save, Send, CheckCircle, Hash,
  Snowflake, Edit3, AlertCircle, ChevronDown, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditContract() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });

  const [contractData, setContractData] = useState<any | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!contractId) return;
    let mounted = true;
    const load = async () => {
      try {
        const data = await ownerService.getContractById(Number(contractId));
        if (!mounted) return;
        setContractData(data);
      } catch (err: any) {
        if (mounted) setLoadError(err?.response?.data || err?.message || 'Không thể tải hợp đồng');
      }
    };
    load();
    return () => { mounted = false; };
  }, [contractId]);

  // Build form state from the loaded contract
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!contractData) return;
    const c = contractData;
    setForm({
      contractTitle: c.contractTitle || c.title || '',
      owner_legal_name: c.ownerLegalName || c.owner_legal_name || '',
      owner_tax_code: c.ownerTaxCode || c.owner_tax_code || '',
      owner_address: c.ownerAddress || c.owner_address || '',
      owner_phone: c.ownerPhone || c.owner_phone || '',
      owner_email: c.ownerEmail || c.owner_email || '',
      renter_legal_name: c.renterLegalName || c.renter_legal_name || '',
      renter_tax_code: c.renterTaxCode || c.renter_tax_code || '',
      renter_address: c.renterAddress || c.renter_address || '',
      renter_phone: c.renterPhone || c.renter_phone || '',
      renter_email: c.renterEmail || c.renter_email || '',
      renterCompany: c.renterCompany || '',
      start_at: c.startAt || c.start_at || '',
      end_at: c.endAt || c.end_at || '',
      rentedCapacity: c.rentedCapacity ?? c.rented_capacity ?? 0,
      monthlyRate: c.monthlyRate ?? c.totalPrice ?? c.total_price ?? 0,
      cargo_description: c.cargoDescription || c.cargo_description || '',
      payment_term: c.paymentTerm || c.payment_term || '',
      penalty_clause: c.penaltyClause || c.penalty_clause || '',
      special_term: c.specialTerm || c.special_term || '',
    });
  }, [contractData]);

  const onChange = (key: string, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const validateForm = (): boolean => {
    if (!form.owner_legal_name?.trim()) { toast.error('Vui lòng nhập tên Bên A'); return false; }
    if (!form.owner_tax_code?.trim()) { toast.error('Vui lòng nhập MST Bên A'); return false; }
    if (!form.renter_legal_name?.trim()) { toast.error('Vui lòng nhập tên Bên B'); return false; }
    if (!form.renter_tax_code?.trim()) { toast.error('Vui lòng nhập MST Bên B'); return false; }
    if (!form.start_at) { toast.error('Vui lòng chọn ngày bắt đầu'); return false; }
    if (!form.end_at) { toast.error('Vui lòng chọn ngày kết thúc'); return false; }
    if (!form.monthlyRate || form.monthlyRate <= 0) { toast.error('Vui lòng nhập đơn giá'); return false; }
    return true;
  };

  const buildApiPayload = () => {
    const totalPrice = Number(form.monthlyRate) || 0;
    return {
      totalPrice,
      startAt: form.start_at || '',
      endAt: form.end_at || '',
      paymentTerm: form.payment_term || '',
      penaltyClause: form.penalty_clause || '',
      specialTerm: form.special_term || '',
      ownerLegalName: form.owner_legal_name || '',
      ownerTaxCode: form.owner_tax_code || '',
      ownerAddress: form.owner_address || '',
      ownerPhone: form.owner_phone || '',
      ownerEmail: form.owner_email || '',
      renterLegalName: form.renter_legal_name || '',
      renterTaxCode: form.renter_tax_code || '',
      renterAddress: form.renter_address || '',
      renterPhone: form.renter_phone || '',
      renterEmail: form.renter_email || '',
      cargoDescription: form.cargo_description || '',
      status: contractData?.status || 'PENDING',
    };
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await ownerService.updateContract(Number(contractId), buildApiPayload());
      toast.success('Cập nhật hợp đồng thành công!');
      navigate('/warehouse/contracts');
    } catch (err: any) {
      toast.error(err?.response?.data || err?.message || 'Không thể cập nhật hợp đồng');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-error)' }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Không thể tải hợp đồng</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>{loadError}</p>
          <button onClick={() => navigate('/warehouse/contracts')} className="px-4 py-2 text-sm text-white" style={{ background: 'var(--color-primary)' }}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!contractData || Object.keys(form).length === 0) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--color-primary)' }} />
          <span className="ml-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Đang tải hợp đồng…</span>
        </div>
      </div>
    );
  }

  const contractStatus = contractData?.status;
  const isEditable = contractStatus === 'PENDING';
  const isDraft = contractStatus === 'DRAFT';
  const contractRef = contractData?.contractRef || `HĐ-${contractId}`;
  const warehouseName = contractData?.warehouseName || contractData?.warehouse?.name || '';

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {showPreview && (
        <CreateContractPreviewModal
          contract={{ ...form, id_contract: Number(contractId) } as any}
          request={contractData?.rentRequest || null}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate('/warehouse/contracts')}
          className="flex items-center gap-2 text-sm mb-5 hover:underline"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách hợp đồng
        </button>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="flex items-center gap-2 mb-1" style={{ color: 'var(--color-text)' }}>
              <ClipboardList className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
              Chỉnh sửa hợp đồng
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {warehouseName ? `Kho: ${warehouseName}` : `Hợp đồng #${contractId}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Status badge */}
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full border"
              style={{
                color: isDraft ? 'var(--color-warning, #f59e0b)' : isEditable ? 'var(--color-info, #3b82f6)' : 'var(--color-text-muted)',
                borderColor: isDraft ? 'rgba(245,158,11,0.3)' : isEditable ? 'rgba(59,130,246,0.3)' : 'var(--color-border)',
                background: isDraft ? 'rgba(245,158,11,0.08)' : isEditable ? 'rgba(59,130,246,0.08)' : 'var(--color-surface)',
              }}
            >
              {contractStatus === 'PENDING' ? 'Đang chờ ký' :
               contractStatus === 'DRAFT' ? 'Bản nháp' :
               contractStatus === 'ACTIVE' ? 'Đang hoạt động' :
               contractStatus === 'COMPLETED' ? 'Đã hoàn thành' :
               contractStatus === 'CANCELED' ? 'Đã hủy' : contractStatus}
            </span>
            <div className="flex items-center gap-2 text-xs px-3 py-2 border border-[var(--color-border)]"
              style={{ background: 'var(--color-surface)' }}>
              <Hash className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
              <span style={{ color: 'var(--color-text-muted)' }}>Mã HĐ:</span>
              <span className="font-mono font-semibold" style={{ color: 'var(--color-primary)' }}>{contractRef}</span>
            </div>
          </div>
        </div>

        {/* DRAFT guard — backend only allows editing PENDING contracts */}
        {isDraft && (
          <div className="flex items-start gap-3 px-4 py-4 mb-5 text-sm border"
            style={{ background: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.35)' }}>
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--color-warning, #f59e0b)' }} />
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--color-warning, #f59e0b)' }}>
                Hợp đồng đang ở trạng thái bản nháp
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Bạn cần gửi hợp đồng cho người thuê từ trang tạo hợp đồng trước. Sau khi người thuê nhận được,
                hợp đồng sẽ chuyển sang trạng thái <strong>PENDING</strong> và bạn có thể chỉnh sửa tại đây.
              </p>
            </div>
          </div>
        )}

        {/* Non-editable guard */}
        {!isEditable && !isDraft && (
          <div className="flex items-start gap-3 px-4 py-4 mb-5 text-sm border"
            style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.25)' }}>
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
            <div>
              <p className="font-semibold mb-0.5" style={{ color: 'var(--color-error)' }}>
                Không thể chỉnh sửa hợp đồng này
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Hợp đồng đang ở trạng thái <strong>{contractStatus}</strong>. Chỉ hợp đồng ở trạng thái
                <strong> PENDING</strong> (chờ ký) mới có thể chỉnh sửa.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">

          {/* Contract title */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
              <ClipboardList className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>Tên hợp đồng</span>
            </div>
            <input
              type="text"
              className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder={warehouseName ? `Hợp đồng thuê kho lạnh – ${warehouseName}` : 'Tên hợp đồng'}
              value={form.contractTitle || ''}
              onChange={(e) => onChange('contractTitle', e.target.value)}
              disabled={!isEditable}
            />
          </div>

          {/* Parties */}
          <CreateContractParties
            contract={form as any}
            onChange={onChange}
            readOnly={!isEditable}
          />

          {/* Renter rejection reason banner */}
          {contractData?.renterRejectionReason && (
            <div className="flex items-start gap-3 px-4 py-3 text-sm border"
              style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
              <div>
                <p className="font-semibold mb-0.5" style={{ color: 'var(--color-error)' }}>
                  Người thuê đã từ chối — hãy chỉnh sửa và gửi lại
                </p>
                <p style={{ color: 'var(--color-text)' }}>"{contractData.renterRejectionReason}"</p>
              </div>
            </div>
          )}

          {/* Terms */}
          <CreateContractTerms
            contract={form as any}
            onChange={onChange}
            request={contractData?.rentRequest || null}
            readOnly={!isEditable}
          />

          {/* Warehouse info (read-only) */}
          {warehouseName && (
            <details className="border border-[var(--color-border)] bg-[var(--color-surface)] group">
              <summary className="px-5 py-3 flex items-center justify-between cursor-pointer list-none border-b border-transparent group-open:border-[var(--color-border)]"
                style={{ background: 'rgba(37,99,235,0.05)' }}>
                <div className="flex items-center gap-2">
                  <Snowflake className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                    Thông tin kho
                  </span>
                </div>
                <ChevronDown className="h-5 w-5 group-open:rotate-180 transition-transform" style={{ color: 'var(--color-primary)' }} />
              </summary>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tên kho</p>
                    <p className="text-sm font-medium">{warehouseName}</p>
                  </div>
                  {contractData?.rentRequest?.renterName && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Người thuê</p>
                      <p className="text-sm font-medium">{contractData.rentRequest.renterName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ngày bắt đầu</p>
                    <p className="text-sm font-medium">{form.start_at ? new Date(form.start_at).toLocaleDateString('vi-VN') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ngày kết thúc</p>
                    <p className="text-sm font-medium">{form.end_at ? new Date(form.end_at).toLocaleDateString('vi-VN') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Đơn giá</p>
                    <p className="text-sm font-medium text-blue-600">
                      {form.monthlyRate ? `${Number(form.monthlyRate).toLocaleString('vi-VN')} VNĐ` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </details>
          )}

          {/* Action bar */}
          {isEditable && (
            <>
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm border transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <Edit3 className="h-4 w-4" /> Xem trước hợp đồng
                </button>

                <div className="flex-1" />

                <button
                  onClick={() => navigate('/warehouse/contracts')}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm border transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  Hủy
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm text-white transition-colors disabled:opacity-60"
                  style={{ background: 'var(--color-primary)' }}>
                  <Save className="h-4 w-4" />
                  {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>

              <div className="flex items-start gap-2 text-xs px-4 py-3"
                style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--color-success, #22c55e)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Sau khi lưu, chữ ký của người thuê sẽ bị reset và họ cần ký lại để xác nhận hợp đồng.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
