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
  ArrowLeft, ClipboardList, Save, Send, CheckCircle, Hash, LayoutGrid, Globe, Snowflake, Edit3, Upload, FileText, AlertCircle, ChevronDown
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
  const [metaData, setMetaData] = useState<any | undefined>(undefined);

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
    payment_term: '',
    penalty_clause: '',
    special_term: '',
  });

  useEffect(() => {
    if (!requestId) return;
    let mounted = true;
    const load = async () => {
      try {
        const req = await ownerService.getRequestDetail(Number(requestId));
        if (!mounted) return;
        setRequest(req);
        try {
          const wh = await warehousesAPI.getById(req.id_warehouse);
          if (mounted) setWarehouse(wh);
        } catch (e) {
          // ignore
        }
        try {
          const meta = await ownerService.getContractMetaData(requestId);
          if (mounted) setMetaData(meta);
        } catch (e) {
          // silent
        }
        const allContracts = await contractsAPI.getAll();
        const draft = allContracts.find(c => c.id_rent_request?.toString() === requestId && (c.status === 'draft' || c.status === 'pending_renter')) as CompositeContract | undefined;
        if (draft && mounted) setExistingDraft(draft);
      } catch (err) {
        // silent
      }
    };
    load();
    return () => { mounted = false; };
  }, [requestId]);

  // Prefill form
  useEffect(() => {
    if (!user && !request && !existingDraft && !metaData) return;

    if (existingDraft) {
      setContract(existingDraft);
    } else {
      setContract(prev => ({
        ...prev,
        owner_legal_name: metaData?.owner?.legalName ?? user?.name ?? prev.owner_legal_name,
        owner_phone: metaData?.owner?.phone ?? user?.phone ?? prev.owner_phone,
        owner_email: metaData?.owner?.email ?? user?.email ?? prev.owner_email,
        owner_tax_code: metaData?.owner?.taxCode ?? prev.owner_tax_code,
        owner_address: metaData?.owner?.address ?? prev.owner_address,

        renter_legal_name: metaData?.renter?.legalName ?? request?.renterName ?? prev.renter_legal_name,
        renter_phone: metaData?.renter?.phone ?? prev.renter_phone,
        renter_email: metaData?.renter?.email ?? prev.renter_email,
        renter_tax_code: metaData?.renter?.taxCode ?? prev.renter_tax_code,
        renter_address: metaData?.renter?.address ?? prev.renter_address,

        start_at: prev.start_at,
        rentedCapacity: request?.details?.reduce((sum: number, d: any) => sum + (d.rentedArea || 0), 0) ?? prev.rentedCapacity,
        monthlyRate: request?.offeredPrice ?? prev.monthlyRate,
        cargo_description: request?.cargoDescription ?? prev.cargo_description,
      }));
    }
  }, [user, request, existingDraft, metaData]);

  const onChange = (key: keyof CompositeContract, val: any) => {
    setContract(prev => ({ ...prev, [key]: val }));
  };

  const validateForm = (): boolean => {
    if (!contract.contractTitle?.trim()) { toast.error('Vui lòng nhập tên hợp đồng'); return false; }
    if (!contract.owner_legal_name?.trim()) { toast.error('Vui lòng nhập tên Bên A'); return false; }
    if (!contract.owner_tax_code?.trim()) { toast.error('Vui lòng nhập MST Bên A'); return false; }
    if (!contract.owner_address?.trim()) { toast.error('Vui lòng nhập địa chỉ Bên A'); return false; }
    if (!contract.owner_phone?.trim()) { toast.error('Vui lòng nhập số điện thoại Bên A'); return false; }
    if (!contract.owner_email?.trim()) { toast.error('Vui lòng nhập email Bên A'); return false; }
    if (!contract.renter_legal_name?.trim()) { toast.error('Vui lòng nhập tên Bên B'); return false; }
    if (!contract.renter_tax_code?.trim()) { toast.error('Vui lòng nhập MST Bên B'); return false; }
    if (!contract.renter_address?.trim()) { toast.error('Vui lòng nhập địa chỉ Bên B'); return false; }
    if (!contract.renter_phone?.trim()) { toast.error('Vui lòng nhập số điện thoại Bên B'); return false; }
    if (!contract.renter_email?.trim()) { toast.error('Vui lòng nhập email Bên B'); return false; }
    if (!contract.start_at) { toast.error('Vui lòng chọn ngày bắt đầu'); return false; }
    if (!contract.end_at) { toast.error('Vui lòng chọn ngày kết thúc'); return false; }
    if (!contract.cargo_description?.trim()) { toast.error('Vui lòng nhập loại hàng hóa lưu trữ'); return false; }
    if (!contract.rentedCapacity || Number(contract.rentedCapacity) <= 0) { toast.error('Vui lòng nhập mức dung lượng thuê'); return false; }
    if (!contract.monthlyRate || contract.monthlyRate <= 0) { toast.error('Vui lòng nhập tổng giá trị hợp đồng'); return false; }
    if (!contract.payment_term?.trim()) { toast.error('Vui lòng nhập điều khoản thanh toán'); return false; }
    if (!contract.penalty_clause?.trim()) { toast.error('Vui lòng nhập quy định phạt'); return false; }
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
    sentAt: status === 'pending_renter' ? new Date().toISOString() : undefined,

    // camelCase aliases to match backend API expectations and SharedContractDetail.tsx
    requestId: request?.id_rentRequest,
    warehouseName: warehouse?.name || '',
    totalPrice: Number(contract.monthlyRate) || 0,
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
    const totalPrice = Number(contract.monthlyRate) || 0;

    return {
      requestId: request?.id ?? Number(requestId),
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
      status: status === 'draft' ? 'DRAFT' : 'PENDING'
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
      toast.error(err?.message ?? 'Không thể lưu hợp đồng');
    }
  };

  const handleSendToRenter = async () => {
    if (!validateForm()) return;
    try {
      await ownerService.createContract(buildApiPayload('pending_renter'));
      toast.success('Đã gửi hợp đồng cho người thuê ký xác nhận!');
      navigate('/warehouse/contracts');
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể gửi hợp đồng');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {showPreview && <CreateContractPreviewModal contract={contract} request={request} onClose={() => setShowPreview(false)} />}

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
                {request.warehouseName && ` · Kho: ${request.warehouseName}`}
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



        <div className="space-y-6">

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
              <FileText className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-text)" }}>
                Tên hợp đồng <span className="ml-1" style={{ color: "var(--color-error)" }}>*</span>
              </span>
            </div>
            <input
              type="text"
              required
              className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
              placeholder={`Hợp đồng thuê kho lạnh${warehouse ? ` – ${warehouse.name}` : ''}`}
              value={contract.contractTitle || ''}
              onChange={(e) => onChange('contractTitle', e.target.value)}
            />
          </div>

          <CreateContractParties contract={contract} onChange={onChange} />

          {/* Request Details (Collapsible) */}
          {request && (
            <details className="border border-[var(--color-border)] bg-[var(--color-surface)] group">
              <summary className="px-5 py-3 flex items-center justify-between cursor-pointer list-none border-b border-transparent group-open:border-[var(--color-border)]"
                style={{ background: 'rgba(37,99,235,0.05)' }}>
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                    Chi tiết yêu cầu thuê
                  </span>
                </div>
                <ChevronDown className="h-5 w-5 group-open:rotate-180 transition-transform" style={{ color: 'var(--color-primary)' }} />
              </summary>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Khách hàng</p>
                    <p className="text-sm font-medium">{request.renterName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Kho được yêu cầu</p>
                    <p className="text-sm font-medium">{request.warehouseName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Thời gian thuê</p>
                    <p className="text-sm font-medium flex flex-col gap-0.5">
                      <span>{request.duration} {request.durationUnit}</span>
                      {request.startDate && request.endDate && (
                        <span className="text-[11px] text-gray-400 font-normal">
                          (Từ {new Date(request.startDate).toLocaleDateString('vi-VN')} đến {new Date(request.endDate).toLocaleDateString('vi-VN')})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Loại hàng hoá</p>
                    <p className="text-sm font-medium">{request.cargoDescription || 'Không có'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tổng giá chủ kho đưa ra</p>
                    <p className="text-sm font-medium text-blue-600">
                      {request.offeredPrice ? `${request.offeredPrice.toLocaleString()} VNĐ` : 'Chưa có'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ghi chú của khách hàng</p>
                    <p className="text-sm bg-gray-50 p-2 rounded border border-gray-100">{request.otherDetail || 'Không có ghi chú'}</p>
                  </div>
                  {request.ownerNote && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Ghi chú của bạn (Chủ kho)</p>
                      <p className="text-sm bg-blue-50 p-2 rounded border border-blue-100 text-blue-800">{request.ownerNote}</p>
                    </div>
                  )}
                </div>

                {request.details?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <p className="text-xs text-gray-500 mb-2">Phân khu được yêu cầu ({request.details.length} khu)</p>
                    <div className="flex flex-col gap-2">
                      {request.details.map((detail: any, idx: number) => (
                        <div key={idx} className="flex items-center flex-wrap gap-2 px-3 py-2 border border-[var(--color-border)] text-xs rounded"
                          style={{ background: 'var(--color-bg-secondary)' }}>
                          <Snowflake className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-info, #3b82f6)' }} />
                          <span className="font-medium" style={{ color: 'var(--color-text)' }}>Phòng số {detail.sector}</span>
                          <span className="font-mono bg-white border border-gray-100 px-1.5 py-0.5 rounded" style={{ color: 'var(--color-text-muted)' }}>
                            {detail.rentedArea} {detail.areaUnit}
                          </span>
                          {detail.priceTierValue != null && (
                            <span className="ml-auto font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              Đơn giá gốc: {detail.priceTierValue.toLocaleString()} VNĐ / {detail.areaUnit} / tháng
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}

          <CreateContractTerms contract={contract} onChange={onChange} request={request} />

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
