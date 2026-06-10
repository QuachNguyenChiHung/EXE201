import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { useApp } from '../../../context/AppContext';
import { ArrowLeft, FileText, Eye, Loader2 } from "lucide-react";
import { employeeService } from "../../../services/employeeService";

export default function ManageContracts() {
  const navigate = useNavigate();
  const { user } = useApp();
  
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (!user || user.role !== "EMPLOYEE") {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    setLoading(true);
    employeeService.getContracts(statusFilter)
      .then(res => setContracts(res))
      .catch(err => console.error("Failed to fetch contracts:", err))
      .finally(() => setLoading(false));
  }, [statusFilter]);

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
              style={{ background: "var(--color-primary)" }}>
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
                Quản lý Hợp đồng
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                Quản lý toàn bộ {contracts.length} hợp đồng trên hệ thống
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-end">
             <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded border text-sm focus:outline-none focus:ring-2"
                  style={{ 
                    background: "var(--color-surface)", 
                    borderColor: "var(--color-border)", 
                    color: "var(--color-text)" 
                  }}
                >
                  <option value="ALL">Tất cả</option>
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="CANCELED">Đã hủy (CANCELED)</option>
                  <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
                </select>
             </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md overflow-hidden">
          {loading ? (
             <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-primary)" }} />
             </div>
          ) : contracts.length === 0 ? (
            <div className="p-10 text-center">
              <p style={{ color: "var(--color-text-secondary)" }}>Chưa có hợp đồng nào.</p>
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
                      {c.renterName || 'Khách hàng'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold text-white uppercase ${c.status === 'ACTIVE' ? 'bg-green-500' : c.status === 'CANCELED' ? 'bg-red-500' : c.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-gray-500'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.signedDate ? new Date(c.signedDate).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/employee/contracts/${c.id}`)}
                        className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                      >
                        <Eye className="h-4 w-4" /> Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
