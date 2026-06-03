import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { warehousesAPI } from '../../../services/apiClient';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
  Warehouse, Plus, EyeOff, Eye, AlertTriangle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { CompositeWarehouse } from '../../../types';
import { MyWarehouseCard } from '../../components/owner/MyWarehouseCard';
import { MyWarehouseCertsModal } from '../../components/owner/MyWarehouseCertsModal';

export default function MyWarehouses() {
  const navigate  = useNavigate();
  const [user] = useState(() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } });
  const [allWarehouses, setAllWarehouses] = useState<CompositeWarehouse[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [reuploadTarget, setReuploadTarget] = useState<CompositeWarehouse | null>(null);

  useEffect(() => {
    let mounted = true;
    warehousesAPI.getAll().then(items => { if (mounted) setAllWarehouses(items); }).catch(err => console.error('Failed to load warehouses:', err));
    return () => { mounted = false; };
  }, []);

  const myWarehouses = useMemo(
    () => allWarehouses.filter(w => w.id_owner === user?.id_user),
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

  const handleHide = async (warehouse: CompositeWarehouse) => {
    if (!confirm(`Ẩn kho "${warehouse.name}"? Kho sẽ không hiển thị cho người thuê nhưng bạn có thể khôi phục bất cứ lúc nào.`)) return;
    try {
      await warehousesAPI.update(warehouse.id_warehouse.toString(), { status: 'inactive', updatedAt: new Date().toISOString() });
      setAllWarehouses(prev => prev.map(w => w.id_warehouse === warehouse.id_warehouse ? { ...w, status: 'inactive', updatedAt: new Date().toISOString() } : w));
      toast.success(`Đã ẩn kho "${warehouse.name}".`);
    } catch (err: any) {
      console.error('[MyWarehouses] hide failed', err);
      toast.error('Không thể ẩn kho');
    }
  };

  const handleRestore = async (warehouse: CompositeWarehouse) => {
    try {
      await warehousesAPI.update(warehouse.id_warehouse.toString(), { status: 'active', updatedAt: new Date().toISOString() });
      setAllWarehouses(prev => prev.map(w => w.id_warehouse === warehouse.id_warehouse ? { ...w, status: 'active', updatedAt: new Date().toISOString() } : w));
      toast.success(`Đã khôi phục kho "${warehouse.name}".`);
    } catch (err: any) {
      console.error('[MyWarehouses] restore failed', err);
      toast.error('Không thể khôi phục kho');
    }
  };

  const handleCertSaved = async (updated: CompositeWarehouse) => {
    try {
      await warehousesAPI.update(updated.id_warehouse.toString(), updated);
      setAllWarehouses(prev => prev.map(w => w.id_warehouse === updated.id_warehouse ? updated : w));
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
            {warehouses.map((warehouse) => (
              <MyWarehouseCard
                key={warehouse.id_warehouse}
                warehouse={warehouse}
                isHidden={warehouse.status === 'inactive'}
                isPending={warehouse.status === 'pending'}
                onRestore={handleRestore}
                onHide={handleHide}
                onReuploadCerts={setReuploadTarget}
              />
            ))}
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
        <MyWarehouseCertsModal
          warehouse={reuploadTarget}
          onClose={() => setReuploadTarget(null)}
          onSaved={handleCertSaved}
        />
      )}
    </div>
  );
}
