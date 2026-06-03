import { FileText, X } from "lucide-react";
import { CompositeContract } from "../../../types";

interface Props {
  contract: Partial<CompositeContract>;
  onClose: () => void;
}

export function CreateContractPreviewModal({ contract, onClose }: Props) {
  const capacity = Number(contract.rentedCapacity) || 0;
  const rate = Number(contract.monthlyRate) || 0;
  const months =
    contract.start_at && contract.end_at
      ? Math.max(1, Math.ceil((new Date(contract.end_at).getTime() - new Date(contract.start_at).getTime()) / (30 * 86400000)))
      : 0;

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("vi-VN") : "___");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] my-4 relative">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]"
          style={{ background: "var(--color-primary)" }}
        >
          <div className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5" />
            <span className="font-semibold">Xem trước hợp đồng</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-sm" style={{ color: "var(--color-text)", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
          {/* Title */}
          <div className="text-center pb-4 border-b border-[var(--color-border)]">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
              Độc lập – Tự do – Hạnh phúc
            </p>
            <h2 className="text-base font-bold uppercase" style={{ color: "var(--color-text)" }}>
              {contract.contractTitle || "HỢP ĐỒNG THUÊ KHO LẠNH"}
            </h2>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-[var(--color-border)]" style={{ background: "var(--color-bg-secondary)" }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--color-primary)" }}>
                BÊN A — CHỦ KHO
              </p>
              <dl className="space-y-1.5 text-xs">
                <div className="flex gap-2">
                  <dt style={{ color: "var(--color-text-muted)", minWidth: 80 }}>Tên:</dt>
                  <dd className="font-semibold">{contract.owner_legal_name || "___"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt style={{ color: "var(--color-text-muted)", minWidth: 80 }}>MST:</dt>
                  <dd className="font-mono">{contract.owner_tax_code || "___"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt style={{ color: "var(--color-text-muted)", minWidth: 80 }}>Địa chỉ:</dt>
                  <dd>{contract.owner_address || "___"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt style={{ color: "var(--color-text-muted)", minWidth: 80 }}>ĐT:</dt>
                  <dd>{contract.owner_phone || "___"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt style={{ color: "var(--color-text-muted)", minWidth: 80 }}>Email:</dt>
                  <dd>{contract.owner_email || "___"}</dd>
                </div>
              </dl>
            </div>
            <div className="p-4 border border-[var(--color-border)]" style={{ background: "var(--color-bg-secondary)" }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--color-success, #22c55e)" }}>
                BÊN B — NGƯỜI THUÊ
              </p>
              <dl className="space-y-1.5 text-xs">
                <div className="flex gap-2">
                  <dt style={{ color: "var(--color-text-muted)", minWidth: 80 }}>Tên:</dt>
                  <dd className="font-semibold">{contract.renter_legal_name || "___"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt style={{ color: "var(--color-text-muted)", minWidth: 80 }}>MST:</dt>
                  <dd className="font-mono">{contract.renter_tax_code || "___"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt style={{ color: "var(--color-text-muted)", minWidth: 80 }}>Địa chỉ:</dt>
                  <dd>{contract.renter_address || "___"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt style={{ color: "var(--color-text-muted)", minWidth: 80 }}>ĐT:</dt>
                  <dd>{contract.renter_phone || "___"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt style={{ color: "var(--color-text-muted)", minWidth: 80 }}>Email:</dt>
                  <dd>{contract.renter_email || "___"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Details */}
          <div>
            <h3 className="font-bold mb-3 border-b border-[var(--color-border)] pb-2">I. CHI TIẾT DỊCH VỤ</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium">Thời hạn thuê:</span> Từ {fmtDate(contract.start_at)} đến {fmtDate(contract.end_at)}
              </li>
              <li>
                <span className="font-medium">Dung lượng thuê:</span> {capacity > 0 ? `${capacity} m³` : "Chưa xác định"}
              </li>
              <li>
                <span className="font-medium">Đơn giá:</span> {fmtCurrency(rate)} / tháng
              </li>
              <li>
                <span className="font-medium">Tổng giá trị dự kiến:</span> {months > 0 ? fmtCurrency(rate * months) : "___"} ({months} tháng)
              </li>
              <li>
                <span className="font-medium">Loại hàng lưu trữ:</span> {contract.cargo_description || "___"}
              </li>
            </ul>
          </div>

          {/* Terms */}
          <div>
            <h3 className="font-bold mb-3 border-b border-[var(--color-border)] pb-2">II. ĐIỀU KHOẢN KÈM THEO</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium">Thanh toán:</span> {contract.payment_term || "Theo thỏa thuận"}
              </li>
              <li>
                <span className="font-medium">Quy định phạt:</span> {contract.penalty_clause || "Không có"}
              </li>
              <li>
                <span className="font-medium">Điều khoản khác:</span> {contract.special_term || "Không có"}
              </li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-[var(--color-border)] text-center pb-8">
            <div>
              <p className="font-bold">ĐẠI DIỆN BÊN A</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                (Ký, ghi rõ họ tên)
              </p>
            </div>
            <div>
              <p className="font-bold">ĐẠI DIỆN BÊN B</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                (Ký, ghi rõ họ tên)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
