import { useState, useRef, useEffect, useCallback } from "react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { CompositeWarehouse, CompositeAiConversations, FilterOptions, AIResponsePayload } from "../../../types";
import { toast } from "sonner";
import { renterService } from "../../../services/renterService";
import { aiAPI } from "../../../services/apiClient";
import { isAINotConfigured, extractAiErrorMessage, isAiSubscriptionRequired, isTokenExhausted } from "./aiSearchUtils";
import { AIChatPanel, ChatMsg } from "../../components/renter/AIChatPanel";
import { AIResultGrid } from "../../components/renter/AIResultGrid";
import { SearchSidebar } from "../../components/renter/SearchSidebar";
import { getUser } from "../../../utils/auth";

type PriceUnit = "day" | "week" | "month" | "year";
const PRICE_TO_MONTHLY: Record<PriceUnit, number> = { month: 1, day: 30, week: 4, year: 1 / 12 };
const DEFAULT_PRICE_UNITS: PriceUnit[] = ["day", "week", "month", "year"];

export interface AIRequestPayload {
    prompt: string;
    criteria: Record<string, string[]>;
    matchingWarehouses: CompositeWarehouse[];
    conversationHistory: { role: "user" | "ai"; content: string }[];
    isInitialHandshake: boolean;
    hasCriteria: boolean;
}



/**
 * Resolve which warehouse list to show after an AI round-trip.
 * Priority:
 *   1. Explicit `response.warehouses` from the backend (cold search / handover).
 *   2. `initialList` filtered by `response.refinedWarehouseIds` (fast path: reorder only).
 *   3. The unchanged `initialList` as a last resort.
 */
function pickWarehouseList(
    response: AIResponsePayload,
    initialList: CompositeWarehouse[],
): CompositeWarehouse[] {
    if (response.warehouses && response.warehouses.length > 0) {
        return response.warehouses;
    }
    if (response.refinedWarehouseIds && response.refinedWarehouseIds.length > 0) {
        const order = response.refinedWarehouseIds;
        const idSet = new Set(order);
        const filtered = initialList.filter((w) => idSet.has(w.id_warehouse.toString()));
        filtered.sort((a, b) => order.indexOf(a.id_warehouse.toString()) - order.indexOf(b.id_warehouse.toString()));
        if (filtered.length > 0) return filtered;
    }
    return initialList;
}

function buildCandidateParams(filters: FilterOptions): Record<string, unknown> {
    const params: Record<string, unknown> = { page: 0, size: 50 };

    if (filters.keyword?.trim()) params.keyword = filters.keyword.trim();
    if (filters.provinces?.length) params.provinces = filters.provinces;
    if (filters.minCapacity !== undefined) params.minArea = filters.minCapacity;
    if (filters.maxCapacity !== undefined) params.maxArea = filters.maxCapacity;

    const units = filters.priceUnits?.length ? filters.priceUnits as PriceUnit[] : DEFAULT_PRICE_UNITS;
    const mul = units.reduce((s, u) => s + PRICE_TO_MONTHLY[u], 0) / units.length;
    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice * mul;
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice * mul;
    if (filters.ratingMin !== undefined) params.minRating = filters.ratingMin;
    if (filters.ratingMax !== undefined) params.maxRating = filters.ratingMax;
    if (filters.certifications?.length)
        params.certTypeIds = filters.certifications.map(Number).filter(n => !Number.isNaN(n));

    return params;
}

