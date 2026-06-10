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
                        if (!reqRes.details || reqRes.details.length === 0) {
                            reqRes.details = [
                                { id: 991, sector: 1, priceTierLabel: "Tiêu chuẩn", priceTierValue: 150000, rentedArea: 50, areaUnit: "m²" },
                                { id: 992, sector: 2, priceTierLabel: "Kho Lạnh", priceTierValue: 250000, rentedArea: 100, areaUnit: "m²" }
                            ];
                        }
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

  const signedDateObj = contract.signedDate ? new Date(contract.signedDate) : new Date();
  const day = signedDateObj.getDate();
  const month = signedDateObj.getMonth() + 1;
  const year = signedDateObj.getFullYear();

  const mockData = {
    ownerName: "CÔNG TY TNHH CHO THUÊ KHO BÃI LOGISTICS",
    renterAddress: "Số 123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh",
    warehouseAddress: "Lô E3, KCN Sóng Thần 1, Thành phố Dĩ An, Bình Dương",
    paymentTerm: "Bên B có trách nhiệm thanh toán tiền thuê cho Bên A vào ngày 05 hàng tháng qua hình thức chuyển khoản ngân hàng. Tiền đặt cọc tương đương 02 tháng tiền thuê.",
    penaltyClause: "Trong trường hợp Bên B thanh toán chậm quá 10 ngày, Bên B sẽ phải chịu khoản phạt 5% trên tổng số tiền chậm trả. Nếu chậm thanh toán quá 30 ngày, Bên A có quyền đơn phương chấm dứt hợp đồng.",
    specialTerm: "Bên B cam kết không tàng trữ, lưu trữ các loại hàng hóa quốc cấm, hóa chất độc hại, hoặc chất dễ cháy nổ không có giấy phép hợp lệ. Mọi hành vi vi phạm pháp luật tại khu vực thuê sẽ do Bên B hoàn toàn chịu trách nhiệm."
  };

  let autoCalculatedTotal = contract.totalPrice || 0;
  if (!autoCalculatedTotal && requestDetail && requestDetail.details) {
      const totalMonthly = requestDetail.details.reduce((acc: number, d: any) => acc + (d.rentedArea * d.priceTierValue), 0);
      const isYears = requestDetail.durationUnit === 'YEARS' || requestDetail.durationUnit === 'Năm';
      const durationMultiplier = isYears ? (requestDetail.duration * 12) : (requestDetail.duration || 1);
      autoCalculatedTotal = totalMonthly * durationMultiplier;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <div className="pt-8 pb-16 px-4" style={{ maxWidth: '896px', margin: '0 auto' }}>
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
          className="bg-white shadow-xl mx-auto border border-gray-300"
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
              <p><strong>Đại diện pháp luật:</strong> {mockData.ownerName}</p>
              <p><strong>Địa chỉ kho:</strong> {mockData.warehouseAddress}</p>
            </div>

            <div className="mt-6">
              <h3 className="font-bold text-lg mb-2">BÊN THUÊ (BÊN B):</h3>
              <p><strong>Đại diện pháp luật:</strong> {contract.renterName || 'Khách hàng'}</p>
              <p><strong>Địa chỉ:</strong> {mockData.renterAddress}</p>
              <p><strong>Liên kết Yêu cầu thuê (Request ID):</strong> #{contract.requestId}</p>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="font-bold text-lg">ĐIỀU 1: NỘI DUNG HỢP ĐỒNG</h3>
              <p>
                Bên A đồng ý cho Bên B thuê không gian tại kho bãi <strong>{contract.warehouseName || 'đã chỉ định'}</strong> dựa theo các tiêu chí và diện tích đã thỏa thuận trong Yêu cầu thuê số <strong>#{contract.requestId}</strong>.
              </p>
              {requestDetail && (
                <div className="pl-4 border-l-2 border-gray-400 my-2 py-1 italic text-sm space-y-1">
                  <p>- Hàng hóa lưu trữ: {requestDetail.cargoDescription || 'Chưa mô tả'}</p>
                  <p>- Thời gian thuê: {requestDetail.duration} {requestDetail.durationUnit === 'MONTHS' || requestDetail.durationUnit === 'Tháng' ? 'Tháng' : requestDetail.durationUnit === 'YEARS' || requestDetail.durationUnit === 'Năm' ? 'Năm' : requestDetail.durationUnit}</p>
                  {requestDetail.details && requestDetail.details.length > 0 && (
                     <div className="mt-1">
                        <p>- Phân khu thuê:</p>
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
                             <div className="mt-2 text-sm">
                               <p>- Tổng phí thuê hàng tháng ước tính: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMonthly)}</strong></p>
                               <p>- Tổng chi phí dự kiến cho toàn kỳ thuê ({requestDetail.duration} {unitLabel}): <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalExpected)}</strong></p>
                             </div>
                           );
                        })()}
                     </div>
                  )}
                </div>
              )}

              <h3 className="font-bold text-lg mt-6">ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG & THANH TOÁN</h3>
              <p>
                Tổng giá trị hợp đồng được hai bên thống nhất xác nhận là: <strong>{formatCurrency(autoCalculatedTotal)}</strong>.
              </p>
              <p>{mockData.paymentTerm}</p>

              <h3 className="font-bold text-lg">ĐIỀU 3: ĐIỀU KHOẢN PHẠT & CAM KẾT CHUNG</h3>
              <p>{mockData.penaltyClause}</p>
              <p>{mockData.specialTerm}</p>

              <h3 className="font-bold text-lg">ĐIỀU 4: TÌNH TRẠNG PHÁP LÝ & HIỆU LỰC</h3>
              <p>
                Tình trạng hiện tại của hợp đồng: <strong className="uppercase">{contract.status}</strong>.
              </p>
              <p>
                Hợp đồng này được tạo và lưu trữ trên hệ thống nền tảng AiLogis, có giá trị pháp lý tương đương văn bản thỏa thuận điện tử giữa các bên kể từ ngày ký ({day}/{month}/{year}).
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-16 grid grid-cols-2 gap-8 text-center break-inside-avoid">
            <div>
              <h3 className="font-bold text-base mb-1">ĐẠI DIỆN BÊN A</h3>
              <p className="text-sm italic mb-20">(Ký, ghi rõ họ tên)</p>
              <p className="font-bold">{contract.warehouseName}</p>
            </div>
            <div>
              <h3 className="font-bold text-base mb-1">ĐẠI DIỆN BÊN B</h3>
              <p className="text-sm italic mb-20">(Ký, ghi rõ họ tên)</p>
              <p className="font-bold">{contract.renterName}</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
