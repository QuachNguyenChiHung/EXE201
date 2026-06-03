import { CompositeContract } from "../../../types";
import { ClipboardList, Calendar, Package, DollarSign, Edit3 } from "lucide-react";

interface Props {
  contract: Partial<CompositeContract>;
  onChange: (key: keyof CompositeContract, val: any) => void;
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

export function CreateContractTerms({ contract, onChange }: Props) {
  return (
    <div className="p-6 border border-[var(--color-border)] bg-[var(--color-surface)]">
      <SectionHeader icon={<ClipboardList className="h-5 w-5" />} title="Chi tiết thuê & Điều khoản" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            <Field label="Đơn giá (VNĐ/tháng)" required>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  className={`${INPUT_CLS} pl-9`}
                  style={INPUT_STYLE}
                  placeholder="VD: 5000000"
                  value={contract.monthlyRate || ""}
                  onChange={(e) => onChange("monthlyRate", e.target.value)}
                />
              </div>
            </Field>
          </div>
        </div>

        {/* ── Terms ── */}
        <div className="space-y-4">
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
