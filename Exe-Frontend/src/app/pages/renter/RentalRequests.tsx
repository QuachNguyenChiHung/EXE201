import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { useApp } from '../../../context/AppContext';
import { Send, ArrowLeft, ClipboardList, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { CompositeWarehouse, CompositeRentRequest } from "../../../types";

import { FilterTab } from "../../components/renter/RentalRequestUtils";
import { RentalRequestFilters } from "../../components/renter/RentalRequestFilters";
import { RentalRequestCard } from "../../components/renter/RentalRequestCard";

export default function RentalRequests() {
    const navigate = useNavigate();
    const { user, isAuthenticated, requests: allRequests, warehouses: warehouseList, withdrawRequest } = useApp();

    const warehouses = useMemo<Record<string, CompositeWarehouse>>(
        () => Object.fromEntries(warehouseList.map((w) => [w.id_warehouse?.toString(), w])),
        [warehouseList],
    );

    const requests = useMemo(
        () => allRequests.filter((r) => r.id_renter === user?.id_user),
        [allRequests, user],
    ) as CompositeRentRequest[];

    const [tab, setTab] = useState<FilterTab>("all");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== "RENTER") navigate("/login");
    }, [isAuthenticated, user, navigate]);

    // Auto-expand first inprogress
    useEffect(() => {
        const inprog = requests.find((r) => r.status === "inprogress");
        if (inprog && !expandedId) setExpandedId(inprog.id_rentRequest);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleWithdraw = async (id: number) => {
        try {
            await withdrawRequest(id);
            if (expandedId === id) setExpandedId(null);
            toast.success("Đã rút yêu cầu thuê kho.");
        } catch (err) {
            toast.error('Không thể rút yêu cầu');
        }
    };

    const filtered = useMemo(
        () => tab === "all" ? requests : requests.filter((r) => r.status === tab),
        [requests, tab],
    );

    const counts: Record<FilterTab, number> = {
        all: requests.length,
        sent: requests.filter((r) => r.status === "sent").length,
        viewed: requests.filter((r) => r.status === "viewed").length,
        inprogress: requests.filter((r) => r.status === "inprogress").length,
        contracted: requests.filter((r) => r.status === "contracted").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
    };

    return (
        <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
            <Navbar />

            <div className="max-w-[900px] w-full mx-auto px-4 py-8">
                {/* ── Header ── */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            onClick={() => navigate("/renter")}
                            className="flex items-center gap-1 text-sm hover:underline"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            <ArrowLeft className="h-4 w-4" /> Dashboard
                        </button>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-9 h-9 flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
                                    <ClipboardList className="h-5 w-5 text-white" />
                                </div>
                                <h1 className="text-xl font-bold">Yêu cầu thuê kho</h1>
                            </div>
                            <p style={{ color: "var(--color-text-secondary)" }}>Theo dõi trạng thái các yêu cầu bạn đã gửi</p>
                        </div>
                        <button
                            onClick={() => navigate("/renter/search")}
                            className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity"
                            style={{ background: "var(--color-primary)" }}
                        >
                            <Send className="h-4 w-4" /> Gửi yêu cầu mới
                        </button>
                    </div>
                </div>

                <RentalRequestFilters
                    activeTab={tab}
                    onTabChange={setTab}
                    counts={counts}
                />

                {/* ── Results bar ── */}
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{filtered.length} yêu cầu</p>
                    {expandedId && (
                        <button
                            onClick={() => setExpandedId(null)}
                            className="text-xs hover:underline flex items-center gap-1"
                            style={{ color: "var(--color-text-muted)" }}
                        >
                            <ChevronDown className="h-3 w-3" /> Thu gọn tất cả
                        </button>
                    )}
                </div>

                {/* ── List ── */}
                {requests.length === 0 ? (
                    <div className="border p-10 text-center bg-[var(--color-surface)]">
                        <ClipboardList className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--color-primary)" }} />
                        <h3 className="mb-2 font-semibold">Chưa có yêu cầu nào</h3>
                        <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
                            Tìm kiếm và gửi yêu cầu thuê kho để bắt đầu.
                        </p>
                        <button
                            onClick={() => navigate("/renter/search")}
                            className="px-6 py-2 text-sm text-white"
                            style={{ background: "var(--color-primary)" }}
                        >
                            Tìm kho ngay
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <p style={{ color: "var(--color-text-secondary)" }}>Không có yêu cầu nào trong trạng thái này.</p>
                        <button
                            onClick={() => setTab("all")}
                            className="text-sm mt-3 underline"
                            style={{ color: "var(--color-primary)" }}
                        >
                            Xem tất cả yêu cầu
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 pb-20">
                        {filtered.map((req) => (
                            <RentalRequestCard
                                key={req.id_rentRequest}
                                request={req}
                                warehouse={warehouses[req.id_warehouse?.toString() || '']}
                                isExpanded={expandedId === req.id_rentRequest}
                                onToggle={() => setExpandedId((prev) => prev === req.id_rentRequest ? null : req.id_rentRequest)}
                                onWithdraw={handleWithdraw}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}