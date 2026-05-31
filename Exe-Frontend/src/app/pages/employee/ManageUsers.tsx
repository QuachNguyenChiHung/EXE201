import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { useApp } from '../../../context/AppContext';
import useUsers from '../../hooks/useUsers';
import { User, UserRole } from '../../../types';
import {
  Users, ArrowLeft, Building, Phone, Mail,
  Warehouse, ShieldCheck, User as UserIcon, ChevronDown, ChevronUp,
  CheckCircle, Edit2, Calendar, Sparkles,
} from 'lucide-react';
import Modal from '../../components/Modal';
import SearchInput from '../../components/SearchInput';
import { toast } from 'sonner';
import { UserConversationsModal } from '../../components/AIConversationViewer';
import UserRow from '../../components/employee/UserRow';

// ── Types ─────────────────────────────────────────────────────────────────────
type RoleFilter = 'all' | UserRole;

const ROLE_CFG: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
  renter: { label: 'Doanh nghiệp', color: 'var(--color-primary)', icon: <Building className="h-3.5 w-3.5" /> },
  warehouse: { label: 'Chủ kho', color: 'var(--color-secondary, #7c3aed)', icon: <Warehouse className="h-3.5 w-3.5" /> },
  employee: { label: 'Nhân viên', color: 'var(--color-success, #22c55e)', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
};

const TABS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'renter', label: 'Doanh nghiệp' },
  { key: 'warehouse', label: 'Chủ kho' },
  { key: 'employee', label: 'Nhân viên' },
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ManageUsers() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewConvUser, setViewConvUser] = useState<User | null>(null);

  const { warehousesByOwner, requestsByRenter, filtered, counts, handleSaveEdit } = useUsers(tab, search);

  const handleSave = async (id: number, name: string, companyName: string) => {
    // Note: Assuming handleSaveEdit accepts a partial user object that can include company info.
    // If the backend expects a specific 'company' structure, the hook may need adjustment.
    await handleSaveEdit(id, { 
        name, 
        company: companyName ? { ...editingUser?.company, company_name: companyName, id_company: editingUser?.company?.id_company ?? 0, user_id: id, company_tax_code: editingUser?.company?.company_tax_code ?? '' } as any : undefined 
    });
    toast.success('Đã cập nhật thông tin người dùng.');
    setEditingUser(null);
  }

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
                Xem và quản lý {counts.all} tài khoản trên nền tảng
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
                warehouseCount={warehousesByOwner[u.id_user] ?? 0}
                requestCount={requestsByRenter[u.id_user] ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
