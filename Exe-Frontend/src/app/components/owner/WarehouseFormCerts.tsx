import { Card } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Shield, AlertTriangle, Upload, X, FileText, CheckCircle2 } from "lucide-react";
import { CertFile } from "./WarehouseFormUtils";

interface Props {
  certFiles: CertFile[];
  setCertFiles: (files: CertFile[]) => void;
  existingCerts: any[];
  setExistingCerts: (certs: any[]) => void;
}

export function WarehouseFormCerts({ certFiles, setCertFiles, existingCerts, setExistingCerts }: Props) {

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    const pdfs = files.filter((f) => f.type === "application/pdf");
    
    if (pdfs.length !== files.length) {
      alert("Chỉ hỗ trợ file PDF cho chứng chỉ");
    }

    const newCerts = pdfs.map((f) => ({
      name: f.name,
      size: f.size,
      file: f,
    }));
    setCertFiles([...certFiles, ...newCerts]);
  };

  const removeNewCert = (idx: number) => {
    setCertFiles(certFiles.filter((_, i) => i !== idx));
  };

  const removeExistingCert = (idx: number) => {
    setExistingCerts(existingCerts.filter((_, i) => i !== idx));
  };

  return (
    <Card className="bento-card p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        Chứng chỉ
      </h2>
      <div className="space-y-4">
        {existingCerts.length === 0 && certFiles.length === 0 && (
          <div className="flex items-start gap-3 border-l-4 border-[var(--color-warning)] px-4 py-3 bg-[var(--color-bg-secondary)]">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-warning)" }} />
            <div className="text-sm">
              <p style={{ fontWeight: 600 }} className="mb-0.5">Cảnh báo</p>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Kho không có chứng chỉ sẽ hiển thị cảnh báo cho người thuê và có thể ảnh hưởng đến khả năng cho thuê.
              </p>
            </div>
          </div>
        )}

        <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-6 text-center hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer relative group">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            multiple
            accept=".pdf"
            onChange={handleCertUpload}
          />
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-[var(--color-bg)] flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
              <Upload className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
            </div>
          </div>
          <p className="font-medium text-[var(--color-text)] mb-1">
            Kéo thả hoặc nhấp để tải lên chứng chỉ
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Chỉ hỗ trợ file PDF (Tối đa 5MB)
          </p>
        </div>

        {/* Existing Certs */}
        {existingCerts.length > 0 && (
          <div className="space-y-2 mt-4">
            <Label className="text-[var(--color-text-secondary)]">Chứng chỉ hiện có</Label>
            {existingCerts.map((cert, i) => (
              <div key={`existing-${i}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-[var(--color-border)]">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {cert.label || "Chứng nhận hệ thống"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[var(--color-text-secondary)]">Đã xác minh</span>
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => window.open(cert.link || '#', '_blank')} className="text-[var(--color-primary)]">
                    <ExternalLinkIcon />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeExistingCert(i)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New cert files */}
        {certFiles.length > 0 && (
          <div className="space-y-2 mt-4">
            <Label className="text-[var(--color-text-secondary)]">Chứng chỉ mới tải lên</Label>
            {certFiles.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-[var(--color-border)]">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{file.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeNewCert(i)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
}
