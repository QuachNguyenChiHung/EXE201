import { CompositeContract } from "../../../types";
import { ClipboardList, Calendar, Package, DollarSign, Edit3 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar as CalendarComponent } from "../ui/calendar";

interface Props {
  contract: Partial<CompositeContract>;
  onChange: (key: keyof CompositeContract, val: any) => void;
  request?: any;
  readOnly?: boolean;
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

const INPUT_CLS = "w-full h-9 px-3 text-sm border focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const INPUT_STYLE = { borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" };
const TEXTAREA_CLS = "w-full px-3 py-2 text-sm border resize-none focus:outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function CreateContractTerms({ contract, onChange, request, readOnly = false }: Props) {
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
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={`${INPUT_CLS} pl-9 text-left flex items-center w-full disabled:cursor-not-allowed`}
                      style={INPUT_STYLE}
                      disabled={readOnly}
                    >
                      {contract.start_at ? format(parseISO(contract.start_at), "dd/MM/yyyy") : <span className="text-gray-400">dd/mm/yyyy</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={contract.start_at ? parseISO(contract.start_at) : undefined}
                      onSelect={(date) => onChange("start_at", date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </Field>
            <Field label="Ngày kết thúc" required>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={`${INPUT_CLS} pl-9 text-left flex items-center w-full disabled:cursor-not-allowed`}
                      style={INPUT_STYLE}
                      disabled={readOnly}
                    >
                      {contract.end_at ? format(parseISO(contract.end_at), "dd/MM/yyyy") : <span className="text-gray-400">dd/mm/yyyy</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={contract.end_at ? parseISO(contract.end_at) : undefined}
                      onSelect={(date) => onChange("end_at", date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {request && contract.start_at && !readOnly && (
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
                disabled={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
                />
              </div>
              {(() => {
                if (!request || readOnly) return null;
                const ownerOffer = request.offeredPrice;
                
                let defaultExpected = 0;
                if (request.details) {
                  const totalMonthly = request.details.reduce((acc: number, d: any) => acc + ((d.rentedArea || 0) * (d.priceTierValue || 0)), 0);
                  const isYears = request.durationUnit === 'YEARS' || request.durationUnit === 'Năm';
                  const durationMultiplier = isYears ? ((request.duration || 1) * 12) : (request.duration || 1);
                  defaultExpected = totalMonthly * durationMultiplier;
                }
                
                if (!ownerOffer && !defaultExpected) return null;
                return (
                  <div className="mt-2 flex flex-col gap-2 text-xs">
                    {defaultExpected > 0 && (
                      <button
                        type="button"
                        onClick={() => onChange("monthlyRate", defaultExpected)}
                        className="px-2 py-1.5 rounded border transition-colors cursor-pointer text-left"
                        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text)' }}
                      >
                        <span className="font-semibold block">Chọn giá gốc dự kiến: {defaultExpected.toLocaleString()} VNĐ</span>
                      </button>
                    )}
                    {ownerOffer != null && (
                      <button
                        type="button"
                        onClick={() => onChange("monthlyRate", ownerOffer)}
                        className="px-2 py-1.5 rounded border transition-colors cursor-pointer text-left"
                        style={{ borderColor: 'rgba(37, 99, 235, 0.3)', background: 'rgba(37, 99, 235, 0.05)', color: 'var(--color-primary)' }}
                      >
                        <span className="font-semibold block">Chọn giá bạn đã chốt: {ownerOffer.toLocaleString()} VNĐ</span>
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
              disabled={readOnly}
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
              disabled={readOnly}
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
              disabled={readOnly}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
