import { useState, useRef, useEffect, useCallback } from "react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { getAttributes } from "./aiSearchData";
import type { SelectMode, Attribute } from "./aiSearchData";
import { useApp } from "../../../context/AppContext";
import { CompositeWarehouse, CompositeAiConversations } from "../../../types";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { renterService, FilterMetaResponseDTO } from "../../../services/renterService";
import { aiAPI } from "../../../services/apiClient";
import { buildFilterSummary, isAINotConfigured, buildSearchParams } from "./aiSearchUtils";
import { AISearchCriteria } from "../../components/renter/AISearchCriteria";
import { AIChatPanel, ChatMsg } from "../../components/renter/AIChatPanel";
import { AIResultGrid } from "../../components/renter/AIResultGrid";
import { getUser } from "../../../utils/auth";

type Phase = "select" | "results";

export interface AIRequestPayload {
    prompt: string;
    criteria: Record<string, string[]>;
    matchingWarehouses: CompositeWarehouse[];
    conversationHistory: { role: "user" | "ai"; content: string }[];
    isInitialHandshake: boolean;
    hasCriteria: boolean;
}

export interface AIResponsePayload {
    text: string;
    refinedWarehouseIds?: string[];
    usage?: { input_tokens: number; output_tokens: number };
}

function SelectionSummary({ selections, attributes }: { selections: Record<string, string[]>, attributes: Attribute[] }) {
    const chips: string[] = [];
    attributes.forEach((attr) => {
        (selections[attr.id] ?? []).forEach((v) => {
            const opt = attr.options.find((o) => o.value === v);
            if (opt) chips.push(opt.label);
        });
    });
    return (
        <div className="flex flex-wrap gap-1.5">
            {chips.map((c, i) => (
                <span key={i} className="bg-[var(--color-primary-100)] text-[var(--color-primary)] text-xs px-2 py-0.5">{c}</span>
            ))}
        </div>
    );
}

