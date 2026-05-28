import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import { User, UserRole } from '../../../types';
import {
  Users, ArrowLeft, Search, Building, Phone, Mail,
  Warehouse, ShieldCheck, User as UserIcon, ChevronDown, ChevronUp,
  CheckCircle, Edit2, Calendar, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserConversationsModal } from '../../components/AIConversationViewer';

// ── Types ─────────────────────────────────────────────────────────────────────
type RoleFilter = 'all' | UserRole;

const ROLE_CFG: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
  renter:   { label: 'Doanh nghiệp', color: 'var(--color-primary)',             icon: <Building className="h-3.5 w-3.5" /> },
  warehouse:{ label: 'Chủ kho',      color: 'var(--color-secondary, #7c3aed)',  icon: <Warehouse className="h-3.5 w-3.5" /> },
  employee: { label: 'Nhân viên',    color: 'var(--color-success, #22c55e)',    icon: <ShieldCheck className="h-3.5 w-3.5" /> },
};

const TABS: { key: RoleFilter; label: string }[] = [
  { key: 'all',       label: 'Tất cả'          },
  { key: 'renter',    label: 'Doanh nghiệp'    },
  { key: 'warehouse', label: 'Chủ kho'         },
  { key: 'employee',  label: 'Nhân viên'       },
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
  onSave: (id: string, name: string, companyName: string) => void;
  onCancel: () => void;
}) {
  const [name, setName]         = useState(user.name);
  const [company, setCompany]   = useState(user.companyName ?? '');

  const handleSave = () => {
    if (!name.trim()) { toast.error('Tên không được để trống'); return; }
    onSave(user.id, name.trim(), company.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-sm border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="px-5 py-4 border-b border-[var(--color-border)]"
          style={{ background: 'var(--color-bg-secondary)' }}>
          <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Chỉnh sửa người dùng</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
        </div>
        <div className="px-5 py-4 space-y-3">
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
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2 text-sm border border-[var(--color-border)]"
            style={{ color: 'var(--color-text-secondary)' }}>Huỷ</button>
          <button onClick={handleSave}
            className="flex-1 py-2 text-sm text-white"
            style={{ background: 'var(--color-primary)' }}>Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────
function UserRow({ user, onEdit, onViewConversations, warehouseCount, requestCount }: {
  user: User;
  onEdit: (u: User) => void;
  onViewConversations: (u: User) => void;
  warehouseCount: number;
  requestCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ROLE_CFG[user.role];

  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ borderLeft: `3px solid ${cfg.color}` }}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="w-9 h-9 shrink-0 flex items-center justify-center text-white"
          style={{ background: cfg.color }}>
          {cfg.icon}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{user.name}</p>
            <span className="inline-flex items-center gap-1 text-[10px] text-white px-1.5 py-0.5"
              style={{ background: cfg.color }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
          {user.role === 'warehouse' && (
            <span className="flex items-center gap-1">
              <Warehouse className="h-3 w-3" /> {warehouseCount} kho
            </span>
          )}
          {user.role === 'renter' && (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> {requestCount} yêu cầu
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {user.role === 'renter' && (
            <button onClick={() => onViewConversations(user)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
              style={{ color: 'var(--color-primary)' }}>
              <Sparkles className="h-3 w-3" /> AI Chat
            </button>
          )}
          <button onClick={() => onEdit(user)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}>
            <Edit2 className="h-3 w-3" /> Sửa
          </button>
          <button onClick={() => setExpanded(p => !p)}
            className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
            {expanded
              ? <ChevronUp   className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
              : <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3"
          style={{ background: 'var(--color-bg-secondary)' }}>
          <div>
            <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>ID người dùng</p>
            <p className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>{user.id}</p>
          </div>
          {user.companyName && (
            <div>
              <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Công ty</p>
              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                <Building className="h-3 w-3 shrink-0" style={{ color: 'var(--color-primary)' }} />
                {user.companyName}
              </p>
            </div>
          )}
          {user.phone && (
            <div>
              <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Điện thoại</p>
              <a href={`tel:${user.phone}`} className="text-xs flex items-center gap-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
                <Phone className="h-3 w-3 shrink-0" /> {user.phone}
              </a>
            </div>
          )}
          <div>
            <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Email</p>
            <a href={`mailto:${user.email}`} className="text-xs flex items-center gap-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
              <Mail className="h-3 w-3 shrink-0" /> {user.email}
            </a>
          </div>
          <div>
            <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Ngày tham gia</p>
            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
              <Calendar className="h-3 w-3 shrink-0" /> {fmtDate(user.createdAt)}
            </p>
          </div>
          {user.role === 'warehouse' && (
            <div>
              <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Số kho đã đăng</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{warehouseCount} kho</p>
            </div>
          )}
          {user.role === 'renter' && (
            <div>
              <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Số yêu cầu đã gửi</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{requestCount} yêu cầu</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ManageUsers() {
  const navigate  = useNavigate();
  const { users, warehouses: warehouseList, requests: requestList, adminUpdateUser } = useApp();

  const [tab,    setTab]    = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewConvUser, setViewConvUser] = useState<User | null>(null);

  // Stats per user
  const warehousesByOwner = useMemo(() =>
    warehouseList.reduce((acc, w) => {
      acc[w.ownerId] = (acc[w.ownerId] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  [warehouseList]);

  const requestsByRenter = useMemo(() =>
    requestList.reduce((acc, r) => {
      acc[r.renterId] = (acc[r.renterId] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  [requestList]);

  const filtered = useMemo(() => {
    let list: User[] = users;
    if (tab !== 'all') list = list.filter(u => u.role === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.companyName?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [users, tab, search]);

  const counts: Record<RoleFilter, number> = useMemo(() => ({
    all:       users.length,
    renter:    users.filter(u => u.role === 'renter').length,
    warehouse: users.filter(u => u.role === 'warehouse').length,
    employee:  users.filter(u => u.role === 'employee').length,
  }), [users]);

  const handleSaveEdit = async (id: string, name: string, companyName: string) => {
    await adminUpdateUser(id, { name, companyName: companyName || undefined });
    toast.success('Đã cập nhật thông tin người dùng.');
    setEditingUser(null);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />

      {editingUser && (
        <EditNameModal
          user={editingUser}
          onSave={handleSaveEdit}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {viewConvUser && (
        <UserConversationsModal
          userId={viewConvUser.id}
          userName={viewConvUser.name}
          onClose={() => setViewConvUser(null)}
        />
      )}

      <div className="bento-container">
        {/* Header */}
        <div className="bento-header">
          <button onClick={() => navigate('/employee')}
            className="flex items-center gap-1 text-sm mb-2 hover:underline"
            style={{ color: 'var(--color-text-secondary)' }}>
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary)' }}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1>Quản lý người dùng</h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Xem và quản lý {users.length} tài khoản trên nền tảng
              </p>
            </div>
          </div>
        </div>

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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm theo tên, email, công ty…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
          />
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
                key={u.id}
                user={u}
                onEdit={setEditingUser}
                onViewConversations={setViewConvUser}
                warehouseCount={warehousesByOwner[u.id] ?? 0}
                requestCount={requestsByRenter[u.id] ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
