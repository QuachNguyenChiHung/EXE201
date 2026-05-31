import { useState, useRef, useEffect, useCallback } from "react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { ATTRIBUTES, QUICK_SUGGESTIONS } from "./aiSearchData";
import type { Attribute, AttrOption, SelectMode } from "./aiSearchData";

import { useApp } from "../../../context/AppContext";
import { WarehouseCard } from "../../components/WarehouseCard";
import { Button } from "../../components/ui/button";
import { ColdStorage, SUBSCRIPTION_TIERS } from "../../../types";
import {
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
  Send,
  ArrowLeft,
  Bot,
  User,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { aiAPI } from "../../../services/apiClient";
import type { AIConversationRecord } from "../../../services/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "select" | "results";

interface ChatMsg {
  id: string;
  role: "user" | "ai";
  content: string;
  refinedList?: ColdStorage[];
  timestamp: Date;
}

/** Payload shape sent to the AI mock backend */
export interface AIRequestPayload {
  prompt: string;
  criteria: Record<string, string[]>;
  matchingWarehouses: ColdStorage[];
  conversationHistory: { role: "user" | "ai"; content: string }[];
  isInitialHandshake: boolean;
  hasCriteria: boolean;
}

/** Expected response shape from the AI backend */
export interface AIResponsePayload {
  text: string;
  refinedWarehouseIds?: string[];
  usage?: { input_tokens: number; output_tokens: number };
}

// Helper to detect "AI not configured" errors from server
const isAINotConfigured = (err: any): boolean =>
  err?.message?.includes("ANTHROPIC_API_KEY") ||
  err?.message?.includes("AI_BACKEND_NOT_CONFIGURED") ||
  err?.message?.includes("AI_KEY_NOT_CONFIGURED");

// ─── Local filter ─────────────────────────────────────────────────────────────
function applyLocalFilter(
  warehouses: ColdStorage[],
  selections: Record<string, string[]>,
): ColdStorage[] {
  let result = warehouses.filter((w) => w.status === "active");

  const locs = selections["location"] ?? [];
  if (locs.length > 0 && !locs.includes("other")) {
    const provinceMap: Record<string, string[]> = {
      hanoi: ["Ha Noi"],
      hcmc: ["Ho Chi Minh"],
      danang: ["Da Nang"],
      haiphong: ["Hai Phong"],
      cantho: ["Can Tho"],
      binhduong: ["Binh Duong"],
      dongnai: ["Dong Nai"],
      vungtau: ["Vung Tau", "Ba Ria"],
      longan: ["Long An"],
    };
    const allowed = locs.flatMap((l) => provinceMap[l] ?? []);
    if (allowed.length > 0) {
      result = result.filter((w) =>
        allowed.some(
          (p) =>
            w.location.province.toLowerCase().includes(p.toLowerCase()) ||
            w.location.city.toLowerCase().includes(p.toLowerCase()),
        ),
      );
    }
  }

  const temps = selections["temperatureZone"] ?? [];
  if (temps.length > 0) {
    const ranges: Record<string, [number, number]> = {
      deep_freeze: [-30, -18],
      freeze: [-18, -10],
      cold: [-10, 0],
      cool: [0, 8],
      climate: [8, 15],
    };
    result = result.filter((w) =>
      temps.some((t) => {
        const [min, max] = ranges[t] ?? [-30, 15];
        const mainOk = w.stats.temperatureMin <= max && w.stats.temperatureMax >= min;
        const sectionOk =
          w.sections?.some((s) => s.temperatureMin <= max && s.temperatureMax >= min) ?? false;
        return mainOk || sectionOk;
      }),
    );
  }

  const caps = selections["capacity"] ?? [];
  if (caps.length > 0) {
    const ranges: Record<string, [number, number]> = {
      xs: [0, 200],
      sm: [200, 500],
      md: [500, 2000],
      lg: [2000, 5000],
      xl: [5000, Infinity],
    };
    result = result.filter((w) =>
      caps.some((c) => {
        const [min, max] = ranges[c] ?? [0, Infinity];
        const mainOk = w.stats.availableCapacity >= min && w.stats.availableCapacity <= max;
        const sectionOk =
          w.sections?.some((s) => s.availableCapacity >= min && s.availableCapacity <= max) ?? false;
        return mainOk || sectionOk;
      }),
    );
  }

  const budgets = selections["budget"] ?? [];
  if (budgets.length > 0 && !budgets.includes("any")) {
    const budgetRanges: Record<string, [number, number]> = {
      budget: [0, 200000],
      mid: [200001, 350000],
      high: [350001, 500000],
      premium: [500001, Infinity],
    };
    result = result.filter((w) =>
      budgets.some((b) => {
        const [min, max] = budgetRanges[b] ?? [0, Infinity];
        if (w.pricePerCubicMeter >= min && w.pricePerCubicMeter <= max) return true;
        if (w.priceTiers?.some((t) => t.unit === "month" && t.value >= min && t.value <= max))
          return true;
        return (
          w.sections?.some((s) =>
            s.priceTiers?.some((t) => t.unit === "month" && t.value >= min && t.value <= max),
          ) ?? false
        );
      }),
    );
  }

  const certs = (selections["certifications"] ?? []).filter((v) => v !== "none");
  if (certs.length > 0) {
    result = result.filter((w) => w.hasCertification);
  }

  const secLevels = (selections["security"] ?? []).filter((s) => s !== "any");
  if (secLevels.length > 0) {
    result = result.filter((w) => secLevels.includes(w.stats.securityLevel));
  }

  const availValues = (selections["availability"] ?? []).filter((a) => a !== "all");
  if (availValues.length > 0) {
    result = result.filter((w) => availValues.includes(w.availability));
  }

  // Sort by subscription tier boost (higher tier = higher priority)
  result.sort((a, b) => {
    const boostA = SUBSCRIPTION_TIERS[a.subscriptionTier ?? 'free'].boostFactor;
    const boostB = SUBSCRIPTION_TIERS[b.subscriptionTier ?? 'free'].boostFactor;
    if (boostB !== boostA) return boostB - boostA;
    return (b.ratingScore ?? 0) - (a.ratingScore ?? 0);
  });

  return result;
}

// ─── Build summary of filter results (fallback, no AI) ────────────────────────
function buildFilterSummary(list: ColdStorage[]): string {
  if (list.length === 0) {
    return "Không tìm thấy kho lạnh nào khớp với tất cả tiêu chí bạn chọn.\n\nThử bỏ bớt một vài điều kiện (ví dụ: mở rộng vùng địa lý, bỏ chứng nhận, hoặc tăng ngân sách).";
  }
  const certCount = list.filter((w) => w.hasCertification).length;
  const availCount = list.filter((w) => w.availability === "available").length;
  const fmtPrice = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  const minP = Math.min(...list.map((w) => w.pricePerCubicMeter));
  const maxP = Math.max(...list.map((w) => w.pricePerCubicMeter));
  return (
    `Tìm thấy **${list.length} kho lạnh** phù hợp với tiêu chí của bạn!\n\n` +
    `**Tổng quan nhanh:**\n` +
    `- ${availCount}/${list.length} kho còn trống ngay\n` +
    `- ${certCount}/${list.length} kho có chứng nhận\n` +
    `- Giá dao động: ${fmtPrice(minP)} – ${fmtPrice(maxP)}/m³/tháng\n\n` +
    `Hãy gửi câu hỏi để AI phân tích sâu hơn! Ví dụ: _"Kho nào rẻ nhất?"_, _"So sánh top 3"_, hoặc _"Chỉ kho bảo mật cao"_.`
  );
}

// ─── Simple markdown renderer ─────────────────────────────────────────────────
function renderMd(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
    return (
      <span key={i} className={i > 0 ? "block" : ""}>
        {parts.map((p, j) => {
          if (p.startsWith("**") && p.endsWith("**"))
            return <strong key={j}>{p.slice(2, -2)}</strong>;
          if (p.startsWith("_") && p.endsWith("_"))
            return <em key={j}>{p.slice(1, -1)}</em>;
          return p;
        })}
      </span>
    );
  });
}