export default function AISearchWarehouse() {
    const currentUser = getUser();
    const { warehouses: allWarehouses } = useApp();

    const [phase, setPhase] = useState<Phase>("select");
    const [selections, setSelections] = useState<Record<string, string[]>>({});
    const [usage, setUsage] = useState<{ monthlyQueries: number; monthlyCost: number } | null>(null);
    const [metaLoading, setMetaLoading] = useState(true);
    const [filterMeta, setFilterMeta] = useState<FilterMetaResponseDTO | null>(null);
    const [attributes, setAttributes] = useState<Attribute[]>([]);

    const [initialList, setInitialList] = useState<CompositeWarehouse[]>([]);
    const [displayedList, setDisplayedList] = useState<CompositeWarehouse[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [warehousesRevealed, setWarehousesRevealed] = useState(false);
    const [hasActiveTier, setHasActiveTier] = useState<boolean | null>(null);

    const [_aiPayload, setAiPayload] = useState<AIRequestPayload | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const conversationIdRef = useRef<number>(0);
    const conversationCreatedAtRef = useRef<string>("");
    const cumulativeTokensRef = useRef<{ input: number; output: number }>({ input: 0, output: 0 });

    useEffect(() => {
        renterService.getFilterMeta()
            .then((data) => {
                setFilterMeta(data);
                setAttributes(getAttributes(data));
            })
            .catch((err) => console.error("Failed to load filter metadata:", err))
            .finally(() => setMetaLoading(false));

        renterService.getRenterAiSubscriptionStatus()
            .then(({ hasActiveTier }) => setHasActiveTier(hasActiveTier))
            .catch(() => setHasActiveTier(false));
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
        (msgs: ChatMsg[], whCount: number, criteria: Record<string, string[]>) => {
            if (!currentUser || !conversationIdRef.current || msgs.length === 0) return;
            const record: CompositeAiConversations = {
                id_ai_conversations: conversationIdRef.current,
                id_user: currentUser.id_user,
                userName: currentUser.name,
                userEmail: currentUser.email,
                criteria,
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
            aiAPI.saveConversation(record).catch((err) =>
                console.log("[ai/conv] Save error:", err?.message),
            );
        },
        [currentUser],
    );

    const totalSelected = Object.values(selections).flat().length;

    const validationErrors = (() => {
        const errors: Record<string, string> = {};
        const minCap = selections["minCapacity"]?.[0];
        const maxCap = selections["maxCapacity"]?.[0];
        const minPrice = selections["minPrice"]?.[0];
        const maxPrice = selections["maxPrice"]?.[0];
        if (minCap && Number(minCap) < 1) errors["minCapacity"] = "Phải từ 1 trở lên";
        if (maxCap && Number(maxCap) < 1) errors["maxCapacity"] = "Phải từ 1 trở lên";
        if (minPrice && Number(minPrice) < 10000) errors["minPrice"] = "Phải từ 10.000đ trở lên";
        if (maxPrice && Number(maxPrice) < 10000) errors["maxPrice"] = "Phải từ 10.000đ trở lên";
        return errors;
    })();
    const hasValidationErrors = Object.keys(validationErrors).length > 0;

    const handleToggle = (attrId: string, value: string, mode: SelectMode) => {
        setSelections((prev) => {
            const cur = prev[attrId] ?? [];
            if (attrId === "certifications") {
                if (value === "none") {
                    return cur.includes("none")
                        ? { ...prev, [attrId]: [] }
                        : { ...prev, [attrId]: ["none"] };
                }
                const withoutNone = cur.filter((v) => v !== "none");
                return withoutNone.includes(value)
                    ? { ...prev, [attrId]: withoutNone.filter((v) => v !== value) }
                    : { ...prev, [attrId]: [...withoutNone, value] };
            }
            const next =
                mode === "single"
                    ? cur.includes(value) ? [] : [value]
                    : cur.includes(value)
                        ? cur.filter((v) => v !== value)
                        : [...cur, value];
            return { ...prev, [attrId]: next };
        });
    };

    const handleSetSelection = (attrId: string, values: string[]) => {
        setSelections((prev) => ({ ...prev, [attrId]: values }));
    };

    const callAIBackend = async (
        prompt: string,
        criteria: Record<string, string[]>,
        warehouses: CompositeWarehouse[],
        history: ChatMsg[],
    ): Promise<AIResponsePayload> => {
        const payload: AIRequestPayload = {
            prompt,
            criteria,
            matchingWarehouses: warehouses,
            conversationHistory: history.map((m) => ({ role: m.role, content: m.content })),
            isInitialHandshake: history.length === 0,
            hasCriteria: Object.values(criteria).flat().length > 0,
        };
        setAiPayload(payload);
        return aiAPI.chat(payload);
    };

    const handleInitialSearch = async () => {
        const hasCriteria = totalSelected > 0;

        setChatMessages([]);
        setWarehousesRevealed(false);
        setAiError(null);
        setPhase("results");
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);

        setChatLoading(true);
        conversationIdRef.current = Date.now();
        conversationCreatedAtRef.current = new Date().toISOString();
        cumulativeTokensRef.current = { input: 0, output: 0 };
        let filtered: CompositeWarehouse[] = [];
        try {
            const params = hasCriteria ? buildSearchParams(selections) : { page: 0, size: 50 };
            const data = await renterService.searchWarehouses(params);
            filtered = data.content || [];

            setInitialList(filtered);
            setDisplayedList(filtered);
            const response = await callAIBackend("", hasCriteria ? selections : {}, filtered, []);

            if (response.usage) {
                cumulativeTokensRef.current.input += response.usage.input_tokens;
                cumulativeTokensRef.current.output += response.usage.output_tokens;
            }

            const aiMsg: ChatMsg = { id: "greeting-" + Date.now(), role: "ai", content: response.text, timestamp: new Date() };
            setChatMessages([aiMsg]);
            persistConversation([aiMsg], filtered.length, hasCriteria ? selections : {});

            if (response.refinedWarehouseIds) {
                const idSet = new Set(response.refinedWarehouseIds);
                const refined = filtered.filter((w) => idSet.has(w.id_warehouse.toString()));
                refined.sort((a, b) => response.refinedWarehouseIds!.indexOf(a.id_warehouse.toString()) - response.refinedWarehouseIds!.indexOf(b.id_warehouse.toString()));
                setDisplayedList(refined);
            }

            if (hasCriteria) setWarehousesRevealed(true);
        } catch (err: any) {
            if (isAINotConfigured(err)) {
                const fallbackGreeting = hasCriteria
                    ? buildFilterSummary(filtered)
                    : `Xin chào! Tôi là trợ lý AI của **Logicha**, sẵn sàng giúp bạn tìm kho lạnh phù hợp nhất.\n\nHiện có **${filtered.length} kho lạnh** đang hoạt động trên hệ thống.\n\nBạn có thể cho tôi biết:\n- Bạn cần bảo quản loại hàng hóa gì?\n- Ở khu vực nào?\n- Công suất cần bao nhiêu m³?\n- Ngân sách dự kiến?\n\n_Hoặc mô tả nhu cầu bằng ngôn ngữ tự nhiên, tôi sẽ tìm kho phù hợp cho bạn!_`;

                setChatMessages([{ id: "fallback-greeting", role: "ai", content: fallbackGreeting, timestamp: new Date() }]);
                if (hasCriteria) setWarehousesRevealed(true);
                setAiError("AI_BACKEND_NOT_CONFIGURED");
            } else {
                toast.error("Không thể kết nối AI. Vui lòng thử lại.");
                setAiError(err.message ?? "Unknown error");
            }
        } finally {
            setChatLoading(false);
        }
    };

    const handleChatSend = async (text?: string) => {
        const msg = (text ?? chatInput).trim();
        if (!msg || chatLoading) return;
        setChatInput("");
        setAiError(null);

        const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: msg, timestamp: new Date() };
        setChatMessages((prev) => [...prev, userMsg]);

        setChatLoading(true);
        try {
            const response = await callAIBackend(msg, selections, initialList, [...chatMessages, userMsg]);

            if (response.usage) {
                cumulativeTokensRef.current.input += response.usage.input_tokens;
                cumulativeTokensRef.current.output += response.usage.output_tokens;
            }

            let refinedList: CompositeWarehouse[] | undefined;
            if (response.refinedWarehouseIds) {
                const idSet = new Set(response.refinedWarehouseIds);
                refinedList = initialList.filter((w) => idSet.has(w.id_warehouse.toString()));
                refinedList.sort((a, b) => response.refinedWarehouseIds!.indexOf(a.id_warehouse.toString()) - response.refinedWarehouseIds!.indexOf(b.id_warehouse.toString()));
            }

            const aiMsg: ChatMsg = { id: (Date.now() + 1).toString(), role: "ai", content: response.text, refinedList, timestamp: new Date() };
            setChatMessages((prev) => {
                const updated = [...prev, aiMsg];
                persistConversation(updated, initialList.length, selections);
                return updated;
            });
            if (refinedList) setDisplayedList(refinedList);
            setWarehousesRevealed(true);
        } catch (err: any) {
            if (isAINotConfigured(err)) {
                const fallbackMsg: ChatMsg = {
                    id: (Date.now() + 1).toString(),
                    role: "ai",
                    content: `AI backend chưa được kết nối. Hiện đang hiển thị **${displayedList.length} kho** phù hợp tiêu chí đã chọn.\n\n_Khi AI backend sẵn sàng, bạn có thể hỏi các câu như: "Kho nào rẻ nhất?", "So sánh top 3", v.v._`,
                    timestamp: new Date(),
                };
                setChatMessages((prev) => [...prev, fallbackMsg]);
                setWarehousesRevealed(true);
                setAiError("AI_BACKEND_NOT_CONFIGURED");
            } else {
                toast.error("AI gặp lỗi, vui lòng thử lại.");
                setAiError(err.message ?? "Unknown error");
            }
        } finally {
            setChatLoading(false);
        }
    };

    const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
    };

    if (metaLoading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">Đang tải cấu hình AI...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (phase === "select") {
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
                <AISearchCriteria
                    selections={selections}
                    usage={usage}
                    totalSelected={totalSelected}
                    onToggle={handleToggle}
                    onSetSelection={handleSetSelection}
                    onReset={() => setSelections({})}
                    onSearch={handleInitialSearch}
                    filterMeta={filterMeta}
                    validationErrors={validationErrors}
                />
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />
            <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-14 z-10">
                <div className="max-w-[1400px] mx-auto px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <button onClick={() => setPhase("select")} className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors shrink-0">
                        <ArrowLeft className="h-4 w-4" /> Chỉnh sửa tiêu chí
                    </button>
                    <div className="hidden sm:block w-px h-4 bg-[var(--color-border)]" />
                    <SelectionSummary selections={selections} attributes={attributes} />
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-6">
                <div className="flex items-center gap-0 mb-6">
                    <div className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] px-4 py-2 text-sm">
                        <span className="w-5 h-5 border border-[var(--color-border)] flex items-center justify-center text-xs">1</span>
                        Chọn tiêu chí ✓
                    </div>
                    <div className="w-8 h-0.5 bg-[var(--color-primary)]" />
                    <div className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 text-sm">
                        <span className="w-5 h-5 border border-white flex items-center justify-center text-xs font-bold">2</span>
                        Kết quả + Chat AI
                    </div>
                </div>

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