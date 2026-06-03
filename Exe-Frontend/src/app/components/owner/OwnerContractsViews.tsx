import { FileText, Plus } from "lucide-react";
import { CompositeContract } from "../../../types";

type FilterTab = "all" | CompositeContract["status"];

export const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "draft", label: "Bản nháp" },
  { key: "pending_renter", label: "Chờ ký" },
  { key: "active", label: "Đang hiệu lực" },
  { key: "expiring_soon", label: "Sắp hết hạn" },
  { key: "expired", label: "Đã hết hạn" },
  { key: "cancelled", label: "Đã huỷ" },
];

export function OwnerContractsHeader({
  pendingCount,
  onNavigateCreate,
}: {
  pendingCount: number;
  onNavigateCreate: () => void;
}) {
  return (
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
      {pendingCount > 0 && (
        <button
          onClick={onNavigateCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-white transition-colors"
          style={{ background: "var(--color-primary)" }}
        >
          <Plus className="h-4 w-4" />
          Soạn hợp đồng ({pendingCount} yêu cầu)
        </button>
      )}
    </div>
  );
}

export function OwnerContractsStats({
  counts,
  onSelectTab,
}: {
  counts: Record<string, number>;
  onSelectTab: (tab: FilterTab) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-[var(--color-border)] mb-8">
      {[
        { key: "draft", label: "Bản nháp", color: "var(--color-text-muted)" },
        { key: "pending_renter", label: "Chờ ký", color: "#f59e0b" },
        { key: "active", label: "Hiệu lực", color: "var(--color-success, #22c55e)" },
        { key: "expiring_soon", label: "Sắp hết hạn", color: "#f97316" },
        { key: "expired", label: "Hết hạn", color: "var(--color-text-muted)" },
        { key: "cancelled", label: "Đã huỷ", color: "var(--color-error)" },
      ].map((s) => (
        <div
          key={s.key}
          className="bg-[var(--color-surface)] p-4 cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors"
          onClick={() => onSelectTab(s.key as FilterTab)}
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
  );
}

export function OwnerContractsPendingBanner({
  pendingRequests,
  onNavigateCreate,
}: {
  pendingRequests: any[];
  onNavigateCreate: (id: string) => void;
}) {
  if (pendingRequests.length === 0) return null;
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 mb-5 border"
      style={{
        background: "rgba(37,99,235,0.05)",
        borderColor: "rgba(37,99,235,0.3)",
      }}
    >
      <FileText
        className="h-5 w-5 shrink-0"
        style={{ color: "var(--color-primary)" }}
      />
      <div className="flex-1">
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--color-text)" }}
        >
          Có {pendingRequests.length} yêu cầu đang thương lượng chưa có hợp đồng
        </p>
        <p
          className="text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Soạn hợp đồng ngay để hoàn tất quy trình cho thuê.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {pendingRequests.slice(0, 3).map((r) => (
          <button
            key={r.id_rentRequest}
            onClick={() => onNavigateCreate(r.id_rentRequest)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-white"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus className="h-3 w-3" /> {r.renterName}
          </button>
        ))}
      </div>
    </div>
  );
}

export function OwnerContractsTabs({
  tab,
  counts,
  onSelectTab,
}: {
  tab: FilterTab;
  counts: Record<string, number>;
  onSelectTab: (tab: FilterTab) => void;
}) {
  return (
    <div className="flex border-b border-[var(--color-border)] mb-5 overflow-x-auto">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelectTab(t.key as FilterTab)}
          className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
          style={{
            borderBottomColor:
              tab === t.key ? "var(--color-primary)" : "transparent",
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
  );
}
