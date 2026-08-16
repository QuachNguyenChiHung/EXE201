import { FileText, X } from "lucide-react";
import { CompositeContract } from "../../../types";
import { ContractPaperView } from "./ContractPaperView";

interface Props {
  contract: Partial<CompositeContract>;
  request?: any;
  onClose: () => void;
}

/**
 * Dialog wrapper around the shared ContractPaperView. Owns only the overlay
 * chrome (backdrop, blue header, close button, scroll container). All actual
 * paper rendering lives in ContractPaperView so this stays in sync with the
 * standalone /shared/contracts/:id page.
 */
export function CreateContractPreviewModal({ contract, request, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl bg-[var(--color-surface)] border border-[var(--color-border)] my-4 relative">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]"
          style={{ background: "var(--color-primary)" }}
        >
          <div className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5" />
            <span className="font-semibold">Xem trước hợp đồng</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="p-8 md:p-12"
          style={{
            background: "white",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
          }}
        >
          <ContractPaperView contract={contract} request={request} />
        </div>
      </div>
    </div>
  );
}
