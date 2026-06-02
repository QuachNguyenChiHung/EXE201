import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { contractsAPI } from '../../../services/apiClient';
import { CompositeContract, CompositeWarehouse } from '../../../types';
import { RateWarehouseModal } from '../../components/RateWarehouseModal';
import { ArrowLeft, Package, Snowflake } from 'lucide-react';
import { toast } from 'sonner';

import { FilterTab } from '../../components/renter/RentedPropertyUtils';
import { RentedPropertyFilters } from '../../components/renter/RentedPropertyFilters';
import { ContractDetailModal, RejectContractModal } from '../../components/renter/ContractModals';
import { RentedPropertyCard } from '../../components/renter/RentedPropertyCard';

export default function RentedProperties() {
  const navigate = useNavigate();
  const { user, isAuthenticated, contracts: allContracts, warehouses: warehouseList, ratings: allRatings, refreshContracts, refreshWarehouses, refreshRatings } = useApp();

  const [tab, setTab] = useState<FilterTab>('all');
  const [viewingContract, setViewingContract] = useState<CompositeContract | null>(null);
  const [rejectingContract, setRejectingContract] = useState<CompositeContract | null>(null);
  const [ratingContract, setRatingContract] = useState<CompositeContract | null>(null);

  // Helper: refresh data from API
  const refreshData = async () => {
    try {
      await Promise.all([
        refreshContracts(),
        refreshWarehouses(),
        refreshRatings(),
      ]);
    } catch (err) {
      console.warn('[RentedProperties] refreshData failed', err);
    }
  };

  const warehouses = useMemo<Record<string, CompositeWarehouse>>(
    () => Object.fromEntries(warehouseList.map(w => [w.id_warehouse?.toString(), w])),
    [warehouseList],
  );

  const contracts = useMemo(
    () => (allContracts as unknown as CompositeContract[]).filter(c => c.id_renter === user?.id_user),
    [allContracts, user],
  );

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'renter') navigate('/login');
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    // initial load
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async (id: number) => {
    try {
      await contractsAPI.update(id.toString(), { status: 'cancelled', notes: 'Huỷ theo yêu cầu của người thuê.' });
      await refreshData();
      toast.success('Đã huỷ hợp đồng.');
    } catch (err) {
      toast.error((err as any)?.message ?? 'Không thể huỷ hợp đồng');
    }
  };

  const handleAcceptContract = async (id: number) => {
    try {
      await contractsAPI.update(id.toString(), { status: 'active', acceptedAt: new Date().toISOString() });
      await refreshData();
      setViewingContract(null);
      toast.success('Đã ký xác nhận hợp đồng! Hợp đồng hiện đang có hiệu lực.');
    } catch (err) {
      toast.error((err as any)?.message ?? 'Không thể xác nhận hợp đồng');
    }
  };

  const handleRejectContract = async (id: number, reason: string) => {
    try {
      await contractsAPI.update(id.toString(), { status: 'draft', renterRejectionReason: reason });
      await refreshData();
      setRejectingContract(null);
      setViewingContract(null);
      toast.success('Đã gửi phản hồi từ chối. Chủ kho sẽ chỉnh sửa và gửi lại.');
    } catch (err) {
      toast.error((err as any)?.message ?? 'Không thể từ chối hợp đồng');
    }
  };

  const filtered = contracts.filter(c => tab === 'all' || c.status === tab);

  const counts = contracts.reduce(
    (acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  const pendingSignCount = counts['pending_renter'] ?? 0;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-20">
      <Navbar />

      {viewingContract && (
        <ContractDetailModal
          contract={viewingContract}
          onAccept={() => handleAcceptContract(viewingContract.id_contract)}
          onReject={() => { setRejectingContract(viewingContract); setViewingContract(null); }}
          onClose={() => setViewingContract(null)}
        />
      )}

      {rejectingContract && (
        <RejectContractModal
          contractRef={rejectingContract.contractRef}
          onConfirm={reason => handleRejectContract(rejectingContract.id_contract, reason)}
          onClose={() => setRejectingContract(null)}
        />
      )}

      {ratingContract && (() => {
        const wh = warehouses[ratingContract.warehouseId?.toString() || ''];
        const existingRating = allRatings.find((r: any) => r.warehouse_id?.toString() === ratingContract.warehouseId?.toString() && r.id_renter === user?.id_user);
        return (
          <RateWarehouseModal
            warehouseId={ratingContract.warehouseId?.toString() || ''}
            warehouseName={wh?.name ?? `Kho #${ratingContract.warehouseId}`}
            contractId={ratingContract.id_contract.toString()}
            contractRef={ratingContract.contractRef || ''}
            existingRating={existingRating}
            onClose={() => setRatingContract(null)}
          />
        );
      })()}

      <div className="max-w-[1000px] w-full mx-auto px-4 py-8">
        {/* ── Header ── */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/renter')}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Về trang chính
          </button>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold">Kho đang thuê</h1>
              <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
                Quản lý các hợp đồng thuê kho lạnh của bạn
              </p>
            </div>
            <button
              onClick={() => navigate('/renter/search')}
              className="bg-[var(--color-primary)] text-white px-5 py-2.5 text-sm hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2"
            >
              <Package className="h-4 w-4" /> Tìm thêm kho
            </button>
          </div>
        </div>

        <RentedPropertyFilters
          tab={tab}
          setTab={setTab}
          counts={counts}
          pendingSignCount={pendingSignCount}
        />

        {/* ── Contract list ── */}
        {contracts.length === 0 ? (
          <div className="mt-2 border p-12 text-center bg-[var(--color-surface)]">
            <Snowflake className="h-12 w-12 text-[var(--color-primary)] mx-auto mb-4" />
            <h3 className="mb-2 font-semibold text-lg">Bạn chưa có kho nào đang hoạt động</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
              Khám phá hàng trăm kho lạnh trên toàn quốc và bắt đầu thuê ngay hôm nay.
            </p>
            <button
              onClick={() => navigate('/renter/search')}
              className="text-white px-8 py-3 text-sm hover:opacity-90 transition-opacity rounded-sm"
              style={{ background: 'var(--color-primary)' }}
            >
              Tìm kho lạnh →
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-16 text-center">
            <Snowflake className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--color-text-secondary)]">Không có hợp đồng nào trong trạng thái này.</p>
            <button
              onClick={() => setTab('all')}
              className="text-sm mt-3 underline"
              style={{ color: "var(--color-primary)" }}
            >
              Xem tất cả hợp đồng
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(contract => (
              <RentedPropertyCard
                key={contract.id_contract}
                contract={contract}
                warehouse={warehouses[contract.warehouseId?.toString() || '']}
                rating={allRatings.find((r: any) => r.warehouse_id?.toString() === contract.warehouseId?.toString() && r.id_renter === user?.id_user)}
                onViewContract={() => setViewingContract(contract)}
                onRejectContract={() => setRejectingContract(contract)}
                onCancelContract={() => handleCancel(contract.id_contract)}
                onRateWarehouse={() => setRatingContract(contract)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}