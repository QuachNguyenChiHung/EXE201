import { useState, useRef, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '../../ui/button';

interface PromptModalProps {
    count: number;
    onSkip: () => void;
    onAnalyze: (req: string) => void;
    onClose: () => void;
}

export function AIPromptModal({ count, onSkip, onAnalyze, onClose }: PromptModalProps) {
    const [text, setText] = useState('');
    const taRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => { taRef.current?.focus(); }, []);

    return (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 200, background: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
        >
            <div
                className="bg-[var(--color-surface)] border border-[var(--color-border)] w-full max-w-lg mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
                        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                            Mô tả nhu cầu trước khi so sánh
                        </span>
                    </div>
                    <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-4">
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        AI sẽ phân tích <strong style={{ color: 'var(--color-text)' }}>{count} kho</strong> đã chọn và đánh dấu kho phù hợp nhất với nhu cầu của bạn.
                    </p>
                    <textarea
                        ref={taRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Ví dụ: Tôi cần kho đông lạnh từ -20°C trở xuống, diện tích tối thiểu 500m³, có chứng chỉ HACCP, giá tốt nhất..."
                        rows={4}
                        className="w-full border border-[var(--color-border)] px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--color-primary)]"
                        style={{
                            background: 'var(--color-bg)',
                            color: 'var(--color-text)',
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && text.trim()) {
                                onAnalyze(text.trim());
                            }
                        }}
                    />
                    <div className="flex flex-wrap gap-2">
                        {['Kho đông lạnh -18°C', 'Giá rẻ nhất', 'Bảo mật cao', 'Có chứng chỉ', 'Diện tích lớn'].map((ex) => (
                            <button
                                key={ex}
                                onClick={() => setText((t) => t ? `${t}, ${ex.toLowerCase()}` : ex)}
                                className="text-xs px-2 py-1 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                                + {ex}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--color-border)]">
                    <button
                        onClick={onSkip}
                        className="text-sm px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text)] transition-colors"
                    >
                        Bỏ qua, chỉ xem bảng
                    </button>
                    <Button
                        onClick={() => text.trim() && onAnalyze(text.trim())}
                        disabled={!text.trim()}
                        className="rounded-none bg-[var(--color-primary)] text-white"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Phân tích AI
                    </Button>
                </div>
            </div>
        </div>
    );
}
