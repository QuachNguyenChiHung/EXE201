import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { getUser } from '../../../utils/auth';
import { ArrowLeft, BarChart3, Loader2, TrendingUp, Award, Star, Users as UsersIcon, Trash2 } from "lucide-react";
import {
  PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { employeeService } from "../../../services/employeeService";
import type { EmployeeTransactionDTO, TransactionAnalyticsSummaryDTO, RevenuePointDTO } from "../../../types/employee";

const TYPE_LABELS: Record<string, string> = {
  RENTAL_FEE: 'Phí thuê kho',
  SPONSOR_SUBSCRIPTION: 'Gói tài trợ',
  AI_SUBSCRIPTION: 'Gói AI',
};

const TYPE_COLORS: Record<string, string> = {
  RENTAL_FEE: '#2a78d6',
  SPONSOR_SUBSCRIPTION: '#eb6834',
  AI_SUBSCRIPTION: '#1baf7a',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Đang chờ', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  COMPLETED: { label: 'Hoàn thành', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  CANCELED: { label: 'Đã hủy', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  REFUNDED: { label: 'Đã hoàn tiền', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

const ROLE_LABELS: Record<string, string> = {
  RENTER: 'Người thuê',
  OWNER: 'Chủ kho',
  EMPLOYEE: 'Nhân viên',
};

function fmtCurrency(n: number | undefined | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function fmtDate(iso: string | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function extractErrorMessage(err: any, fallback: string): string {
  const msg = err?.response?.data?.message || err?.response?.data || err?.message || fallback;
  return typeof msg === 'string' ? msg : fallback;
}

export default function TransactionAnalytics() {
  const navigate = useNavigate();
  const user = getUser();

  // ── Summary (stat tiles + pie chart) ──────────────────────────────────────
  const [summary, setSummary] = useState<TransactionAnalyticsSummaryDTO | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const fetchSummary = useCallback(() => {
    setLoadingSummary(true);
    employeeService.getTransactionAnalyticsSummary()
      .then(setSummary)
      .catch((err) => toast.error(extractErrorMessage(err, 'Không thể tải dữ liệu phân tích giao dịch')))
      .finally(() => setLoadingSummary(false));
  }, []);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYEE") {
      navigate("/login");
      return;
    }
    fetchSummary();
  }, [user?.role, navigate, fetchSummary]);

  // ── Line chart (revenue over time) ────────────────────────────────────────
  const [granularity, setGranularity] = useState<'day' | 'month' | 'year'>('day');
  const [chartStartDate, setChartStartDate] = useState(() => daysAgoStr(29));
  const [chartEndDate, setChartEndDate] = useState(() => todayStr());
  const [revenuePoints, setRevenuePoints] = useState<RevenuePointDTO[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  const fetchChart = useCallback(() => {
    setLoadingChart(true);
    employeeService.getTransactionRevenueTimeseries(granularity, chartStartDate, chartEndDate)
      .then(setRevenuePoints)
      .catch((err) => toast.error(extractErrorMessage(err, 'Không thể tải dữ liệu doanh thu theo thời gian')))
      .finally(() => setLoadingChart(false));
  }, [granularity, chartStartDate, chartEndDate]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  // ── Raw transaction table ─────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<EmployeeTransactionDTO[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [tableStartDate, setTableStartDate] = useState("");
  const [tableEndDate, setTableEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTransactions = useCallback(() => {
    setLoadingTable(true);
    employeeService.getAllTransactions({
      type: typeFilter !== 'ALL' ? typeFilter : undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      buyerRole: roleFilter !== 'ALL' ? roleFilter : undefined,
      startDate: tableStartDate || undefined,
      endDate: tableEndDate || undefined,
      page,
      size: 10,
    })
      .then(res => {
        setTransactions(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      })
      .catch((err) => toast.error(extractErrorMessage(err, 'Không thể tải danh sách giao dịch')))
      .finally(() => setLoadingTable(false));
  }, [typeFilter, statusFilter, roleFilter, tableStartDate, tableEndDate, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const setFilter = useCallback(<T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  }, []);

  // Soft-deletes a transaction (backend marks it DELETED) — it then drops out
  // of every metric on this page too, so the summary tiles/charts need a
  // refetch alongside the table, not just a local row removal.
  const handleDelete = useCallback((tx: EmployeeTransactionDTO) => {
    if (!confirm(`Xóa giao dịch #${tx.id}? Giao dịch sẽ không còn hiển thị hoặc được tính vào số liệu thống kê. Hành động này không thể hoàn tác.`)) {
      return;
    }
    setDeletingId(tx.id);
    employeeService.deleteTransaction(tx.id)
      .then(() => {
        toast.success(`Đã xóa giao dịch #${tx.id}`);
        fetchTransactions();
        fetchSummary();
        fetchChart();
      })
      .catch((err) => toast.error(extractErrorMessage(err, 'Không thể xóa giao dịch')))
      .finally(() => setDeletingId(null));
  }, [fetchTransactions, fetchSummary, fetchChart]);

  const statTiles = useMemo(() => [
    {
      label: 'Dịch vụ doanh thu cao nhất',
      value: summary ? (TYPE_LABELS[summary.topServiceType] ?? summary.topServiceType ?? '—') : '—',
      sub: summary ? fmtCurrency(summary.topServiceRevenue) : '',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'var(--color-primary)',
    },
    {
      label: 'Loại giao dịch phổ biến nhất',
      value: summary ? (TYPE_LABELS[summary.mostCommonType] ?? summary.mostCommonType ?? '—') : '—',
      sub: summary ? `${summary.mostCommonTypeCount} giao dịch` : '',
      icon: <BarChart3 className="h-5 w-5" />,
      color: '#0891b2',
    },
    {
      label: 'Giao dịch lớn nhất',
      value: summary?.highestTransaction ? fmtCurrency(summary.highestTransaction.amount) : 'Chưa có dữ liệu',
      sub: summary?.highestTransaction
        ? `${summary.highestTransaction.buyerName ?? ''} · ${TYPE_LABELS[summary.highestTransaction.type] ?? summary.highestTransaction.type}`
        : '',
      icon: <Award className="h-5 w-5" />,
      color: '#eab308',
    },
    {
      label: 'Nhóm chi tiêu nhiều nhất',
      value: summary ? (ROLE_LABELS[summary.topSpendingRole] ?? summary.topSpendingRole ?? '—') : '—',
      sub: summary ? fmtCurrency(summary.topSpendingRoleAmount) : '',
      icon: <UsersIcon className="h-5 w-5" />,
      color: '#7c3aed',
    },
  ], [summary]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <div className="bento-container">
        <div className="bento-header">
          <button
            onClick={() => navigate("/employee")}
            className="flex items-center gap-1 text-sm mb-2 hover:underline transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 flex items-center justify-center shrink-0"
              style={{ background: "#0891b2" }}>
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
                Phân tích Giao dịch
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                Thống kê doanh thu và toàn bộ giao dịch trên hệ thống
              </p>
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)] mb-8">
          {statTiles.map(s => (
            <div key={s.label} className="bg-[var(--color-surface)] p-6 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1 truncate">{s.label}</p>
                <p className="text-xl font-extrabold truncate" style={{ color: 'inherit' }}>
                  {loadingSummary ? '…' : s.value}
                </p>
                {s.sub && (
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{loadingSummary ? '' : s.sub}</p>
                )}
              </div>
              <div className="w-10 h-10 flex items-center justify-center text-white shrink-0 ml-3"
                style={{ background: s.color }}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Pie chart */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Doanh thu theo loại giao dịch
            </h3>
            {loadingSummary ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : !summary || summary.revenueByType.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chưa có dữ liệu.</p>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.revenueByType}
                      dataKey="totalAmount"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ percentage }) => `${(percentage ?? 0).toFixed(1)}%`}
                    >
                      {summary.revenueByType.map((entry) => (
                        <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Legend formatter={(value: string) => TYPE_LABELS[value] ?? value} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '4px', fontSize: '13px' }}
                      itemStyle={{ color: 'var(--color-text)' }}
                      formatter={(value: number, _name: string, item: any) => [fmtCurrency(value), TYPE_LABELS[item?.payload?.type] ?? item?.payload?.type]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Line chart */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Tăng trưởng doanh thu theo thời gian
            </h3>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex border border-[var(--color-border)] rounded overflow-hidden">
                {([
                  { key: 'day', label: 'Ngày' },
                  { key: 'month', label: 'Tháng' },
                  { key: 'year', label: 'Năm' },
                ] as const).map(g => (
                  <button
                    key={g.key}
                    onClick={() => setGranularity(g.key)}
                    className="px-3 py-1.5 text-xs font-medium transition-colors"
                    style={granularity === g.key
                      ? { background: 'var(--color-primary)', color: '#fff' }
                      : { background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={chartStartDate}
                  max={chartEndDate}
                  onChange={(e) => setChartStartDate(e.target.value)}
                  className="px-2 py-1.5 rounded border text-xs focus:outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>đến</span>
                <input
                  type="date"
                  value={chartEndDate}
                  min={chartStartDate}
                  max={todayStr()}
                  onChange={(e) => setChartEndDate(e.target.value)}
                  className="px-2 py-1.5 rounded border text-xs focus:outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            {loadingChart ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : revenuePoints.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chưa có dữ liệu.</p>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenuePoints} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="bucketLabel" stroke="var(--color-text-muted)" fontSize={12} tickMargin={10} minTickGap={30} />
                    <YAxis
                      stroke="var(--color-text-muted)"
                      fontSize={12}
                      tickFormatter={(value: number) => (value / 1000).toLocaleString('vi-VN')}
                      label={{ value: 'Nghìn VNĐ', angle: -90, position: 'insideLeft', fill: 'var(--color-text-muted)', fontSize: 12 }}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '4px', fontSize: '13px' }}
                      itemStyle={{ color: 'var(--color-text)' }}
                      formatter={(value: number, name: string) => [fmtCurrency(value), name]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="renterAmount" name="Người thuê" stroke="#2a78d6" strokeWidth={2} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="ownerAmount" name="Chủ kho" stroke="#eb6834" strokeWidth={2} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="totalAmount" name="Tổng cộng" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Raw transaction table */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Tất cả giao dịch ({totalElements})
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setFilter(setTypeFilter)(e.target.value)}
                className="px-3 py-1.5 rounded border text-sm focus:outline-none focus:ring-2"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                <option value="ALL">Tất cả loại</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setFilter(setStatusFilter)(e.target.value)}
                className="px-3 py-1.5 rounded border text-sm focus:outline-none focus:ring-2"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={roleFilter}
                onChange={(e) => setFilter(setRoleFilter)(e.target.value)}
                className="px-3 py-1.5 rounded border text-sm focus:outline-none focus:ring-2"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                <option value="ALL">Tất cả vai trò</option>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                type="date"
                value={tableStartDate}
                onChange={(e) => setFilter(setTableStartDate)(e.target.value)}
                className="px-2 py-1.5 rounded border text-sm focus:outline-none"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
              />
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>đến</span>
              <input
                type="date"
                value={tableEndDate}
                onChange={(e) => setFilter(setTableEndDate)(e.target.value)}
                className="px-2 py-1.5 rounded border text-sm focus:outline-none"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
              />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md overflow-hidden">
          {loadingTable ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-10 text-center">
              <p style={{ color: "var(--color-text-secondary)" }}>Chưa có giao dịch nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Người mua</th>
                    <th className="px-4 py-3 font-semibold">Vai trò</th>
                    <th className="px-4 py-3 font-semibold">Loại giao dịch</th>
                    <th className="px-4 py-3 font-semibold">Số tiền</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                    <th className="px-4 py-3 font-semibold">Mô tả</th>
                    <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {transactions.map(tx => {
                    const statusCfg = STATUS_CONFIG[tx.status] ?? { label: tx.status, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
                    const isDeleting = deletingId === tx.id;
                    return (
                      <tr key={tx.id} className="hover:bg-[var(--color-bg-secondary)]">
                        <td className="px-4 py-3 font-medium">#{tx.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{tx.buyerName}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{tx.buyerEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                            {ROLE_LABELS[tx.buyerRole] ?? tx.buyerRole}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {TYPE_LABELS[tx.type] ?? tx.type}
                        </td>
                        <td className="px-4 py-3 font-bold" style={{ color: 'var(--color-primary)' }}>
                          {fmtCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{ color: statusCfg.color, background: statusCfg.bg }}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {fmtDate(tx.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {tx.description ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(tx)}
                            disabled={isDeleting}
                            title="Xóa giao dịch"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
                          >
                            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
              <span className="text-sm text-[var(--color-text-secondary)]">
                Trang {page + 1} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
