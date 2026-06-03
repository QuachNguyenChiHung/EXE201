import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";

import { useApp } from "../../../context/AppContext";
import { getUser } from "../../../utils/auth";
import { CompositeContract, CompositeWarehouse } from "../../../types";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { ContractCancelModal } from "../../components/owner/ContractCancelModal";
import { ContractCard } from "../../components/owner/ContractCard";
import {
  OwnerContractsHeader,
  OwnerContractsPendingBanner,
  OwnerContractsStats,
  OwnerContractsTabs,
} from "../../components/owner/OwnerContractsViews";

type FilterTab = "all" | CompositeContract["status"];

export default function OwnerContracts() {
  const navigate = useNavigate();
  const { contracts: allContracts, warehouses: warehouseList, requests, cancelContract } = useApp();
  const user = getUser();

  const [tab, setTab] = useState<FilterTab>("all");
  const [cancelTarget, setCancelTarget] =
    useState<CompositeContract | null>(null);

  useEffect(() => {
    if (!user || user.role !== "warehouse") {
      navigate("/login");
    }
  }, [user, navigate]);

  // ── Owner's warehouses ───────────────────────────────────────────────────
  const ownerWarehouseIds = useMemo(
    () =>
      new Set(
        warehouseList
          .filter((w) => w.id_owner === user?.id_user)
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
          ownerWarehouseIds.has(c.id_warehouse as number) ||
          c.id_owner === user?.id_user,
      ),
    [allContracts, ownerWarehouseIds, user],
  );

  // Inprogress requests without a draft contract yet (for CTA)
  const pendingRequestsWithoutContract = useMemo(
    () =>
      requests.filter(
        (r) =>
          ownerWarehouseIds.has(r.id_warehouse as number) &&
          r.status === "inprogress" &&
          !allContracts.some((c) => c.id_rent_request === r.id_rentRequest),
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
    await cancelContract(cancelTarget.id_contract);
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
        <ContractCancelModal
          contractRef={cancelTarget.contractRef!}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Back ── */}
        <button
          onClick={() => navigate("/warehouse")}
          className="flex items-center gap-2 text-sm mb-5 hover:underline"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Về trang chính
        </button>

        <OwnerContractsHeader
          pendingCount={pendingRequestsWithoutContract.length}
          onNavigateCreate={() =>
            navigate(
              `/warehouse/contracts/create/${pendingRequestsWithoutContract[0]?.id_rentRequest}`,
            )
          }
        />

        <OwnerContractsStats counts={counts} onSelectTab={setTab as any} />

        <OwnerContractsPendingBanner
          pendingRequests={pendingRequestsWithoutContract}
          onNavigateCreate={(id) => navigate(`/warehouse/contracts/create/${id}`)}
        />

        <OwnerContractsTabs tab={tab} counts={counts} onSelectTab={setTab as any} />

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
                key={c.id_contract}
                contract={c}
                warehouse={warehouseMap[c.id_warehouse as number]}
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
