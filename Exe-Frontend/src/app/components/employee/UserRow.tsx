import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Warehouse, CheckCircle, Sparkles, Edit2, ChevronDown, ChevronUp, Building, Phone, Mail, Calendar, ShieldCheck, Loader2, FileText, FileSignature, User as UserIcon, AlignLeft, MapPin, CreditCard, Package, Activity, Lock, Unlock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { User, UserRole } from '../../../types';
import { employeeService } from '../../../services/employeeService';
import { OwnerDetailResponseDTO, RenterDetailResponseDTO } from '../../../types/employee';

const ROLE_CFG: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
    RENTER: { label: 'Doanh nghiệp', color: 'var(--color-primary)', icon: <Building className="h-3.5 w-3.5" /> },
    OWNER: { label: 'Chủ kho', color: 'var(--color-secondary, #7c3aed)', icon: <Warehouse className="h-3.5 w-3.5" /> },
    EMPLOYEE: { label: 'Nhân viên', color: 'var(--color-success, #22c55e)', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
};

export default function UserRow({ user, onEdit, onViewConversations, onToggleStatus, warehouseCount, requestCount }: {
    user: User;
    onEdit: (u: User) => void;
    onViewConversations: (u: User) => void;
    onToggleStatus?: (u: User, newStatus: string) => void;
    warehouseCount: number;
    requestCount: number;
}) {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);
    const roleKey = (user.role || '').toString().toUpperCase() as UserRole;
    const DEFAULT_CFG = { label: 'Người dùng', color: 'var(--color-border)', icon: null as React.ReactNode };
    const cfg = ROLE_CFG[roleKey] ?? DEFAULT_CFG;

    const fmtDate = (iso: string) => {
        if (!iso) return 'N/A';
        const d = new Date(iso);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const [detailLoading, setDetailLoading] = useState(false);
    const [ownerDetail, setOwnerDetail] = useState<OwnerDetailResponseDTO | null>(null);
    const [renterDetail, setRenterDetail] = useState<RenterDetailResponseDTO | null>(null);
    const hasFetched = React.useRef(false);

    // Activity stats state
    const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
    const [activityDays, setActivityDays] = useState(7);
    const [activityStats, setActivityStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        if (expanded && roleKey === 'OWNER' && !ownerDetail && !hasFetched.current) {
            let mounted = true;
            hasFetched.current = true;
            setDetailLoading(true);
            employeeService.getOwnerDetail(user.id_user)
                .then(res => { if (mounted) setOwnerDetail(res); })
                .catch(err => console.error(err))
                .finally(() => { if (mounted) setDetailLoading(false); });
            return () => { mounted = false; };
        }
        if (expanded && roleKey === 'RENTER' && !renterDetail && !hasFetched.current) {
            let mounted = true;
            hasFetched.current = true;
            setDetailLoading(true);
            employeeService.getRenterDetail(user.id_user)
                .then(res => { if (mounted) setRenterDetail(res); })
                .catch(err => console.error(err))
                .finally(() => { if (mounted) setDetailLoading(false); });
            return () => { mounted = false; };
        }
    }, [expanded, roleKey, user.id_user, ownerDetail, renterDetail]);

    useEffect(() => {
        if (expanded && activeTab === 'activity') {
            let mounted = true;
            setStatsLoading(true);
            employeeService.getUserActivityStats(user.id_user, activityDays)
                .then((res: any) => {
                    if (mounted) {
                        const formatted = (res.dates || []).map((date: string, index: number) => ({
                             name: date,
                             logins: (res.activityTrend || [])[index] || 0
                        }));
                        setActivityStats({ ...res, chartData: formatted });
                    }
                })
                .catch(err => console.error(err))
                .finally(() => { if (mounted) setStatsLoading(false); });
            return () => { mounted = false; };
        }
    }, [expanded, activeTab, user.id_user, activityDays]);

    return (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]"
            style={{ borderLeft: `3px solid ${cfg.color}` }}>
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 shrink-0 flex items-center justify-center text-white" style={{ background: cfg.color }}>
                    {cfg.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{user.name}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-white px-1.5 py-0.5" style={{ background: cfg.color }}>
                            {cfg.icon} {cfg.label}
                        </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {roleKey === 'OWNER' && (
                        <span className="flex items-center gap-1"><Warehouse className="h-3 w-3" /> {warehouseCount} kho</span>
                    )}
                    {roleKey === 'RENTER' && (
                        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {requestCount} yêu cầu</span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {roleKey === 'RENTER' && (
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
                    {onToggleStatus && (
                        <button onClick={() => onToggleStatus(user, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                            style={{ color: user.status === 'ACTIVE' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                            {user.status === 'ACTIVE' ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                            {user.status === 'ACTIVE' ? 'Khoá' : 'Mở Khoá'}
                        </button>
                    )}
                    <button onClick={() => setExpanded(p => !p)}
                        className="p-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
                        {expanded ? <ChevronUp className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
                    {/* Inner Tabs Navigation */}
                    <div className="flex gap-4 px-4 border-b border-[var(--color-border)] pt-2" style={{ background: 'var(--color-surface)' }}>
                         <button onClick={() => setActiveTab('overview')}
                             className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}>
                             Tổng quan
                         </button>
                         <button onClick={() => setActiveTab('activity')}
                             className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${activeTab === 'activity' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}>
                             Hoạt động
                         </button>
                    </div>

                    <div className="px-4 py-5">
                       {activeTab === 'overview' && (
                           <>
                            {detailLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
                            ) : (
                                <div className={`grid grid-cols-1 ${roleKey !== 'EMPLOYEE' ? 'lg:grid-cols-3' : ''} gap-5`}>
                                    
                                    {/* LEFT COLUMN */}
                                    <div className="lg:col-span-1 flex flex-col gap-5">
                                {/* USER INFO CARD */}
                                {(() => {
                                    const detailUser = ownerDetail?.userInfo || renterDetail?.userInfo;
                                    const companyName = detailUser?.company?.companyName || user.company?.company_name;
                                    const taxCode = detailUser?.company?.companyTaxCode;
                                    const userPhone = detailUser?.phone || user.phone;
                                    const userEmail = detailUser?.email || user.email;

                                    return (
                                        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-5 shadow-sm">
                                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
                                                <UserIcon className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Thông tin</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-xs mb-1 uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-muted)' }}>ID / Trạng thái</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-mono font-semibold" style={{ color: 'var(--color-text)' }}>{user.id_user}</p>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {user.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                {companyName && (
                                                    <div>
                                                        <p className="text-xs mb-1 uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-muted)' }}>Công ty</p>
                                                        <p className="text-sm flex items-center gap-1.5 font-medium" style={{ color: 'var(--color-text)' }}>
                                                            <Building className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-primary)' }} /> {companyName}
                                                        </p>
                                                        {taxCode && (
                                                            <p className="text-xs mt-1 text-[var(--color-text-muted)]">
                                                                Mã số thuế: {taxCode}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {userPhone && (
                                                    <div>
                                                        <p className="text-xs mb-1 uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-muted)' }}>Điện thoại</p>
                                                        <a href={`tel:${userPhone}`} className="text-sm flex items-center gap-1.5 font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
                                                            <Phone className="h-3.5 w-3.5 shrink-0" /> {userPhone}
                                                        </a>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs mb-1 uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-muted)' }}>Email</p>
                                                    <a href={`mailto:${userEmail}`} className="text-sm flex items-center gap-1.5 font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
                                                        <Mail className="h-3.5 w-3.5 shrink-0" /> {userEmail}
                                                    </a>
                                                </div>
                                                <div>
                                                    <p className="text-xs mb-1 uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-muted)' }}>Ngày tham gia</p>
                                                    <p className="text-sm flex items-center gap-1.5 font-medium" style={{ color: 'var(--color-text)' }}>
                                                        <Calendar className="h-3.5 w-3.5 shrink-0" /> {fmtDate(user.create_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* RENTER STATS CARD */}
                                {roleKey === 'RENTER' && renterDetail && (
                                    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
                                            <CreditCard className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Chi tiêu & Gói</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Tổng chi tiêu</p>
                                                <p className="font-extrabold text-xl" style={{ color: 'var(--color-success, #22c55e)' }}>
                                                    {(renterDetail.totalSpending || 0).toLocaleString()} ₫
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] mb-0.5 uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                                                    <Sparkles className="h-3 w-3" /> Gói AI
                                                </p>
                                                <p className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>
                                                    {renterDetail.aiSubscriptionPlan || 'Chưa đăng ký'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT COLUMN */}
                            {roleKey !== 'EMPLOYEE' && (
                                <div className="lg:col-span-2 flex flex-col gap-5">
                                    
                                    {/* WAREHOUSES CARD (OWNER ONLY) */}
                                {roleKey === 'OWNER' && ownerDetail && (
                                    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
                                            <Warehouse className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Kho của chủ sở hữu ({ownerDetail.warehouses?.length || 0})</span>
                                        </div>
                                        {ownerDetail.warehouses && ownerDetail.warehouses.length > 0 ? (
                                            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                                                {ownerDetail.warehouses.map(w => (
                                                    <div key={w.id} onClick={() => navigate('/employee/warehouses', { state: { searchWarehouse: w.name, expandWarehouseId: w.id } })} className="p-3 border border-[var(--color-border)] rounded-md flex gap-4 items-start cursor-pointer hover:border-[var(--color-primary)] transition-colors" style={{ background: 'var(--color-bg-secondary)' }}>
                                                        <div className="w-24 h-24 rounded bg-[var(--color-border)] shrink-0 overflow-hidden shadow-sm">
                                                            {w.images && w.images.length > 0 ? (
                                                                <img src={w.images[0].imageUrl} alt={w.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center"><Warehouse className="h-8 w-8 text-gray-400" /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0 py-1">
                                                            <p className="font-semibold text-base truncate" style={{ color: 'var(--color-text)' }}>{w.name}</p>
                                                            <p className="text-sm mt-1.5 text-gray-500 truncate"><MapPin className="inline h-3.5 w-3.5 mr-1" />{w.locationAddressText}, {w.locationProvince}</p>
                                                            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded border border-[var(--color-border)] bg-white font-medium">{w.status}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>Chưa có kho nào.</p>
                                        )}
                                    </div>
                                )}

                                {/* CONTRACTS CARD */}
                                {(ownerDetail || renterDetail) && (
                                    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--color-border)]">
                                            <div className="flex items-center gap-2">
                                                <FileSignature className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                                                    Hợp đồng ({(ownerDetail?.contracts || renterDetail?.contracts || []).length})
                                                </span>
                                            </div>
                                        </div>
                                        {(() => {
                                            const contracts = ownerDetail?.contracts || renterDetail?.contracts || [];
                                            if (contracts.length === 0) return <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>Chưa có hợp đồng nào.</p>;
                                            
                                            return (
                                                <div className="space-y-2">
                                                    {contracts.map((c: any) => (
                                                        <div key={c.id} onClick={() => navigate(`/shared/contracts/${c.id}`)} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-[var(--color-border)] rounded-md cursor-pointer hover:border-[var(--color-primary)] transition-colors" style={{ background: 'var(--color-bg-secondary)' }}>
                                                            <div>
                                                                <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{c.warehouseName}</p>
                                                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>ID Yêu cầu: {c.requestId} • Ký: {c.signedDate}</p>
                                                            </div>
                                                            <div className="mt-2 sm:mt-0 sm:text-right flex items-center justify-between sm:block">
                                                                <p className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>{c.totalPrice?.toLocaleString()} ₫</p>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 mt-1 inline-block">{c.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* RENTAL REQUESTS CARD */}
                                {(ownerDetail || renterDetail) && (
                                    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
                                            <FileText className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                                                Yêu cầu thuê ({(ownerDetail?.rentalRequests || renterDetail?.rentalRequests || []).length})
                                            </span>
                                        </div>
                                        {(() => {
                                            const requests = ownerDetail?.rentalRequests || renterDetail?.rentalRequests || [];
                                            if (requests.length === 0) return <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>Chưa có yêu cầu thuê nào.</p>;
                                            
                                            return (
                                                <div className="space-y-2">
                                                    {requests.map((r: any) => (
                                                        <div key={r.id} onClick={() => navigate(`/shared/requests/${r.id}`)} className="p-3 border border-[var(--color-border)] rounded-md cursor-pointer hover:border-[var(--color-primary)] transition-colors" style={{ background: 'var(--color-bg-secondary)' }}>
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{r.warehouseName}</p>
                                                                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                                                                        <Package className="h-3 w-3" /> Hàng hóa: {r.cargoDescription}
                                                                    </p>
                                                                </div>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 shrink-0 ml-2">{r.status}</span>
                                                            </div>
                                                            <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex flex-wrap gap-4 text-xs">
                                                                <span style={{ color: 'var(--color-text-muted)' }}>Thời gian: <span className="font-medium text-[var(--color-text)]">{r.duration} {r.durationUnit}</span></span>
                                                                <span style={{ color: 'var(--color-text-muted)' }}>Chi tiết: <span className="font-medium text-[var(--color-text)]">{r.details?.length || 0} phân khu</span></span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                                </div>
                            )}
                            </div>
                        )}
                           </>
                       )}

                       {activeTab === 'activity' && (
                           <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md p-5 shadow-sm max-w-4xl">
                               {statsLoading ? (
                                   <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
                               ) : activityStats ? (
                                   <div>
                                       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-2 border-b border-[var(--color-border)] gap-2">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                                                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>
                                                    Hoạt động {activityStats.days} ngày qua
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                                                    Tổng: {activityStats.totalLoginsInPeriod} lượt
                                                </div>
                                                <select 
                                                    value={activityDays} 
                                                    onChange={e => setActivityDays(Number(e.target.value))}
                                                    className="border border-[var(--color-border)] rounded px-2 py-1 text-xs bg-[var(--color-bg)] outline-none"
                                                    style={{ color: 'var(--color-text)' }}
                                                >
                                                    <option value={7}>7 ngày</option>
                                                    <option value={14}>14 ngày</option>
                                                    <option value={30}>30 ngày</option>
                                                </select>
                                            </div>
                                       </div>
                                       {activityStats.chartData.length === 0 ? (
                                            <p className="text-xs text-center py-4 text-[var(--color-text-muted)]">Không có dữ liệu</p>
                                       ) : (
                                            <div className="h-[250px] w-full mt-4">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={activityStats.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                                        <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} tickMargin={10} minTickGap={20} />
                                                        <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                                                        <RechartsTooltip 
                                                            contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '4px', fontSize: '12px' }}
                                                            itemStyle={{ color: 'var(--color-text)' }}
                                                        />
                                                        <Line type="monotone" dataKey="logins" name="Đăng nhập" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                       )}
                                   </div>
                               ) : (
                                   <p className="text-xs text-center py-4 text-[var(--color-text-muted)]">Không thể tải dữ liệu</p>
                               )}
                           </div>
                       )}
                    </div>
                </div>
            )}
        </div>
    );
}
