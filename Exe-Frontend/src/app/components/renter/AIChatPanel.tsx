import React, { RefObject } from "react";
import { Sparkles, Bot, User, Send } from "lucide-react";
import { QUICK_SUGGESTIONS } from "../../pages/renter/aiSearchData";
import { CompositeWarehouse } from "../../../types";

export interface ChatMsg {
    id: string;
    role: "user" | "ai";
    content: string;
    refinedList?: CompositeWarehouse[];
    timestamp: Date;
}

interface AIChatPanelProps {
    displayedListCount: number;
    aiError: string | null;
    chatMessages: ChatMsg[];
    chatLoading: boolean;
    chatInput: string;
    chatScrollRef: RefObject<HTMLDivElement>;
    chatEndRef: RefObject<HTMLDivElement>;
    chatInputRef: RefObject<HTMLTextAreaElement>;
    setChatInput: (val: string) => void;
    handleChatSend: (text?: string) => void;
    handleChatKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

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

export function AIChatPanel({
    displayedListCount,
    aiError,
    chatMessages,
    chatLoading,
    chatInput,
    chatScrollRef,
    chatEndRef,
    chatInputRef,
    setChatInput,
    handleChatSend,
    handleChatKeyDown
}: AIChatPanelProps) {
    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col" style={{ position: "sticky", top: "120px", maxHeight: "calc(100vh - 140px)" }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-primary)] text-white shrink-0">
                <div className="w-7 h-7 bg-white bg-opacity-20 flex items-center justify-center"><Sparkles className="h-4 w-4" /></div>
                <div>
                    <p className="text-sm font-semibold">Hỏi AI để phân tích sâu hơn</p>
                    <p className="text-xs text-blue-200">
                        Đang phân tích {displayedListCount} kho
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
    );
}
