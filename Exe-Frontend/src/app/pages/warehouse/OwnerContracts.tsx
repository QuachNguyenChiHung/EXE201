import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";

import { useApp } from "../../../context/AppContext";
import { CompositeContract, CompositeWarehouse } from "../../../types";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Edit3,
  Eye,
  Trash2,
  Calendar,
  Package,
  DollarSign,
  Building,
  User,
  Hash,
  Snowflake,
  ArrowLeft,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
const fmtDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
  CompositeContract["status"],
  {
    label: string;
    color: string;
    icon: React.ReactNode;
  }
> = {
  draft: {
    label: "Bản nháp",
    color: "var(--color-text-muted)",
    icon: <Edit3 className="h-3.5 w-3.5" />,
  },
  pending_renter: {
    label: "Chờ người thuê ký",
    color: "#f59e0b",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  active: {
    label: "Đang hiệu lực",
    color: "var(--color-success, #22c55e)",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  expiring_soon: {
    label: "Sắp hết hạn",
    color: "#f97316",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  expired: {
    label: "Đã hết hạn",
    color: "var(--color-text-muted)",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Đã huỷ",
    color: "var(--color-error, #ef4444)",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

type FilterTab = "all" | CompositeContract["status"];
const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "draft", label: "Bản nháp" },
  { key: "pending_renter", label: "Chờ ký" },
  { key: "active", label: "Đang hiệu lực" },
  { key: "expiring_soon", label: "Sắp hết hạn" },
  { key: "expired", label: "Đã hết hạn" },
  { key: "cancelled", label: "Đã huỷ" },
];

// ── Cancel confirm modal ──────────────────────────────────────────────────────
function CancelModal({
  contractRef,
  onConfirm,
  onClose,
}: {
  contractRef: string;
  onConfirm: (note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)]">
        <div
          className="px-5 py-4 border-b border-[var(--color-border)]"
          style={{ background: "var(--color-bg-secondary)" }}
        >
          <p
            className="font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            Huỷ hợp đồng
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Mã HĐ:{" "}
            <span className="font-mono">{contractRef}</span>
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div
            className="flex items-start gap-2 text-sm px-3 py-2.5"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <AlertTriangle
              className="h-4 w-4 shrink-0 mt-0.5"
              style={{ color: "var(--color-error)" }}
            />
            <span style={{ color: "var(--color-text)" }}>
              Hành động này không thể hoàn tác. Hợp đồng sẽ
              chuyển sang trạng thái "Đã huỷ".
            </span>
          </div>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Lý do huỷ
            </label>
            <textarea
              rows={3}
              className="w-full text-sm px-3 py-2 border resize-none focus:outline-none focus:border-[var(--color-error)] transition-colors"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
              }}
              placeholder="Nhập lý do huỷ hợp đồng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(note)}
            className="flex-1 py-2.5 text-sm text-white transition-colors"
            style={{
              background: "var(--color-error, #ef4444)",
            }}
          >
            Xác nhận huỷ HĐ
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contract card ─────────────────────────────────────────────────────────────
function ContractCard({
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
  const monthly =
    contract.rentedCapacity * contract.monthlyRate;

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
              {warehouse.name} · {warehouse.location.city}
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
              {contract.rentedCapacity.toLocaleString()} m³
            </span>
            <span
              className="flex items-center gap-1 px-2 py-1 border border-[var(--color-border)]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <Calendar className="h-3 w-3" />{" "}
              {fmtDate(contract.start_at)} →{" "}
              {fmtDate(contract.end_at)}
            </span>
            {contract.monthlyRate > 0 && (
              <span
                className="flex items-center gap-1 px-2 py-1 border"
                style={{
                  color: "var(--color-primary)",
                  borderColor: "var(--color-primary)",
                }}
              >
                <DollarSign className="h-3 w-3" />{" "}
                {fmtCurrency(contract.monthlyRate)}/m³/tháng
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
          {contract.monthlyRate > 0 && (
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OwnerContracts() {
  const navigate = useNavigate();
  const { user, isAuthenticated, contracts: allContracts, warehouses: warehouseList, requests, cancelContract } = useApp();

  const [tab, setTab] = useState<FilterTab>("all");
  const [cancelTarget, setCancelTarget] =
    useState<CompositeContract | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "warehouse")
      navigate("/login");
  }, [isAuthenticated, user, navigate]);

  // ── Owner's warehouses ───────────────────────────────────────────────────
  const ownerWarehouseIds = useMemo(
    () =>
      new Set(
        warehouseList
          .filter((w) => w.id_owner === user?.id)
          .map((w) => w.id_warehouse),
      ),
    [warehouseList, user],
  );

  const warehouseMap = useMemo<Record<string, CompositeWarehouse>>(
    () =>
      Object.fromEntries(warehouseList.map((w) => [w.id_warehouse, w])),
    [warehouseList],
  );

  // Owner's contracts (via their warehouses OR as ownerId)
  const contracts = useMemo(
    () =>
      allContracts.filter(
        (c) =>
          ownerWarehouseIds.has(c.id_warehouse) ||
          c.id_owner === user?.id,
      ),
    [allContracts, ownerWarehouseIds, user],
  );

  // Inprogress requests without a draft contract yet (for CTA)
  const pendingRequestsWithoutContract = useMemo(
    () =>
      requests.filter(
        (r) =>
          ownerWarehouseIds.has(r.id_warehouse) &&
          r.status === "inprogress" &&
          !allContracts.some((c) => c.id_rent_request === r.id),
      ),
    [requests, ownerWarehouseIds, allContracts],
  );

  const counts = useMemo(
    () =>
      contracts.reduce(
        (acc, c) => {
          acc[c.status] = (acc[c.status] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [contracts],
  );

  const filtered =
    tab === "all"
      ? contracts
      : contracts.filter((c) => c.status === tab);

  const handleEdit = (c: CompositeContract) => {
    if (c.id_rent_request) {
      navigate(`/warehouse/contracts/create/${c.id_rent_request}`);
    } else {
      toast.error(
        "Không tìm thấy yêu cầu liên kết với hợp đồng này.",
      );
    }
  };

  const handleCancelConfirm = async (note: string) => {
    if (!cancelTarget) return;
    await cancelContract(cancelTarget.id);
    toast.success("Đã huỷ hợp đồng.");
    setCancelTarget(null);
  };


  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg)" }}
    >
      <Navbar />

      {cancelTarget && (
        <CancelModal
          contractRef={cancelTarget.contractRef}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Back + Header ── */}
        <button
          onClick={() => navigate("/warehouse")}
          className="flex items-center gap-2 text-sm mb-5 hover:underline"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Về trang chính
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1
              className="flex items-center gap-2 mb-1"
              style={{ color: "var(--color-text)" }}
            >
              <FileText
                className="h-6 w-6"
                style={{ color: "var(--color-primary)" }}
              />
              Quản lý hợp đồng
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Hợp đồng thuê kho cho tất cả kho của bạn
            </p>
          </div>
          {pendingRequestsWithoutContract.length > 0 && (
            <button
              onClick={() =>
                navigate(
                  `/warehouse/contracts/create/${pendingRequestsWithoutContract[0].id}`,
                )
              }
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-white transition-colors"
              style={{ background: "var(--color-primary)" }}
            >
              <Plus className="h-4 w-4" />
              Soạn hợp đồng (
              {pendingRequestsWithoutContract.length} yêu cầu)
            </button>
          )}
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-[var(--color-border)] mb-8">
          {[
            {
              key: "draft",
              label: "Bản nháp",
              color: "var(--color-text-muted)",
            },
            {
              key: "pending_renter",
              label: "Chờ ký",
              color: "#f59e0b",
            },
            {
              key: "active",
              label: "Hiệu lực",
              color: "var(--color-success, #22c55e)",
            },
            {
              key: "expiring_soon",
              label: "Sắp hết hạn",
              color: "#f97316",
            },
            {
              key: "expired",
              label: "Hết hạn",
              color: "var(--color-text-muted)",
            },
            {
              key: "cancelled",
              label: "Đã huỷ",
              color: "var(--color-error)",
            },
          ].map((s) => (
            <div
              key={s.key}
              className="bg-[var(--color-surface)] p-4 cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors"
              onClick={() => setTab(s.key as FilterTab)}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="w-2 h-2 shrink-0"
                  style={{ background: s.color }}
                />
                <span
                  className="text-xl font-extrabold"
                  style={{ color: "var(--color-text)" }}
                >
                  {counts[s.key] ?? 0}
                </span>
              </div>
              <p
                className="text-[10px] uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Pending requests CTA banner */}
        {pendingRequestsWithoutContract.length > 0 && (
          <div
            className="flex items-center gap-4 px-4 py-3 mb-5 border"
            style={{
              background: "rgba(37,99,235,0.05)",
              borderColor: "rgba(37,99,235,0.3)",
            }}
          >
            <Send
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--color-primary)" }}
            />
            <div className="flex-1">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Có {pendingRequestsWithoutContract.length} yêu
                cầu đang thương lượng chưa có hợp đồng
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Soạn hợp đồng ngay để hoàn tất quy trình cho
                thuê.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              {pendingRequestsWithoutContract
                .slice(0, 3)
                .map((r) => (
                  <button
                    key={r.id}
                    onClick={() =>
                      navigate(
                        `/warehouse/contracts/create/${r.id}`,
                      )
                    }
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-white"
                    style={{
                      background: "var(--color-primary)",
                    }}
                  >
                    <Plus className="h-3 w-3" /> {r.renterName}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex border-b border-[var(--color-border)] mb-5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor:
                  tab === t.key
                    ? "var(--color-primary)"
                    : "transparent",
                color:
                  tab === t.key
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                fontWeight: tab === t.key ? 600 : 400,
              }}
            >
              {t.label}
              {t.key !== "all" && (counts[t.key] ?? 0) > 0 && (
                <span
                  className="ml-1.5 text-[10px] px-1.5 py-0.5"
                  style={{
                    background: "var(--color-bg-secondary)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Contract list ── */}
        {filtered.length === 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-16 text-center">
            <FileText
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: "var(--color-text-muted)" }}
            />
            <p style={{ color: "var(--color-text-secondary)" }}>
              {tab === "all"
                ? "Chưa có hợp đồng nào. Hãy soạn hợp đồng từ yêu cầu đang thương lượng."
                : "Không có hợp đồng nào trong mục này."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((c) => (
              <ContractCard
                key={c.id}
                contract={c}
                warehouse={warehouseMap[c.id_warehouse]}
                onEdit={handleEdit}
                onCancel={setCancelTarget}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}