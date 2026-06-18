import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { ownerService } from '../../../services/ownerService';
import { CompositeWarehouse } from '../../../types/warehouse';
import { ClipboardList, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { FilterTab, IncomingRequest, RequestStatus, STATUS_CFG, TABS } from '../../components/owner/WarehouseRequestUtils';
import { WarehouseResponseModal } from '../../components/owner/WarehouseResponseModal';
import { WarehouseRequestCard } from '../../components/owner/WarehouseRequestCard';
import { getUser } from '../../../utils/auth';

export default function WarehouseRequests() {
  const navigate = useNavigate();
  const user = getUser();
  const { warehouses: warehouseList, loading: appLoading, contracts, updateRequest } = useApp();
  const [tab, setTab] = useState<FilterTab>('all');
  const [modalReq, setModalReq] = useState<IncomingRequest | null>(null);

  // Pagination & Caching
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requestsList, setRequestsList] = useState<IncomingRequest[]>([]);
  const [cache, setCache] = useState<Record<string, { list: IncomingRequest[], totalPages: number, totalElements: number }>>({});

  const warehouses = useMemo<Record<string, CompositeWarehouse>>(() =>
    Object.fromEntries(warehouseList.map(w => [w.id_warehouse, w])),
    [warehouseList]);

  const fetchPage = useCallback(async (p: number, t: FilterTab, isPreload: boolean = false, forceRefetch: boolean = false) => {
    const cacheKey = `${t}_${p}`;
    if (!forceRefetch && cache[cacheKey]) {
      if (!isPreload) {
        setRequestsList(cache[cacheKey].list);
        setTotalPages(cache[cacheKey].totalPages);
        setTotalElements(cache[cacheKey].totalElements);
        setLoading(false);
      }
      return cache[cacheKey];
    }

    if (!isPreload) setLoading(true);
    try {
      const dataRes = await ownerService.getIncomingRequests(p, 10, t === 'all' ? undefined : t);
      const mapped = (dataRes.content as any[]).map(r => {
        const matchingWarehouse = warehouseList.find(w => w.name === r.warehouseName);
        const details = r.details || [];
        const requestedCapacity = details.reduce((sum: number, d: any) => sum + (d.rentedArea || 0), 0) || undefined;
        const sectionName = details.length > 1
          ? `${details.length} phân khu`
          : (details[0]?.sector ? `Phân khu ${details[0].sector}` : undefined);
        const priceTierLabel = details.length > 1 ? 'Nhiều phân khu' : details[0]?.priceTierLabel;
        const priceTierValue = details.length > 1 ? undefined : details[0]?.priceTierValue;

        return {
          ...r,
          id_rentRequest: r.id || r.id_rentRequest,
          id_warehouse: matchingWarehouse?.id_warehouse,
          cargo_description: r.cargoDescription,
          cargoType: r.cargoDescription,
          other_detail: r.otherDetail,
          message: r.otherDetail,
          duration: r.duration,
          duration_unit: r.durationUnit,
          durationLabel: `${r.duration} ${r.durationUnit === 'MONTH' ? 'tháng' : r.durationUnit === 'YEAR' ? 'năm' : r.durationUnit || ''}`.trim(),
          status: r.status,
          offered_price: r.offeredPrice,
          renterOfferedPrice: r.renterOfferedPrice,
          owner_note: r.ownerNote,
          rejection_reason: r.rejectionReason,
          renterName: r.renterName,
          renterPhone: r.renterPhone || 'N/A',
          renterEmail: r.renterEmail || 'N/A',
          requestedCapacity,
          priceTierLabel,
          priceTierValue,
          sectionName,
          start_date: r.startDate,
          end_date: r.endDate,
          submit_at: r.createdAt || r.submit_at || new Date().toISOString()
        } as IncomingRequest;
      });

      const newData = { list: mapped, totalPages: dataRes.totalPages, totalElements: dataRes.totalElements };
      setCache(prev => ({ ...prev, [cacheKey]: newData }));

      if (!isPreload) {
        setRequestsList(mapped);
        setTotalPages(dataRes.totalPages);
        setTotalElements(dataRes.totalElements);
      }
      return newData;
    } catch (err: any) {
      console.error('Failed to fetch requests', err);
      if (!isPreload) toast.error('Không tải được danh sách yêu cầu');
    } finally {
      if (!isPreload) setLoading(false);
    }
  }, [cache, warehouseList]);


  useEffect(() => {
    if (!user || user.role !== 'OWNER' || appLoading.warehouses) return;
    fetchPage(page, tab).then(data => {
      if (data && page < data.totalPages - 1) {
        fetchPage(page + 1, tab, true);
      }
    });
  }, [page, tab, user?.email, appLoading.warehouses]);

  const invalidateAndRefetch = () => {
    setCache({});
    fetchPage(page, tab, false, true);
  };

  const handleMarkViewed = async (id: string) => {
    // Backend RequestStatus enum only supports PENDING, APPROVED, REJECTED
    // We cannot mark it as 'viewed' anymore.
  };

  const refetchSingleRequest = async (id: string) => {
    try {
      const r = await ownerService.getRequestDetail(Number(id));
      const matchingWarehouse = warehouseList.find(w => w.name === r.warehouseName);
      const updatedReq: IncomingRequest = {
        ...r,
        id_rentRequest: r.id || r.id_rentRequest,
        id_warehouse: matchingWarehouse?.id_warehouse,
        cargo_description: r.cargoDescription,
        cargoType: r.cargoDescription,
        other_detail: r.otherDetail,
        message: r.otherDetail,
        duration: r.duration,
        duration_unit: r.durationUnit,
        durationLabel: `${r.duration} ${r.durationUnit === 'MONTH' ? 'tháng' : r.durationUnit === 'YEAR' ? 'năm' : r.durationUnit || ''}`.trim(),
        status: r.status,
        offered_price: r.offeredPrice,
        renterOfferedPrice: r.renterOfferedPrice,
        owner_note: r.ownerNote,
        rejection_reason: r.rejectionReason,
        renterName: r.renterName,
        renterPhone: r.renterPhone || 'N/A',
        renterEmail: r.renterEmail || 'N/A',
        requestedCapacity: r.details?.reduce((sum: number, d: any) => sum + (d.rentedArea || 0), 0) || undefined,
        priceTierLabel: r.details?.length > 1 ? 'Nhiều phân khu' : r.details?.[0]?.priceTierLabel,
        priceTierValue: r.details?.length > 1 ? undefined : r.details?.[0]?.priceTierValue,
        sectionName: r.details?.length > 1 ? `${r.details.length} phân khu` : (r.details?.[0]?.sector ? `Phân khu ${r.details[0].sector}` : undefined),
        sectionId: r.details?.[0]?.sector,
        start_date: r.startDate,
        end_date: r.endDate,
        submit_at: r.createdAt || r.submit_at || new Date().toISOString()
      } as IncomingRequest;

      setRequestsList(prev => prev.map(req => req.id_rentRequest.toString() === id ? updatedReq : req));

      // Update cache
      setCache(prev => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach(key => {
          newCache[key] = {
            ...newCache[key],
            list: newCache[key].list.map((req: any) => req.id_rentRequest.toString() === id ? updatedReq : req)
          };
        });
        return newCache;
      });
    } catch (err) {
      console.error("Failed to refetch single request", err);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await ownerService.updateRequestStatus(id, { status: 'APPROVED' });
      setModalReq(null);
      toast.success('Đã chấp nhận yêu cầu thuê!');
      refetchSingleRequest(id);
    } catch (err) {
      toast.error('Không thể chấp nhận yêu cầu');
    }
  };

  const handleNegotiate = async (id: string, offeredPrice: number, ownerNote: string) => {
    try {
      await ownerService.updateRequestStatus(id, { status: 'PENDING', offeredPrice: offeredPrice, ownerNote: ownerNote });
      setModalReq(null);
      toast.success('Đã gửi đề xuất giá. Người thuê sẽ nhận được thông báo!');
      refetchSingleRequest(id);
    } catch (err) {
      toast.error('Không thể gửi đề xuất giá');
    }
  };

  const handleReject = async (id: string, rejectionReason: string) => {
    try {
      await ownerService.updateRequestStatus(id, { status: 'REJECTED', rejectionReason: rejectionReason });
      setModalReq(null);
      toast.success('Đã từ chối yêu cầu và gửi lý do cho người thuê.');
      refetchSingleRequest(id);
    } catch (err) {
      toast.error('Không thể từ chối yêu cầu');
    }
  };


  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {modalReq && (
        <WarehouseResponseModal
          request={modalReq}
          warehouse={warehouses[modalReq.id_warehouse as number]}
          onClose={() => setModalReq(null)}
          onAccept={handleAccept}
          onNegotiate={handleNegotiate}
          onReject={handleReject}
        />
      )}

      <div className="bento-container">
        {/* Header */}
        <div className="bento-header">
          <button
            onClick={() => navigate('/warehouse')}
            className="flex items-center gap-1 text-sm mb-2 hover:underline"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary)' }}>
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1>Yêu cầu thuê kho</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Quản lý và phản hồi các yêu cầu từ khách hàng</p>
              </div>
            </div>
          </div>
        </div>



        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)] mb-4 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(0); }}
              className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === t.key ? 'var(--color-primary)' : 'transparent',
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: tab === t.key ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Results bar */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{totalElements} yêu cầu</p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12 border border-[var(--color-border)] rounded bg-[var(--color-surface)]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : requestsList.length === 0 ? (
          <div className="border border-[var(--color-border)] p-16 text-center" style={{ background: 'var(--color-surface)' }}>
            <ClipboardList className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <h3 className="mb-2" style={{ color: 'var(--color-text)' }}>Không có yêu cầu nào</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {tab === 'all' ? 'Chưa có khách hàng gửi yêu cầu thuê kho.' : 'Không có yêu cầu trong mục này.'}
            </p>
            {tab !== 'all' && (
              <button onClick={() => setTab('all')} className="mt-4 px-5 py-2 text-sm text-white" style={{ background: 'var(--color-primary)' }}>
                Xem tất cả
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {requestsList.map(req => (
              <WarehouseRequestCard
                key={req.id_rentRequest}
                req={req}
                warehouse={warehouses[req.id_warehouse as number]}
                existingContract={contracts.find(c => c.id_rent_request === req.id_rentRequest)}
                onOpenModal={r => setModalReq(r)}
                onMarkViewed={handleMarkViewed}
                onCreateContract={id => navigate(`/warehouse/contracts/create/${id}`)}
                onViewContract={() => navigate(`/warehouse/contracts/create/${req.id_rentRequest}`)}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded mt-4">
            <span className="text-sm text-[var(--color-text-secondary)]">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
