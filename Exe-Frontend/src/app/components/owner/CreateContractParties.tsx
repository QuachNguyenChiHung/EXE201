import { CompositeContract } from "../../../types";
import { User, Building, MapPin, Phone, Mail, Hash } from "lucide-react";

interface Props {
  contract: Partial<CompositeContract>;
  onChange: (key: keyof CompositeContract, val: any) => void;
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

export function CreateContractParties({ contract, onChange, readOnly = false }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ── Party A ── */}
      <div className="p-6 border border-[var(--color-border)] bg-[var(--color-surface)]">
        <SectionHeader icon={<Building className="h-5 w-5" />} title="Bên A — Chủ Kho (Bên cho thuê)" />
        <div className="space-y-4">
          <Field label="Tên công ty / Cá nhân" required>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className={`${INPUT_CLS} pl-9`}
                style={INPUT_STYLE}
                placeholder="VD: CÔNG TY TNHH LOGICHA"
                value={contract.owner_legal_name || ""}
                onChange={(e) => onChange("owner_legal_name", e.target.value)}
                disabled={readOnly}
              />
            </div>
          </Field>
          <Field label="Mã số thuế" required>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className={`${INPUT_CLS} pl-9`}
                style={INPUT_STYLE}
                placeholder="VD: 0312345678"
                value={contract.owner_tax_code || ""}
                onChange={(e) => onChange("owner_tax_code", e.target.value)}
                disabled={readOnly}
              />
            </div>
          </Field>
          <Field label="Địa chỉ trụ sở">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className={`${INPUT_CLS} pl-9`}
                style={INPUT_STYLE}
                placeholder="Địa chỉ công ty bên A"
                value={contract.owner_address || ""}
                onChange={(e) => onChange("owner_address", e.target.value)}
                disabled={readOnly}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Số điện thoại">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className={`${INPUT_CLS} pl-9`}
                  style={INPUT_STYLE}
                  placeholder="09xx..."
                  value={contract.owner_phone || ""}
                  onChange={(e) => onChange("owner_phone", e.target.value)}
                  disabled={readOnly}
                />
              </div>
            </Field>
            <Field label="Email liên hệ">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  className={`${INPUT_CLS} pl-9`}
                  style={INPUT_STYLE}
                  placeholder="email@bena.com"
                  value={contract.owner_email || ""}
                  onChange={(e) => onChange("owner_email", e.target.value)}
                  disabled={readOnly}
                />
              </div>
            </Field>
          </div>
        </div>
      </div>

      {/* ── Party B ── */}
      <div className="p-6 border border-[var(--color-border)] bg-[var(--color-surface)]">
        <SectionHeader icon={<User className="h-5 w-5" />} title="Bên B — Người Thuê" />
        <div className="space-y-4">
          <Field label="Tên công ty / Cá nhân" required>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className={`${INPUT_CLS} pl-9`}
                style={INPUT_STYLE}
                placeholder="VD: NGUYEN VAN A"
                value={contract.renter_legal_name || ""}
                onChange={(e) => onChange("renter_legal_name", e.target.value)}
                disabled={readOnly}
              />
            </div>
          </Field>
          <Field label="Mã số thuế" required>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className={`${INPUT_CLS} pl-9`}
                style={INPUT_STYLE}
                placeholder="VD: 8312345678"
                value={contract.renter_tax_code || ""}
                onChange={(e) => onChange("renter_tax_code", e.target.value)}
                disabled={readOnly}
              />
            </div>
          </Field>
          <Field label="Địa chỉ">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className={`${INPUT_CLS} pl-9`}
                style={INPUT_STYLE}
                placeholder="Địa chỉ công ty/cá nhân bên B"
                value={contract.renter_address || ""}
                onChange={(e) => onChange("renter_address", e.target.value)}
                disabled={readOnly}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Số điện thoại">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className={`${INPUT_CLS} pl-9`}
                  style={INPUT_STYLE}
                  placeholder="09xx..."
                  value={contract.renter_phone || ""}
                  onChange={(e) => onChange("renter_phone", e.target.value)}
                  disabled={readOnly}
                />
              </div>
            </Field>
            <Field label="Email liên hệ">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  className={`${INPUT_CLS} pl-9`}
                  style={INPUT_STYLE}
                  placeholder="email@benb.com"
                  value={contract.renter_email || ""}
                  onChange={(e) => onChange("renter_email", e.target.value)}
                  disabled={readOnly}
                />
              </div>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
