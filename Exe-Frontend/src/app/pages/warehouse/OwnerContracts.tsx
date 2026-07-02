import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { getUser } from "../../../utils/auth";
import { ArrowLeft, FileText, Eye, Loader2, Edit3 } from "lucide-react";
import { ownerService } from "../../../services/ownerService";

const TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Đang chờ ký" },
  { key: "ACTIVE", label: "Đang hoạt động" },
  { key: "COMPLETED", label: "Đã hoàn thành" },
  { key: "CANCELED", label: "Đã hủy" },
];

export default function OwnerContracts() {
  const navigate = useNavigate();
  const user = getUser();
  
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchContracts = useCallback(async () => {
    if (!user || user.role !== "OWNER") return;
    setLoading(true);
    try {
      const res = await ownerService.getContracts(tab, page, 10);
      const list = Array.isArray(res) ? res : ((res as any)?.content || (res as any)?.data || (res as any)?.contracts || []);
      setContracts(list);
      if (res && !(Array.isArray(res))) {
        setTotalPages((res as any).totalPages || 0);
      } else {
        setTotalPages(1);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tab, page, user?.id_user, user?.role]);

  useEffect(() => {
    setPage(0);
  }, [tab]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    if (!user || user.role !== "OWNER") {
      navigate("/login");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <div className="bento-container">
        {/* Header */}
        <div className="bento-header">
          <button
            onClick={() => navigate("/warehouse")}
            className="flex items-center gap-1 text-sm mb-2 hover:underline transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 flex items-center justify-center shrink-0"
                style={{ background: "var(--color-primary)" }}>
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
                  Quản lý Hợp đồng
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  Quản lý tất cả hợp đồng cho thuê kho của bạn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)] mb-4 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(0); }}
              className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === t.key ? 'var(--color-primary)' : 'transparent',
                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: tab === t.key ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Table */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md overflow-hidden">
          {loading ? (
             <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
             </div>
          ) : contracts.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--color-text-muted)" }} />
              <p style={{ color: "var(--color-text-secondary)" }}>
                {tab === "ALL" 
                  ? "Bạn chưa có hợp đồng nào. Hợp đồng sẽ xuất hiện khi bạn tạo từ yêu cầu thuê." 
                  : "Không có hợp đồng nào trong mục này."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã HĐ</th>
                  <th className="px-4 py-3 font-semibold">Kho</th>
                  <th className="px-4 py-3 font-semibold">Bên thuê</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Ngày ký</th>
                  <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {contracts.map(c => (
                  <tr key={c.id} className="hover:bg-[var(--color-bg-secondary)]">
                    <td className="px-4 py-3 font-medium">#{c.id}</td>
                    <td className="px-4 py-3 font-medium">
                      {c.warehouseName || 'Không rõ'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {c.renterLegalName || 'Khách hàng'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold text-white uppercase ${
                        c.status === 'ACTIVE' ? 'bg-green-500' : 
                        c.status === 'CANCELED' ? 'bg-red-500' : 
                        c.status === 'COMPLETED' ? 'bg-blue-500' : 
                        c.status === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.startAt ? new Date(c.startAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => navigate(`/warehouse/contracts/edit/${c.id}`)}
                          className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                        >
                          <Edit3 className="h-4 w-4" /> Sửa
                        </button>
                        <button
                          onClick={() => navigate(`/shared/contracts/${c.id}`)}
                          className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                        >
                          <Eye className="h-4 w-4" /> Xem
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
