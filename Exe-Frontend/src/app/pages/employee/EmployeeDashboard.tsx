import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { getUser } from '../../../utils/auth';
import { MockUsers } from '../../../data/mockUsers';
import { MockWarehouseData as MockWarehouses } from '../../../data/mockWarehouses';
import { MockCompositeRentRequests as MockRentRequests } from '../../../data/mockRequests';
import { contractsAPI } from '../../../services/apiClient';
import { Users, Warehouse, Clock, CheckCircle, AlertCircle, ClipboardList, FileText, Database, Shield } from 'lucide-react';
import { AIStatusPanel } from '../../components/AIStatusPanel';
import type { CompositeContract } from '../../../types';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [contractList, setContractList] = useState<CompositeContract[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'employee') {
      navigate('/login');
      return;
    }

    contractsAPI.getAll()
      .then(c => setContractList(c))
      .catch(err => console.error('Failed to load contracts:', err));
  }, [user, navigate]);

  // ── Stats from mock data ──────────────────────────────────────────────────
  const stats = useMemo(() => [
    {
      label: 'Tổng người dùng',
      value: MockUsers.length,
      sub: `${MockUsers.filter(u => u.role === 'renter').length} DN · ${MockUsers.filter(u => u.role === 'warehouse').length} Chủ kho`,
      icon: <Users className="h-5 w-5" />,
      color: 'var(--color-primary)',
    },
    {
      label: 'Tổng kho lạnh',
      value: MockWarehouses.length,
      sub: `${MockWarehouses.filter(w => w.status === 'active').length} đang hoạt động`,
      icon: <Warehouse className="h-5 w-5" />,
      color: 'var(--color-secondary, #7c3aed)',
    },
    {
      label: 'Kho chờ duyệt',
      value: MockWarehouses.filter(w => w.status === 'pending').length,
      sub: 'Cần kiểm duyệt',
      icon: <Clock className="h-5 w-5" />,
      color: 'var(--color-warning, #f59e0b)',
      urgent: MockWarehouses.some(w => w.status === 'pending'),
    },
    {
      label: 'Yêu cầu thuê',
      value: MockRentRequests.length,
      sub: `${MockRentRequests.filter(r => r.status === 'inprogress').length} đang thương lượng`,
      icon: <ClipboardList className="h-5 w-5" />,
      color: 'var(--color-success, #22c55e)',
    },
  ], []);

  // ── Recent pending warehouses ──────────────────────────────────────────────
  const pendingWarehouses = useMemo(
    () => MockWarehouses.filter(w => w.status === 'pending').slice(0, 3),
    [],
  );

  // ── Active contracts ───────────────────────────────────────────────────────
  const activeContracts = useMemo(
    () => contractList.filter(c => c.status === 'active' || c.status === 'expiring_soon'),
    [contractList],
  );

  const actions = [
    {
      icon: <Users className="h-8 w-8" />,
      color: 'var(--color-primary)',
      title: 'Quản lý người dùng',
      desc: `${MockUsers.length} tài khoản đang đăng ký`,
      badge: null,
      path: '/employee/users',
    },
    {
      icon: <Warehouse className="h-8 w-8" />,
      color: 'var(--color-secondary, #7c3aed)',
      title: 'Quản lý kho lạnh',
      desc: `${MockWarehouses.filter(w => w.status === 'active').length} đang hoạt động · ${MockWarehouses.filter(w => w.status === 'pending').length} chờ duyệt`,
      badge: MockWarehouses.filter(w => w.status === 'pending').length || null,
      path: '/employee/warehouses',
    },
    {
      icon: <Database className="h-8 w-8" />,
      color: '#0891b2',
      title: 'Data Migration',
      desc: 'Migrate & quản lý dữ liệu mock',
      badge: null,
      path: '/employee/data-migration',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      color: '#22c55e',
      title: 'Loại chứng nhận',
      desc: 'Quản lý ISO, HACCP, GDP, ATTP... dùng khi duyệt kho',
      badge: null,
      path: '/employee/cert-types',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="bento-container">
        {/* Header */}
        <div className="bento-header">
          <h1>Xin chào, {user?.name}!</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Quản lý hệ thống logicha</p>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)] mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-[var(--color-surface)] p-6 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1 truncate">{s.label}</p>
                <p className="text-3xl font-extrabold" style={{ color: s.urgent ? s.color : 'inherit' }}>
                  {s.value}
                </p>
                {s.sub && (
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{s.sub}</p>
                )}
              </div>
              <div className="w-10 h-10 flex items-center justify-center text-white shrink-0 ml-3"
                style={{ background: s.color }}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* AI Service Status */}
        <AIStatusPanel />

        {/* Pending warehouses alert */}
        {pendingWarehouses.length > 0 && (
          <div className="mb-6 border border-[var(--color-border)]" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]"
              style={{ background: 'var(--color-bg-secondary)' }}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" style={{ color: 'var(--color-warning, #f59e0b)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Kho đang chờ duyệt ({MockWarehouses.filter(w => w.status === 'pending').length})
                </span>
              </div>
              <button onClick={() => navigate('/employee/warehouses')}
                className="text-xs hover:underline" style={{ color: 'var(--color-primary)' }}>
                Xem tất cả →
              </button>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {pendingWarehouses.map(w => (
                <div key={w.id_warehouse} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{w.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {w.location.city}, {w.location.province} · {w.ownerName}
                    </p>
                  </div>
                  <button onClick={() => navigate('/employee/warehouses')}
                    className="shrink-0 ml-3 text-xs px-2.5 py-1 text-white"
                    style={{ background: 'var(--color-warning, #f59e0b)' }}>
                    Duyệt ngay
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-border)] mb-8">
          {actions.map(a => (
            <button
              key={a.title}
              onClick={() => navigate(a.path)}
              className="bg-[var(--color-surface)] p-8 text-left hover:bg-[var(--color-primary-50)] transition-colors group relative"
            >
              {a.badge != null && a.badge > 0 && (
                <span className="absolute top-4 right-4 text-white text-xs px-2 py-0.5"
                  style={{ background: 'var(--color-warning, #f59e0b)' }}>
                  {a.badge} mới
                </span>
              )}
              <div className="w-14 h-14 flex items-center justify-center text-white mb-5" style={{ background: a.color }}>
                {a.icon}
              </div>
              <h3 className="mb-2 group-hover:text-[var(--color-primary)] transition-colors">{a.title}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm">{a.desc}</p>
            </button>
          ))}
        </div>

        {/* Contract overview */}
        <div className="border border-[var(--color-border)]" style={{ background: 'var(--color-surface)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]"
            style={{ background: 'var(--color-bg-secondary)' }}>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Hợp đồng đang hoạt động ({activeContracts.length})
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <CheckCircle className="h-3.5 w-3.5" style={{ color: 'var(--color-success, #22c55e)' }} />
              {contractList.filter(c => c.status === 'expiring_soon').length} sắp hết hạn
            </div>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {activeContracts.slice(0, 4).map(c => {
              const wh = MockWarehouses.find(w => w.id_warehouse === c.warehouseId);
              return (
                <div key={c.id_contract} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                      {c.contractRef}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {wh?.name ?? c.warehouseId} · {c.rentedCapacity.toLocaleString()} m³
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[10px] px-2 py-0.5 text-white"
                    style={{
                      background: c.status === 'expiring_soon'
                        ? 'var(--color-warning, #f59e0b)'
                        : 'var(--color-success, #22c55e)',
                    }}
                  >
                    {c.status === 'expiring_soon' ? 'Sắp hết hạn' : 'Đang thuê'}
                  </span>
                </div>
              );
            })}
            {activeContracts.length === 0 && (
              <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                Không có hợp đồng đang hoạt động.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
