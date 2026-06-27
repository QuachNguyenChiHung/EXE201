import { useState, useRef, useEffect, useCallback } from "react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { CompositeWarehouse, CompositeAiConversations } from "../../../types";
import { toast } from "sonner";
import { renterService } from "../../../services/renterService";
import { aiAPI } from "../../../services/apiClient";
import { isAINotConfigured } from "./aiSearchUtils";
import { AIChatPanel, ChatMsg } from "../../components/renter/AIChatPanel";
import { AIResultGrid } from "../../components/renter/AIResultGrid";
import { getUser } from "../../../utils/auth";

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
    warehouses?: CompositeWarehouse[];
    usage?: { input_tokens: number; output_tokens: number };
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

export default function AISearchWarehouse() {
    const currentUser = getUser();

    const [hasActiveTier, setHasActiveTier] = useState<boolean | null>(null);

    const [initialList, setInitialList] = useState<CompositeWarehouse[]>([]);
    const [displayedList, setDisplayedList] = useState<CompositeWarehouse[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
        {
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
        },
    ]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [warehousesRevealed, setWarehousesRevealed] = useState(false);

    const [_aiPayload, setAiPayload] = useState<AIRequestPayload | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

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
            aiAPI.saveConversation(record).catch((err) =>
                console.log("[ai/conv] Save error:", err?.message),
            );
        },
        [currentUser],
    );

    const callAIBackend = async (
        prompt: string,
        warehouses: CompositeWarehouse[],
        history: ChatMsg[],
    ): Promise<AIResponsePayload> => {
        const payload: AIRequestPayload = {
            prompt,
            criteria: {},
            matchingWarehouses: warehouses.slice(0, 12),
            conversationHistory: history.map((m) => ({ role: m.role, content: m.content })),
            isInitialHandshake: history.length === 0,
            hasCriteria: false,
        };
        setAiPayload(payload);
        return aiAPI.chat(payload);
    };

    // Best-effort: fetch the candidate universe the AI will reason about.
    // Returns [] on failure so callers can still proceed gracefully.
    const fetchInitialCandidates = useCallback(async (): Promise<CompositeWarehouse[]> => {
        try {
            const data = await renterService.searchWarehouses({ page: 0, size: 50 });
            return data.content || [];
        } catch (searchErr) {
            console.warn("[AISearch] candidate list failed, continuing with empty list:", searchErr);
            return [];
        }
    }, []);

    const handleChatSend = async (text?: string) => {
        const msg = (text ?? chatInput).trim();
        if (!msg || chatLoading) return;
        setChatInput("");
        setAiError(null);

        // Lazy-init on the first prompt: seed the conversation id, token counters,
        // and (if not already loaded) the candidate warehouse list. This replaces
        // the old auto-handshake and keeps the page quiet until the user engages.
        const isFirstPrompt = initialList.length === 0 && conversationIdRef.current === 0;
        if (isFirstPrompt) {
            conversationIdRef.current = Date.now();
            conversationCreatedAtRef.current = new Date().toISOString();
            cumulativeTokensRef.current = { input: 0, output: 0 };
            const candidates = await fetchInitialCandidates();
            if (candidates.length > 0) {
                setInitialList(candidates);
                setDisplayedList(candidates);
            }
        }

        const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: msg, timestamp: new Date() };
        setChatMessages((prev) => [...prev, userMsg]);

        setChatLoading(true);
        try {
            // Always read the freshest initialList — the lazy-init above may have
            // just set it on this very same tick.
            const universe = initialList.length > 0 ? initialList : await fetchInitialCandidates().then((c) => {
                if (c.length > 0) {
                    setInitialList(c);
                    setDisplayedList(c);
                }
                return c;
            });
            const response = await callAIBackend(
                msg,
                universe,
                [...chatMessages, userMsg].filter((m) => !m.id.startsWith("welcome-")),
            );

            if (response.usage) {
                cumulativeTokensRef.current.input += response.usage.input_tokens;
                cumulativeTokensRef.current.output += response.usage.output_tokens;
            }

            const refinedList = pickWarehouseList(response, initialList);

            const aiMsg: ChatMsg = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: response.text,
                refinedList: refinedList !== initialList ? refinedList : undefined,
                timestamp: new Date(),
            };
            setChatMessages((prev) => {
                const updated = [...prev, aiMsg];
                // Strip the static welcome banner — it's a UI hint, not a real AI turn.
                persistConversation(
                    updated.filter((m) => !m.id.startsWith("welcome-")),
                    initialList.length,
                );
                return updated;
            });
            setDisplayedList(refinedList);
            // If the BE explicitly returned a warehouse list, that becomes the new
            // candidate universe for subsequent follow-ups. Otherwise keep the original.
            if (response.warehouses && response.warehouses.length > 0) {
                setInitialList(response.warehouses);
            }
            setWarehousesRevealed(true);
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
                        Mô tả nhu cầu của bạn — AI sẽ tự động tìm kho phù hợp và cập nhật danh sách bên phải theo hội thoại.
                    </p>
                </div>
            </div>

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