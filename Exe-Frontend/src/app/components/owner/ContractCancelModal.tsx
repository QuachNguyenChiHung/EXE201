import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export function ContractCancelModal({
  contractRef,
  onConfirm,
  onClose,
}: {
  contractRef: string;
  onConfirm: (note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)]">
        <div
          className="px-5 py-4 border-b border-[var(--color-border)]"
          style={{ background: "var(--color-bg-secondary)" }}
        >
          <p
            className="font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            Huỷ hợp đồng
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Mã HĐ:{" "}
            <span className="font-mono">{contractRef}</span>
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div
            className="flex items-start gap-2 text-sm px-3 py-2.5"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <AlertTriangle
              className="h-4 w-4 shrink-0 mt-0.5"
              style={{ color: "var(--color-error)" }}
            />
            <span style={{ color: "var(--color-text)" }}>
              Hành động này không thể hoàn tác. Hợp đồng sẽ
              chuyển sang trạng thái "Đã huỷ".
            </span>
          </div>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Lý do huỷ
            </label>
            <textarea
              rows={3}
              className="w-full text-sm px-3 py-2 border resize-none focus:outline-none focus:border-[var(--color-error)] transition-colors"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
              }}
              placeholder="Nhập lý do huỷ hợp đồng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(note)}
            className="flex-1 py-2.5 text-sm text-white transition-colors"
            style={{
              background: "var(--color-error, #ef4444)",
            }}
          >
            Xác nhận huỷ HĐ
          </button>
        </div>
      </div>
    </div>
  );
}
