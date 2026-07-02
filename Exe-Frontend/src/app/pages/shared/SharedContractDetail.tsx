import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { getUser } from '../../../utils/auth';
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { employeeService } from "../../../services/employeeService";

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const signedDateObj = contract.startAt ? new Date(contract.startAt) : new Date();
  const day = signedDateObj.getDate();
  const month = signedDateObj.getMonth() + 1;
  const year = signedDateObj.getFullYear();

  const contractTotalPrice = contract.totalPrice || 0;
  let autoCalculatedTotal = 0;
  if (requestDetail && requestDetail.details) {
      const totalMonthly = requestDetail.details.reduce((acc: number, d: any) => acc + (d.rentedArea * d.priceTierValue), 0);
      const isYears = requestDetail.durationUnit === 'YEARS' || requestDetail.durationUnit === 'Năm';
      const durationMultiplier = isYears ? (requestDetail.duration * 12) : (requestDetail.duration || 1);
      autoCalculatedTotal = totalMonthly * durationMultiplier;
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
          #printable-contract, #printable-contract * {
            visibility: visible;
          }
          #printable-contract {
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

        {/* Paper Contract View */}
          <div 
            id="printable-contract"
            className="bg-white shadow-xl mx-auto border border-gray-300 print:shadow-none print:border-none"
            style={{ 
              width: '210mm', 
              minHeight: '297mm', 
              padding: '2cm',
              fontFamily: '"Times New Roman", Times, serif',
              color: '#000',
              boxSizing: 'border-box'
            }}
          >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="font-bold leading-tight uppercase" style={{ fontSize: '13pt' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="font-bold leading-tight underline decoration-1 underline-offset-4 mt-1" style={{ fontSize: '14pt' }}>Độc lập - Tự do - Hạnh phúc</div>
            <div className="mt-3 italic" style={{ fontSize: '13pt' }}>
              {/* If no exact province is available, default to "Việt Nam" */}
              Hôm nay, ngày {day} tháng {month} năm {year}
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="font-bold uppercase mb-1" style={{ fontSize: '14pt' }}>HỢP ĐỒNG CHO THUÊ KHO BÃI</div>
            <div style={{ fontSize: '13pt' }}>Số: {contract.id}/HĐTK-{year}</div>
          </div>

          {/* Body */}
          <div className="leading-relaxed text-justify" style={{ fontSize: '14pt' }}>
            <p className="mb-4">
              Căn cứ Bộ Luật Dân Sự số 91/2015/QH13 đã được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam khóa XIII, kỳ họp thứ 10 thông qua ngày 24 tháng 11 năm 2015;
            </p>
            <p className="mb-4">
              Căn cứ vào sự thỏa thuận và nhu cầu của hai bên.
            </p>

            <div className="mt-6 mb-6">
              <div className="font-bold mb-2" style={{ fontSize: '14pt' }}>BÊN CHO THUÊ (BÊN A):</div>
              <p><strong>Cơ sở / Kho bãi:</strong> {contract.warehouseName || 'Không có tên'}</p>
              <p><strong>Đại diện pháp luật:</strong> {contract.ownerLegalName}</p>
              <p><strong>Mã số thuế:</strong> {contract.ownerTaxCode || 'Chưa cập nhật'}</p>
              <p><strong>Địa chỉ kho:</strong> {contract.ownerAddress || 'Chưa cập nhật'}</p>
              <p><strong>Email:</strong> {contract.ownerEmail || 'Chưa cập nhật'}</p>
              <p><strong>Điện thoại:</strong> {contract.ownerPhone || 'Chưa cập nhật'}</p>
            </div>

            <div className="mt-6 mb-6">
              <div className="font-bold mb-2" style={{ fontSize: '14pt' }}>BÊN THUÊ (BÊN B):</div>
              <p><strong>Đại diện pháp luật:</strong> {contract.renterLegalName || 'Khách hàng'}</p>
              <p><strong>Mã số thuế:</strong> {contract.renterTaxCode || 'Chưa cập nhật'}</p>
              <p><strong>Địa chỉ:</strong> {contract.renterAddress || 'Chưa cập nhật'}</p>
              <p><strong>Email:</strong> {contract.renterEmail || 'Chưa cập nhật'}</p>
              <p><strong>Điện thoại:</strong> {contract.renterPhone || 'Chưa cập nhật'}</p>
              <p><strong>Liên kết Yêu cầu thuê (Request ID):</strong> #{contract.requestId}</p>
            </div>

            <div className="mt-6 mb-4">
              <div className="font-bold mb-2" style={{ fontSize: '14pt' }}>ĐIỀU 1: NỘI DUNG HỢP ĐỒNG</div>
              <p className="mb-2">
                Bên A đồng ý cho Bên B thuê không gian tại kho bãi <strong>{contract.warehouseName || 'đã chỉ định'}</strong>.
              </p>
              <p className="mb-2">
                <strong>Thời hạn hiệu lực của hợp đồng:</strong> Từ ngày {contract.startAt ? new Date(contract.startAt).toLocaleDateString('vi-VN') : '...'} đến ngày {contract.endAt ? new Date(contract.endAt).toLocaleDateString('vi-VN') : '...'}.
              </p>
              {requestDetail && (
                <div className="mt-4 mb-4 p-4 border border-gray-300 bg-gray-50 rounded-md print:border-gray-400 print:bg-transparent">
                  <div className="font-bold uppercase mb-2 text-gray-700 print:text-black" style={{ fontSize: '13pt' }}>Tham chiếu Yêu cầu thuê (#{contract.requestId})</div>
                  <p className="italic text-gray-600 print:text-black mb-3" style={{ fontSize: '13pt' }}>
                    Chi tiết từ Yêu cầu thuê ban đầu. Lưu ý: Các điều khoản, diện tích, hoặc mức giá chính thức trong hợp đồng có thể thay đổi so với yêu cầu ban đầu tùy theo thỏa thuận thực tế.
                  </p>
                  <div className="space-y-1 pl-3 border-l-2 border-gray-300 print:border-black" style={{ fontSize: '13pt' }}>
                    <p>- Hàng hóa lưu trữ: {requestDetail.cargoDescription || 'Chưa mô tả'}</p>
                    <p>- Thời gian thuê: {requestDetail.duration} {requestDetail.durationUnit === 'MONTHS' || requestDetail.durationUnit === 'Tháng' ? 'Tháng' : requestDetail.durationUnit === 'YEARS' || requestDetail.durationUnit === 'Năm' ? 'Năm' : requestDetail.durationUnit}
                      {requestDetail.startDate && requestDetail.endDate && (
                        <span className="italic ml-1">
                          (Từ {new Date(requestDetail.startDate).toLocaleDateString('vi-VN')} đến {new Date(requestDetail.endDate).toLocaleDateString('vi-VN')})
                        </span>
                      )}
                    </p>
                    {requestDetail.details && requestDetail.details.length > 0 && (
                       <div className="mt-2">
                          <p className="font-semibold">- Phân khu yêu cầu thuê:</p>
                          <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                             {requestDetail.details.map((d: any, i: number) => {
                               const lineCost = d.rentedArea * d.priceTierValue;
                               return (
                                 <li key={i}>
                                   Khu vực {d.sector}: {d.rentedArea} {d.areaUnit} x {new Intl.NumberFormat('vi-VN').format(d.priceTierValue)} đ/{d.areaUnit} = <strong>{new Intl.NumberFormat('vi-VN').format(lineCost)} đ</strong>
                                 </li>
                               );
                             })}
                          </ul>
                          {(() => {
                             const totalMonthly = requestDetail.details.reduce((acc: number, d: any) => acc + (d.rentedArea * d.priceTierValue), 0);
                             const isYears = requestDetail.durationUnit === 'YEARS' || requestDetail.durationUnit === 'Năm';
                             const durationMultiplier = isYears ? (requestDetail.duration * 12) : (requestDetail.duration || 1);
                             const totalExpected = totalMonthly * durationMultiplier;
                             const unitLabel = requestDetail.durationUnit === 'MONTHS' || requestDetail.durationUnit === 'Tháng' ? 'Tháng' : isYears ? 'Năm' : requestDetail.durationUnit;
                             return (
                               <div className="mt-3 space-y-1" style={{ fontSize: '13pt' }}>
                                 <p>- Phí thuê dự kiến gốc cho phân khu: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMonthly)}</strong></p>
                                 <p>- Tổng chi phí dự kiến gốc ({requestDetail.duration} {unitLabel}): <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalExpected)}</strong> <span className="italic text-gray-500 print:text-black" style={{ fontSize: '12pt' }}>*(Ước tính dựa trên đơn giá tháng)</span></p>
                                 {requestDetail.renterOfferedPrice && (
                                    <p>- Tổng khách hàng đề xuất: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(requestDetail.renterOfferedPrice)}</strong></p>
                                 )}
                                 {requestDetail.offeredPrice && (
                                    <p>- Tổng chủ kho chốt giá: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(requestDetail.offeredPrice)}</strong></p>
                                 )}
                               </div>
                             );
                          })()}
                       </div>
                    )}

                    {/* Notes & Negotiation */}
                    {(requestDetail.otherDetail || requestDetail.ownerNote || requestDetail.rejectionReason || requestDetail.renterRejectionReason) && (
                      <div className="mt-4 pt-3 border-t border-gray-300 border-dashed print:border-black">
                        <p className="font-semibold mb-1">- Ghi chú & Lịch sử thương lượng:</p>
                        {requestDetail.otherDetail && <p className="ml-4 italic mb-1" style={{ fontSize: '12pt' }}><span className="not-italic font-medium">Khách hàng ghi chú:</span> {requestDetail.otherDetail}</p>}
                        {requestDetail.ownerNote && <p className="ml-4 italic mb-1" style={{ fontSize: '12pt' }}><span className="not-italic font-medium">Chủ kho phản hồi:</span> {requestDetail.ownerNote}</p>}
                        {requestDetail.rejectionReason && <p className="ml-4 italic text-red-600 print:text-black mb-1" style={{ fontSize: '12pt' }}><span className="not-italic font-medium">Lý do chủ kho từ chối:</span> {requestDetail.rejectionReason}</p>}
                        {requestDetail.renterRejectionReason && <p className="ml-4 italic text-red-600 print:text-black" style={{ fontSize: '12pt' }}><span className="not-italic font-medium">Lý do khách hàng từ chối:</span> {requestDetail.renterRejectionReason}</p>}
                      </div>
                    )}

                  </div>
                </div>
              )}

              <div className="font-bold mb-2 mt-6" style={{ fontSize: '14pt' }}>ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG & THANH TOÁN</div>
              <p className="mb-2">
                Tổng giá trị hợp đồng chính thức được hai bên thống nhất xác nhận là: <strong>{formatCurrency(contractTotalPrice)}</strong> <em>(Chưa bao gồm thuế GTGT)</em>.
              </p>
              {autoCalculatedTotal !== contractTotalPrice && autoCalculatedTotal > 0 && (
                <p className="italic text-gray-600 print:text-black mb-2" style={{ fontSize: '13pt' }}>
                  *(Mức giá trên áp dụng theo thỏa thuận cuối cùng của hợp đồng, có thể khác với giá dự kiến ban đầu là {formatCurrency(autoCalculatedTotal)}).
                </p>
              )}
              <p className="mb-4">{contract.paymentTerm || 'Chưa cập nhật phương thức và kỳ hạn thanh toán cụ thể.'}</p>

              <div className="font-bold mb-2 mt-6" style={{ fontSize: '14pt' }}>ĐIỀU 3: ĐIỀU KHOẢN PHẠT & CAM KẾT CHUNG</div>
              <p className="mb-2">{contract.penaltyClause || 'Chưa cập nhật các điều khoản phạt vi phạm hợp đồng.'}</p>
              <p className="mb-4">{contract.specialTerm || 'Chưa có các cam kết hoặc điều khoản đặc biệt nào khác.'}</p>

              <div className="font-bold mb-2 mt-6" style={{ fontSize: '14pt' }}>ĐIỀU 4: TÌNH TRẠNG PHÁP LÝ & HIỆU LỰC</div>
              {contract.cancelReason && (
                <p>
                  <strong>Lý do hủy/chấm dứt:</strong> {contract.cancelReason}
                </p>
              )}
              <p className="mt-2">
                Hợp đồng này được tạo và lưu trữ trên hệ thống nền tảng AiLogis, có giá trị pháp lý tương đương văn bản thỏa thuận điện tử giữa các bên kể từ ngày ký ({day}/{month}/{year}).
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-16 grid grid-cols-2 gap-8 text-center break-inside-avoid">
            <div>
              <div className="font-bold mb-1" style={{ fontSize: '14pt' }}>ĐẠI DIỆN BÊN A</div>
              <p className="italic mb-20" style={{ fontSize: '13pt' }}>(Ký, ghi rõ họ tên)</p>
              <p className="font-bold" style={{ fontSize: '14pt' }}>{contract.ownerLegalName}</p>
            </div>
            <div>
              <div className="font-bold mb-1" style={{ fontSize: '14pt' }}>ĐẠI DIỆN BÊN B</div>
              <p className="italic mb-20" style={{ fontSize: '13pt' }}>(Ký, ghi rõ họ tên)</p>
              <p className="font-bold">{contract.renterLegalName}</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
