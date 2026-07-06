import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { ownerService } from '../../../services/ownerService';
import { CompositeWarehouse } from '../../../types/warehouse';
import { ClipboardList, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { FilterTab, IncomingRequest, RequestStatus, STATUS_CFG, TABS } from '../../components/owner/WarehouseRequestUtils';
import { WarehouseRequestCard } from '../../components/owner/WarehouseRequestCard';
import { getUser } from '../../../utils/auth';

export default function WarehouseRequests() {
  const navigate = useNavigate();
  const user = getUser();
  const { warehouses: warehouseList, loading: appLoading, contracts, updateRequest } = useApp();
  const [tab, setTab] = useState<FilterTab>('all');

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
      const mapped = (dataRes.content as any[])
        .filter(r => r.status !== 'PENDING_PAYMENT')
        .map(r => {
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
          owner_note: r.ownerNote,
          rejection_reason: r.rejectionReason,
          renterName: r.renterName,
          renterPhone: r.renterPhone || 'N/A',
          renterEmail: r.renterEmail || 'N/A',
          renterCompanyName: r.renterCompanyName,
          renterCompanyTaxCode: r.renterCompanyTaxCode,
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
      // Filter out PENDING_PAYMENT — they shouldn't appear on this page
      if (r.status === 'PENDING_PAYMENT') return;

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
        owner_note: r.ownerNote,
        rejection_reason: r.rejectionReason,
        renterName: r.renterName,
        renterPhone: r.renterPhone || 'N/A',
        renterEmail: r.renterEmail || 'N/A',
        renterCompanyName: r.renterCompanyName,
        renterCompanyTaxCode: r.renterCompanyTaxCode,
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
      // silent
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const result = await ownerService.acceptRequest(id);
      toast.success(result.message || 'Đã chấp nhận yêu cầu thuê!');
      refetchSingleRequest(id);
      return result;
    } catch (err) {
      toast.error('Không thể chấp nhận yêu cầu');
      return undefined;
    }
  };

  const handleReject = async (id: string, rejectionReason: string) => {
    try {
      await ownerService.rejectRequest(id, rejectionReason);
      toast.success('Đã từ chối yêu cầu. Hệ thống sẽ tự động hoàn tiền cho người thuê qua VNPay.');
      refetchSingleRequest(id);
    } catch (err) {
      toast.error('Không thể từ chối yêu cầu');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {/* Header */}
      <div className="bento-container">
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
                onAccept={handleAccept}
                onReject={id => handleReject(id, '')}
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
