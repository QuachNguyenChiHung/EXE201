import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { CompositeWarehouse } from '../../../types/warehouse';
import { ClipboardList, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { FilterTab, IncomingRequest, RequestStatus, STATUS_CFG, TABS } from '../../components/owner/WarehouseRequestUtils';
import { WarehouseResponseModal } from '../../components/owner/WarehouseResponseModal';
import { WarehouseRequestCard } from '../../components/owner/WarehouseRequestCard';

export default function WarehouseRequests() {
  const navigate = useNavigate();
  const { user, requests: allRequests, warehouses: warehouseList, contracts, updateRequest } = useApp();
  const [tab, setTab]         = useState<FilterTab>('all');
  const [modalReq, setModalReq] = useState<IncomingRequest | null>(null);

  const warehouses = useMemo<Record<string, CompositeWarehouse>>(() =>
    Object.fromEntries(warehouseList.map(w => [w.id_warehouse, w])),
  [warehouseList]);

  const ownerWarehouseIds = useMemo(
    () => warehouseList.filter(w => w.id_owner === user?.id_user).map(w => w.id_warehouse),
    [warehouseList, user],
  );

  const requests = useMemo(() =>
    allRequests.filter(r => ownerWarehouseIds.includes(r.id_warehouse as number)) as IncomingRequest[],
  [allRequests, ownerWarehouseIds]);

  const handleMarkViewed = async (id: string) => {
    await updateRequest(id, { status: 'viewed' });
    toast.success('Đã đánh dấu là đã xem.');
  };

  const handleAccept = async (id: string, offeredPrice: number, ownerNote: string) => {
    try {
      await updateRequest(id, { status: 'inprogress', offered_price: offeredPrice, owner_note: ownerNote });
      setModalReq(null);
      toast.success('Đã chấp nhận thương lượng. Người thuê sẽ nhận được thông báo!');
    } catch (err) {
      toast.error('Không thể chấp nhận yêu cầu');
    }
  };

  const handleReject = async (id: string, rejectionReason: string) => {
    try {
      await updateRequest(id, { status: 'rejected', rejection_reason: rejectionReason });
      setModalReq(null);
      toast.success('Đã từ chối yêu cầu và gửi lý do cho người thuê.');
    } catch (err) {
      toast.error('Không thể từ chối yêu cầu');
    }
  };

  const filtered = tab === 'all' ? requests : requests.filter(r => r.status === tab);

  const counts: Record<FilterTab, number> = {
    all:        requests.length,
    sent:       requests.filter(r => r.status === 'sent').length,
    viewed:     requests.filter(r => r.status === 'viewed').length,
    inprogress: requests.filter(r => r.status === 'inprogress').length,
    contracted: requests.filter(r => r.status === 'contracted').length,
    rejected:   requests.filter(r => r.status === 'rejected').length,
  };

  const pendingCount = counts.sent + counts.viewed;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {modalReq && warehouses[modalReq.id_warehouse as number] && (
        <WarehouseResponseModal
          request={modalReq}
          warehouse={warehouses[modalReq.id_warehouse as number]}
          onClose={() => setModalReq(null)}
          onAccept={handleAccept}
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
            {pendingCount > 0 && (
              <div
                className="shrink-0 flex items-center gap-2 px-3 py-2 text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
              >
                <AlertCircle className="h-4 w-4" />
                {pendingCount} yêu cầu cần phản hồi
              </div>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[var(--color-border)] mb-6">
          {(Object.keys(STATUS_CFG) as RequestStatus[]).map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <button
                key={s}
                onClick={() => setTab(tab === s ? 'all' : s)}
                className="bg-[var(--color-surface)] p-4 text-left hover:bg-[var(--color-bg-secondary)] transition-colors"
                style={{ outline: tab === s ? `2px solid ${cfg.color}` : 'none', outlineOffset: -2 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 shrink-0" style={{ background: cfg.color }} />
                  <span className="text-2xl font-extrabold" style={{ color: 'var(--color-text)' }}>{counts[s]}</span>
                </div>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{cfg.label}</p>
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)] mb-4 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === t.key ? 'var(--color-primary)' : 'transparent',
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: tab === t.key ? 600 : 400,
              }}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span
                  className="ml-1.5 text-[10px] px-1.5 py-0.5"
                  style={{
                    background: tab === t.key ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                    color: tab === t.key ? 'white' : 'var(--color-text-muted)',
                  }}
                >
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Results bar */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{filtered.length} yêu cầu</p>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
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
            {tab === 'all' && pendingCount > 0 && (
              <div
                className="flex items-center gap-3 px-4 py-3 border text-sm"
                style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.25)', color: 'var(--color-text)' }}
              >
                <AlertCircle className="h-4 w-4 shrink-0" style={{ color: '#ef4444' }} />
                Có <strong className="mx-1">{pendingCount} yêu cầu chưa được phản hồi</strong>. Hãy phản hồi sớm!
              </div>
            )}
            {filtered.map(req => (
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
      </div>
    </div>
  );
}