// ─── Option chip ──────────────────────────────────────────────────────────────
function OptionChip({ option, selected, onClick }: { option: AttrOption; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`px-3 py-2 text-sm border transition-colors text-left w-full leading-tight ${
          selected
            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
            : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
        }`}
      >
        {option.label}
      </button>
      {hovered && (
        <div
          className="absolute z-20 bottom-full left-0 mb-2 bg-[var(--color-text)] text-white text-xs px-3 py-2 w-64 pointer-events-none"
          style={{ lineHeight: 1.5 }}
        >
          {option.hint}
          <div className="absolute top-full left-5 border-4 border-transparent border-t-[var(--color-text)]" />
        </div>
      )}
    </div>
  );
}

// ─── Attribute section ───────────────────────────────────────────────────────
function AttrSection({ attr, selections, onToggle }: { attr: Attribute; selections: Record<string, string[]>; onToggle: (id: string, v: string, m: SelectMode) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const selected = selections[attr.id] ?? [];

  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-[var(--color-surface)] hover:bg-[var(--color-bg-secondary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 flex items-center justify-center text-white shrink-0 ${selected.length > 0 ? "bg-[var(--color-primary)]" : "bg-[var(--color-text-muted)]"}`}>
            {attr.icon}
          </div>
          <span className="text-sm font-semibold">{attr.label}</span>
          {selected.length > 0 && (
            <span className="bg-[var(--color-primary)] text-white text-xs px-1.5 py-0.5 leading-none">{selected.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[var(--color-text-muted)] shrink-0">
          <span className="text-xs hidden sm:inline">{attr.mode === "multi" ? "Chọn nhiều" : "Chọn một"}</span>
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </button>
      {!collapsed && (
        <div className="px-5 pb-5 bg-[var(--color-surface)]">
          <div className="flex items-start gap-2 mt-0 mb-4 bg-[var(--color-bg-secondary)] px-3 py-2.5">
            <Info className="h-3.5 w-3.5 text-[var(--color-info)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{attr.explanation}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {attr.options.map((opt) => (
              <OptionChip key={opt.value} option={opt} selected={selected.includes(opt.value)} onClick={() => onToggle(attr.id, opt.value, attr.mode)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Selection summary chips (Phase 2 header) ────────────────────────────────
function SelectionSummary({ selections }: { selections: Record<string, string[]> }) {
  const chips: string[] = [];
  ATTRIBUTES.forEach((attr) => {
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AISearchWarehouse() {
  const { warehouses: allWarehouses, user: currentUser } = useApp();

  const [phase, setPhase] = useState<Phase>("select");
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [usage, setUsage] = useState<{ monthlyQueries: number; monthlyCost: number } | null>(null);

  const [initialList, setInitialList] = useState<ColdStorage[]>([]);
  const [displayedList, setDisplayedList] = useState<ColdStorage[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [warehousesRevealed, setWarehousesRevealed] = useState(false);

  const [_aiPayload, setAiPayload] = useState<AIRequestPayload | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const conversationIdRef = useRef<string>("");
  const conversationCreatedAtRef = useRef<string>("");
  const cumulativeTokensRef = useRef<{ input: number; output: number }>({ input: 0, output: 0 });

  useEffect(() => {
    // Scroll only within the chat container, not the whole page
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatMessages, chatLoading]);

  // ── Persist conversation to backend (fire-and-forget) ─────────────────────
  const persistConversation = useCallback(
    (msgs: ChatMsg[], whCount: number, criteria: Record<string, string[]>) => {
      if (!currentUser || !conversationIdRef.current || msgs.length === 0) return;
      const record: AIConversationRecord = {
        id: conversationIdRef.current,
        userId: currentUser.id_user,
        userName: currentUser.name,
        userEmail: currentUser.email,
        criteria,
        messages: msgs.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        })),
        warehouseCount: whCount,
        totalInputTokens: cumulativeTokensRef.current.input,
        totalOutputTokens: cumulativeTokensRef.current.output,
        createdAt: conversationCreatedAtRef.current,
        updatedAt: new Date().toISOString(),
      };
      aiAPI.saveConversation(record).catch((err) =>
        console.log("[ai/conv] Save error:", err?.message),
      );
    },
    [currentUser],
  );

  const totalSelected = Object.values(selections).flat().length;

  const handleToggle = (attrId: string, value: string, mode: SelectMode) => {
    setSelections((prev) => {
      const cur = prev[attrId] ?? [];
      const next =
        mode === "single"
          ? cur.includes(value) ? [] : [value]
          : cur.includes(value)
            ? cur.filter((v) => v !== value)
            : [...cur, value];
      return { ...prev, [attrId]: next };
    });
  };

  // ── Build & send AI request ───────────────────────────────────────────────
  const callAIBackend = async (
    prompt: string,
    criteria: Record<string, string[]>,
    warehouses: ColdStorage[],
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

  // Phase 1 → Phase 2: filter locally, then auto-call AI backend
  const handleInitialSearch = async () => {
    const hasCriteria = totalSelected > 0;
    const filtered = hasCriteria
      ? applyLocalFilter(allWarehouses, selections)
      : allWarehouses.filter((w) => w.status === "active");

    setInitialList(filtered);
    setDisplayedList(filtered);
    setChatMessages([]);
    setWarehousesRevealed(false);
    setAiError(null);
    setPhase("results");
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);

    // Auto-call AI backend (initial handshake)
    setChatLoading(true);
    // Generate new conversation ID for this session
    conversationIdRef.current = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    conversationCreatedAtRef.current = new Date().toISOString();
    cumulativeTokensRef.current = { input: 0, output: 0 };
    try {
      const response = await callAIBackend("", hasCriteria ? selections : {}, filtered, []);

      // Accumulate token usage
      if (response.usage) {
        cumulativeTokensRef.current.input += response.usage.input_tokens;
        cumulativeTokensRef.current.output += response.usage.output_tokens;
      }

      const aiMsg: ChatMsg = { id: "greeting-" + Date.now(), role: "ai", content: response.text, timestamp: new Date() };
      setChatMessages([aiMsg]);
      // Persist initial greeting
      persistConversation([aiMsg], filtered.length, hasCriteria ? selections : {});

      if (response.refinedWarehouseIds) {
        const idSet = new Set(response.refinedWarehouseIds);
        const refined = filtered.filter((w) => idSet.has(w.id));
        refined.sort((a, b) => response.refinedWarehouseIds!.indexOf(a.id) - response.refinedWarehouseIds!.indexOf(b.id));
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

  // Send chat message
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

      // Accumulate token usage
      if (response.usage) {
        cumulativeTokensRef.current.input += response.usage.input_tokens;
        cumulativeTokensRef.current.output += response.usage.output_tokens;
      }

      let refinedList: ColdStorage[] | undefined;
      if (response.refinedWarehouseIds) {
        const idSet = new Set(response.refinedWarehouseIds);
        refinedList = initialList.filter((w) => idSet.has(w.id));
        refinedList.sort((a, b) => response.refinedWarehouseIds!.indexOf(a.id) - response.refinedWarehouseIds!.indexOf(b.id));
      }

      const aiMsg: ChatMsg = { id: (Date.now() + 1).toString(), role: "ai", content: response.text, refinedList, timestamp: new Date() };
      setChatMessages((prev) => {
        const updated = [...prev, aiMsg];
        // Persist updated conversation
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

  const fmtCurrency = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

  // ── PHASE 1: Attribute selection ──────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <div className="bento-container">
          <div className="bento-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-[var(--color-accent)] flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">Bước 1 / 2</span>
              </div>
              <h1>Chọn tiêu chí kho lạnh</h1>
              <p className="text-[var(--color-text-secondary)] mt-1 max-w-lg">
                Chọn các thuộc tính phù hợp với nhu cầu của bạn. Mỗi lựa chọn có giải thích chi tiết. Sau đó AI sẽ lọc kết quả và bạn có thể chat để phân tích sâu hơn.
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-2 max-w-lg border-l-2 border-[var(--color-border)] pl-3 leading-relaxed">
                <span className="font-medium text-[var(--color-text-secondary)]">Mẹo tiết kiệm:</span> Càng cung cấp nhiều tiêu chí và thông tin chi tiết ở bước này, AI càng lọc chính xác ngay từ đầu — giúp <span className="font-medium text-[var(--color-text-secondary)]">giảm chi phí sử dụng AI</span> do hạn chế các lượt chat phân tích lặp lại ở bước sau.
              </p>
            </div>
            {usage && (
              <div className="flex gap-px bg-[var(--color-border)] shrink-0">
                <div className="bg-[var(--color-surface)] px-4 py-3 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">Truy vấn tháng</p>
                  <p className="font-extrabold text-lg">{usage.monthlyQueries}</p>
                </div>
                <div className="bg-[var(--color-surface)] px-4 py-3 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">Chi phí tháng</p>
                  <p className="font-extrabold text-lg">{fmtCurrency(usage.monthlyCost)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 mb-6 justify-between">
            <div className="flex items-center gap-0">
              <div className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 text-sm">
                <span className="w-5 h-5 border border-white flex items-center justify-center text-xs font-bold">1</span>
                Chọn tiêu chí
              </div>
              <div className="w-8 h-0.5 bg-[var(--color-border)]" />
              <div className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] px-4 py-2 text-sm">
                <span className="w-5 h-5 border border-[var(--color-border)] flex items-center justify-center text-xs">2</span>
                Kết quả + Chat AI
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalSelected > 0 && (
                <button onClick={() => setSelections({})} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1 transition-colors">
                  <RotateCcw className="h-3 w-3" /> Đặt lại
                </button>
              )}
              <Button onClick={handleInitialSearch} className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] h-9 text-sm px-4">
                {totalSelected === 0 ? "Xem tất cả kho →" : `Xem kết quả (${totalSelected} tiêu chí) →`}
              </Button>
            </div>
          </div>

          {/* Attributes */}
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] mb-6">
            {ATTRIBUTES.map((attr) => (
              <AttrSection key={attr.id} attr={attr} selections={selections} onToggle={handleToggle} />
            ))}
          </div>

          {/* Action bar */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {totalSelected > 0 ? (
                  <>Đã chọn <span className="font-bold text-[var(--color-text)]">{totalSelected}</span> tiêu chí</>
                ) : (
                  <span className="text-[var(--color-text-muted)]">Chưa chọn tiêu chí nào — sẽ hiển thị tất cả kho</span>
                )}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Kết quả sẽ được lọc ngay lập tức — không mất phí AI ở bước này</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelections({})} disabled={totalSelected === 0} className="rounded-none border border-[var(--color-border)]">
                <RotateCcw className="h-4 w-4 mr-2" /> Đặt lại
              </Button>
              <Button onClick={handleInitialSearch} className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]">
                {totalSelected === 0 ? "Xem tất cả kho →" : "Xem kết quả & Chat AI →"}
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── PHASE 2: Results + Chat ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-14 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <button onClick={() => setPhase("select")} className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" /> Chỉnh sửa tiêu chí
          </button>
          <div className="hidden sm:block w-px h-4 bg-[var(--color-border)]" />
          <SelectionSummary selections={selections} />
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
          {/* Left: Chat panel */}
          <div className="lg:col-span-2">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col" style={{ position: "sticky", top: "120px", maxHeight: "calc(100vh - 140px)" }}>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-primary)] text-white shrink-0">
                <div className="w-7 h-7 bg-white bg-opacity-20 flex items-center justify-center"><Sparkles className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold">Hỏi AI để phân tích sâu hơn</p>
                  <p className="text-xs text-blue-200">
                    Đang phân tích {displayedList.length} kho
                    {aiError === "AI_BACKEND_NOT_CONFIGURED" && <span className="ml-1 text-yellow-300">(chưa kết nối AI)</span>}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" ref={chatScrollRef}>
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "ai" && (
                      <div className="w-6 h-6 bg-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5"><Bot className="h-3.5 w-3.5 text-white" /></div>
                    )}
                    <div className={`max-w-[85%] px-3 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-bg-secondary)] text-[var(--color-text)]"}`}>
                      {msg.role === "ai" ? renderMd(msg.content) : msg.content}
                      {msg.refinedList && (
                        <div className="mt-2 pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">↑ Danh sách bên phải đã cập nhật ({msg.refinedList.length} kho)</div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0 mt-0.5"><User className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" /></div>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 bg-[var(--color-primary)] flex items-center justify-center shrink-0"><Bot className="h-3.5 w-3.5 text-white" /></div>
                    <div className="bg-[var(--color-bg-secondary)] px-3 py-2.5 flex items-center gap-1.5">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="w-1.5 h-1.5 bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="px-3 py-2 border-t border-[var(--color-border)] shrink-0">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {QUICK_SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => handleChatSend(s)} disabled={chatLoading} className="whitespace-nowrap text-xs px-2.5 py-1.5 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors shrink-0 disabled:opacity-40">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] p-3 flex gap-2 shrink-0">
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Hỏi AI thêm... (Enter để gửi)"
                  rows={2}
                  disabled={chatLoading}
                  className="flex-1 text-sm px-3 py-2 border border-[var(--color-border)] resize-none focus:outline-none focus:border-[var(--color-primary)] transition-colors bg-[var(--color-surface)] disabled:opacity-50"
                />
                <button onClick={() => handleChatSend()} disabled={!chatInput.trim() || chatLoading} className="w-10 h-10 self-end bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-40 shrink-0">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-3">
            {!warehousesRevealed ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col items-center justify-center text-center" style={{ minHeight: "480px" }}>
                <div className="w-16 h-16 bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-5"><Sparkles className="h-8 w-8 text-[var(--color-text-muted)]" /></div>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto leading-relaxed">
                  Đặt câu hỏi cho AI ở bên trái để xem danh sách kho phù hợp.<br /><br />
                  Ví dụ: <em>"Kho nào rẻ nhất?"</em> hoặc <em>"So sánh top 3 lựa chọn"</em>.
                </p>
              </div>
            ) : displayedList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
                {displayedList.map((w) => (
                  <WarehouseCard key={w.id} warehouse={w} compact openInNewTab />
                ))}
              </div>
            ) : (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-12 text-center">
                <div className="w-14 h-14 bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-4"><AlertCircle className="h-7 w-7 text-[var(--color-text-muted)]" /></div>
                <h3 className="mb-2">Không có kết quả</h3>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto">Thử hỏi AI để gợi ý điều chỉnh, hoặc quay lại bước 1 để thay đổi tiêu chí.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}