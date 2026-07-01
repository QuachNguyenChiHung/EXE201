import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { useApp } from '../../../context/AppContext';
import { renterService } from '../../../services/renterService';
import { Send, ArrowLeft, ClipboardList, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { CompositeWarehouse, CompositeRentRequest, CompositeContract } from "../../../types";

import { FilterTab, TABS } from "../../components/renter/RentalRequestUtils";
import { RentalRequestCard } from "../../components/renter/RentalRequestCard";
import { getUser } from "../../../utils/auth";

export default function RentalRequests() {
    const navigate = useNavigate();
    const user = getUser();
    const { warehouses: warehouseList, loading: appLoading } = useApp();

    const [tab, setTab] = useState<FilterTab>("all");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [contracts, setContracts] = useState<CompositeContract[]>([]);

    // Pagination & Caching
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [requestsList, setRequestsList] = useState<CompositeRentRequest[]>([]);
    const [cache, setCache] = useState<Record<string, { list: CompositeRentRequest[], totalPages: number, totalElements: number }>>({});

    const warehouses = useMemo<Record<string, CompositeWarehouse>>(
        () => Object.fromEntries(warehouseList.map((w) => [w.id_warehouse?.toString(), w])),
        [warehouseList],
    );

    useEffect(() => {
        if (!user) {
            navigate("/login");
        } else if (user.role !== "RENTER") {
            navigate("/login");
        }
    }, [user, navigate]);

    const fetchContracts = useCallback(async () => {
        try {
            const { content } = await renterService.getMyContracts(0, 100);
            setContracts(content);
        } catch (err) {
            console.warn('[RentalRequests] fetchContracts failed', err);
        }
    }, []);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const handleAcceptContract = async (contractId: number) => {
        try {
            await renterService.signContract(contractId);
            await fetchContracts();
            toast.success('Đã ký xác nhận hợp đồng!');
        } catch (err) {
            toast.error((err as any)?.message ?? 'Không thể ký hợp đồng');
        }
    };

    const handleRejectContract = async (contractId: number, reason: string) => {
        try {
            await renterService.rejectContract(contractId, reason);
            await fetchContracts();
            toast.success('Đã gửi phản hồi từ chối.');
        } catch (err) {
            toast.error((err as any)?.message ?? 'Không thể từ chối hợp đồng');
        }
    };

    const handleAcceptOffer = async (requestId: number) => {
        try {
            await renterService.acceptOffer(requestId);
            await fetchPage(page, tab, false, true);
            toast.success('Đã chấp nhận giá đề xuất!');
        } catch (err) {
            toast.error((err as any)?.message ?? 'Không thể chấp nhận giá đề xuất');
        }
    };

    const handleCounterOffer = async (requestId: number, note: string, newPrice: number) => {
        try {
            await renterService.counterOffer(requestId, note, newPrice);
            await fetchPage(page, tab, false, true);
            toast.success('Đã gửi lời từ chối Giá cho chủ kho.');
        } catch (err) {
            toast.error((err as any)?.message ?? 'Không thể gửi lời từ chối Giá');
        }
    };

    const contractsByRequestId = useMemo(() => {
        const map: Record<number, CompositeContract> = {};
        contracts.forEach(c => {
            if (c.id_rent_request) map[c.id_rent_request] = c;
        });
        return map;
    }, [contracts]);

    const fetchPage = useCallback(async (p: number, t: FilterTab, isPreload: boolean = false, forceRefetch: boolean = false) => {
        const cacheKey = `${t}_${p}`;
        if (!forceRefetch && cache[cacheKey]) {
            if (!isPreload) {
                setRequestsList(cache[cacheKey].list);
                setTotalPages(cache[cacheKey].totalPages);
                setTotalElements(cache[cacheKey].totalElements);
                setLoading(false);
            }
            return cache[cacheKey];
        }

        if (!isPreload) setLoading(true);
        try {
            const dataRes = await renterService.getMyRequests(p, 10, t === 'all' ? undefined : t);
            console.log('[RentalRequests] raw API response:', JSON.stringify(dataRes.content, null, 2));
            const mapped = (dataRes.content as any[]).map(r => {
                const details = r.details || [];

                const requestedCapacity = details.reduce((sum: number, d: any) => sum + (d.rentedArea || 0), 0) || undefined;
                const priceTierLabel = details.length > 1 ? 'Nhiều phân khu' : details[0]?.priceTierLabel;
                const priceTierValue = details.length > 1 ? undefined : details[0]?.priceTierValue;
                const sectionName = details.length > 1
                    ? `${details.length} phân khu`
                    : (details[0]?.priceTierLabel ?? (details[0]?.sector ? `Khu vực ${details[0].sector}` : undefined));

                return {
                    ...r,
                    id_rentRequest: r.id || r.id_rentRequest,
                    id_warehouse: r.warehouseId,
                    cargo_description: r.cargoDescription,
                    cargoType: r.cargoDescription,
                    other_detail: r.otherDetail,
                    message: r.otherDetail,
                    duration: r.duration,
                    duration_unit: r.durationUnit,
                    durationLabel: `${r.duration} ${r.durationUnit === 'MONTH' ? 'tháng' : r.durationUnit === 'YEAR' ? 'năm' : r.durationUnit || ''}`.trim(),
                    status: r.status,
                    offered_price: r.offeredPrice,
                    renterOfferedPrice: r.renterOfferedPrice,
                    owner_note: r.ownerNote,
                    rejection_reason: r.rejectionReason,
                    requestedCapacity,
                    priceTierLabel,
                    priceTierValue,
                    sectionName,
                    sectionId: details[0]?.sector,
                    start_date: r.startDate,
                    end_date: r.endDate,
                    submit_at: r.createdAt || r.submit_at || new Date().toISOString(),
                    details: r.details
                } as CompositeRentRequest;
            });

            console.log('[RentalRequests] mapped requests:', mapped);
            console.log('[RentalRequests] warehouseList (mock):', warehouseList);

            const newData = { list: mapped, totalPages: dataRes.totalPages, totalElements: dataRes.totalElements };
            setCache(prev => ({ ...prev, [cacheKey]: newData }));

            if (!isPreload) {
                setRequestsList(mapped);
                setTotalPages(dataRes.totalPages);
                setTotalElements(dataRes.totalElements);
            }
            return newData;
        } catch (err: any) {
            console.error('Failed to fetch requests', err);
            if (!isPreload) toast.error('Không tải được danh sách yêu cầu');
        } finally {
            if (!isPreload) setLoading(false);
        }
    }, [cache, warehouseList]);

    useEffect(() => {
        if (!user || user.role !== 'RENTER' || appLoading.warehouses) return;
        fetchPage(page, tab).then(data => {
            if (data && page < data.totalPages - 1) {
                fetchPage(page + 1, tab, true);
            }
        });
    }, [page, tab, user?.email, appLoading.warehouses]);

    const handleWithdraw = async (id: number) => {
        try {
            await renterService.cancelRequest(id);
            if (expandedId === id) setExpandedId(null);
            toast.success("Đã rút yêu cầu thuê kho.");

            // Invalidate cache and refetch current page
            setCache({});
            fetchPage(page, tab, false, true);
        } catch (err) {
            toast.error('Không thể rút yêu cầu');
        }
    };



    return (
        <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
            <Navbar />

            <div className="bento-container">
                {/* ── Header ── */}
                <div className="bento-header">
                    <button
                        onClick={() => navigate("/renter")}
                        className="flex items-center gap-1 text-sm mb-2 hover:underline"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        <ArrowLeft className="h-4 w-4" /> Dashboard
                    </button>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 flex items-center justify-center shrink-0" style={{ background: "var(--color-primary)" }}>
                                <ClipboardList className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1>Yêu cầu thuê kho</h1>
                                <p style={{ color: "var(--color-text-secondary)" }}>Theo dõi trạng thái các yêu cầu bạn đã gửi</p>
                            </div>
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

                {/* ── Tabs ── */}
                <div className="flex border-b border-[var(--color-border)] mb-4 overflow-x-auto">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => { setTab(t.key); setPage(0); }}
                            className="px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors"
                            style={{
                                borderBottomColor: tab === t.key ? 'var(--color-primary)' : 'transparent',
                                color: tab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                fontWeight: tab === t.key ? 600 : 400,
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Results bar ── */}
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{totalElements} yêu cầu</p>
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
                {loading ? (
                    <div className="flex justify-center items-center py-12 border border-[var(--color-border)] rounded bg-[var(--color-surface)]">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]"></div>
                    </div>
                ) : requestsList.length === 0 ? (
                    <div className="border border-[var(--color-border)] p-10 text-center bg-[var(--color-surface)]">
                        <ClipboardList className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
                        <h3 className="mb-2 font-semibold">Chưa có yêu cầu nào</h3>
                        <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
                            {tab === "all" ? "Tìm kiếm và gửi yêu cầu thuê kho để bắt đầu." : "Không có yêu cầu nào trong trạng thái này."}
                        </p>
                        {tab === 'all' ? (
                            <button
                                onClick={() => navigate("/renter/search")}
                                className="px-6 py-2 text-sm text-white"
                                style={{ background: "var(--color-primary)" }}
                            >
                                Tìm kho ngay
                            </button>
                        ) : (
                            <button
                                onClick={() => { setTab("all"); setPage(0); }}
                                className="text-sm mt-3 underline"
                                style={{ color: "var(--color-primary)" }}
                            >
                                Xem tất cả yêu cầu
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {requestsList.map((req) => {
                            const contract = contractsByRequestId[req.id_rentRequest || req.id_rentRequest];
                            return (
                                <RentalRequestCard
                                    key={req.id_rentRequest}
                                    request={req}
                                    warehouse={warehouses[req.id_warehouse?.toString() || '']}
                                    contract={contract}
                                    isExpanded={expandedId === req.id_rentRequest}
                                    onToggle={() => setExpandedId((prev) => prev === req.id_rentRequest ? null : req.id_rentRequest)}
                                    onWithdraw={handleWithdraw}
                                    onSign={handleAcceptContract}
                                    onReject={handleRejectContract}
                                    onAcceptOffer={handleAcceptOffer}
                                    onCounterOffer={handleCounterOffer}
                                />
                            );
                        })}
                    </div>
                )}

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded mt-4">
                        <span className="text-sm text-[var(--color-text-secondary)]">
                            Trang {page + 1} / {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}