import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { WarehouseCard } from '../../components/WarehouseCard';
import { Button } from '../../components/ui/button';
import { useApp } from '../../../context/AppContext';
import { ColdStorage } from '../../../types';
import {
  Heart,
  BarChart2,
  Trash2,
  X,
  Package,
  Thermometer,
  MapPin,
  Shield,
  Zap,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Sparkles,
  Send,
  ChevronRight,
  ChevronLeft,
  Star,
  MessageSquare,
  FileCheck,
  Calendar,
  Building2,
  Link as LinkIcon,
  Tag,
  LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'list' | 'compare';

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const UNIT_SHORT: Record<string, string> = { month: 'tháng', day: 'ngày', year: 'năm' };

const secLabel = (s: 'basic' | 'medium' | 'high') =>
  ({ basic: 'Cơ bản', medium: 'Trung bình', high: 'Cao' }[s]);

const availLabel = (a: string) =>
  ({ available: 'Còn trống', partially: 'Gần đầy', full: 'Đầy' }[a] ?? a);

// ── Certification full display ─────────────────────────────────────────────
function CertificationList({ warehouse }: { warehouse: ColdStorage }) {
  if (!warehouse.hasCertification || warehouse.certifications.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 py-3 px-4"
        style={{
          background: 'rgba(239,68,68,0.08)',
          border: '2px solid var(--color-error)',
        }}
      >
        <AlertTriangle className="h-6 w-6" style={{ color: 'var(--color-error)' }} />
        <span style={{ color: 'var(--color-error)', fontWeight: 700, fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.3 }}>
          CHƯA CÓ CHỨNG CHỈ
        </span>
        <span style={{ color: 'var(--color-error)', fontSize: '0.7rem', textAlign: 'center', opacity: 0.8 }}>
          Không đảm bảo tiêu chuẩn vệ sinh an toàn thực phẩm
        </span>
      </div>
    );
  }

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
  };

  const isExpired = (expiryDate: string) => new Date(expiryDate) < new Date();
  const isExpiringSoon = (expiryDate: string) => {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000; // within 90 days
  };

  return (
    <div className="flex flex-col gap-2 text-left">
      {warehouse.certifications.map((cert) => {
        const expired = isExpired(cert.expiryDate);
        const expiringSoon = !expired && isExpiringSoon(cert.expiryDate);
        return (
          <div
            key={cert.id}
            className="p-2 text-xs"
            style={{
              border: expired
                ? '1px solid var(--color-error)'
                : expiringSoon
                  ? '1px solid var(--color-warning)'
                  : '1px solid var(--color-success)',
              background: expired
                ? 'rgba(239,68,68,0.04)'
                : expiringSoon
                  ? 'rgba(245,158,11,0.04)'
                  : 'rgba(34,197,94,0.04)',
            }}
          >
            {/* Name row */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <FileCheck
                  className="h-3.5 w-3.5 flex-shrink-0"
                  style={{
                    color: expired
                      ? 'var(--color-error)'
                      : expiringSoon
                        ? 'var(--color-warning)'
                        : 'var(--color-success)',
                  }}
                />
                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{cert.name}</span>
              </div>
              {expired && (
                <span className="text-[9px] px-1 py-0.5" style={{ background: 'var(--color-error)', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Hết hạn
                </span>
              )}
              {expiringSoon && (
                <span className="text-[9px] px-1 py-0.5" style={{ background: 'var(--color-warning)', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Sắp hết hạn
                </span>
              )}
            </div>

            {/* Issuer */}
            <div className="flex items-center gap-1 mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span>{cert.issuer}</span>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-1 mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>Cấp: {fmtDate(cert.issueDate)}</span>
            </div>
            <div className="flex items-center gap-1" style={{ color: expired ? 'var(--color-error)' : expiringSoon ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>Hết hạn: {fmtDate(cert.expiryDate)}</span>
            </div>

            {/* Document link */}
            {cert.documentUrl && (
              <a
                href={cert.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 mt-1 transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                <LinkIcon className="h-3 w-3 flex-shrink-0" />
                <span style={{ textDecoration: 'underline' }}>Xem tài liệu</span>
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Price display ──────────────────────────────────────────────────────────
function PriceDisplay({ warehouse }: { warehouse: ColdStorage }) {
  const tiers = warehouse.priceTiers?.filter((t) => t.value > 0);

  if (tiers && tiers.length > 0) {
    return (
      <div className="flex flex-col gap-1.5 text-left">
        {tiers.map((tier, idx) => (
          <div key={tier.id} className="flex items-center gap-1.5">
            <Tag className="h-3 w-3 flex-shrink-0" style={{ color: idx === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
            <div>
              {tier.label && (
                <span className="text-[10px] block" style={{ color: 'var(--color-text-muted)' }}>
                  {tier.label}
                </span>
              )}
              <span style={{ fontWeight: idx === 0 ? 700 : 500, color: idx === 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontSize: idx === 0 ? '0.85rem' : '0.78rem' }}>
                {fmt(tier.value)}
                <span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  /m³/{UNIT_SHORT[tier.unit] ?? tier.unit}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Section-based pricing — show first tier of each section
  const sectionTiers = warehouse.sections
    ?.map((s) => ({ section: s, tier: s.priceTiers?.find((t) => t.value > 0) }))
    .filter((x): x is { section: typeof x.section; tier: NonNullable<typeof x.tier> } => !!x.tier);

  if (sectionTiers && sectionTiers.length > 0) {
    return (
      <div className="flex flex-col gap-1 text-left">
        {sectionTiers.map(({ section, tier }) => (
          <div key={section.id} className="flex items-center justify-between gap-2">
            <span className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)', maxWidth: 90 }}>
              {section.name}
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
              {fmt(tier.value)}
              <span style={{ fontWeight: 400, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                /{UNIT_SHORT[tier.unit] ?? tier.unit}
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Fallback: single pricePerCubicMeter
  return (
    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
      {fmt(warehouse.pricePerCubicMeter)}
      <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/m³/tháng</span>
    </span>
  );
}

// ── Sections display ───────────────────────────────────────────────────────
function SectionsDisplay({ warehouse }: { warehouse: ColdStorage }) {
  const secs = warehouse.sections;
  if (!secs || secs.length === 0) {
    return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Không có phân khu</span>;
  }

  const availColor = (a: string) =>
    a === 'available' ? 'var(--color-success)' : a === 'partially' ? 'var(--color-warning)' : 'var(--color-error)';
  const availLabel = (a: string) =>
    ({ available: 'Trống', partially: 'Gần đầy', full: 'Đầy' }[a] ?? a);

  return (
    <div className="flex flex-col gap-1.5 text-left">
      {secs.map((sec) => {
        const firstTier = sec.priceTiers?.find((t) => t.value > 0);
        return (
          <div
            key={sec.id}
            className="p-2 text-xs"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{sec.name}</span>
              <span style={{ color: availColor(sec.availability), fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {availLabel(sec.availability)}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: 'var(--color-text-muted)' }}>
              <span>{sec.capacity.toLocaleString()} m³</span>
              <span>{sec.temperatureMin}°C ~ {sec.temperatureMax}°C</span>
              {firstTier && (
                <span style={{ color: 'var(--color-primary)' }}>
                  {fmt(firstTier.value)}/{UNIT_SHORT[firstTier.unit] ?? firstTier.unit}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Compare rows — NO auto-highlight logic ─────────────────────────────────
interface CompareRow {
  label: string;
  icon: React.ReactNode;
  render: (w: ColdStorage) => React.ReactNode;
}

const ROWS: CompareRow[] = [
  {
    label: 'Vị trí',
    icon: <MapPin className="h-3.5 w-3.5" />,
    render: (w) => (
      <span>{w.location.city}, {w.location.province}</span>
    ),
  },
  {
    label: 'Tổng công suất',
    icon: <Package className="h-3.5 w-3.5" />,
    render: (w) => `${w.stats.totalCapacity.toLocaleString()} m³`,
  },
  {
    label: 'Còn trống',
    icon: <Package className="h-3.5 w-3.5" />,
    render: (w) => `${w.stats.availableCapacity.toLocaleString()} m³`,
  },
  {
    label: 'Nhiệt độ tối thiểu',
    icon: <Thermometer className="h-3.5 w-3.5" />,
    render: (w) => `${w.stats.temperatureMin}°C`,
  },
  {
    label: 'Nhiệt độ tối đa',
    icon: <Thermometer className="h-3.5 w-3.5" />,
    render: (w) => `${w.stats.temperatureMax}°C`,
  },
  {
    label: 'Độ ẩm',
    icon: <Zap className="h-3.5 w-3.5" />,
    render: (w) => `${w.stats.humidity}%`,
  },
  {
    label: 'Giá thuê',
    icon: <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>₫</span>,
    render: (w) => <PriceDisplay warehouse={w} />,
  },
  {
    label: 'Phân khu',
    icon: <LayoutGrid className="h-3.5 w-3.5" />,
    render: (w) => <SectionsDisplay warehouse={w} />,
  },
  {
    label: 'Bảo mật',
    icon: <Shield className="h-3.5 w-3.5" />,
    render: (w) => secLabel(w.stats.securityLevel),
  },
  {
    label: 'Dự phòng điện',
    icon: <Zap className="h-3.5 w-3.5" />,
    render: (w) =>
      w.stats.powerBackup ? (
        <span className="flex items-center justify-center gap-1" style={{ color: 'var(--color-success)' }}>
          <CheckCircle className="h-4 w-4" /> Có
        </span>
      ) : (
        <span style={{ color: 'var(--color-text-muted)' }}>Không</span>
      ),
  },
  {
    label: 'Chứng chỉ',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    render: (w) => <CertificationList warehouse={w} />,
  },
  {
    label: 'Tình trạng',
    icon: <Package className="h-3.5 w-3.5" />,
    render: (w) => {
      const color =
        w.availability === 'available'
          ? 'var(--color-success)'
          : w.availability === 'partially'
            ? 'var(--color-warning)'
            : 'var(--color-error)';
      return <span style={{ color, fontWeight: 500 }}>{availLabel(w.availability)}</span>;
    },
  },
];

// ── AI analysis (mock intelligence) ────────────────────────────────────────
interface AIMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  bestId?: string; // if AI sets a recommendation
}

function analyzeRequirements(
  requirements: string,
  warehouses: ColdStorage[],
): { bestId: string; reasoning: string } {
  const req = requirements.toLowerCase();
  type Scored = { w: ColdStorage; score: number; reasons: string[] };
  const scored: Scored[] = warehouses.map((w) => ({ w, score: 0, reasons: [] }));

  // Price
  if (/giá|rẻ|tiết kiệm|chi phí|cost|cheap/.test(req)) {
    const min = Math.min(...warehouses.map((w) => w.pricePerCubicMeter));
    scored.forEach((s) => {
      if (s.w.pricePerCubicMeter === min) {
        s.score += 4;
        s.reasons.push(`giá thuê thấp nhất (${fmt(s.w.pricePerCubicMeter)}/m³)`);
      }
    });
  }

  // Capacity
  if (/lớn|rộng|diện tích|công suất|m³|nhiều|capacity/.test(req)) {
    const max = Math.max(...warehouses.map((w) => w.stats.availableCapacity));
    scored.forEach((s) => {
      if (s.w.stats.availableCapacity === max) {
        s.score += 4;
        s.reasons.push(`diện tích trống lớn nhất (${s.w.stats.availableCapacity.toLocaleString()} m³)`);
      }
    });
  }

  // Cold / frozen temperature
  if (/lạnh|đông|âm|cold|frozen|nhiệt độ thấp|-\d+/.test(req)) {
    const min = Math.min(...warehouses.map((w) => w.stats.temperatureMin));
    scored.forEach((s) => {
      if (s.w.stats.temperatureMin === min) {
        s.score += 4;
        s.reasons.push(`nhiệt độ tối thiểu thấp nhất (${s.w.stats.temperatureMin}°C)`);
      }
    });
  }

  // Security
  if (/bảo mật|an toàn|bảo vệ|security|safe/.test(req)) {
    scored.forEach((s) => {
      if (s.w.stats.securityLevel === 'high') { s.score += 4; s.reasons.push('bảo mật cấp cao'); }
      else if (s.w.stats.securityLevel === 'medium') s.score += 1;
    });
  }

  // Certification
  if (/chứng chỉ|tiêu chuẩn|haccp|iso|chứng nhận|cert/.test(req)) {
    scored.forEach((s) => {
      if (s.w.hasCertification) {
        s.score += 4;
        s.reasons.push(`đã có ${s.w.certifications.length} chứng chỉ`);
      }
    });
  }

  // Power backup
  if (/điện|dự phòng|backup|power|cúp điện/.test(req)) {
    scored.forEach((s) => {
      if (s.w.stats.powerBackup) { s.score += 3; s.reasons.push('có hệ thống dự phòng điện'); }
    });
  }

  // Availability bonus
  scored.forEach((s) => {
    if (s.w.availability === 'available') s.score += 1;
    else if (s.w.availability === 'full') s.score -= 3;
  });

  // ── Universal certification penalty (always applies, regardless of query) ──
  // Warehouses without any certification are penalized heavily so they're
  // never picked as "best" unless every option lacks certification.
  scored.forEach((s) => {
    if (!s.w.hasCertification || s.w.certifications.length === 0) {
      s.score -= 10;
    }
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  const reasoning =
    best.reasons.length > 0
      ? `Dựa trên yêu cầu của bạn, **${best.w.name}** phù hợp nhất vì: ${best.reasons.join('; ')}.`
      : `Sau khi phân tích tổng thể, **${best.w.name}** là lựa chọn cân bằng nhất trong ${warehouses.length} kho đang so sánh, với tình trạng ${availLabel(best.w.availability).toLowerCase()} và giá ${fmt(best.w.pricePerCubicMeter)}/m³.`;

  return { bestId: best.w.id, reasoning };
}

/** Simulate streaming delay */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Requirement Prompt Modal ───────────────────────────────────────────────
interface PromptModalProps {
  count: number;
  onSkip: () => void;
  onAnalyze: (req: string) => void;
  onClose: () => void;
}

function PromptModal({ count, onSkip, onAnalyze, onClose }: PromptModalProps) {
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

// ── AI Chat Sidebar ────────────────────────────────────────────────────────
interface AIChatProps {
  warehouses: ColdStorage[];
  initialReq?: string;
  bestId: string | null;
  onBestChange: (id: string) => void;
  onClose: () => void;
}

function AIChatSidebar({ warehouses, initialReq, bestId, onBestChange, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initDone = useRef(false);

  const addAI = (text: string, newBestId?: string) => {
    const id = Math.random().toString(36).slice(2);
    setMessages((m) => [...m, { id, role: 'ai', text, bestId: newBestId }]);
    if (newBestId) onBestChange(newBestId);
  };

  // Run initial analysis if requirements were given
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
        `Xin chào! Tôi đang so sánh ${warehouses.length} kho lạnh cho bạn. Hãy mô tả nhu cầu của bạn (nhiệt độ, diện tích, giá, tiêu chuẩn...) và tôi sẽ chỉ ra kho phù hợp nhất.`,
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');

    const userMsgId = Math.random().toString(36).slice(2);
    setMessages((m) => [...m, { id: userMsgId, role: 'user', text }]);
    setThinking(true);

    await sleep(900 + Math.random() * 600);

    const { bestId: bid, reasoning } = analyzeRequirements(text, warehouses);
    addAI(reasoning, bid);
    setThinking(false);
  };

  /** Render AI text with **bold** markdown */
  const renderText = (text: string) => {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((p, i) =>
      i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>,
    );
  };

  return (
    <div
      className="flex flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)]"
      style={{ width: 320, minWidth: 280, maxWidth: 360 }}
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
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
            key={w.id}
            className="text-[10px] px-2 py-0.5 flex items-center gap-1"
            style={{
              border: w.id === bestId ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
              color: w.id === bestId ? 'var(--color-primary)' : 'var(--color-text-muted)',
              background: w.id === bestId ? 'rgba(37,99,235,0.06)' : 'transparent',
              fontWeight: w.id === bestId ? 700 : 400,
            }}
          >
            {w.id === bestId && <Star className="h-2.5 w-2.5" style={{ fill: 'var(--color-primary)' }} />}
            {w.name}
          </span>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 0 }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[90%] px-3 py-2 text-xs leading-relaxed"
              style={
                msg.role === 'user'
                  ? {
                      background: 'var(--color-primary)',
                      color: '#fff',
                    }
                  : {
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                    }
              }
            >
              {msg.role === 'ai' && msg.bestId && (
                <div
                  className="flex items-center gap-1 mb-1.5 pb-1.5"
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-primary)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <Star className="h-2.5 w-2.5" style={{ fill: 'var(--color-primary)' }} />
                  Phù hợp nhất: {warehouses.find((w) => w.id === msg.bestId)?.name}
                </div>
              )}
              {renderText(msg.text)}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 flex items-center gap-1.5"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--color-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Đang phân tích...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border)] px-3 py-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Hỏi thêm về nhu cầu..."
            rows={2}
            className="flex-1 text-xs border border-[var(--color-border)] px-2 py-1.5 resize-none focus:outline-none focus:border-[var(--color-primary)]"
            style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || thinking}
            className="flex items-center justify-center w-8 self-end pb-0.5 transition-colors disabled:opacity-40"
            style={{ color: 'var(--color-primary)' }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
          Enter để gửi · Shift+Enter xuống dòng
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function Bookmarks() {
  const navigate = useNavigate();
  const { bookmarkedIds: bookmarkIds, compareIds, warehouses: allWarehouses, toggleBookmark, toggleCompare, clearCompare, clearAllBookmarks } = useApp();

  const [warehouses, setWarehouses] = useState<ColdStorage[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewMode>('list');
  const [showPrompt, setShowPrompt] = useState(false);
  const [initialReq, setInitialReq] = useState<string | undefined>(undefined);
  const [showAI, setShowAI] = useState(true);
  const [bestId, setBestId] = useState<string | null>(null);

  // Derive bookmarked warehouses from Redux store
  useEffect(() => {
    if (bookmarkIds.length === 0) { setWarehouses([]); return; }
    const bookmarked = bookmarkIds
      .map((id) => allWarehouses.find((w) => w.id === id))
      .filter(Boolean) as ColdStorage[];
    setWarehouses(bookmarked);
  }, [bookmarkIds, allWarehouses]);

  const compareWarehouses = warehouses.filter((w) => compareIds.includes(w.id));

  const handleRemoveBookmark = async (id: string) => {
    await toggleBookmark(id);
    toast.success('Đã xoá khỏi danh sách lưu');
  };

  const handleClearAll = async () => {
    await clearAllBookmarks();
    toast.success('Đã xoá toàn bộ danh sách lưu');
    setView('list');
  };

  // "So sánh N kho" button → show prompt modal first
  const handleOpenPrompt = () => {
    if (compareIds.length < 2) { toast.error('Chọn ít nhất 2 kho để so sánh'); return; }
    setShowPrompt(true);
  };

  const enterCompare = (req?: string) => {
    setShowPrompt(false);
    setInitialReq(req);
    setBestId(null);
    setShowAI(true);
    setView('compare');
  };

  // ── Compare floating bar ──────────────────────────────────────────────────
  const CompareBar = () => {
    if (view !== 'list' || compareIds.length === 0) return null;
    return (
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 flex items-center justify-between gap-4"
        style={{ zIndex: 50 }}
      >
        <div className="flex items-center gap-3">
          <BarChart2 className="h-5 w-5 text-[var(--color-primary)]" />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Đã chọn{' '}
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              {compareIds.length}
            </span>{' '}
            / 3 kho để so sánh
          </span>
          <div className="hidden sm:flex items-center gap-2">
            {compareWarehouses.map((w) => (
              <span
                key={w.id}
                className="text-xs px-2 py-0.5 flex items-center gap-1"
                style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
              >
                {w.name}
                <button onClick={() => toggleCompare(w.id)} className="ml-1 opacity-60 hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => clearCompare()}
            className="text-xs transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            Xoá chọn
          </button>
          <Button
            onClick={handleOpenPrompt}
            disabled={compareIds.length < 2}
            className="rounded-none bg-[var(--color-primary)] text-white"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            So sánh {compareIds.length} kho
          </Button>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      {/* Requirement Prompt Modal */}
      {showPrompt && (
        <PromptModal
          count={compareIds.length}
          onClose={() => setShowPrompt(false)}
          onSkip={() => enterCompare(undefined)}
          onAnalyze={(req) => enterCompare(req)}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => { if (view === 'compare') setView('list'); else navigate(-1); }}
                className="flex items-center gap-1 text-sm transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                <ArrowLeft className="h-4 w-4" />
                {view === 'compare' ? 'Quay lại danh sách' : 'Quay lại'}
              </button>
            </div>
            <h1
              className="flex items-center gap-3"
              style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}
            >
              {view === 'compare' ? (
                <>
                  <BarChart2 className="h-6 w-6 text-[var(--color-primary)]" />
                  So sánh kho lạnh
                </>
              ) : (
                <>
                  <Heart className="h-6 w-6" style={{ color: 'var(--color-error)', fill: 'var(--color-error)' }} />
                  Kho đã lưu
                </>
              )}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {view === 'compare'
                ? `So sánh chi tiết ${compareWarehouses.length} kho · AI đề xuất kho phù hợp nhất`
                : `${bookmarkIds.length} kho lạnh đã lưu · chọn tối đa 3 kho để so sánh`}
            </p>
          </div>

          {view === 'list' && bookmarkIds.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-error)';
                e.currentTarget.style.color = 'var(--color-error)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xoá tất cả
            </button>
          )}

          {/* Compare view: AI toggle + re-analyze */}
          {view === 'compare' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrompt(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-[var(--color-primary)] transition-colors"
                style={{ color: 'var(--color-primary)' }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Phân tích lại
              </button>
              <button
                onClick={() => setShowAI((v) => !v)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 border transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {showAI ? 'Ẩn AI' : 'Hiện AI'}
                {showAI ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* ── EMPTY STATE */}
        {!loading && bookmarkIds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-20 h-20 flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.08)' }}
            >
              <Heart className="h-10 w-10" style={{ color: 'var(--color-error)', opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)' }}>
              Chưa có kho nào được lưu
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Nhấn vào biểu tượng ♥ trên thẻ kho lạnh để lưu vào đây
            </p>
            <Button
              onClick={() => navigate('/renter/search')}
              className="rounded-none bg-[var(--color-primary)] text-white mt-2"
            >
              Tìm kiếm kho lạnh
            </Button>
          </div>
        )}

        {/* ── LOADING */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          </div>
        )}

        {/* ── LIST VIEW */}
        {!loading && view === 'list' && warehouses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((w) => (
              <WarehouseCard key={w.id} warehouse={w} />
            ))}
          </div>
        )}

        {/* ── COMPARE VIEW */}
        {!loading && view === 'compare' && (
          <>
            {compareWarehouses.length < 2 ? (
              <div className="text-center py-16">
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Chọn ít nhất 2 kho trong danh sách để xem bảng so sánh.
                </p>
                <Button className="mt-4 rounded-none" onClick={() => setView('list')}>
                  Quay lại danh sách
                </Button>
              </div>
            ) : (
              <div className="flex gap-0 border border-[var(--color-border)]" style={{ minHeight: 600 }}>
                {/* ── Table panel */}
                <div className="flex-1 overflow-x-auto" style={{ minWidth: 0 }}>
                  <table className="w-full border-collapse text-sm table-fixed">
                    <colgroup>
                      <col style={{ width: '20%' }} />
                      {compareWarehouses.map((w) => (
                        <col key={w.id} style={{ width: `${80 / compareWarehouses.length}%` }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        {/* Label column */}
                        <th
                          className="border-b border-r border-[var(--color-border)] px-4 py-3 text-left"
                          style={{ background: 'var(--color-surface)' }}
                        />
                        {compareWarehouses.map((w) => {
                          const isBest = w.id === bestId;
                          return (
                            <th
                              key={w.id}
                              className="border-b border-r border-[var(--color-border)] px-4 py-3 min-w-[200px]"
                              style={{
                                background: isBest
                                  ? 'rgba(37,99,235,0.05)'
                                  : 'var(--color-surface)',
                              }}
                            >
                              {/* Best badge */}
                              {isBest && (
                                <div
                                  className="flex items-center justify-center gap-1 mb-2 py-1 text-xs"
                                  style={{
                                    background: 'var(--color-primary)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    fontSize: '0.65rem',
                                  }}
                                >
                                  <Star className="h-3 w-3" style={{ fill: '#fff' }} />
                                  Phù hợp nhất
                                </div>
                              )}
                              <div className="flex flex-col gap-1">
                                <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.9rem' }}>
                                  {w.name}
                                </span>
                                <span
                                  className="flex items-center gap-1 text-xs"
                                  style={{ color: 'var(--color-text-muted)' }}
                                >
                                  <MapPin className="h-3 w-3" />
                                  {w.location.province}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <button
                                    onClick={() => navigate(`/renter/warehouse/${w.id}`)}
                                    className="flex items-center gap-1 text-xs px-2 py-0.5 border border-[var(--color-primary)] transition-colors"
                                    style={{ color: 'var(--color-primary)' }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'var(--color-primary)';
                                      e.currentTarget.style.color = '#fff';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent';
                                      e.currentTarget.style.color = 'var(--color-primary)';
                                    }}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Xem chi tiết
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleRemoveBookmark(w.id);
                                      toggleCompare(w.id);
                                    }}
                                    className="flex items-center gap-1 text-xs px-2 py-0.5 border border-[var(--color-border)] transition-colors"
                                    style={{ color: 'var(--color-text-muted)' }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--color-error)';
                                      e.currentTarget.style.color = 'var(--color-error)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--color-border)';
                                      e.currentTarget.style.color = 'var(--color-text-muted)';
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                    Xoá
                                  </button>
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {ROWS.map((row, ri) => (
                        <tr
                          key={row.label}
                          style={{
                            background:
                              ri % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)',
                          }}
                        >
                          {/* Row label */}
                          <td className="border-b border-r border-[var(--color-border)] px-4 py-3">
                            <span
                              className="flex items-center gap-2"
                              style={{
                                color: 'var(--color-text-secondary)',
                                fontWeight: 500,
                                fontSize: '0.8rem',
                              }}
                            >
                              <span style={{ color: 'var(--color-text-muted)' }}>{row.icon}</span>
                              {row.label}
                            </span>
                          </td>
                          {compareWarehouses.map((w) => (
                            <td
                              key={w.id}
                              className="border-b border-r border-[var(--color-border)] px-4 py-3 text-center"
                              style={
                                w.id === bestId
                                  ? { background: 'rgba(37,99,235,0.04)' }
                                  : undefined
                              }
                            >
                              <span style={{ color: 'var(--color-text)' }}>
                                {row.render(w)}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── AI Chat Sidebar */}
                {showAI && (
                  <AIChatSidebar
                    key={`${compareIds.join('-')}-${initialReq ?? 'none'}`}
                    warehouses={compareWarehouses}
                    initialReq={initialReq}
                    bestId={bestId}
                    onBestChange={setBestId}
                    onClose={() => setShowAI(false)}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <CompareBar />
    </div>
  );
}