import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { getUser } from '../../../utils/auth';
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { employeeService } from "../../../services/employeeService";
import { ContractPaperView } from "../../components/owner/ContractPaperView";

export default function SharedContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [contract, setContract] = useState<any>(null);
  const [requestDetail, setRequestDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContractDetail = useCallback(async () => {
    const currentUser = getUser();
    if (!currentUser) return;

    if (id) {
      setLoading(true);
      employeeService.getContractDetail(Number(id))
        .then(res => {
            setContract(res);
            if (res.requestId) {
                employeeService.getRequestDetail(res.requestId)
                    .then(reqRes => {
                        setRequestDetail(reqRes);
                    })
                    .catch(() => {});
            }
        })
        .catch(() => {
            setError("Không tìm thấy hợp đồng hoặc có lỗi xảy ra.");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    fetchContractDetail();
  }, [fetchContractDetail]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: "var(--color-text-secondary)" }}>{error || "Không tìm thấy hợp đồng."}</p>
          <button onClick={() => navigate(-1)} className="text-[var(--color-primary)] hover:underline">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar />
      <style>{`
        @media print {
          @page { margin: 0; }
          body { margin: 1.6cm; background: white; }
          body * {
            visibility: hidden;
          }
          #contract-paper-view, #contract-paper-view * {
            visibility: visible;
          }
          #contract-paper-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="pt-8 pb-16 px-4 print:pt-0 print:pb-0" style={{ maxWidth: '896px', margin: '0 auto' }}>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm hover:underline transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Về danh sách
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded transition-colors text-white"
            style={{ background: "var(--color-primary)" }}
          >
            <Printer className="h-4 w-4" /> In hợp đồng
          </button>
        </div>

        <ContractPaperView
          contract={contract}
          request={requestDetail}
          className="bg-white shadow-xl mx-auto border border-gray-300 print:shadow-none print:border-none"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '2cm',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}
