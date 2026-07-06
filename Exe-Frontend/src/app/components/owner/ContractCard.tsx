import { CompositeContract, CompositeWarehouse } from "../../../types";
import { formatShortAddress } from "../../utils/addressFormat";
import {
  FileText,
  Clock,
  XCircle,
  Edit3,
  Trash2,
  Calendar,
  Package,
  DollarSign,
  Building,
  User,
  Hash,
  Snowflake,
  Upload,
  Phone,
} from "lucide-react";
import { fmtCurrency, fmtDate, STATUS_CFG } from "./ContractUtils";

export function ContractCard({
  contract,
  warehouse,
  onEdit,
  onCancel,
}: {
  contract: CompositeContract;
  warehouse: CompositeWarehouse | undefined;
  onEdit: (c: CompositeContract) => void;
  onCancel: (c: CompositeContract) => void;
}) {
  const cfg = STATUS_CFG[contract.status];
  const monthly = (contract.rentedCapacity || 0) * (contract.monthlyRate || 0);

  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-border)]"
      style={{ borderLeft: `3px solid ${cfg.color}` }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--color-border)]"
        style={{ background: "var(--color-bg-secondary)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 text-white"
            style={{ background: cfg.color }}
          >
            {cfg.icon} {cfg.label}
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            #{contract.contractRef}
          </span>
          {contract.inputMode === "pdf" && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 border border-[var(--color-border)]"
              style={{ color: "var(--color-text-muted)" }}
            >
              <Upload className="h-3 w-3" /> PDF
            </span>
          )}
        </div>
        {contract.sentAt && (
          <span
            className="text-[10px] shrink-0"
            style={{ color: "var(--color-text-muted)" }}
          >
            Gửi: {fmtDate(contract.sentAt)}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col md:flex-row gap-4">
        {/* Main info */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title */}
          <p
            className="font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            {contract.contractTitle ||
              (warehouse
                ? warehouse.name
                : `Kho #${(contract as any).id_warehouse}`)}
          </p>

          {/* Warehouse */}
          {warehouse && (
            <p
              className="text-xs flex items-center gap-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <Snowflake
                className="h-3 w-3"
                style={{ color: "var(--color-primary)" }}
              />
              {warehouse.name} — {formatShortAddress({
                province: warehouse.location_province,
                commune: warehouse.location_commune,
                locationAddressText: warehouse.location_address_text,
              })}
            </p>
          )}

          {/* Renter info */}
          <div className="flex flex-wrap gap-3 text-xs">
            {(contract.renter_legal_name ||
              contract.renterCompany) && (
              <span
                className="flex items-center gap-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <User className="h-3 w-3" />
                {contract.renter_legal_name ||
                  contract.renterCompany}
              </span>
            )}
            {contract.renter_tax_code && (
              <span
                className="flex items-center gap-1 font-mono"
                style={{ color: "var(--color-text-muted)" }}
              >
                <Hash className="h-3 w-3" /> MST:{" "}
                {contract.renter_tax_code}
              </span>
            )}
            {contract.renterPhone && (
              <span
                className="flex items-center gap-1 font-mono"
                style={{ color: "var(--color-text-muted)" }}
              >
                <Phone className="h-3 w-3" />
                {contract.renterPhone}
              </span>
            )}
            {contract.renterCompany &&
              contract.renter_legal_name && (
                <span
                  className="flex items-center gap-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <Building className="h-3 w-3" />{" "}
                  {contract.renterCompany}
                </span>
              )}
          </div>

          {/* Rejection note */}
          {contract.renterRejectionReason && (
            <div
              className="flex items-start gap-2 text-xs px-3 py-2"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              <XCircle
                className="h-3.5 w-3.5 shrink-0 mt-0.5"
                style={{ color: "var(--color-error)" }}
              />
              <span style={{ color: "var(--color-text)" }}>
                <strong style={{ color: "var(--color-error)" }}>
                  Từ chối:{" "}
                </strong>
                {contract.renterRejectionReason}
              </span>
            </div>
          )}

          {/* Chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span
              className="flex items-center gap-1 px-2 py-1 border border-[var(--color-border)]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <Package className="h-3 w-3" />{" "}
              {contract.rentedCapacity?.toLocaleString() || 0} m³
            </span>
            <span
              className="flex items-center gap-1 px-2 py-1 border border-[var(--color-border)]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <Calendar className="h-3 w-3" />{" "}
              {fmtDate(contract.start_at)} →{" "}
              {fmtDate(contract.end_at)}
            </span>
            {(contract.monthlyRate ?? 0) > 0 && (
              <span
                className="flex items-center gap-1 px-2 py-1 border"
                style={{
                  color: "var(--color-primary)",
                  borderColor: "var(--color-primary)",
                }}
              >
                <DollarSign className="h-3 w-3" />{" "}
                {fmtCurrency(contract.monthlyRate!)}/m³/tháng
              </span>
            )}
          </div>

          {/* PDF badge */}
          {contract.pdfFileName && (
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              <FileText
                className="h-3.5 w-3.5"
                style={{ color: "var(--color-primary)" }}
              />
              <span className="font-mono">
                {contract.pdfFileName}
              </span>
            </div>
          )}
        </div>

        {/* Right: price + actions */}
        <div className="md:w-44 shrink-0 flex flex-col gap-2">
          {(contract.monthlyRate ?? 0) > 0 && (
            <div
              className="p-3 border border-[var(--color-border)]"
              style={{ background: "var(--color-bg)" }}
            >
              <p
                className="text-[10px] uppercase tracking-wide mb-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                / Tháng
              </p>
              <p
                className="font-extrabold"
                style={{ color: "var(--color-primary)" }}
              >
                {fmtCurrency(monthly)}
              </p>
            </div>
          )}

          {/* Actions */}
          {(contract.status === "draft" ||
            contract.status === "pending_renter") && (
            <button
              onClick={() => onEdit(contract)}
              className="flex items-center justify-center gap-2 text-xs px-3 py-2 border transition-colors hover:border-[var(--color-primary)]"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              <Edit3 className="h-3.5 w-3.5" />
              {contract.status === "draft"
                ? "Chỉnh sửa"
                : "Chỉnh sửa & gửi lại"}
            </button>
          )}

          {contract.status === "pending_renter" && (
            <div
              className="flex items-center gap-1.5 text-[10px] px-2 py-1.5 border border-dashed"
              style={{
                borderColor: "#f59e0b",
                color: "#f59e0b",
              }}
            >
              <Clock className="h-3 w-3" />
              Đang chờ người thuê ký
            </div>
          )}

          {contract.status === "active" && (
            <button
              onClick={() => onCancel(contract)}
              className="flex items-center justify-center gap-2 text-xs px-3 py-2 border transition-colors"
              style={{
                borderColor: "var(--color-error)",
                color: "var(--color-error)",
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Huỷ HĐ
            </button>
          )}

          {contract.status === "draft" && (
            <div
              className="flex items-center gap-1.5 text-[10px] px-2 py-1.5 border border-dashed"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              <Edit3 className="h-3 w-3" /> Chưa gửi cho người
              thuê
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
