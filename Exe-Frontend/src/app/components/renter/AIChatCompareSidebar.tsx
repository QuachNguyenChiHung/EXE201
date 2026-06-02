import { useState, useRef, useEffect } from 'react';
import { CompositeWarehouse } from '../../../types';
import { Sparkles, Bot, User, Send, Star, X } from 'lucide-react';

const fmt = (n: number | undefined) => {
    if (n === undefined) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
};

const availLabel = (a: string) =>
    ({ available: 'Còn trống', partially: 'Gần đầy', full: 'Đầy' }[a] ?? a);

export interface AIMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    bestId?: number;
}

export function analyzeRequirements(
    requirements: string,
    warehouses: CompositeWarehouse[],
): { bestId: number; reasoning: string } {
    const req = requirements.toLowerCase();
    type Scored = { w: CompositeWarehouse; score: number; reasons: string[] };
    const scored: Scored[] = warehouses.map((w) => ({ w, score: 0, reasons: [] }));

    // Price
    if (/giá|rẻ|tiết kiệm|chi phí|cost|cheap/.test(req)) {
        const min = Math.min(...warehouses.map((w) => w.pricePerCubicMeter || Infinity));
        scored.forEach((s) => {
            if (s.w.pricePerCubicMeter === min) {
                s.score += 4;
                s.reasons.push(`giá thuê thấp nhất (${fmt(s.w.pricePerCubicMeter)}/m³)`);
            }
        });
    }

    // Capacity
    if (/lớn|rộng|diện tích|công suất|m³|nhiều|capacity/.test(req)) {
        const max = Math.max(...warehouses.map((w) => w.stats?.availableCapacity || 0));
        scored.forEach((s) => {
            if (s.w.stats?.availableCapacity === max) {
                s.score += 4;
                s.reasons.push(`diện tích trống lớn nhất (${s.w.stats?.availableCapacity?.toLocaleString()} m³)`);
            }
        });
    }

    // Cold / frozen temperature
    if (/lạnh|đông|âm|cold|frozen|nhiệt độ thấp|-\d+/.test(req)) {
        const min = Math.min(...warehouses.map((w) => w.stats?.temperatureMin || Infinity));
        scored.forEach((s) => {
            if (s.w.stats?.temperatureMin === min) {
                s.score += 4;
                s.reasons.push(`nhiệt độ tối thiểu thấp nhất (${s.w.stats?.temperatureMin}°C)`);
            }
        });
    }

    // Security
    if (/bảo mật|an toàn|bảo vệ|security|safe/.test(req)) {
        scored.forEach((s) => {
            if (s.w.stats?.securityLevel === 'high') { s.score += 4; s.reasons.push('bảo mật cấp cao'); }
            else if (s.w.stats?.securityLevel === 'medium') s.score += 1;
        });
    }

    // Certification
    if (/chứng chỉ|tiêu chuẩn|haccp|iso|chứng nhận|cert/.test(req)) {
        scored.forEach((s) => {
            if (s.w.certifications && s.w.certifications.length > 0) {
                s.score += 4;
                s.reasons.push(`đã có ${s.w.certifications.length} chứng chỉ`);
            }
        });
    }

    // Power backup
    if (/điện|dự phòng|backup|power|cúp điện/.test(req)) {
        scored.forEach((s) => {
            if (s.w.stats?.powerBackup) { s.score += 3; s.reasons.push('có hệ thống dự phòng điện'); }
        });
    }

    // Availability bonus
    scored.forEach((s) => {
        if (s.w.availability === 'available') s.score += 1;
        else if (s.w.availability === 'full') s.score -= 3;
    });

    // Penalize missing certification
    scored.forEach((s) => {
        if (!s.w.certifications || s.w.certifications.length === 0) {
            s.score -= 10;
        }
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    const reasoning =
        best.reasons.length > 0
            ? `Dựa trên yêu cầu của bạn, **${best.w.name}** phù hợp nhất vì: ${best.reasons.join('; ')}.`
            : `Sau khi phân tích tổng thể, **${best.w.name}** là lựa chọn cân bằng nhất trong ${warehouses.length} kho đang so sánh, với tình trạng ${availLabel(best.w.availability || 'full').toLowerCase()} và giá ${fmt(best.w.pricePerCubicMeter)}/m³.`;

    return { bestId: best.w.id_warehouse, reasoning };
}

/** Simulate streaming delay */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface AIChatProps {
    warehouses: CompositeWarehouse[];
    initialReq?: string;
    bestId: number | null;
    onBestChange: (id: number) => void;
    onClose: () => void;
}

export function AIChatCompareSidebar({ warehouses, initialReq, bestId, onBestChange, onClose }: AIChatProps) {
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const initDone = useRef(false);

    const addAI = (text: string, newBestId?: number) => {
        const id = Math.random().toString(36).slice(2);
        setMessages((m) => [...m, { id, role: 'ai', text, bestId: newBestId }]);
        if (newBestId) onBestChange(newBestId);
    };

    useEffect(() => {
        if (initDone.current) return;
        initDone.current = true;

        if (initialReq) {
            const userMsgId = Math.random().toString(36).slice(2);
            setMessages([{ id: userMsgId, role: 'user', text: initialReq }]);
            setThinking(true);
            sleep(1200).then(() => {
                const { bestId: bid, reasoning } = analyzeRequirements(initialReq, warehouses);
                addAI(reasoning, bid);
                setThinking(false);
            });
        } else {
            addAI(
                `Tôi đang so sánh ${warehouses.length} kho lạnh. Bạn cần tìm kho thiên về yếu tố nào? (Ví dụ: "Kho nào rẻ nhất", "Ưu tiên diện tích lớn", hoặc "Cần chứng chỉ HACCP")`
            );
        }
    }, [warehouses, initialReq, onBestChange]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinking]);

    const handleSend = async () => {
        if (!input.trim() || thinking) return;
        const text = input.trim();
        setInput('');
        setMessages((m) => [...m, { id: Math.random().toString(), role: 'user', text }]);
        setThinking(true);

        await sleep(800 + Math.random() * 1000);
        const { bestId: bid, reasoning } = analyzeRequirements(text, warehouses);
        addAI(reasoning, bid);
        setThinking(false);
    };

    return (
        <div className="w-[320px] bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col flex-shrink-0 relative h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--color-border)]" style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>
                        Trợ lý AI
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Warehouse chips */}
            <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-[var(--color-border)]" style={{ background: 'var(--color-bg)' }}>
                {warehouses.map((w) => (
                    <span
                        key={w.id_warehouse}
                        className="text-[10px] px-2 py-0.5 flex items-center gap-1"
                        style={{
                            border: w.id_warehouse === bestId ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                            color: w.id_warehouse === bestId ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            background: w.id_warehouse === bestId ? 'rgba(37,99,235,0.06)' : 'transparent',
                            fontWeight: w.id_warehouse === bestId ? 700 : 400,
                        }}
                    >
                        {w.id_warehouse === bestId && <Star className="h-2.5 w-2.5" style={{ fill: 'var(--color-primary)' }} />}
                        {w.name}
                    </span>
                ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 0 }}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div
                            className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                            style={{
                                background: msg.role === 'user' ? 'var(--color-bg-secondary)' : 'var(--color-primary)',
                                color: msg.role === 'user' ? 'var(--color-text-muted)' : '#fff',
                            }}
                        >
                            {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                        </div>
                        <div
                            className="text-[0.8rem] px-3 py-2 leading-relaxed"
                            style={{
                                background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
                            }}
                            dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                        />
                    </div>
                ))}
                {thinking && (
                    <div className="flex gap-2">
                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 bg-[var(--color-primary)] text-white">
                            <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div className="px-3 py-2 bg-[var(--color-bg-secondary)] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[var(--color-border)] p-2">
                <div className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Hỏi AI..."
                        className="flex-1 text-[0.8rem] px-2 py-1.5 border border-[var(--color-border)] resize-none focus:outline-none focus:border-[var(--color-primary)]"
                        rows={2}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || thinking}
                        className="w-8 flex flex-col items-center justify-center bg-[var(--color-primary)] text-white disabled:opacity-50 transition-opacity"
                    >
                        <Send className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
