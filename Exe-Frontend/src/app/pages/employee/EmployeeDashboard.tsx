import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { getUser } from '../../../utils/auth';
import { MockUsers } from '../../../data/mockUsers';
import { MockWarehouseData as MockWarehouses } from '../../../data/mockWarehouses';
import { MockCompositeRentRequests as MockRentRequests } from '../../../data/mockRequests';
import { contractsAPI } from '../../../services/apiClient';
import { employeeService } from '../../../services/employeeService';
import { Users, Warehouse, Clock, CheckCircle, AlertCircle, ClipboardList, FileText, Shield, Sparkles, Star } from 'lucide-react';
import { AIStatusPanel } from '../../components/AIStatusPanel';
import type { CompositeContract } from '../../../types';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [contractList, setContractList] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'EMPLOYEE') {
      navigate('/login');
      return;
    }

    employeeService.getContracts()
      .then(c => setContractList(c))
      .catch(err => console.error('Failed to load contracts:', err));

    // fetch employee statistics
    employeeService.getStatistics()
      .then(r => setStatsData(r))
      .catch(err => console.error('Failed to load statistics:', err));
  }, [user?.role, navigate]);

  // ── Stats from mock data ──────────────────────────────────────────────────
  const stats = useMemo(() => [
    {
      label: 'Tổng người dùng',
      value: statsData?.usersCount ?? MockUsers.length,
      sub: statsData
        ? `${(statsData.usersByRole?.renter ?? 0)} Người thuê · ${(statsData.usersByRole?.warehouse ?? 0)} Chủ kho · ${(statsData.usersByRole?.employee ?? 0)} Nhân viên`
        : `${MockUsers.filter(u => u.role === 'RENTER').length} Người thuê · ${MockUsers.filter(u => u.role === 'OWNER').length} Chủ kho · ${MockUsers.filter(u => u.role === 'EMPLOYEE').length} Nhân viên`,
      icon: <Users className="h-5 w-5" />,
      color: 'var(--color-primary)',
    },
    {
      label: 'Tổng kho lạnh',
      value: (statsData?.warehousesByStatus?.active ?? MockWarehouses.length),
      sub: `${statsData ? statsData.warehousesByStatus?.active ?? 0 : MockWarehouses.filter(w => w.status === 'active').length} đang hoạt động`,
      icon: <Warehouse className="h-5 w-5" />,
      color: 'var(--color-secondary, #7c3aed)',
    },
    {
      label: 'Kho chờ duyệt',
      value: statsData ? statsData.warehousesByStatus?.pending ?? 0 : MockWarehouses.filter(w => w.status === 'pending').length,
      sub: 'Cần kiểm duyệt',
      icon: <Clock className="h-5 w-5" />,
      color: 'var(--color-warning, #f59e0b)',
      urgent: (statsData ? (statsData.warehousesByStatus?.pending ?? 0) > 0 : MockWarehouses.some(w => w.status === 'pending')),
    },
    {
      label: 'Yêu cầu thuê',
      value: statsData ? (Object.values(statsData.rentRequestsByStatus || {}).reduce((a: number, b: number) => a + b, 0)) : MockRentRequests.length,
      sub: statsData
        ? `${statsData.rentRequestsByStatus?.completed ?? 0} đã hoàn thành · ${statsData.rentRequestsByStatus?.pending ?? 0} chờ duyệt · ${statsData.rentRequestsByStatus?.cancelled ?? 0} đã từ chối`
        : `${MockRentRequests.filter(r => r.status === 'inprogress').length} đang thương lượng`,
      icon: <ClipboardList className="h-5 w-5" />,
      color: 'var(--color-success, #22c55e)',
    },
  ], [statsData]);

  // ── Recent pending warehouses ──────────────────────────────────────────────
  const pendingWarehouses = useMemo(
    () => MockWarehouses.filter(w => w.status === 'pending').slice(0, 3),
    [],
  );

  // ── Active contracts ───────────────────────────────────────────────────────
  const activeContracts = useMemo(
    () => contractList.filter(c => c.status === 'active' || c.status === 'expiring_soon' || c.status === 'ACTIVE' || c.status === 'EXPIRING_SOON'),
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
      desc: `${statsData ? statsData.warehousesByStatus?.active ?? 0 : MockWarehouses.filter(w => w.status === 'active').length} đang hoạt động · ${statsData ? statsData.warehousesByStatus?.pending ?? 0 : MockWarehouses.filter(w => w.status === 'pending').length} chờ duyệt`,
      badge: statsData ? (statsData.warehousesByStatus?.pending ?? 0) || null : MockWarehouses.filter(w => w.status === 'pending').length || null,
      path: '/employee/warehouses',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      color: '#22c55e',
      title: 'Loại chứng nhận',
      desc: 'Quản lý ISO, HACCP, GDP, ATTP... dùng khi duyệt kho',
      badge: null,
      path: '/employee/cert-types',
    },
    {
      icon: <FileText className="h-8 w-8" />,
      color: '#0ea5e9',
      title: 'Quản lý Hợp đồng',
      desc: 'Quản lý tất cả các hợp đồng thuê trên hệ thống',
      badge: null,
      path: '/employee/contracts',
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      color: '#ec4899', // Pink
      title: 'Gói AI',
      desc: 'Quản lý các gói đăng ký AI cho người dùng',
      badge: null,
      path: '/employee/ai-tiers',
    },
    {
      icon: <Star className="h-8 w-8" />,
      color: '#eab308', // Yellow
      title: 'Gói Tài Trợ',
      desc: 'Quản lý các gói ưu tiên tìm kiếm kho bãi',
      badge: null,
      path: '/employee/sponsor-tiers',
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



        {/* Pending warehouses alert */}
        {(statsData ? (statsData.warehousesByStatus?.pending ?? 0) > 0 : pendingWarehouses.length > 0) && (
          <div className="mb-6 border border-[var(--color-border)]" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]"
              style={{ background: 'var(--color-bg-secondary)' }}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" style={{ color: 'var(--color-warning, #f59e0b)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Kho đang chờ duyệt ({statsData ? (statsData.warehousesByStatus?.pending ?? 0) : MockWarehouses.filter(w => w.status === 'pending').length})
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
              <Clock className="h-3.5 w-3.5" style={{ color: 'var(--color-warning, #f59e0b)' }} />
              {contractList.filter(c => c.status === 'expiring_soon' || c.status === 'EXPIRING_SOON').length} hết hạn trong 30 ngày
            </div>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {activeContracts.slice(0, 4).map(c => {
              const whName = c.warehouseName || 'Kho';
              return (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                      {`Mã HĐ: #${c.id}`}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {whName}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[10px] px-2 py-0.5 text-white"
                    style={{
                      background: (c.status === 'expiring_soon' || c.status === 'EXPIRING_SOON')
                        ? 'var(--color-warning, #f59e0b)'
                        : 'var(--color-success, #22c55e)',
                    }}
                  >
                    {(c.status === 'expiring_soon' || c.status === 'EXPIRING_SOON') ? 'Sắp hết hạn' : 'Đang hoạt động'}
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
