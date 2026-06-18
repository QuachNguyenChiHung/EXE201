import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { getUser } from '../../../utils/auth';
import { ArrowLeft, ClipboardList, Box, Calendar, Building2, Layers, Loader2 } from "lucide-react";
import { employeeService } from "../../../services/employeeService";

export default function SharedRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequestDetail = useCallback(async () => {
    const currentUser = getUser();
    if (!currentUser) return;

    if (id) {
      setLoading(true);
      employeeService.getRequestDetail(Number(id))
        .then(res => {
            setRequest(res);
        })
        .catch(err => {
            console.error("Failed to fetch request:", err);
            setError("Không tìm thấy yêu cầu hoặc có lỗi xảy ra.");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    fetchRequestDetail();
  }, [fetchRequestDetail]);

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

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: "var(--color-text-secondary)" }}>{error || "Không tìm thấy yêu cầu."}</p>
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

      <div className="bento-container pt-8 pb-16" style={{ maxWidth: '896px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="bento-header mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm mb-2 hover:underline transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ArrowLeft className="h-4 w-4" /> Về danh sách
          </button>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center rounded" style={{ background: "var(--color-primary)" }}>
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                  Yêu cầu thuê #{request.id}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase text-white bg-blue-500">
                    {request.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2" style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
                <Box className="h-5 w-5" style={{ color: "var(--color-primary)" }} /> Thông tin thuê
              </h3>
              <div>
                <p className="text-xs uppercase font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>Hàng hóa</p>
                <p className="text-sm">{request.cargoDescription || 'Không có mô tả'}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>Thời gian thuê</p>
                <p className="text-sm flex flex-col gap-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
                    {request.duration} {request.durationUnit === 'MONTHS' ? 'Tháng' : request.durationUnit === 'YEARS' ? 'Năm' : request.durationUnit}
                  </span>
                  {request.startDate && request.endDate && (
                    <span className="text-[11px] text-[var(--color-text-muted)] ml-5">
                      (Từ {new Date(request.startDate).toLocaleDateString('vi-VN')} đến {new Date(request.endDate).toLocaleDateString('vi-VN')})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2" style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
                <Building2 className="h-5 w-5" style={{ color: "var(--color-primary)" }} /> Kho bãi & Đối tác
              </h3>
              <div>
                <p className="text-xs uppercase font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>Tên kho</p>
                <p className="text-sm font-medium mb-1">{request.warehouseName || 'N/A'}</p>
              </div>
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-xs uppercase font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>Bên thuê (Renter)</p>
                <p className="text-sm font-medium mb-1">{request.renterName || 'Đang cập nhật tên'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sections Detail */}
        {request.details && request.details.length > 0 && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-sm p-6">
            <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-3 mb-4" style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
              <Layers className="h-5 w-5" style={{ color: "var(--color-primary)" }} /> Các phân khu được chọn
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {request.details.map((detail: any, idx: number) => (
                <div key={idx} className="border border-[var(--color-border)] rounded-md p-4 bg-[var(--color-bg-secondary)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold" style={{ color: "var(--color-text)" }}>Khu vực {detail.sector}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                      {detail.priceTierLabel}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Diện tích thuê:</span>
                      <span className="font-medium">{detail.rentedArea} {detail.areaUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Đơn giá:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detail.priceTierValue || 0)} / {detail.areaUnit}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 mt-2 border-t border-[var(--color-border)]">
                      <span className="font-semibold" style={{ color: "var(--color-text)" }}>Thành tiền ước tính:</span>
                      <span className="font-bold text-[var(--color-primary)]">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((detail.rentedArea || 0) * (detail.priceTierValue || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {(() => {
              const totalMonthly = request.details.reduce((acc: number, d: any) => acc + (d.rentedArea * d.priceTierValue), 0);
              const isYears = request.durationUnit === 'YEARS' || request.durationUnit === 'Năm';
              const durationMultiplier = isYears ? (request.duration * 12) : (request.duration || 1);
              const totalExpected = totalMonthly * durationMultiplier;
              const unitLabel = request.durationUnit === 'MONTHS' || request.durationUnit === 'Tháng' ? 'Tháng' : isYears ? 'Năm' : request.durationUnit;
              return (
                <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex flex-col items-end gap-2">
                  <div className="flex justify-between w-full max-w-sm">
                    <span className="text-[var(--color-text-muted)] font-medium">Tổng phí thuê dự kiến:</span>
                    <span className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMonthly)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-sm">
                    <span className="text-[var(--color-text-muted)] font-medium">Thời gian thuê:</span>
                    <span className="font-semibold">{request.duration} {unitLabel}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-sm pt-2 mt-1 border-t border-[var(--color-border)]">
                    <span className="font-bold text-lg" style={{ color: "var(--color-text)" }}>
                      Dự toán chi phí gốc:
                      <br /><span className="text-xs font-normal text-gray-500 italic">*(Ước tính dựa trên đơn giá tháng)</span>
                    </span>
                    <span className="font-bold text-xl text-[var(--color-text)]">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalExpected)}
                    </span>
                  </div>
                  {request.renterOfferedPrice && (
                    <div className="flex justify-between w-full max-w-sm pt-2">
                      <span className="font-semibold" style={{ color: "var(--color-text)" }}>Tổng khách hàng đề xuất:</span>
                      <span className="font-bold text-lg text-[var(--color-warning, #f59e0b)]">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(request.renterOfferedPrice)}
                      </span>
                    </div>
                  )}
                  {request.offeredPrice && (
                    <div className="flex justify-between w-full max-w-sm pt-2">
                      <span className="font-semibold" style={{ color: "var(--color-text)" }}>Tổng chủ kho chốt giá:</span>
                      <span className="font-bold text-lg text-[var(--color-success, #22c55e)]">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(request.offeredPrice)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Notes and Negotiations */}
        {(request.otherDetail || request.ownerNote || request.rejectionReason || request.renterRejectionReason) && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-lg border-b pb-3 mb-4" style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}>
              Ghi chú & Thương lượng
            </h3>
            <div className="space-y-4">
              {request.otherDetail && (
                <div>
                  <p className="text-xs uppercase font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>Ghi chú của khách hàng</p>
                  <p className="text-sm bg-[var(--color-bg-secondary)] p-3 rounded border border-[var(--color-border)]">{request.otherDetail}</p>
                </div>
              )}
              {request.ownerNote && (
                <div>
                  <p className="text-xs uppercase font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>Phản hồi của chủ kho</p>
                  <p className="text-sm bg-[var(--color-bg-secondary)] p-3 rounded border border-[var(--color-border)]">{request.ownerNote}</p>
                </div>
              )}
              {request.rejectionReason && (
                <div>
                  <p className="text-xs uppercase font-semibold mb-1 text-red-500">Lý do chủ kho từ chối</p>
                  <p className="text-sm bg-red-50 text-red-700 p-3 rounded border border-red-200">{request.rejectionReason}</p>
                </div>
              )}
              {request.renterRejectionReason && (
                <div>
                  <p className="text-xs uppercase font-semibold mb-1 text-red-500">Lý do khách hàng từ chối</p>
                  <p className="text-sm bg-red-50 text-red-700 p-3 rounded border border-red-200">{request.renterRejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
