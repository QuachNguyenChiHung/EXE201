import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { CompositeContract, CompositeWarehouse, ContractDetailDTO } from '../../../types';
import { ArrowLeft, Package, Snowflake } from 'lucide-react';
import { toast } from 'sonner';

import { FilterTab } from '../../components/renter/RentedPropertyUtils';
import { RentedPropertyFilters } from '../../components/renter/RentedPropertyFilters';
import { RentedPropertyCard } from '../../components/renter/RentedPropertyCard';
import { getUser } from '../../../utils/auth';
import { renterService } from '../../../services/renterService';

export default function RentedProperties() {
  const navigate = useNavigate();
  const user = getUser();
  const { warehouses: warehouseList, refreshWarehouses } = useApp();

  const [tab, setTab] = useState<FilterTab>('all');
  const [renterContracts, setRenterContracts] = useState<CompositeContract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);

  const buildContractDetails = (details: any[]): ContractDetailDTO[] => {
    if (!details || details.length === 0) return [];
    return details.map((d) => ({
      sectionId: d.id ?? 0,
      sectionName: d.sector ? `Phân khu ${d.sector}` : 'Phân khu',
      sector: d.sector,
      rentedArea: d.rentedArea ?? 0,
      areaUnit: d.areaUnit ?? 'm³',
      priceTierId: 0,
      priceTierLabel: d.priceTierLabel ?? 'Giá theo tháng',
      priceTierValue: d.priceTierValue ?? 0,
      priceTierUnit: 'tháng',
    }));
  };

  const fetchContracts = async () => {
    setLoadingContracts(true);
    try {
      const [contractsRes, requestsRes] = await Promise.all([
        renterService.getMyContracts(0, 100),
        renterService.getMyRequests(0, 100).catch(() => ({ content: [] })),
      ]);

      const requestDetailsMap: Record<number, any[]> = {};
      const requestWarehouseMap: Record<number, number> = {};
      (requestsRes.content as any[]).forEach((r: any) => {
        const reqId = r.id || r.id_rentRequest;
        if (r.details && r.details.length > 0) {
          requestDetailsMap[reqId] = r.details;
        }
        if (r.id_warehouse) {
          requestWarehouseMap[reqId] = r.id_warehouse;
        }
      });

      const contracts: CompositeContract[] = contractsRes.content.map((c: CompositeContract) => {
        const reqId = c.id_rent_request ?? 0;
        const details = requestDetailsMap[reqId] ?? [];
        return {
          ...c,
          id_warehouse: c.id_warehouse ?? requestWarehouseMap[reqId],
          contractDetails: buildContractDetails(details),
        };
      });

      setRenterContracts(contracts);
    } catch (err) {
      // silent
    } finally {
      setLoadingContracts(false);
    }
  };

  const warehouses = useMemo<Record<string, CompositeWarehouse>>(
    () => Object.fromEntries(warehouseList.map(w => [w.id_warehouse?.toString(), w])),
    [warehouseList],
  );

  useEffect(() => {
    if (!user) navigate('/login');
    else if (user.role !== 'RENTER') navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleCancel = async (id: number) => {
    try {
      await renterService.cancelContract(id, 'Huỷ theo yêu cầu của người thuê.');
      await fetchContracts();
      toast.success('Đã hủy hợp đồng.');
    } catch (err) {
      toast.error((err as any)?.message ?? 'Không thể hủy hợp đồng');
    }
  };

  const handleSign = async (id: number) => {
    try {
      await renterService.signContract(id);
      await fetchContracts();
      toast.success('Đã ký xác nhận hợp đồng!');
    } catch (err) {
      toast.error((err as any)?.message ?? 'Không thể ký hợp đồng');
    }
  };

  const filtered = renterContracts.filter(c => tab === 'all' || c.status === tab);

  const counts = renterContracts.reduce(
    (acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  const pendingSignCount = renterContracts.filter(c =>
    c.status === 'pending_renter' || c.status === 'PENDING'
  ).length;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-20">
      <Navbar />

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
        {loadingContracts ? (
          <div className="flex justify-center items-center py-12 mt-2 border border-[var(--color-border)] rounded bg-[var(--color-surface)]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : renterContracts.length === 0 ? (
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
                warehouse={warehouses[contract.id_warehouse?.toString() || '']}
                onViewContract={() => {
                  navigate(`/shared/contracts/${contract.id_contract}`);
                }}
                onSignContract={() => handleSign(contract.id_contract)}
                onCancelContract={() => handleCancel(contract.id_contract)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}