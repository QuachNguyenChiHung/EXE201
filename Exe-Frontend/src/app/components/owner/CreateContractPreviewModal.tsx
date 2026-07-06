import { FileText, X } from "lucide-react";
import { CompositeContract } from "../../../types";

interface Props {
  contract: Partial<CompositeContract>;
  request?: any;
  onClose: () => void;
}

export function CreateContractPreviewModal({ contract, request, onClose }: Props) {
  const capacity = Number(contract.rentedCapacity) || 0;
  const rate = Number(contract.monthlyRate) || 0;
  const months =
    contract.start_at && contract.end_at
      ? Math.max(1, Math.ceil((new Date(contract.end_at).getTime() - new Date(contract.start_at).getTime()) / (30 * 86400000)))
      : 0;

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("vi-VN") : "___");

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

        <div className="p-8 md:p-12" style={{ background: "white", color: "black", fontFamily: '"Times New Roman", Times, serif', maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-bold text-lg leading-tight uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
            <h3 className="font-bold text-base leading-tight underline decoration-1 underline-offset-4">Độc lập - Tự do - Hạnh phúc</h3>
            <p className="mt-4 text-sm italic">
              Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
            </p>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-bold text-2xl uppercase mb-1">{contract.contractTitle || "HỢP ĐỒNG CHO THUÊ KHO BÃI"}</h1>
            <p className="text-base">Số: {contract.contractRef || "___"}</p>
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
              <p><strong>Cơ sở / Kho bãi:</strong> {(contract as any).warehouseName || 'Không có tên'}</p>
              <p><strong>Đại diện pháp luật:</strong> {contract.owner_legal_name || "___"}</p>
              <p><strong>Mã số thuế:</strong> {contract.owner_tax_code || "___"}</p>
              <p><strong>Địa chỉ kho:</strong> {contract.owner_address || "___"}</p>
              <p><strong>Email:</strong> {contract.owner_email || "___"}</p>
              <p><strong>Điện thoại:</strong> {contract.owner_phone || "___"}</p>
            </div>

            <div className="mt-6">
              <h3 className="font-bold text-lg mb-2">BÊN THUÊ (BÊN B):</h3>
              <p><strong>Đại diện pháp luật:</strong> {contract.renter_legal_name || "___"}</p>
              <p><strong>Mã số thuế:</strong> {contract.renter_tax_code || "___"}</p>
              <p><strong>Địa chỉ:</strong> {contract.renter_address || "___"}</p>
              <p><strong>Email:</strong> {contract.renter_email || "___"}</p>
              <p><strong>Điện thoại:</strong> {contract.renter_phone || "___"}</p>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="font-bold text-lg">ĐIỀU 1: NỘI DUNG HỢP ĐỒNG</h3>
              <p>
                Bên A đồng ý cho Bên B thuê không gian tại kho bãi <strong>{(contract as any).warehouseName || 'đã chỉ định'}</strong>.
              </p>
              <p className="mt-2">
                <strong>Thời hạn hiệu lực của hợp đồng:</strong> Từ ngày {fmtDate(contract.start_at)} đến ngày {fmtDate(contract.end_at)}.
              </p>
              
              {request && (
                <div className="mt-4 p-4 border border-gray-300 bg-gray-50 rounded-md">
                  <h4 className="font-bold text-sm uppercase mb-2 text-gray-700">Tham chiếu Yêu cầu thuê (#{contract.id_rent_request || request.id_rentRequest || request.id})</h4>
                  <p className="text-sm italic text-gray-600 mb-3">
                    Chi tiết từ Yêu cầu thuê ban đầu. Lưu ý: Các điều khoản, diện tích, hoặc mức giá chính thức trong hợp đồng có thể thay đổi so với yêu cầu ban đầu tùy theo thỏa thuận thực tế.
                  </p>
                  <div className="text-sm space-y-1 pl-3 border-l-2 border-gray-300">
                    <p>- Hàng hóa lưu trữ: {request.cargoDescription || request.cargo_description || 'Chưa mô tả'}</p>
                    <p>- Thời gian thuê: {request.duration} {request.durationUnit === 'MONTHS' || request.durationUnit === 'MONTH' || request.durationUnit === 'Tháng' ? 'Tháng' : request.durationUnit === 'YEARS' || request.durationUnit === 'YEAR' || request.durationUnit === 'Năm' ? 'Năm' : request.durationUnit}</p>
                    {request.details && request.details.length > 0 && (
                       <div className="mt-2">
                          <p className="font-semibold">- Phân khu yêu cầu thuê:</p>
                          <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                             {request.details.map((d: any, i: number) => {
                               const lineCost = d.rentedArea * d.priceTierValue;
                               return (
                                 <li key={i}>
                                   Khu vực {d.sector}: {d.rentedArea} {d.areaUnit} x {new Intl.NumberFormat('vi-VN').format(d.priceTierValue)} đ/{d.areaUnit} = <strong>{new Intl.NumberFormat('vi-VN').format(lineCost)} đ</strong>
                                 </li>
                               );
                             })}
                          </ul>
                          {(() => {
                             const totalMonthly = request.details.reduce((acc: number, d: any) => acc + (d.rentedArea * d.priceTierValue), 0);
                             const isYears = request.durationUnit === 'YEARS' || request.durationUnit === 'YEAR' || request.durationUnit === 'Năm';
                             const durationMultiplier = isYears ? (request.duration * 12) : (request.duration || 1);
                             const totalExpected = totalMonthly * durationMultiplier;
                             const unitLabel = request.durationUnit === 'MONTHS' || request.durationUnit === 'MONTH' || request.durationUnit === 'Tháng' ? 'Tháng' : isYears ? 'Năm' : request.durationUnit;
                             return (
                               <div className="mt-3 text-sm space-y-1">
                                 <p>- Phí thuê dự kiến gốc cho phân khu: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMonthly)}</strong></p>
                                 <p>- Tổng chi phí dự kiến gốc ({request.duration} {unitLabel}): <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalExpected)}</strong> <span className="text-xs italic text-gray-500">*(Ước tính dựa trên đơn giá tháng)</span></p>
                                 {request.offeredPrice && (
                                    <p>- Tổng chủ kho chốt giá: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(request.offeredPrice)}</strong></p>
                                 )}
                               </div>
                             );
                          })()}
                       </div>
                    )}

                    {/* Notes & Negotiation */}
                    {(request.otherDetail || request.ownerNote || request.rejectionReason || request.renterRejectionReason) && (
                      <div className="mt-4 pt-3 border-t border-gray-300 border-dashed">
                        <p className="font-semibold mb-1">- Ghi chú & Lịch sử thương lượng:</p>
                        {request.otherDetail && <p className="ml-4 italic text-xs mb-1"><span className="not-italic font-medium">Khách hàng ghi chú:</span> {request.otherDetail}</p>}
                        {request.ownerNote && <p className="ml-4 italic text-xs mb-1"><span className="not-italic font-medium">Chủ kho phản hồi:</span> {request.ownerNote}</p>}
                        {request.rejectionReason && <p className="ml-4 italic text-xs text-red-600 mb-1"><span className="not-italic font-medium">Lý do chủ kho từ chối:</span> {request.rejectionReason}</p>}
                        {request.renterRejectionReason && <p className="ml-4 italic text-xs text-red-600"><span className="not-italic font-medium">Lý do khách hàng từ chối:</span> {request.renterRejectionReason}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!request && (
                <div className="mt-4 p-4 border border-gray-300 rounded-md">
                  <p className="font-semibold">- Hàng hóa lưu trữ: <span className="font-normal">{contract.cargo_description || 'Chưa mô tả'}</span></p>
                  <p className="font-semibold mt-2">- Mức dung lượng thuê: <span className="font-normal">{capacity > 0 ? `${capacity} m³` : 'Chưa xác định'}</span></p>
                </div>
              )}

              <h3 className="font-bold text-lg mt-6">ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG & THANH TOÁN</h3>
              <p>
                Tổng giá trị hợp đồng chính thức được hai bên thống nhất xác nhận là: <strong>{fmtCurrency(rate)}</strong> <em>(Chưa bao gồm thuế GTGT)</em>.
              </p>
              <p className="mt-2">{contract.payment_term || 'Chưa cập nhật phương thức và kỳ hạn thanh toán cụ thể.'}</p>

              <h3 className="font-bold text-lg">ĐIỀU 3: ĐIỀU KHOẢN PHẠT & CAM KẾT CHUNG</h3>
              <p>{contract.penalty_clause || 'Chưa cập nhật các điều khoản phạt vi phạm hợp đồng.'}</p>
              <p>{contract.special_term || 'Chưa có các cam kết hoặc điều khoản đặc biệt nào khác.'}</p>

              <h3 className="font-bold text-lg">ĐIỀU 4: TÌNH TRẠNG PHÁP LÝ & HIỆU LỰC</h3>
              <p>
                Hợp đồng này được tạo và lưu trữ trên hệ thống nền tảng AiLogis, có giá trị pháp lý tương đương văn bản thỏa thuận điện tử giữa các bên kể từ ngày ký.
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-16 grid grid-cols-2 gap-8 text-center break-inside-avoid pb-8">
            <div>
              <h3 className="font-bold text-base mb-1">ĐẠI DIỆN BÊN A</h3>
              <p className="text-sm italic mb-20">(Ký, ghi rõ họ tên)</p>
              <p className="font-bold">{contract.owner_legal_name || "___"}</p>
            </div>
            <div>
              <h3 className="font-bold text-base mb-1">ĐẠI DIỆN BÊN B</h3>
              <p className="text-sm italic mb-20">(Ký, ghi rõ họ tên)</p>
              <p className="font-bold">{contract.renter_legal_name || "___"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
