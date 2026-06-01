import { useEffect, useState } from "react";
import { healthAPI, seedAPI, aiAPI } from "../../services/apiClient";
import { MockUsers } from "../../data/mockUsers";
import { MockWarehouseData } from "../../data/mockWarehouses";
import { MockCompositeRentRequests } from "../../data/mockRequests";
import { MockCompositeContracts } from "../../data/mockContracts";
import { MockRatings } from "../../data/mockRatings";
import {
  CheckCircle, XCircle, Loader, Database, Server, Key, Layers,
  Brain, HardDrive, RefreshCw, Upload, AlertTriangle, Table2,
} from "lucide-react";

type Status = "checking" | "ok" | "error" | "warn";

interface CheckResult {
  label: string;
  icon: JSX.Element;
  status: Status;
  detail?: string;
}

interface TableCount {
  name: string;
  count: number;
}

export function SystemStatus() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [tableCounts, setTableCounts] = useState<TableCount[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedLog, setSeedLog] = useState<string | null>(null);

  useEffect(() => {
    runChecks();
  }, []);

  async function runChecks() {
    setRunning(true);
    setSeedLog(null);
    const results: CheckResult[] = [];

    // ── 1. Mock Data Status ─────────────────────────────────────────────────
    results.push({
      label: "Mock Data Mode",
      icon: <Key className="h-3.5 w-3.5" />,
      status: "ok",
      detail: "Using in-memory mock data",
    });
    setChecks([...results]);

    // ── 2. Health Check ─────────────────────────────────────────────────────
    try {
      const data = await healthAPI.check();
      results.push({
        label: "System Health",
        icon: <Server className="h-3.5 w-3.5" />,
        status: data.status === "ok" ? "ok" : "error",
        detail: data.status === "ok" ? "All systems operational" : JSON.stringify(data),
      });
    } catch (e: any) {
      results.push({ label: "System Health", icon: <Server className="h-3.5 w-3.5" />, status: "error", detail: e?.message });
    }
    setChecks([...results]);

    // ── 3. Data Store Connection ────────────────────────────────────────────
    try {
      const data = await healthAPI.kvPing();
      results.push({
        label: "Data Store",
        icon: <Database className="h-3.5 w-3.5" />,
        status: data.status === "ok" ? "ok" : "error",
        detail: data.message,
      });
    } catch (e: any) {
      results.push({ label: "Data Store", icon: <Database className="h-3.5 w-3.5" />, status: "error", detail: e?.message });
    }
    setChecks([...results]);

    // ── 4. Tables & row counts ──────────────────────────────────────────────
    try {
      const data = await seedAPI.status();
      const counts = data.counts ?? {};
      const totalRecords = Object.values(counts).reduce((a: number, b) => a + (b as number), 0);
      const tables: TableCount[] = Object.entries(counts).map(([name, count]) => ({ name, count: count as number }));
      setTableCounts(tables);

      results.push({
        label: "Bảng dữ liệu",
        icon: <Table2 className="h-3.5 w-3.5" />,
        status: (totalRecords as number) > 0 ? "ok" : "warn",
        detail: `${Object.keys(counts).length} bảng — ${totalRecords} records`,
      });
    } catch (e: any) {
      setTableCounts([]);
      results.push({ label: "Bảng dữ liệu", icon: <Table2 className="h-3.5 w-3.5" />, status: "error", detail: e?.message });
    }
    setChecks([...results]);

    // ── 5. Seed meta ────────────────────────────────────────────────────────
    try {
      const data = await seedAPI.check();
      results.push({
        label: "Seed Status",
        icon: <Layers className="h-3.5 w-3.5" />,
        status: data.seeded ? "ok" : "warn",
        detail: data.seeded
          ? `Seeded lúc ${new Date(data.meta?.ts).toLocaleString("vi-VN")}`
          : "Chưa seed",
      });
    } catch (e: any) {
      results.push({ label: "Seed Status", icon: <Layers className="h-3.5 w-3.5" />, status: "warn", detail: "Chưa seed hoặc lỗi" });
    }
    setChecks([...results]);

    // ── 6. AI Service (Mock) ────────────────────────────────────────────────
    try {
      const data = await aiAPI.status();
      const aiOk = data.keyConfigured && data.apiReachable;
      results.push({
        label: "AI Service (Mock)",
        icon: <Brain className="h-3.5 w-3.5" />,
        status: aiOk ? "ok" : "warn",
        detail: aiOk
          ? `${data.model} — ${data.latencyMs}ms`
          : "Mock AI responses",
      });
    } catch (e: any) {
      results.push({ label: "AI Service (Mock)", icon: <Brain className="h-3.5 w-3.5" />, status: "warn", detail: "Mock mode" });
    }
    setChecks([...results]);

    // ── 7. Storage (Mock) ───────────────────────────────────────────────────
    results.push({
      label: "Storage (Mock)",
      icon: <HardDrive className="h-3.5 w-3.5" />,
      status: "ok",
      detail: "Mock file uploads enabled",
    });
    setChecks([...results]);

    setRunning(false);
  }

  async function handleSeed() {
    setSeeding(true);
    setSeedLog("Đang seed dữ liệu mẫu (force overwrite)…");
    try {
      const result = await seedAPI.seed(
        {
          users: MockUsers,
          warehouses: MockWarehouseData,
          requests: MockCompositeRentRequests,
          contracts: MockCompositeContracts,
          ratings: MockRatings,
        },
        true, // force
        "manual-reseed-v2",
      );
      if ((result as any).status === "already_seeded") {
        setSeedLog("⚠ Đã seed rồi — hãy dùng force=true (đã bật)");
      } else {
        const counts = (result as any).counts;
        const total = counts ? Object.values(counts).reduce((a: any, b: any) => a + b, 0) : "?";
        setSeedLog(`✓ Seed thành công! ${total} records. Đang reload…`);
        // Re-run checks after seed
        setTimeout(() => runChecks(), 500);
      }
    } catch (err: any) {
      setSeedLog(`✗ Seed thất bại: ${err?.message}`);
    } finally {
      setSeeding(false);
    }
  }

  const overallOk = checks.length > 0 && checks.every(c => c.status === "ok");
  const hasError = checks.some(c => c.status === "error");
  const hasWarn = checks.some(c => c.status === "warn");
  const isChecking = running;

  const overallStatus: Status = isChecking ? "checking" : hasError ? "error" : hasWarn ? "warn" : "ok";

  const statusIcon: Record<Status, JSX.Element> = {
    ok: <CheckCircle className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
    warn: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    checking: <Loader className="h-4 w-4 text-blue-400 animate-spin" />,
  };

  const smallIcon: Record<Status, JSX.Element> = {
    ok: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
    error: <XCircle className="h-3.5 w-3.5 text-red-500" />,
    warn: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
    checking: <Loader className="h-3.5 w-3.5 text-blue-400 animate-spin" />,
  };

  const statusColor: Record<Status, { bg: string; border: string; text: string; badge: string }> = {
    ok: { bg: "rgba(34,197,94,0.05)", border: "rgba(34,197,94,0.15)", text: "#16a34a", badge: "rgba(34,197,94,0.12)" },
    error: { bg: "rgba(239,68,68,0.05)", border: "rgba(239,68,68,0.15)", text: "#dc2626", badge: "rgba(239,68,68,0.12)" },
    warn: { bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.15)", text: "#d97706", badge: "rgba(245,158,11,0.12)" },
    checking: { bg: "rgba(59,130,246,0.05)", border: "rgba(59,130,246,0.15)", text: "#2563eb", badge: "rgba(59,130,246,0.12)" },
  };

  const overallLabel = isChecking
    ? "Đang kiểm tra…"
    : overallOk
      ? "Tất cả hoạt động tốt"
      : hasError
        ? "Có lỗi"
        : "Cảnh báo";

  return (
    <div style={{
      border: "1px solid var(--color-border)",
      padding: "12px 16px",
      fontSize: "12px",
      fontFamily: "monospace",
      marginTop: "16px",
    }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          cursor: "pointer", background: "none", border: "none",
          padding: 0, width: "100%", textAlign: "left",
        }}
      >
        {statusIcon[overallStatus]}
        <span style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "12px" }}>
          System Diagnostics
        </span>
        <span style={{
          marginLeft: "4px", padding: "1px 8px", fontSize: "10px",
          background: statusColor[overallStatus].badge,
          color: statusColor[overallStatus].text,
          letterSpacing: "0.08em", textTransform: "uppercase" as const,
        }}>
          {overallLabel}
        </span>
        {!isChecking && (
          <span style={{
            marginLeft: "4px", padding: "1px 6px", fontSize: "10px",
            color: "var(--color-text-muted)", background: "rgba(0,0,0,0.04)",
          }}>
            {checks.filter(c => c.status === "ok").length}/{checks.length} passed
          </span>
        )}
        <span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: "10px" }}>
          {expanded ? "▲ Thu gọn" : "▼ Chi tiết"}
        </span>
      </button>

      {/* ── Expanded panel ─────────────────────────────────────────────────── */}
      {expanded && (
        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Connection info */}
          <div style={{
            background: "rgba(37,99,235,0.05)",
            border: "1px solid rgba(37,99,235,0.12)",
            padding: "8px 10px",
          }}>
            <div style={{
              color: "var(--color-text-muted)", fontSize: "10px",
              textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "4px",
            }}>
              Data Mode
            </div>
            <div style={{ color: "var(--color-text-muted)" }}>
              Mode: <code style={{ color: "var(--color-primary)" }}>Mock Data (In-Memory)</code>
            </div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "10px", marginTop: "4px" }}>
              All data is stored in memory and will reset on page reload
            </div>
          </div>

          {/* ── Check results ──────────────────────────────────────────────── */}
          {checks.map((check) => {
            const c = statusColor[check.status];
            return (
              <div key={check.label} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "6px 10px",
                background: c.bg, border: `1px solid ${c.border}`,
              }}>
                {smallIcon[check.status]}
                <span style={{
                  color: "var(--color-text-secondary)",
                  display: "flex", alignItems: "center", gap: "4px",
                  minWidth: "140px",
                }}>
                  {check.icon}{check.label}
                </span>
                {check.detail && (
                  <code style={{
                    marginLeft: "auto", color: "var(--color-text-muted)",
                    fontSize: "10px", textAlign: "right", maxWidth: "50%",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {check.detail}
                  </code>
                )}
              </div>
            );
          })}

          {/* ── Table row counts breakdown ──────────────────────────────────── */}
          {tableCounts.length > 0 && (
            <div style={{
              background: "rgba(37,99,235,0.03)",
              border: "1px solid rgba(37,99,235,0.10)",
              padding: "8px 10px",
            }}>
              <div style={{
                color: "var(--color-text-muted)", fontSize: "10px",
                textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: "6px",
              }}>
                Chi tiết bảng dữ liệu
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 16px" }}>
                {tableCounts.map((t) => (
                  <div key={t.name} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "2px 0",
                  }}>
                    <span style={{ color: "var(--color-text-secondary)", fontSize: "11px" }}>{t.name}</span>
                    <span style={{
                      color: t.count > 0 ? "#16a34a" : "var(--color-text-muted)",
                      fontWeight: t.count > 0 ? 600 : 400, fontSize: "11px",
                    }}>
                      {t.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Seed log ───────────────────────────────────────────────────── */}
          {seedLog && (
            <div style={{
              padding: "6px 10px", fontSize: "11px",
              background: seedLog.startsWith("✓")
                ? "rgba(34,197,94,0.08)"
                : seedLog.startsWith("✗")
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(59,130,246,0.08)",
              border: `1px solid ${
                seedLog.startsWith("✓")
                  ? "rgba(34,197,94,0.2)"
                  : seedLog.startsWith("✗")
                    ? "rgba(239,68,68,0.2)"
                    : "rgba(59,130,246,0.2)"
              }`,
              color: seedLog.startsWith("✓")
                ? "#16a34a"
                : seedLog.startsWith("✗")
                  ? "#dc2626"
                  : "#2563eb",
            }}>
              {seedLog}
            </div>
          )}

          {/* ── Action buttons ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button
              onClick={(e) => { e.stopPropagation(); runChecks(); }}
              disabled={running}
              style={{
                padding: "5px 12px", fontSize: "11px",
                background: "var(--color-primary)", color: "#fff",
                border: "none", cursor: running ? "not-allowed" : "pointer",
                opacity: running ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: "4px",
              }}
            >
              <RefreshCw className={`h-3 w-3 ${running ? "animate-spin" : ""}`} />
              Kiểm tra lại
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleSeed(); }}
              disabled={seeding || running}
              style={{
                padding: "5px 12px", fontSize: "11px",
                background: "#d97706", color: "#fff",
                border: "none", cursor: (seeding || running) ? "not-allowed" : "pointer",
                opacity: (seeding || running) ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: "4px",
              }}
            >
              {seeding
                ? <Loader className="h-3 w-3 animate-spin" />
                : <Upload className="h-3 w-3" />
              }
              Seed dữ liệu mẫu (overwrite)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
