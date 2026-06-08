import { useState, useEffect, useCallback } from "react";
import { aiAPI } from "../../services/apiClient";
import type { AIStatusResult } from "../../types/api";
import {
  Bot,
  CheckCircle,
  XCircle,
  Loader,
  RefreshCw,
  Key,
  Zap,
  Clock,
  AlertTriangle,
  Cpu,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

type CheckPhase = "idle" | "checking" | "done";

export function AIStatusPanel() {
  const [status, setStatus] = useState<AIStatusResult | null>(null);
  const [phase, setPhase] = useState<CheckPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runCheck = useCallback(async () => {
    setPhase("checking");
    setError(null);
    try {
      const result = await aiAPI.status();
      setStatus(result);
      setLastChecked(new Date());
    } catch (err: any) {
      setError(err?.message ?? "Không thể kết nối đến server");
      setStatus(null);
    } finally {
      setPhase("done");
    }
  }, []);

  // Auto-check on mount
  useEffect(() => {
    runCheck();
  }, [runCheck]);

  const isChecking = phase === "checking";

  // Derive overall health
  const overallHealth: "healthy" | "degraded" | "down" | "unknown" =
    error
      ? "down"
      : !status
        ? "unknown"
        : status.keyConfigured && status.apiReachable
          ? "healthy"
          : status.keyConfigured && !status.apiReachable
            ? "degraded"
            : "down";

  const healthConfig = {
    healthy: {
      label: "Hoạt động tốt",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.2)",
      icon: <CheckCircle className="h-5 w-5" style={{ color: "#22c55e" }} />,
    },
    degraded: {
      label: "Có vấn đề",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      icon: <AlertTriangle className="h-5 w-5" style={{ color: "#f59e0b" }} />,
    },
    down: {
      label: "Không hoạt động",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.2)",
      icon: <XCircle className="h-5 w-5" style={{ color: "#ef4444" }} />,
    },
    unknown: {
      label: "Chưa kiểm tra",
      color: "var(--color-text-muted)",
      bg: "var(--color-bg-secondary)",
      border: "var(--color-border)",
      icon: <Bot className="h-5 w-5" style={{ color: "var(--color-text-muted)" }} />,
    },
  };

  const h = healthConfig[isChecking ? "unknown" : overallHealth];

  // Detail rows for expanded view
  const detailRows: Array<{
    label: string;
    icon: JSX.Element;
    value: string;
    status: "ok" | "warn" | "error" | "neutral";
  }> = [];

  if (status) {
    // API Key
    detailRows.push({
      label: "API Key",
      icon: <Key className="h-3.5 w-3.5" />,
      value: status.keyConfigured
        ? "Đã cấu hình"
        : "Chưa cấu hình — set ANTHROPIC_API_KEY",
      status: status.keyConfigured ? "ok" : "error",
    });

    // Model
    detailRows.push({
      label: "Model",
      icon: <Cpu className="h-3.5 w-3.5" />,
      value: status.model,
      status: "neutral",
    });

    // API Reachable
    detailRows.push({
      label: "Claude API",
      icon: status.apiReachable
        ? <Wifi className="h-3.5 w-3.5" />
        : <WifiOff className="h-3.5 w-3.5" />,
      value: status.apiReachable
        ? "Kết nối thành công"
        : status.keyConfigured
          ? status.error ?? "Không thể kết nối"
          : "Bỏ qua (chưa có key)",
      status: status.apiReachable ? "ok" : status.keyConfigured ? "error" : "warn",
    });

    // Latency
    if (status.latencyMs !== null) {
      const latencyStatus: "ok" | "warn" | "error" =
        status.latencyMs < 3000 ? "ok" : status.latencyMs < 8000 ? "warn" : "error";
      detailRows.push({
        label: "Latency",
        icon: <Clock className="h-3.5 w-3.5" />,
        value: `${status.latencyMs.toLocaleString()} ms`,
        status: latencyStatus,
      });
    }

    // Error detail
    if (status.error && status.keyConfigured) {
      detailRows.push({
        label: "Chi tiết lỗi",
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        value: status.error,
        status: "error",
      });
    }
  }

  if (error) {
    detailRows.push({
      label: "Server Error",
      icon: <XCircle className="h-3.5 w-3.5" />,
      value: error,
      status: "error",
    });
  }

  const statusColorMap = {
    ok: { bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.18)", text: "#16a34a" },
    warn: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.18)", text: "#d97706" },
    error: { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.18)", text: "#dc2626" },
    neutral: { bg: "rgba(59,130,246,0.04)", border: "rgba(59,130,246,0.12)", text: "var(--color-text-secondary)" },
  };

  return (
    <div
      className="mb-8 border"
      style={{
        background: "var(--color-surface)",
        borderColor: h.border,
      }}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--color-bg-secondary)] cursor-pointer"
      >
        {/* Icon */}
        <div
          className="w-10 h-10 flex items-center justify-center shrink-0"
          style={{ background: h.bg, border: `1px solid ${h.border}` }}
        >
          {isChecking ? (
            <Loader className="h-5 w-5 animate-spin" style={{ color: "var(--color-primary)" }} />
          ) : (
            h.icon
          )}
        </div>

        {/* Title + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              AI Service — Claude API
            </span>
            <span
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 font-semibold"
              style={{
                background: isChecking ? "rgba(59,130,246,0.1)" : h.bg,
                color: isChecking ? "#2563eb" : h.color,
              }}
            >
              {isChecking ? "Đang kiểm tra…" : h.label}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {status
              ? `Model: ${status.model}${status.latencyMs ? ` · ${status.latencyMs}ms` : ""}`
              : isChecking
                ? "Đang ping Claude API…"
                : "Nhấn để kiểm tra trạng thái AI backend"
            }
          </p>
        </div>

        {/* Right side: last checked + expand */}
        <div className="flex items-center gap-3 shrink-0">
          {lastChecked && (
            <span className="text-[10px] hidden sm:inline" style={{ color: "var(--color-text-muted)" }}>
              {lastChecked.toLocaleTimeString("vi-VN")}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); runCheck(); }}
            disabled={isChecking}
            className="w-7 h-7 flex items-center justify-center transition-colors disabled:opacity-40"
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
            }}
            title="Kiểm tra lại"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} style={{ color: "var(--color-text-muted)" }} />
          </button>
          {expanded ? (
            <ChevronUp className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
          ) : (
            <ChevronDown className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t px-5 py-4" style={{ borderColor: "var(--color-border)" }}>
          {/* Quick summary badges */}
          {status && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1"
                style={{
                  background: status.keyConfigured ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                  color: status.keyConfigured ? "#16a34a" : "#dc2626",
                  border: `1px solid ${status.keyConfigured ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                <Key className="h-3 w-3" />
                Key: {status.keyConfigured ? "OK" : "Missing"}
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1"
                style={{
                  background: status.apiReachable ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                  color: status.apiReachable ? "#16a34a" : "#dc2626",
                  border: `1px solid ${status.apiReachable ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                <Zap className="h-3 w-3" />
                API: {status.apiReachable ? "Reachable" : "Unreachable"}
              </span>
              {status.latencyMs !== null && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1"
                  style={{
                    background: "rgba(59,130,246,0.06)",
                    color: "#2563eb",
                    border: "1px solid rgba(59,130,246,0.15)",
                  }}
                >
                  <Clock className="h-3 w-3" />
                  {status.latencyMs}ms
                </span>
              )}
            </div>
          )}

          {/* Detail rows */}
          <div className="flex flex-col gap-1.5">
            {detailRows.map((row, i) => {
              const sc = statusColorMap[row.status];
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs"
                  style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
                >
                  <span style={{ color: sc.text }}>{row.icon}</span>
                  <span className="font-medium w-24 shrink-0" style={{ color: "var(--color-text-secondary)" }}>
                    {row.label}
                  </span>
                  <code
                    className="flex-1 min-w-0 truncate"
                    style={{ color: sc.text, fontSize: "11px" }}
                    title={row.value}
                  >
                    {row.value}
                  </code>
                </div>
              );
            })}
          </div>

          {/* Help text if not configured */}
          {status && !status.keyConfigured && (
            <div
              className="mt-4 px-4 py-3 flex items-start gap-3 text-xs"
              style={{
                background: "rgba(59,130,246,0.05)",
                border: "1px solid rgba(59,130,246,0.15)",
                color: "var(--color-text-secondary)",
              }}
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#2563eb" }} />
              <div>
                <p className="font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                  AI đang chạy ở chế độ Mock:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                  <li>Hiện tại hệ thống sử dụng mock AI responses</li>
                  <li>
                    Để kích hoạt AI thật, cần cấu hình <code className="px-1 py-0.5" style={{ background: "var(--color-bg-secondary)" }}>ANTHROPIC_API_KEY</code> từ{" "}
                    <a
                      href="https://console.anthropic.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 underline"
                      style={{ color: "var(--color-primary)" }}
                    >
                      console.anthropic.com <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </li>
                  <li>Mock mode vẫn cho phép test giao diện và workflow</li>
                </ol>
              </div>
            </div>
          )}

          {/* Recheck button */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={runCheck}
              disabled={isChecking}
              className="text-xs px-3 py-1.5 text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              style={{ background: "var(--color-primary)" }}
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Đang kiểm tra…" : "Kiểm tra lại"}
            </button>
            {lastChecked && (
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                Lần cuối: {lastChecked.toLocaleString("vi-VN")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}