export default function AISearchWarehouse() {
    const currentUser = getUser();

    const [hasActiveTier, setHasActiveTier] = useState<boolean | null>(null);

    const [filters, setFilters] = useState<FilterOptions>({ provinces: [], cities: [], priceUnits: [] });
    const [filterMeta, setFilterMeta] = useState<any>(null);
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    const [warehouseEntitiesList, setWarehouseEntitiesList] = useState<CompositeWarehouse[]>([]);

    const [displayedList, setDisplayedList] = useState<CompositeWarehouse[]>([]);
    const makeWelcomeMsg = (): ChatMsg => ({
        id: "welcome-billing",
        role: "ai",
        content:
            `Xin chào! Tôi là trợ lý AI của **Logicha**, sẵn sàng giúp bạn tìm kho lạnh phù hợp nhất.\n\n` +
            `Lưu ý: **Các kho lạnh đều hỗ trợ tính theo ngày, tuần, tháng, năm** — bạn có thể chọn hình thức thuê linh hoạt theo nhu cầu.\n\n` +
            `Bạn có thể mô tả nhu cầu bằng ngôn ngữ tự nhiên, ví dụ:\n` +
            `- *"Kho lạnh ở Hồ Chí Minh, bảo quản hải sản đông lạnh"*\n` +
            `- *"Tìm kho rẻ nhất dưới 300.000đ/m³"*\n` +
            `- *"So sánh 3 kho có chứng chỉ HACCP"*\n\n` +
            `_Tôi sẽ phân tích và gợi ý kho phù hợp cho bạn!_`,
        timestamp: new Date(),
    });

    const [chatMessages, setChatMessages] = useState<ChatMsg[]>([makeWelcomeMsg()]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [warehousesRevealed, setWarehousesRevealed] = useState(false);

    const [_aiPayload, setAiPayload] = useState<AIRequestPayload | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [searchMode, setSearchMode] = useState<"standard" | "context">("standard");

    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const conversationIdRef = useRef<number>(0);
    const conversationCreatedAtRef = useRef<string>("");
    const cumulativeTokensRef = useRef<{ input: number; output: number }>({ input: 0, output: 0 });

    useEffect(() => {
        renterService.getRenterAiSubscriptionStatus()
            .then(({ hasActiveTier }) => setHasActiveTier(hasActiveTier))
            .catch(() => setHasActiveTier(false));
    }, []);

    useEffect(() => {
        renterService.getFilterMeta()
            .then(setFilterMeta)
            .catch(() => { });
    }, []);

    // Fetch all warehouses on mount so the AI has a full candidate pool immediately.
    useEffect(() => {
        setCandidatesLoading(true);
        renterService.searchWarehouses({ page: 0, size: 50 })
            .then((data) => {
                const list = data.content || [];
                setWarehouseEntitiesList(list);
            })
            .catch(() => { })
            .finally(() => setCandidatesLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Restore the latest saved conversation on mount.
    // Guard: if the user sends a message before the fetch returns, skip restore
    // so we don't overwrite their in-progress turn.
    useEffect(() => {
        if (!currentUser) return;
        let cancelled = false;
        aiAPI.getConversationsByUser(currentUser.id_user ?? 0)
            .then(convs => {
                if (cancelled) return;
                if (convs.length === 0) return;
                const latest = convs[0];
                let parsed: ChatMsg[] = [];
                try {
                    const raw = typeof latest.message === 'string'
                        ? JSON.parse(latest.message)
                        : latest.message;
                    if (Array.isArray(raw) && raw.length > 0) {
                        parsed = raw.map((m: any, i: number) => ({
                            id: m.id ?? `restored-${i}`,
                            role: m.role === 'user' ? 'user' : 'ai',
                            content: String(m.content ?? ''),
                            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                        }));
                    }
                } catch { /* malformed JSON — skip */ }
                if (parsed.length === 0) return;
                // Only restore if the user hasn't started a new conversation yet
                if (conversationIdRef.current !== 0) return;
                setChatMessages([makeWelcomeMsg(), ...parsed]);
                conversationIdRef.current = latest.id_ai_conversations;
                cumulativeTokensRef.current = {
                    input: latest.total_input_tokens ?? 0,
                    output: latest.total_output_tokens ?? 0,
                };
            })
            .catch(() => { });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTo({
                top: chatScrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [chatMessages, chatLoading]);

    const persistConversation = useCallback(
        (msgs: ChatMsg[], whCount: number) => {
            if (!currentUser || !conversationIdRef.current || msgs.length === 0) return;
            const record: CompositeAiConversations = {
                id_ai_conversations: conversationIdRef.current,
                id_user: currentUser.id_user,
                userName: currentUser.name,
                userEmail: currentUser.email,
                criteria: {},
                message: msgs.map((m) => ({
                    role: m.role,
                    content: m.content,
                    timestamp: m.timestamp.toISOString(),
                })),
                warehouseCount: whCount,
                total_input_tokens: cumulativeTokensRef.current.input,
                total_output_tokens: cumulativeTokensRef.current.output,
                create_at: conversationCreatedAtRef.current,
                update_at: new Date().toISOString(),
            };
            aiAPI.saveConversation(record).catch(() => { });
        },
        [currentUser],
    );

    const callAIBackend = async (
        prompt: string,
        warehouses: CompositeWarehouse[],
        history: ChatMsg[],
    ): Promise<AIResponsePayload> => {
        const isHandshake = history.filter((m) => m.role === "ai").length === 0;
        const strippedWarehouses = warehouses.slice(0, 12).map(w => {
            const { images, ...rest } = w;
            return rest;
        });
        const payload: AIRequestPayload = {
            prompt,
            criteria: {},
            matchingWarehouses: strippedWarehouses,
            conversationHistory: history.map((m) => ({ role: m.role, content: m.content })),
            isInitialHandshake: isHandshake,
            hasCriteria: false,
        };
        setAiPayload(payload);
        const result = await aiAPI.chat(payload);
        return result;
    };

    const callAIContextBackend = async (
        prompt: string,
        warehouses: CompositeWarehouse[],
        history: ChatMsg[],
    ): Promise<AIResponsePayload> => {
        const strippedWarehouses = warehouses.map(w => {
            const { images, ...rest } = w;
            return rest;
        });
        const result = await aiAPI.contextChat({
            query: prompt,
            conversationHistory: history.map((m) => ({ role: m.role, content: m.content })),
            warehouses: strippedWarehouses,
        });
        return result;
    };

    // Fetch the candidate universe the AI will reason about, respecting current filters.
    const fetchInitialCandidates = useCallback(async (currentFilters?: FilterOptions): Promise<CompositeWarehouse[]> => {
        try {
            const params = currentFilters ? buildCandidateParams(currentFilters) : { page: 0, size: 50 };
            const data = await renterService.searchWarehouses(params);
            return data.content || [];
        } catch (searchErr) {
            return [];
        }
    }, []);

    const handleApplyFilters = useCallback(async () => {
        setCandidatesLoading(true);
        try {
            const candidates = await fetchInitialCandidates(filters);
            // Store filter results as the entity pool; display is driven by AI only
            setWarehouseEntitiesList(candidates);
            setWarehousesRevealed(false);
        } finally {
            setCandidatesLoading(false);
        }
    }, [filters, fetchInitialCandidates]);

    const handleClearFilters = useCallback(() => {
        setFilters({ provinces: [], cities: [], priceUnits: [] });
    }, []);

    const handleNewConversation = useCallback(() => {
        setChatMessages([makeWelcomeMsg()]);
        setChatInput("");
        setAiError(null);
        conversationIdRef.current = 0;
        conversationCreatedAtRef.current = "";
        cumulativeTokensRef.current = { input: 0, output: 0 };
    }, []);

    const handleChatSend = async (text?: string) => {
        const msg = (text ?? chatInput).trim();
        if (!msg || chatLoading) return;
        setChatInput("");
        setAiError(null);

        // Lazy-init on the first prompt: seed the conversation id and token counters.
        const isFirstPrompt = conversationIdRef.current === 0;
        if (isFirstPrompt) {
            conversationIdRef.current = Date.now();
            conversationCreatedAtRef.current = new Date().toISOString();
            cumulativeTokensRef.current = { input: 0, output: 0 };
        }
        // Context mode requires a non-empty entity pool to analyze.
        let localCandidates = warehouseEntitiesList;
        if (searchMode === "context" && localCandidates.length === 0) {
            const noListMsg: ChatMsg = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: "Chế độ **Ngữ cảnh** cần danh sách kho để phân tích. Hãy áp dụng bộ lọc bên trên trước rồi thử lại.",
                timestamp: new Date(),
            };
            setChatMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: msg, timestamp: new Date() }, noListMsg]);
            return;
        }

        // Standard mode: auto-fetch if pool is still empty (edge case: fetch failed on mount).
        if (searchMode === "standard" && localCandidates.length === 0) {
            localCandidates = await fetchInitialCandidates(filters);
            if (localCandidates.length > 0) {
                setWarehouseEntitiesList(localCandidates);
            }
        }

        const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: msg, timestamp: new Date() };
        setChatMessages((prev) => [...prev, userMsg]);

        setChatLoading(true);
        try {
            const universe = localCandidates.length > 0 ? localCandidates : (searchMode === "standard" ? await fetchInitialCandidates(filters).then((c) => {
                if (c.length > 0) { setWarehouseEntitiesList(c); }
                return c;
            }) : []);
            const history = [...chatMessages, userMsg].filter((m) => !m.id.startsWith("welcome-"));
            const response = searchMode === "context"
                ? await callAIContextBackend(msg, universe, history)
                : await callAIBackend(msg, universe, history);

            if (response.usage) {
                cumulativeTokensRef.current.input += response.usage.input_tokens;
                cumulativeTokensRef.current.output += response.usage.output_tokens;
            }

            const refinedList = pickWarehouseList(response, warehouseEntitiesList);

            const aiMsg: ChatMsg = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: response.text,
                refinedList: refinedList !== warehouseEntitiesList ? refinedList : undefined,
                timestamp: new Date(),
            };
            setChatMessages((prev) => {
                const updated = [...prev, aiMsg];
                // Strip the static welcome banner — it's a UI hint, not a real AI turn.
                persistConversation(
                    updated.filter((m) => !m.id.startsWith("welcome-")),
                    warehouseEntitiesList.length,
                );
                return updated;
            });
            // displayedList is exclusively driven by AI results
            setDisplayedList(refinedList);
            // If the BE explicitly returned a new warehouse list, update the entity pool
            // so subsequent follow-up queries use the freshest universe.
            if (response.warehouses && response.warehouses.length > 0) {
                setWarehouseEntitiesList(response.warehouses);
            }
            setWarehousesRevealed(true);

            if (response.tokenExhausted) {
                const noticeMsg: ChatMsg = {
                    id: (Date.now() + 2).toString(),
                    role: "ai",
                    content:
                        "Token AI đã hết. Cuộc hội thoại này đã được lưu.\n\nTin nhắn tiếp theo sẽ bắt đầu một cuộc hội thoại mới.",
                    timestamp: new Date(),
                };
                setChatMessages((prev) => [...prev, noticeMsg]);
                conversationIdRef.current = 0;
                cumulativeTokensRef.current = { input: 0, output: 0 };
            }
        } catch (err: any) {
            if (isAINotConfigured(err)) {
                const fallbackMsg: ChatMsg = {
                    id: (Date.now() + 1).toString(),
                    role: "ai",
                    content: `AI backend chưa được kết nối. Hãy thử mô tả chi tiết hơn nhu cầu của bạn, ví dụ: "Kho lạnh ở Hồ Chí Minh, bảo quản hải sản".`,
                    timestamp: new Date(),
                };
                setChatMessages((prev) => [...prev, fallbackMsg]);
                setAiError("AI_BACKEND_NOT_CONFIGURED");
            } else if (isAiSubscriptionRequired(err)) {
                // Backend rejected because the user has no active AI tier
                // (or the 1-month window has expired). Surface the original
                // Vietnamese message and nudge them to /renter/ai-subscription.
                const reason = extractAiErrorMessage(
                    err,
                    "Bạn cần đăng ký Gói AI để sử dụng Trợ lý ảo!",
                );
                const upgradeMsg: ChatMsg = {
                    id: (Date.now() + 1).toString(),
                    role: "ai",
                    content:
                        `${reason}\n\n` +
                        `👉 Vào **trang đăng ký gói AI** ở banner vàng phía trên ` +
                        `(hoặc truy cập **/renter/ai-subscription**) để mở khóa Trợ lý ảo.`,
                    timestamp: new Date(),
                };
                setChatMessages((prev) => [...prev, upgradeMsg]);
                // Show the amber banner so the "Nâng cấp gói AI" button is visible.
                setHasActiveTier(false);
                setAiError("AI_SUBSCRIPTION_REQUIRED");
                toast.error(reason, {
                    description: "Nhấn \"Nâng cấp gói AI\" ở banner phía trên để tiếp tục.",
                    duration: 6000,
                });
            } else if (isTokenExhausted(err)) {
                // User has run out of output tokens in their current billing window.
                // Push the notice into the chat box (not just a toast at the corner)
                // so the user actually sees it while looking at the conversation.
                const reason = extractAiErrorMessage(
                    err,
                    "Bạn đã dùng hết token trong gói AI hiện tại. Hãy nạp thêm hoặc nâng cấp gói.",
                );
                const tokenMsg: ChatMsg = {
                    id: (Date.now() + 1).toString(),
                    role: "ai",
                    content:
                        `${reason}\n\n` +
                        `👉 Vào **trang đăng ký gói AI** (hoặc truy cập **/renter/ai-subscription**) ` +
                        `để nâng cấp gói cao hơn hoặc mua thêm token.`,
                    timestamp: new Date(),
                };
                setChatMessages((prev) => [...prev, tokenMsg]);
                // Keep the toast as a secondary signal in case the user has scrolled away.
                toast.error(reason, {
                    description: "Truy cập /renter/ai-subscription để nâng cấp.",
                    duration: 6000,
                });
                setAiError("TOKEN_EXHAUSTED");
            } else {
                toast.error(extractAiErrorMessage(err, "AI gặp lỗi, vui lòng thử lại."));
                setAiError(err.message ?? "Unknown error");
            }
        } finally {
            setChatLoading(false);
        }
    };

    const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            {hasActiveTier === false && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
                    <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
                        <p className="text-sm text-amber-800">
                            Bạn chưa đăng ký gói AI. Hãy nâng cấp để sử dụng trợ lý tìm kiếm thông minh.
                        </p>
                        <a
                            href="/renter/ai-subscription"
                            className="shrink-0 text-sm font-semibold px-4 py-1.5 bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                        >
                            Nâng cấp gói AI
                        </a>
                    </div>
                </div>
            )}

            <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <div className="max-w-[1400px] mx-auto px-6 py-4">
                    <h1 className="text-xl font-semibold">Tìm kho lạnh bằng AI</h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        Lọc thủ công bên dưới để thu hẹp phạm vi, sau đó mô tả nhu cầu cho AI để tìm kho phù hợp nhất.
                    </p>
                </div>
            </div>

            {/* ── Search mode toggle ── */}
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="max-w-[1400px] mx-auto px-6 py-2 flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-secondary)] mr-1">Chế độ:</span>
                    <button
                        onClick={() => {
                            if (searchMode === "standard") return;
                            setSearchMode("standard");
                            setChatMessages([{ id: "welcome-billing", role: "ai", content: `Xin chào! Tôi là trợ lý AI của **Logicha**, sẵn sàng giúp bạn tìm kho lạnh phù hợp nhất.\n\nBạn có thể mô tả nhu cầu bằng ngôn ngữ tự nhiên, ví dụ:\n- *"Kho lạnh ở Hồ Chí Minh, bảo quản hải sản đông lạnh"*\n- *"Tìm kho rẻ nhất dưới 300.000đ/m³"*\n\n_Tôi sẽ phân tích và gợi ý kho phù hợp cho bạn!_`, timestamp: new Date() }]);
                            conversationIdRef.current = 0;
                            cumulativeTokensRef.current = { input: 0, output: 0 };
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${searchMode === "standard" ? "bg-blue-600 text-white" : "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"}`}
                    >
                        Tiêu chuẩn
                    </button>
                    <button
                        onClick={() => {
                            if (searchMode === "context") return;
                            setSearchMode("context");
                            setChatMessages([{ id: "welcome-billing", role: "ai", content: `Chế độ **Ngữ cảnh** — AI sẽ phân tích toàn bộ thông tin chi tiết của từng kho trong danh sách lọc.\n\n⚠ Chế độ này **tốn nhiều token hơn**. Hãy áp dụng bộ lọc trước để giảm số kho cần phân tích.\n\nSau khi lọc, hãy mô tả nhu cầu của bạn.`, timestamp: new Date() }]);
                            conversationIdRef.current = 0;
                            cumulativeTokensRef.current = { input: 0, output: 0 };
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${searchMode === "context" ? "bg-orange-500 text-white" : "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"}`}
                    >
                        Ngữ cảnh ▲ Tốn token hơn
                    </button>
                </div>
            </div>

            {/* ── Context mode cost warning ── */}
            {searchMode === "context" && (
                <div className="bg-orange-50 border-b border-orange-200 px-6 py-2">
                    <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
                        <p className="text-xs text-orange-800">
                            ⚠ Chế độ ngữ cảnh đang gửi <strong>{warehouseEntitiesList.length} kho</strong> cho AI — tốn nhiều token hơn chế độ tiêu chuẩn.
                            {warehouseEntitiesList.length === 0 && " Áp dụng bộ lọc trước để tải danh sách kho."}
                        </p>
                        <button
                            onClick={() => document.querySelector<HTMLElement>("[data-filter-bar]")?.scrollIntoView({ behavior: "smooth" })}
                            className="shrink-0 text-xs font-semibold text-orange-700 hover:text-orange-900 underline"
                        >
                            Lọc ngay ↑
                        </button>
                    </div>
                </div>
            )}

            {/* ── Manual pre-filter bar — only shown in context mode ── */}
            {searchMode === "context" && (
                <div className="border-b border-[var(--color-border)] bg-white" data-filter-bar="true">
                    <div className="max-w-[1400px] mx-auto">
                        <SearchSidebar
                            sidebarOpen={true}
                            setSidebarOpen={() => { }}
                            filters={filters}
                            setLocalFilters={setFilters}
                            handleSearch={handleApplyFilters}
                            clearFilters={handleClearFilters}
                            loading={candidatesLoading}
                            certifications={filterMeta?.certifications || []}
                            locations={filterMeta?.locations || []}
                        />
                    </div>
                </div>
            )}

            <div className="max-w-[1400px] mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                    <div className="lg:col-span-2">
                        <AIChatPanel
                            displayedListCount={displayedList.length}
                            aiError={aiError}
                            chatMessages={chatMessages}
                            chatLoading={chatLoading}
                            chatInput={chatInput}
                            chatScrollRef={chatScrollRef}
                            chatEndRef={chatEndRef}
                            chatInputRef={chatInputRef}
                            setChatInput={setChatInput}
                            handleChatSend={handleChatSend}
                            handleChatKeyDown={handleChatKeyDown}
                            onNewConversation={handleNewConversation}
                        />
                    </div>
                    <div className="lg:col-span-3">
                        <AIResultGrid
                            displayedList={displayedList}
                            warehousesRevealed={warehousesRevealed}
                        />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}