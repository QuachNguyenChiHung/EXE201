import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { requestsAPI, warehousesAPI, contractsAPI } from '../../../services/apiClient';
import { ownerService } from '../../../services/ownerService';
import { CompositeContract } from '../../../types/renter';
import { CreateContractParties } from '../../components/owner/CreateContractParties';
import { CreateContractTerms } from '../../components/owner/CreateContractTerms';
import { CreateContractPDFUpload } from '../../components/owner/CreateContractPDFUpload';
import { CreateContractPreviewModal } from '../../components/owner/CreateContractPreviewModal';
import {
  ArrowLeft, ClipboardList, Save, Send, CheckCircle, Hash, LayoutGrid, Globe, Snowflake, Edit3, Upload, FileText, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';



const today = () => new Date().toISOString().slice(0, 10);
const genRef = () => `LGC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

export default function CreateContract() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  const [user] = useState(() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } });
  const [request, setRequest] = useState<any | undefined>(undefined);
  const [warehouse, setWarehouse] = useState<any | undefined>(undefined);
  const [existingDraft, setExistingDraft] = useState<CompositeContract | undefined>(undefined);

  const [showPreview, setShowPreview] = useState(false);

  const contractRef = existingDraft?.contractRef ?? genRef();
  const contractId = existingDraft?.id_contract || Date.now();

  const [contract, setContract] = useState<Partial<CompositeContract>>({
    contractTitle: '',
    owner_legal_name: '',
    owner_tax_code: '',
    owner_address: '',
    owner_phone: '',
    owner_email: '',
    renter_legal_name: '',
    renter_tax_code: '',
    renter_address: '',
    renter_phone: '',
    renter_email: '',
    renterCompany: '',
    start_at: today(),
    end_at: '',
    rentedCapacity: 0,
    monthlyRate: 0,
    cargo_description: '',
    payment_term: 'Thanh toán trước ngày 05 hàng tháng. Hình thức: chuyển khoản ngân hàng.',
    penalty_clause: 'Phạt 5% tổng giá trị hợp đồng còn lại nếu một bên huỷ trước thời hạn mà không thông báo trước 30 ngày.',
    special_term: '',
    notes: '',
  });

  useEffect(() => {
    if (!requestId) return;
    let mounted = true;
    const load = async () => {
      try {
        const req = await requestsAPI.getById(requestId);
        if (!mounted) return;
        setRequest(req);
        try {
          const wh = await warehousesAPI.getById(req.id_warehouse);
          if (mounted) setWarehouse(wh);
        } catch (e) {
          // ignore
        }
        const allContracts = await contractsAPI.getAll();
        const draft = allContracts.find(c => c.id_rent_request?.toString() === requestId && (c.status === 'draft' || c.status === 'pending_renter')) as CompositeContract | undefined;
        if (draft && mounted) setExistingDraft(draft);
      } catch (err) {
        console.warn('[CreateContract] load data failed', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [requestId]);

  // Prefill form
  useEffect(() => {
    if (!user && !request && !existingDraft) return;

    if (existingDraft) {
      setContract(existingDraft);
    } else {
      setContract(prev => ({
        ...prev,
        owner_legal_name: user?.name ?? prev.owner_legal_name,
        owner_phone: user?.phone ?? prev.owner_phone,
        owner_email: user?.email ?? prev.owner_email,
        renter_legal_name: request?.renterName ?? prev.renter_legal_name,
        renter_phone: request?.renterPhone ?? prev.renter_phone,
        renter_email: request?.renterEmail ?? prev.renter_email,
        renterCompany: request?.renterCompany ?? prev.renterCompany,
        start_at: request?.startDate ?? prev.start_at,
        rentedCapacity: request?.requestedCapacity ?? prev.rentedCapacity,
        monthlyRate: request?.offeredPrice ?? request?.priceTierValue ?? prev.monthlyRate,
        cargo_description: request?.cargoType ?? prev.cargo_description,
        notes: request?.message ?? prev.notes,
      }));
    }
  }, [user, request, existingDraft]);

  const onChange = (key: keyof CompositeContract, val: any) => {
    setContract(prev => ({ ...prev, [key]: val }));
  };

  const validateForm = (): boolean => {
    if (!contract.owner_legal_name?.trim()) { toast.error('Vui lòng nhập tên Bên A'); return false; }
    if (!contract.owner_tax_code?.trim()) { toast.error('Vui lòng nhập MST Bên A'); return false; }
    if (!contract.renter_legal_name?.trim()) { toast.error('Vui lòng nhập tên Bên B'); return false; }
    if (!contract.renter_tax_code?.trim()) { toast.error('Vui lòng nhập MST Bên B'); return false; }
    if (!contract.start_at) { toast.error('Vui lòng chọn ngày bắt đầu'); return false; }
    if (!contract.end_at) { toast.error('Vui lòng chọn ngày kết thúc'); return false; }
    if (!contract.monthlyRate || contract.monthlyRate <= 0) { toast.error('Vui lòng nhập đơn giá'); return false; }
    return true;
  };

  const buildContractData = (status: 'draft' | 'pending_renter'): CompositeContract => ({
    id_contract: contractId,
    id_rent_request: request?.id_rentRequest,
    id_renter: request?.id_renter,
    id_owner: user?.id_user,
    id_warehouse: request?.id_warehouse,
    sectionId: request?.sectionId,
    sectionIds: request?.sectionIds,
    isWholeWarehouse: request?.isWholeWarehouse,
    contractRef,
    status,
    contractTitle: contract.contractTitle || `Hợp đồng thuê kho lạnh${warehouse ? ` – ${warehouse.name}` : ''}`,
    
    // Core ERD
    owner_legal_name: contract.owner_legal_name || '',
    owner_tax_code: contract.owner_tax_code || '',
    owner_address: contract.owner_address || '',
    owner_phone: contract.owner_phone || '',
    owner_email: contract.owner_email || '',
    renter_legal_name: contract.renter_legal_name || '',
    renter_tax_code: contract.renter_tax_code || '',
    renter_address: contract.renter_address || '',
    renter_phone: contract.renter_phone || '',
    renter_email: contract.renter_email || '',
    start_at: contract.start_at || '',
    end_at: contract.end_at || '',
    cargo_description: contract.cargo_description || '',
    payment_term: contract.payment_term || '',
    penalty_clause: contract.penalty_clause || '',
    special_term: contract.special_term || '',
    create_at: contract.create_at || new Date().toISOString(),
    update_at: new Date().toISOString(),
    cancel_reason: contract.cancel_reason || '',
    
    // Extensions
    renterCompany: contract.renterCompany,
    rentedCapacity: Number(contract.rentedCapacity) || 0,
    monthlyRate: Number(contract.monthlyRate) || 0,
    notes: contract.notes,
    sentAt: status === 'pending_renter' ? new Date().toISOString() : undefined,
    
    // camelCase aliases to match backend API expectations and SharedContractDetail.tsx
    requestId: request?.id_rentRequest,
    warehouseName: warehouse?.name || '',
    totalPrice: Number(contract.monthlyRate) * (request?.duration || 1) || 0,
    ownerLegalName: contract.owner_legal_name || '',
    ownerTaxCode: contract.owner_tax_code || '',
    ownerAddress: contract.owner_address || '',
    ownerPhone: contract.owner_phone || '',
    ownerEmail: contract.owner_email || '',
    renterLegalName: contract.renter_legal_name || '',
    renterTaxCode: contract.renter_tax_code || '',
    renterAddress: contract.renter_address || '',
    renterPhone: contract.renter_phone || '',
    renterEmail: contract.renter_email || '',
    startAt: contract.start_at || '',
    endAt: contract.end_at || '',
    cargoDescription: contract.cargo_description || '',
    paymentTerm: contract.payment_term || '',
    penaltyClause: contract.penalty_clause || '',
    specialTerm: contract.special_term || '',
    cancelReason: contract.cancel_reason || '',
  } as any);

  const buildApiPayload = (status: string) => {
    // Calculate duration based on start and end dates
    let durationMonths = 1;
    if (contract.start_at && contract.end_at) {
      const start = new Date(contract.start_at);
      const end = new Date(contract.end_at);
      durationMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      if (durationMonths <= 0) durationMonths = 1;
    }
    const totalPrice = (Number(contract.monthlyRate) || 0) * durationMonths;

    return {
      requestId: request?.id_rentRequest,
      totalPrice: totalPrice,
      startAt: contract.start_at || '',
      endAt: contract.end_at || '',
      paymentTerm: contract.payment_term || '',
      penaltyClause: contract.penalty_clause || '',
      specialTerm: contract.special_term || '',
      ownerLegalName: contract.owner_legal_name || '',
      ownerTaxCode: contract.owner_tax_code || '',
      ownerAddress: contract.owner_address || '',
      ownerPhone: contract.owner_phone || '',
      ownerEmail: contract.owner_email || '',
      renterLegalName: contract.renter_legal_name || '',
      renterTaxCode: contract.renter_tax_code || '',
      renterAddress: contract.renter_address || '',
      renterPhone: contract.renter_phone || '',
      renterEmail: contract.renter_email || '',
      warehouseName: warehouse?.name || '',
      cargoDescription: contract.cargo_description || '',
      cancelReason: contract.cancel_reason || '',
      status: status
    };
  };

  const handleSaveDraft = async () => {
    try {
      // Still using mock for draft since API might only support create -> ACTIVE/PENDING
      // But we will send to API with status DRAFT if API supports it later
      await ownerService.createContract(buildApiPayload('draft'));
      toast.success('Đã lưu bản nháp hợp đồng!');
      navigate('/warehouse/contracts');
    } catch (err: any) {
      console.error('[CreateContract] createContract failed:', err);
      toast.error(err?.message ?? 'Không thể lưu hợp đồng');
    }
  };

  const handleSendToRenter = async () => {
    if (!validateForm()) return;
    try {
      await ownerService.createContract(buildApiPayload('pending_renter'));
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
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {showPreview && <CreateContractPreviewModal contract={contract} onClose={() => setShowPreview(false)} />}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate('/warehouse/contracts')}
          className="flex items-center gap-2 text-sm mb-5 hover:underline"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách hợp đồng
        </button>

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

        {/* Request scope info */}
        {request && (request.sectionIds?.length || request.isWholeWarehouse || request.sectionId) && (() => {
          const sections = warehouse?.sections ?? [];
          const isWhole = request.isWholeWarehouse;
          const ids = request.sectionIds ?? (request.sectionId ? [request.sectionId] : []);
          const selectedSections = sections.filter((s: any) => ids.includes(s.id));
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
                    {selectedSections.map((sec: any) => (
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

        <div className="space-y-6">

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
              <FileText className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-text)" }}>Tên hợp đồng</span>
            </div>
            <input
              type="text"
              className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
              placeholder={`Hợp đồng thuê kho lạnh${warehouse ? ` – ${warehouse.name}` : ''}`}
              value={contract.contractTitle || ''}
              onChange={(e) => onChange('contractTitle', e.target.value)}
            />
          </div>

          <CreateContractParties contract={contract} onChange={onChange} />
          
          <CreateContractTerms contract={contract} onChange={onChange} />

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
              <Edit3 className="h-4 w-4" /> Xem trước hợp đồng
            </button>

            <div className="flex-1" />

            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-4 py-2.5 text-sm border transition-colors"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
              <Save className="h-4 w-4" /> Lưu bản nháp
            </button>

            <button
              onClick={handleSendToRenter}
              className="flex items-center gap-2 px-5 py-2.5 text-sm text-white transition-colors"
              style={{ background: 'var(--color-primary)' }}>
              <Send className="h-4 w-4" /> Gửi cho người thuê ký
            </button>
          </div>

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
