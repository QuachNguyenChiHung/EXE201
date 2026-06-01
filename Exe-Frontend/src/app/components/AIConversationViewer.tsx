import { useState, useEffect } from 'react';
import { aiAPI } from '../../services/apiClient';
import type { CompositeAiConversations as AIConversationRecord } from '../../types';
import {
  Sparkles, Bot, User as UserIcon, ChevronDown, ChevronUp,
  MessageSquare, Calendar, Warehouse, X,
} from 'lucide-react';
import { ATTRIBUTES } from '../pages/renter/aiSearchData';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/** Simple markdown renderer (bold + italic) */
function renderMd(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
    return (
      <span key={i} className={i > 0 ? 'block' : ''}>
        {parts.map((p, j) => {
          if (p.startsWith('**') && p.endsWith('**'))
            return <strong key={j}>{p.slice(2, -2)}</strong>;
          if (p.startsWith('_') && p.endsWith('_'))
            return <em key={j}>{p.slice(1, -1)}</em>;
          return p;
        })}
      </span>
    );
  });
}

function CriteriaChips({ criteria }: { criteria: Record<string, string[]> }) {
  const chips: string[] = [];
  ATTRIBUTES.forEach((attr) => {
    (criteria[attr.id] ?? []).forEach((v) => {
      const opt = attr.options.find((o) => o.value === v);
      if (opt) chips.push(opt.label);
    });
  });
  if (chips.length === 0) return <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Khong co tieu chi</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c, i) => (
        <span key={i} className="text-[10px] px-1.5 py-0.5" style={{ background: 'var(--color-primary-100, #e0e7ff)', color: 'var(--color-primary)' }}>{c}</span>
      ))}
    </div>
  );
}

// ── Single conversation card ──────────────────────────────────────────────────
function ConversationCard({ conv }: { conv: AIConversationRecord }) {
  const [expanded, setExpanded] = useState(false);
  const messages: any[] = conv.message || [];
  const userMsgCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-bg-secondary)] transition-colors"
      >
        <div className="w-7 h-7 shrink-0 flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
              {fmtDate(conv.create_at)}
            </p>
            <span className="text-[10px] px-1.5 py-0.5 flex items-center gap-1" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>
              <MessageSquare className="h-2.5 w-2.5" /> {messages.length} tin nhan
            </span>
            <span className="text-[10px] px-1.5 py-0.5 flex items-center gap-1" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>
              <Warehouse className="h-2.5 w-2.5" /> {conv.warehouseCount} kho
            </span>
            {(conv.total_input_tokens > 0 || conv.total_output_tokens > 0) && (
              <span className="text-[10px] px-1.5 py-0.5 flex items-center gap-1" style={{ background: 'var(--color-accent, #fef3c7)', color: 'var(--color-accent-dark, #92400e)' }}>
                <Sparkles className="h-2.5 w-2.5" /> {((conv.total_input_tokens ?? 0) + (conv.total_output_tokens ?? 0)).toLocaleString()} tokens
              </span>
            )}
          </div>
          <div className="mt-1">
            <CriteriaChips criteria={conv.criteria} />
          </div>
        </div>
        <div className="shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 py-3 space-y-2.5 max-h-[400px] overflow-y-auto" style={{ background: 'var(--color-bg-secondary)' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-5 h-5 shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'var(--color-primary)' }}>
                  <Bot className="h-3 w-3 text-white" />
                </div>
              )}
              <div
                className="max-w-[85%] px-3 py-2 text-xs leading-relaxed"
                style={{
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                }}
              >
                {msg.role === 'ai' ? renderMd(msg.content) : msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-5 h-5 shrink-0 flex items-center justify-center mt-0.5" style={{ background: 'var(--color-bg-tertiary, #e5e7eb)' }}>
                  <UserIcon className="h-3 w-3" style={{ color: 'var(--color-text-secondary)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Modal: View all conversations for a user ──────────────────────────────────
export function UserConversationsModal({
  userId,
  userName,
  onClose,
}: {
  userId: number;
  userName: string;
  onClose: () => void;
}) {
  const [convs, setConvs] = useState<AIConversationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    aiAPI.getConversationsByUser(userId)
      .then(setConvs)
      .catch((err) => console.log('[convs] Fetch error:', err?.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0" style={{ background: 'var(--color-primary)' }}>
          <div className="flex items-center gap-3 text-white">
            <Sparkles className="h-5 w-5" />
            <div>
              <p className="font-semibold text-sm">Lich su hoi thoai AI</p>
              <p className="text-xs opacity-80">{userName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                Dang tai...
              </div>
            </div>
          ) : convs.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Nguoi dung nay chua co hoi thoai AI nao.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {convs.length} cuoc hoi thoai
                </p>
                <span className="text-[10px] px-2 py-1 flex items-center gap-1" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                  <Sparkles className="h-3 w-3" />
                  Tong token: {convs.reduce((s, c) => s + (c.total_input_tokens ?? 0) + (c.total_output_tokens ?? 0), 0).toLocaleString()}
                  ({convs.reduce((s, c) => s + (c.total_input_tokens ?? 0), 0).toLocaleString()} in / {convs.reduce((s, c) => s + (c.total_output_tokens ?? 0), 0).toLocaleString()} out)
                </span>
              </div>
              {convs.map((c) => (
                <ConversationCard key={c.id_ai_conversations} conv={c} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}