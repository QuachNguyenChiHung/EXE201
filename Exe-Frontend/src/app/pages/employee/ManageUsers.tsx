import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { useMemo } from 'react';
import { User, UserRole } from '../../../types';
import {
  Users, ArrowLeft, Building, Phone, Mail,
  Warehouse, ShieldCheck, User as UserIcon, ChevronDown, ChevronUp,
  CheckCircle, Edit2, Calendar, Sparkles, Activity, Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';
import Modal from '../../components/Modal';
import SearchInput from '../../components/SearchInput';
import { toast } from 'sonner';
import { UserConversationsModal } from '../../components/AIConversationViewer';
import UserRow from '../../components/employee/UserRow';
import { getUser } from '/src/utils/auth';
import { employeeService } from '../../../services/employeeService';
import { UserDTO } from '../../../types/employee';

// ── Types ─────────────────────────────────────────────────────────────────────
type RoleFilter = 'all' | UserRole;

const ROLE_CFG: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
  RENTER: { label: 'Doanh nghiệp', color: 'var(--color-primary)', icon: <Building className="h-3.5 w-3.5" /> },
  OWNER: { label: 'Chủ kho', color: 'var(--color-secondary, #7c3aed)', icon: <Warehouse className="h-3.5 w-3.5" /> },
  EMPLOYEE: { label: 'Nhân viên', color: 'var(--color-success, #22c55e)', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
};

const TABS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'RENTER', label: 'Doanh nghiệp' },
  { key: 'OWNER', label: 'Chủ kho' },
  { key: 'EMPLOYEE', label: 'Nhân viên' },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ── Edit name modal ────────────────────────────────────────────────────────────
