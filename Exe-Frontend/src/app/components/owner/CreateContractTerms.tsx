import { CompositeContract } from "../../../types";
import { ClipboardList, Calendar, Package, DollarSign, Edit3 } from "lucide-react";

interface Props {
  contract: Partial<CompositeContract>;
  onChange: (key: keyof CompositeContract, val: any) => void;
  request?: any;
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
      <span style={{ color: "var(--color-primary)" }}>{icon}</span>
      <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-text)" }}>
        {title}
      </span>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
        {label}
        {required && <span className="ml-1" style={{ color: "var(--color-error)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS = "w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors";
const INPUT_STYLE = { borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" };
const TEXTAREA_CLS = "w-full px-3 py-2 text-sm border resize-none focus:outline-none focus:border-[var(--color-primary)] transition-colors";

export function CreateContractTerms({ contract, onChange, request }: Props) {
  return (
    <div className="space-y-6">
      {/* ── Details ── */}
      <div className="p-6 border border-[var(--color-border)] bg-[var(--color-surface)]">
        <SectionHeader icon={<ClipboardList className="h-5 w-5" />} title="Chi tiết thuê" />
        {/* ── Details ── */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ngày bắt đầu" required>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  className={`${INPUT_CLS} pl-9`}
                  style={INPUT_STYLE}
                  value={contract.start_at || ""}
                  onChange={(e) => onChange("start_at", e.target.value)}
                />
              </div>
            </Field>
            <Field label="Ngày kết thúc" required>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  className={`${INPUT_CLS} pl-9`}
                  style={INPUT_STYLE}
                  value={contract.end_at || ""}
                  onChange={(e) => onChange("end_at", e.target.value)}
                  min={contract.start_at}
                />
              </div>
              {request && contract.start_at && (
                <div className="mt-2 flex">
                  <button
                    type="button"
                    onClick={() => {
                      const start = new Date(contract.start_at!);
                      if (isNaN(start.getTime())) return;
                      const duration = request.duration || 1;
                      const unit = (request.durationUnit || '').toUpperCase();
                      if (unit.includes('YEAR') || unit === 'NĂM') {
                        start.setFullYear(start.getFullYear() + duration);
                      } else {
                        start.setMonth(start.getMonth() + duration);
                      }
                      const yyyy = start.getFullYear();
                      const mm = String(start.getMonth() + 1).padStart(2, '0');
                      const dd = String(start.getDate()).padStart(2, '0');
                      onChange("end_at", `${yyyy}-${mm}-${dd}`);
                    }}
                    className="text-[11px] px-2 py-1 rounded transition-colors text-left"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-primary)', background: 'rgba(37,99,235,0.05)' }}
                  >
                    + Tự động tính ({request.duration} {request.durationUnit === 'MONTHS' || request.durationUnit === 'MONTH' ? 'tháng' : request.durationUnit === 'YEARS' || request.durationUnit === 'YEAR' ? 'năm' : request.durationUnit})
                  </button>
                </div>
              )}
            </Field>
          </div>
          <Field label="Loại hàng hóa lưu trữ">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Package className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className={`${INPUT_CLS} pl-9`}
                style={INPUT_STYLE}
                placeholder="VD: Hải sản đông lạnh, Dược phẩm..."
                value={contract.cargo_description || ""}
                onChange={(e) => onChange("cargo_description", e.target.value)}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mức dung lượng thuê (tùy chọn)">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xs">m³</span>
                </div>
                <input
                  type="number"
                  className={`${INPUT_CLS} pr-8`}
                  style={INPUT_STYLE}
                  placeholder="VD: 50"
                  value={contract.rentedCapacity || ""}
                  onChange={(e) => onChange("rentedCapacity", e.target.value)}
                />
              </div>
            </Field>
            <Field label="Tổng giá trị hợp đồng (VNĐ)" required>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className={`${INPUT_CLS} pl-9`}
                  style={INPUT_STYLE}
                  placeholder="VD: 5,000,000"
                  value={contract.monthlyRate ? Number(contract.monthlyRate).toLocaleString('en-US') : ""}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/,/g, '');
                    const numValue = parseInt(rawValue, 10);
                    onChange("monthlyRate", isNaN(numValue) ? "" : numValue);
                  }}
                />
              </div>
              {(() => {
                if (!request) return null;
                const ownerOffer = request.offeredPrice;
                const renterOffer = request.renterOfferedPrice;
                
                if (!ownerOffer && !renterOffer) return null;
                return (
                  <div className="mt-2 flex flex-col gap-2 text-xs">
                    {ownerOffer != null && (
                      <button
                        type="button"
                        onClick={() => onChange("monthlyRate", ownerOffer)}
                        className="px-2 py-1.5 rounded border transition-colors cursor-pointer text-left"
                        style={{ borderColor: 'rgba(37, 99, 235, 0.3)', background: 'rgba(37, 99, 235, 0.05)', color: 'var(--color-primary)' }}
                      >
                        <span className="font-semibold block">Chọn giá của bạn: {ownerOffer.toLocaleString()} VNĐ</span>
                      </button>
                    )}
                    {renterOffer != null && (
                      <button
                        type="button"
                        onClick={() => onChange("monthlyRate", renterOffer)}
                        className="px-2 py-1.5 rounded border transition-colors cursor-pointer text-left"
                        style={{ borderColor: 'rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.05)', color: 'var(--color-success, #22c55e)' }}
                      >
                        <span className="font-semibold block">Chọn giá khách đề xuất: {renterOffer.toLocaleString()} VNĐ</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            </Field>
          </div>
        </div>
      </div>

      {/* ── Terms ── */}
      <div className="p-6 border border-[var(--color-border)] bg-[var(--color-surface)]">
        <SectionHeader icon={<Edit3 className="h-5 w-5" />} title="Điều khoản hợp đồng" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Điều khoản thanh toán">
            <textarea
              className={TEXTAREA_CLS}
              style={INPUT_STYLE}
              rows={2}
              placeholder="VD: Thanh toán vào mùng 1 đến mùng 5 hàng tháng."
              value={contract.payment_term || ""}
              onChange={(e) => onChange("payment_term", e.target.value)}
            />
          </Field>
          <Field label="Quy định phạt">
            <textarea
              className={TEXTAREA_CLS}
              style={INPUT_STYLE}
              rows={2}
              placeholder="VD: Trễ hạn thanh toán chịu phạt 1%/ngày."
              value={contract.penalty_clause || ""}
              onChange={(e) => onChange("penalty_clause", e.target.value)}
            />
          </Field>
          <Field label="Điều khoản đặc biệt">
            <textarea
              className={TEXTAREA_CLS}
              style={INPUT_STYLE}
              rows={2}
              placeholder="Ghi chú thêm các ràng buộc khác (nếu có)..."
              value={contract.special_term || ""}
              onChange={(e) => onChange("special_term", e.target.value)}
            />
          </Field>
          <Field label="Ghi chú nội bộ">
            <div className="relative">
              <div className="absolute top-2.5 left-3 pointer-events-none">
                <Edit3 className="h-4 w-4 text-gray-400" />
              </div>
              <textarea
                className={`${TEXTAREA_CLS} pl-9`}
                style={INPUT_STYLE}
                rows={2}
                placeholder="Ghi chú riêng cho chủ kho..."
                value={contract.notes || ""}
                onChange={(e) => onChange("notes", e.target.value)}
              />
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}
