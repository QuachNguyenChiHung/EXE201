import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { useApp } from "../../../context/AppContext";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { employeeService } from "../../../services/employeeService";

export default function ManageContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  
  const [contract, setContract] = useState<any>(null);
  const [requestDetail, setRequestDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "EMPLOYEE") {
      navigate("/login");
      return;
    }

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
                    .catch(reqErr => console.error("Failed to fetch attached request:", reqErr));
            }
        })
        .catch(err => {
            console.error("Failed to fetch contract:", err);
            setError("Không tìm thấy hợp đồng hoặc có lỗi xảy ra.");
        })
        .finally(() => setLoading(false));
    }
  }, [user, navigate, id]);

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
          <button onClick={() => navigate("/employee/contracts")} className="text-[var(--color-primary)] hover:underline">
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
            onClick={() => navigate("/employee/contracts")}
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
            maxWidth: '210mm', 
            minHeight: '297mm', 
            padding: '2cm',
            fontFamily: '"Times New Roman", Times, serif',
            color: '#000'
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-bold text-lg leading-tight uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
            <h3 className="font-bold text-base leading-tight underline decoration-1 underline-offset-4">Độc lập - Tự do - Hạnh phúc</h3>
            <p className="mt-4 text-sm italic">
              {/* If no exact province is available, default to "Việt Nam" */}
              Hôm nay, ngày {day} tháng {month} năm {year}
            </p>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-bold text-2xl uppercase mb-1">HỢP ĐỒNG CHO THUÊ KHO BÃI</h1>
            <p className="text-base">Số: {contract.id}/HĐTK-{year}</p>
          </div>

          {/* Body */}
          <div className="space-y-6 text-base leading-relaxed text-justify">
            <p>
              Căn cứ Bộ Luật Dân Sự số 91/2015/QH13 đã được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam khóa XIII, kỳ họp thứ 10 thông qua ngày 24 tháng 11 năm 2015;
            </p>
            <p>
              Căn cứ vào sự thỏa thuận và nhu cầu của hai bên.
            </p>

            <div className="mt-6">
              <h3 className="font-bold text-lg mb-2">BÊN CHO THUÊ (BÊN A):</h3>
              <p><strong>Cơ sở / Kho bãi:</strong> {contract.warehouseName || 'Không có tên'}</p>
              <p><strong>Đại diện pháp luật:</strong> {contract.ownerLegalName}</p>
              <p><strong>Mã số thuế:</strong> {contract.ownerTaxCode || 'Chưa cập nhật'}</p>
              <p><strong>Địa chỉ kho:</strong> {contract.ownerAddress || 'Chưa cập nhật'}</p>
              <p><strong>Email:</strong> {contract.ownerEmail || 'Chưa cập nhật'}</p>
              <p><strong>Điện thoại:</strong> {contract.ownerPhone || 'Chưa cập nhật'}</p>
            </div>

            <div className="mt-6">
              <h3 className="font-bold text-lg mb-2">BÊN THUÊ (BÊN B):</h3>
              <p><strong>Đại diện pháp luật:</strong> {contract.renterLegalName || 'Khách hàng'}</p>
              <p><strong>Mã số thuế:</strong> {contract.renterTaxCode || 'Chưa cập nhật'}</p>
              <p><strong>Địa chỉ:</strong> {contract.renterAddress || 'Chưa cập nhật'}</p>
              <p><strong>Email:</strong> {contract.renterEmail || 'Chưa cập nhật'}</p>
              <p><strong>Điện thoại:</strong> {contract.renterPhone || 'Chưa cập nhật'}</p>
              <p><strong>Liên kết Yêu cầu thuê (Request ID):</strong> #{contract.requestId}</p>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="font-bold text-lg">ĐIỀU 1: NỘI DUNG HỢP ĐỒNG</h3>
              <p>
                Bên A đồng ý cho Bên B thuê không gian tại kho bãi <strong>{contract.warehouseName || 'đã chỉ định'}</strong>.
              </p>
              <p className="mt-2">
                <strong>Thời hạn hiệu lực của hợp đồng:</strong> Từ ngày {contract.startAt ? new Date(contract.startAt).toLocaleDateString('vi-VN') : '...'} đến ngày {contract.endAt ? new Date(contract.endAt).toLocaleDateString('vi-VN') : '...'}.
              </p>
              {requestDetail && (
                <div className="mt-4 p-4 border border-gray-300 bg-gray-50 rounded-md print:border-gray-400 print:bg-transparent">
                  <h4 className="font-bold text-sm uppercase mb-2 text-gray-700 print:text-black">Tham chiếu Yêu cầu thuê (#{contract.requestId})</h4>
                  <p className="text-sm italic text-gray-600 print:text-black mb-3">
                    Chi tiết từ Yêu cầu thuê ban đầu. Lưu ý: Các điều khoản, diện tích, hoặc mức giá chính thức trong hợp đồng có thể thay đổi so với yêu cầu ban đầu tùy theo thỏa thuận thực tế.
                  </p>
                  <div className="text-sm space-y-1 pl-3 border-l-2 border-gray-300 print:border-black">
                    <p>- Hàng hóa lưu trữ: {requestDetail.cargoDescription || 'Chưa mô tả'}</p>
                    <p>- Thời gian thuê: {requestDetail.duration} {requestDetail.durationUnit === 'MONTHS' || requestDetail.durationUnit === 'Tháng' ? 'Tháng' : requestDetail.durationUnit === 'YEARS' || requestDetail.durationUnit === 'Năm' ? 'Năm' : requestDetail.durationUnit}</p>
                    {requestDetail.details && requestDetail.details.length > 0 && (
                       <div className="mt-2">
                          <p className="font-semibold">- Phân khu yêu cầu thuê:</p>
                          <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                             {requestDetail.details.map((d: any, i: number) => {
                               const lineMonthly = d.rentedArea * d.priceTierValue;
                               return (
                                 <li key={i}>
                                   Khu vực {d.sector}: {d.rentedArea} {d.areaUnit} x {new Intl.NumberFormat('vi-VN').format(d.priceTierValue)} đ/{d.areaUnit}/tháng = <strong>{new Intl.NumberFormat('vi-VN').format(lineMonthly)} đ/tháng</strong>
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
                               <div className="mt-3 text-sm">
                                 <p>- Phí thuê hàng tháng dự kiến (Yêu cầu): <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMonthly)}</strong></p>
                                 <p>- Tổng chi phí dự kiến cho toàn kỳ thuê ({requestDetail.duration} {unitLabel}): <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalExpected)}</strong></p>
                               </div>
                             );
                          })()}
                       </div>
                    )}
                  </div>
                </div>
              )}

              <h3 className="font-bold text-lg mt-6">ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG & THANH TOÁN</h3>
              <p>
                Tổng giá trị hợp đồng chính thức được hai bên thống nhất xác nhận là: <strong>{formatCurrency(contractTotalPrice)}</strong> <em>(Chưa bao gồm thuế GTGT)</em>.
              </p>
              {autoCalculatedTotal !== contractTotalPrice && autoCalculatedTotal > 0 && (
                <p className="text-sm italic text-gray-600 print:text-black">
                  *(Mức giá trên áp dụng theo thỏa thuận cuối cùng của hợp đồng, có thể khác với giá dự kiến ban đầu là {formatCurrency(autoCalculatedTotal)}).
                </p>
              )}
              <p className="mt-2">{contract.paymentTerm || 'Chưa cập nhật phương thức và kỳ hạn thanh toán cụ thể.'}</p>

              <h3 className="font-bold text-lg">ĐIỀU 3: ĐIỀU KHOẢN PHẠT & CAM KẾT CHUNG</h3>
              <p>{contract.penaltyClause || 'Chưa cập nhật các điều khoản phạt vi phạm hợp đồng.'}</p>
              <p>{contract.specialTerm || 'Chưa có các cam kết hoặc điều khoản đặc biệt nào khác.'}</p>

              <h3 className="font-bold text-lg">ĐIỀU 4: TÌNH TRẠNG PHÁP LÝ & HIỆU LỰC</h3>
              <p>
                Tình trạng hiện tại của hợp đồng: <strong className="uppercase">{contract.status}</strong>.
              </p>
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
              <h3 className="font-bold text-base mb-1">ĐẠI DIỆN BÊN A</h3>
              <p className="text-sm italic mb-20">(Ký, ghi rõ họ tên)</p>
              <p className="font-bold">{contract.ownerLegalName}</p>
            </div>
            <div>
              <h3 className="font-bold text-base mb-1">ĐẠI DIỆN BÊN B</h3>
              <p className="text-sm italic mb-20">(Ký, ghi rõ họ tên)</p>
              <p className="font-bold">{contract.renterLegalName}</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
