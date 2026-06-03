import { File, Trash2, Upload, AlertCircle } from "lucide-react";
import { CompositeContract } from "../../../types";

interface Props {
  pdfFile: globalThis.File | null;
  setPdfFile: (f: globalThis.File | null) => void;
  contract: Partial<CompositeContract>;
  onChange: (key: keyof CompositeContract, val: any) => void;
}

const fmtBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export function CreateContractPDFUpload({ pdfFile, setPdfFile, contract, onChange }: Props) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setPdfFile(null);
  };

  return (
    <div className="p-6 border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)]">
        <Upload className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-text)" }}>
          Tải lên bản PDF đã ký
        </span>
      </div>

      <div className="p-4 mb-4 rounded bg-blue-50 border border-blue-100 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Upload hợp đồng bản cứng</p>
          <p>
            Chế độ này dành cho trường hợp bạn và khách hàng đã ký hợp đồng ở ngoài hệ thống (bản giấy hoặc PDF).
            Hãy tải file PDF lên để lưu trữ. Bạn vẫn cần điền các thông tin Bên A/B và thời hạn để hệ thống theo dõi hợp đồng.
          </p>
        </div>
      </div>

      {pdfFile ? (
        <div className="flex items-center justify-between p-4 border rounded border-blue-200 bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-white shadow-sm border border-blue-100">
              <File className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{pdfFile.name}</p>
              <p className="text-xs text-gray-500">{fmtBytes(pdfFile.size)}</p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-2 rounded-full hover:bg-white hover:text-red-500 text-gray-400 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="relative border-2 border-dashed border-[var(--color-border)] rounded-lg p-10 flex flex-col items-center justify-center bg-[var(--color-bg-secondary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer group">
          <input
            type="file"
            accept=".pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
          <div className="p-3 rounded-full bg-[var(--color-surface)] shadow-sm border border-[var(--color-border)] mb-4 group-hover:border-blue-400 group-hover:shadow-md transition-all">
            <Upload className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text)" }}>
            Nhấp hoặc kéo thả file PDF vào đây
          </p>
          <p className="text-xs text-center px-4" style={{ color: "var(--color-text-muted)" }}>
            Hỗ trợ file định dạng .pdf (Tối đa 10MB)
          </p>
        </div>
      )}
    </div>
  );
}