function EditNameModal({
  user,
  onSave,
  onCancel,
}: {
  user: User;
  onSave: (id: number, name: string, companyName: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [company, setCompany] = useState(user.company?.company_name ?? '');

  const handleSave = () => {
    if (!name.trim()) { toast.error('Tên không được để trống'); return; }
    onSave(user.id_user, name.trim(), company.trim());
  };

  return (
    <Modal title="Chỉnh sửa người dùng" onClose={onCancel} className="max-w-sm" footer={(
      <div className="px-0 pb-0 flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2 text-sm border border-[var(--color-border)]"
          style={{ color: 'var(--color-text-secondary)' }}>Huỷ</button>
        <button onClick={handleSave}
          className="flex-1 py-2 text-sm text-white"
          style={{ background: 'var(--color-primary)' }}>Lưu thay đổi</button>
      </div>
    )}>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>

      <div className="space-y-3 mt-3">
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Họ và tên</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Công ty / Tổ chức</label>
          <input value={company} onChange={e => setCompany(e.target.value)}
            placeholder="(tuỳ chọn)"
            className="w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
        </div>
      </div>
    </Modal>
  );
}

// ── Create Employee modal ──────────────────────────────────────────────────────
function CreateEmployeeModal({
  onSave,
  onCancel,
}: {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Vui lòng nhập đầy đủ Tên, Email và Mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim(),
        role: 'EMPLOYEE',
        status: 'ACTIVE'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Thêm nhân viên mới" onClose={onCancel} className="max-w-sm" footer={(
      <div className="px-0 pb-0 flex gap-3">
        <button onClick={onCancel} disabled={loading}
          className="flex-1 py-2 text-sm border border-[var(--color-border)] disabled:opacity-50"
          style={{ color: 'var(--color-text-secondary)' }}>Huỷ</button>
        <button onClick={handleSave} disabled={loading}
          className="flex-1 py-2 text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'var(--color-primary)' }}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Tạo tài khoản
        </button>
      </div>
    )}>
      <p className="text-xs mt-0.5 mb-4" style={{ color: 'var(--color-text-muted)' }}>
        Nhập thông tin để tạo tài khoản nhân viên mới trên hệ thống.
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-xs mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Họ và tên <span className="text-red-500">*</span></label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full h-9 px-3 text-sm border rounded-md focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
        </div>
        <div>
          <label className="text-xs mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Email <span className="text-red-500">*</span></label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email"
            className="w-full h-9 px-3 text-sm border rounded-md focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
        </div>
        <div>
          <label className="text-xs mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Mật khẩu <span className="text-red-500">*</span></label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password"
            className="w-full h-9 px-3 text-sm border rounded-md focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
        </div>
        <div>
          <label className="text-xs mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Số điện thoại</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
            className="w-full h-9 px-3 text-sm border rounded-md focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }} />
        </div>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ManageUsers() {
  const navigate = useNavigate();
  const user = getUser();
  useEffect(() => {
    if (!user || user.role !== 'EMPLOYEE') {
      navigate('/login');
      return;
    }

  }, [user, navigate]);
  const [tab, setTab] = useState<RoleFilter>('all');

  const [viewMode, setViewMode] = useState<'list' | 'activity'>('list');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewConvUser, setViewConvUser] = useState<User | null>(null);
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [listUsers, setListUsers] = useState<any[]>([]);

  // Stats state
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsByDate, setStatsByDate] = useState<any[]>([]);
  const [statsByHour, setStatsByHour] = useState<any[]>([]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const defaultStartStr = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const [startDate, setStartDate] = useState(defaultStartStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [hourlyDate, setHourlyDate] = useState(todayStr);

  const [inputStartDate, setInputStartDate] = useState(defaultStartStr);
  const [inputEndDate, setInputEndDate] = useState(todayStr);
  const [inputHourlyDate, setInputHourlyDate] = useState(todayStr);
  const { warehouses: warehouseList, requests: requestList, adminUpdateUser } = useApp();

  const warehousesByOwner = useMemo(() =>
    (warehouseList || []).reduce((acc: Record<number, number>, w: any) => { acc[w.id_owner || 0] = (acc[w.id_owner || 0] ?? 0) + 1; return acc }, {}),
    [warehouseList]);

  const requestsByRenter = useMemo(() =>
    (requestList || []).reduce((acc: Record<number, number>, r: any) => { acc[r.id_renter || 0] = (acc[r.id_renter || 0] ?? 0) + 1; return acc }, {}),
    [requestList]);

  const filtered = useMemo(() => {
    let list = listUsers as any[];
    if (tab !== 'all') list = list.filter(u => u.role === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || ((u.company?.company_name ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [listUsers, tab, search]);

  const counts = useMemo(() => ({
    all: listUsers.length,
    RENTER: listUsers.filter(u => u.role === 'RENTER').length,
    OWNER: listUsers.filter(u => u.role === 'OWNER').length,
    EMPLOYEE: listUsers.filter(u => u.role === 'EMPLOYEE').length,
  }), [listUsers]);

  const handleSave = async (id: number, name: string, companyName: string) => {
    try {
      await employeeService.updateUser(id, { name });
      toast.success('Đã cập nhật thông tin người dùng.');
      setEditingUser(null);
      // update local list optimistically
      setListUsers(prev => prev.map(u => u.id_user === id ? { ...u, name, company: companyName ? { company_name: companyName } : u.company } : u));
    } catch (err) {
      console.error(err);
      toast.error('Cập nhật thất bại');
    }
  }

  const handleToggleStatus = async (user: User, newStatus: string) => {
    try {
      await employeeService.updateUserStatus(user.id_user, newStatus);
      toast.success(`Đã ${newStatus === 'ACTIVE' ? 'mở khoá' : 'khoá'} tài khoản.`);
      setListUsers(prev => prev.map(u => u.id_user === user.id_user ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      console.error(err);
      toast.error('Cập nhật trạng thái thất bại');
    }
  }
  const handleCreateEmployee = async (data: any) => {
    try {
      await employeeService.createUser(data);
      toast.success('Đã tạo tài khoản nhân viên thành công!');
      setCreatingEmployee(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data || err.message || 'Lỗi không xác định';
      toast.error('Không thể tạo nhân viên: ' + errMsg);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await employeeService.getUsers();
      console.log('Fetched users:', res);
      const mapped = (res || []).map((u: UserDTO) => ({
        id_user: u.id,
        email: u.email,
        name: u.fullName ?? '',
        role: u.role,
        status: u.status,
        company: u.companyName ? { company_name: u.companyName, id_company: 0, user_id: u.id, company_tax_code: '' } : undefined,
      }));
      setListUsers(mapped);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch stats when viewMode or dates change
  useEffect(() => {
    if (viewMode === 'activity') {
      (async () => {
        try {
          setStatsLoading(true);

          const [dateRes, hourRes] = await Promise.all([
            employeeService.getActiveUsersByDate(startDate, endDate),
            employeeService.getActiveUsersByHour(hourlyDate)
          ]);

          // Format data for Recharts
          // The backend returns: { dates: string[], series: { role: string, data: number[] }[] }
          // We need an array of objects: { name: '2023-10-01', OWNER: 5, RENTER: 10, total: 15 }

          const formatResponse = (res: any, isDaily: boolean) => {
            const labels: string[] = isDaily ? (res.dates || []) : (res.hours || []);
            const series: { role: string; data: number[] }[] = res.series || [];

            return labels.map((label: string, index: number) => {
              const item: any = { name: isDaily ? label : `${label}:00` };
              let total = 0;
              series.forEach(s => {
                const val = s.data[index] || 0;
                item[s.role] = val;
                total += val;
              });
              item.total = total;
              return item;
            });
          };

          const formattedDateStats = formatResponse(dateRes, true);
          const formattedHourStats = formatResponse(hourRes, false);

          formattedDateStats.sort((a: any, b: any) => a.name.localeCompare(b.name));

          // For hours, parse as integer to sort
          formattedHourStats.sort((a: any, b: any) => parseInt(a.name) - parseInt(b.name));

          setStatsByDate(formattedDateStats);
          setStatsByHour(formattedHourStats);
        } catch (error) {
          console.error('Error fetching stats:', error);
          toast.error('Lỗi khi tải thống kê');
        } finally {
          setStatsLoading(false);
        }
      })();
    }
  }, [viewMode, startDate, endDate, hourlyDate]);
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {editingUser && (
        <EditNameModal
          user={editingUser}
          onSave={handleSave}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {viewConvUser && (
        <UserConversationsModal
          userId={viewConvUser.id_user}
          userName={viewConvUser.name}
          onClose={() => setViewConvUser(null)}
        />
      )}

      {creatingEmployee && (
        <CreateEmployeeModal 
          onSave={handleCreateEmployee}
          onCancel={() => setCreatingEmployee(false)}
        />
      )}

      <div className="bento-container">
        {/* Header */}
        <div className="bento-header flex justify-between items-start gap-4">
          <div>
            <button onClick={() => navigate('/employee')}
              className="flex items-center gap-1 text-sm mb-2 hover:underline transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}>
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </button>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 flex items-center justify-center shrink-0 rounded-md"
                style={{ background: 'var(--color-primary)' }}>
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Quản lý người dùng</h1>
                <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
                  Xem và quản lý {counts.all} tài khoản trên nền tảng
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setCreatingEmployee(true)} 
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md transition-opacity hover:opacity-90 shadow-sm"
            style={{ background: 'var(--color-primary)' }}
          >
            <ShieldCheck className="h-4 w-4" /> Thêm nhân viên
          </button>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-4 border-b border-[var(--color-border)] mb-6">
          <button
            onClick={() => setViewMode('list')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${viewMode === 'list' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
          >
            <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Danh sách người dùng</div>
          </button>
          <button
            onClick={() => setViewMode('activity')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${viewMode === 'activity' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
          >
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Thống kê hoạt động</div>
          </button>
        </div>

        {viewMode === 'list' ? (
          <>
            {/* Role summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-border)] mb-6">
              {TABS.map(t => {
                const cfg = t.key === 'all' ? null : ROLE_CFG[t.key as UserRole];
                return (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className="bg-[var(--color-surface)] p-5 text-left hover:bg-[var(--color-bg-secondary)] transition-colors"
                    style={{ borderBottom: tab === t.key ? `2px solid var(--color-primary)` : '2px solid transparent' }}>
                    <div className="flex items-center gap-2 mb-1">
                      {cfg && <span className="inline-flex text-white p-0.5" style={{ background: cfg.color }}>{cfg.icon}</span>}
                      <p className="text-2xl font-extrabold" style={{ color: cfg?.color ?? 'var(--color-primary)' }}>
                        {counts[t.key]}
                      </p>
                    </div>
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{t.label}</p>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="mb-4">
              <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên, email, công ty…" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-border)] mb-6 overflow-x-auto">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
                  style={{
                    borderBottomColor: tab === t.key ? 'var(--color-primary)' : 'transparent',
                    color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: tab === t.key ? 600 : 400,
                  }}>
                  {t.label}
                  <span className="text-xs px-1.5 py-0.5"
                    style={{
                      background: tab === t.key ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                      color: tab === t.key ? 'white' : 'var(--color-text-muted)',
                    }}>
                    {counts[t.key]}
                  </span>
                </button>
              ))}
            </div>

            {/* User list */}
            {filtered.length === 0 ? (
              <div className="border border-[var(--color-border)] p-16 text-center"
                style={{ background: 'var(--color-surface)' }}>
                <UserIcon className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {search ? `Không tìm thấy người dùng phù hợp với "${search}"` : 'Không có người dùng.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(u => (
                  <UserRow
                    key={u.id_user}
                    user={u}
                    onEdit={setEditingUser}
                    onViewConversations={setViewConvUser}
                    onToggleStatus={handleToggleStatus}
                    warehouseCount={warehousesByOwner[u.id_user] ?? 0}
                    requestCount={requestsByRenter[u.id_user] ?? 0}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Activity View */
          <div className="space-y-6">
            {statsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-[var(--color-primary)]" />
                <p>Đang tải dữ liệu thống kê...</p>
              </div>
            ) : (
              <>
                {/* Active users by date */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                      <Calendar className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> Thống kê lượt truy cập theo ngày
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="date"
                        value={inputStartDate}
                        onChange={e => setInputStartDate(e.target.value)}
                        max={inputEndDate}
                        className="border border-[var(--color-border)] rounded px-2 py-1 bg-[var(--color-bg)] outline-none focus:border-[var(--color-primary)] transition-colors"
                        style={{ color: 'var(--color-text)' }}
                      />
                      <span className="text-[var(--color-text-muted)]">-</span>
                      <input
                        type="date"
                        value={inputEndDate}
                        onChange={e => setInputEndDate(e.target.value)}
                        max={todayStr}
                        className="border border-[var(--color-border)] rounded px-2 py-1 bg-[var(--color-bg)] outline-none focus:border-[var(--color-primary)] transition-colors"
                        style={{ color: 'var(--color-text)' }}
                      />
                      <button
                        onClick={() => { setStartDate(inputStartDate); setEndDate(inputEndDate); }}
                        className="px-3 py-1 rounded text-white bg-[var(--color-primary)] hover:opacity-90 transition-opacity"
                      >
                        Lọc
                      </button>
                    </div>
                  </div>
                  {statsByDate.length === 0 ? (
                    <p className="text-sm text-center py-10 text-[var(--color-text-muted)]">Không có dữ liệu</p>
                  ) : (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={statsByDate} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickMargin={10} minTickGap={30} />
                          <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '4px', fontSize: '13px' }}
                            itemStyle={{ color: 'var(--color-text)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                          {Object.keys(statsByDate[0] || {}).filter(k => k !== 'name' && k !== 'total').map((key) => {
                            const roleColorMap: any = { OWNER: '#f97316', RENTER: '#3b82f6', EMPLOYEE: '#22c55e' };
                            const nameMap: any = { OWNER: 'Chủ kho', RENTER: 'Doanh nghiệp', EMPLOYEE: 'Nhân viên' };
                            return (
                              <Line key={key} type="monotone" dataKey={key} name={nameMap[key] || key} stroke={roleColorMap[key] || '#9ca3af'} strokeWidth={2} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Active users by hour */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                      <Activity className="h-4 w-4" style={{ color: 'var(--color-primary)' }} /> Lượt truy cập theo giờ
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="date"
                        value={inputHourlyDate}
                        onChange={e => setInputHourlyDate(e.target.value)}
                        max={todayStr}
                        className="border border-[var(--color-border)] rounded px-2 py-1 bg-[var(--color-bg)] outline-none focus:border-[var(--color-primary)] transition-colors"
                        style={{ color: 'var(--color-text)' }}
                      />
                      <button
                        onClick={() => setHourlyDate(inputHourlyDate)}
                        className="px-3 py-1 rounded text-white bg-[var(--color-primary)] hover:opacity-90 transition-opacity"
                      >
                        Lọc
                      </button>
                    </div>
                  </div>
                  {statsByHour.length === 0 ? (
                    <p className="text-sm text-center py-10 text-[var(--color-text-muted)]">Không có dữ liệu</p>
                  ) : (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={statsByHour} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickMargin={10} />
                          <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '4px', fontSize: '13px' }}
                            itemStyle={{ color: 'var(--color-text)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                          {Object.keys(statsByHour[0] || {}).filter(k => k !== 'name' && k !== 'total').map((key) => {
                            const roleColorMap: any = { OWNER: '#f97316', RENTER: '#3b82f6', EMPLOYEE: '#22c55e' };
                            const nameMap: any = { OWNER: 'Chủ kho', RENTER: 'Doanh nghiệp', EMPLOYEE: 'Nhân viên' };
                            return (
                              <Line key={key} type="monotone" dataKey={key} name={nameMap[key] || key} stroke={roleColorMap[key] || '#9ca3af'} strokeWidth={2} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
