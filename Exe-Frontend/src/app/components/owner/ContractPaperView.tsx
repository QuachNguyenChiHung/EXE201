import type { CSSProperties } from "react";

interface Props {
  contract: any;
  request?: any;
  className?: string;
  style?: CSSProperties;
}

/**
 * The "paper" body of a contract: header, all four ĐIỀU blocks, signatures.
 * Used by both the standalone SharedContractDetail page and the in-app preview
 * dialog so the two views can never drift apart.
 *
 * Accepts either the backend API shape (camelCase) or the form-state shape
 * (snake_case) — every field read normalises both spellings.
 */
export function ContractPaperView({ contract, request, className, style }: Props) {
  if (!contract) return null;

  // Field normalisation: API (camelCase) OR form state (snake_case)
  const c = contract ?? {};
  const id = c.id ?? c.id_contract;
  const contractRef = c.contractRef ?? c.contract_ref;

  const ownerLegalName = c.ownerLegalName ?? c.owner_legal_name ?? "";
  const ownerTaxCode = c.ownerTaxCode ?? c.owner_tax_code ?? "";
  const ownerAddress = c.ownerAddress ?? c.owner_address ?? "";
  const ownerEmail = c.ownerEmail ?? c.owner_email ?? "";
  const ownerPhone = c.ownerPhone ?? c.owner_phone ?? "";

  const renterLegalName = c.renterLegalName ?? c.renter_legal_name ?? "";
  const renterTaxCode = c.renterTaxCode ?? c.renter_tax_code ?? "";
  const renterAddress = c.renterAddress ?? c.renter_address ?? "";
  const renterEmail = c.renterEmail ?? c.renter_email ?? "";
  const renterPhone = c.renterPhone ?? c.renter_phone ?? "";

  const warehouseName = c.warehouseName ?? c.warehouse_name ?? "";
  const startAt = c.startAt ?? c.start_at ?? "";
  const endAt = c.endAt ?? c.end_at ?? "";
  const paymentTerm = c.paymentTerm ?? c.payment_term ?? "";
  const penaltyClause = c.penaltyClause ?? c.penalty_clause ?? "";
  const specialTerm = c.specialTerm ?? c.special_term ?? "";
  const cancelReason = c.cancelReason ?? c.cancel_reason ?? "";
  const cargoDescription = c.cargoDescription ?? c.cargo_description ?? "";

  const requestIdValue =
    c.requestId ??
    c.id_rent_request ??
    request?.id_rentRequest ??
    request?.id ??
    null;

  const monthlyRate = Number(c.monthlyRate ?? c.monthly_rate ?? 0) || 0;
  const totalPrice = Number(c.totalPrice ?? c.total_price ?? monthlyRate) || 0;

  const signedDateObj = startAt ? new Date(startAt) : new Date();
  const day = signedDateObj.getDate();
  const month = signedDateObj.getMonth() + 1;
  const year = signedDateObj.getFullYear();

  let autoCalculatedTotal = 0;
  if (request && request.details) {
    const totalMonthly = request.details.reduce(
      (acc: number, d: any) => acc + (d.rentedArea * d.priceTierValue),
      0
    );
    const isYears =
      request.durationUnit === "YEARS" || request.durationUnit === "Năm";
    const durationMultiplier = isYears
      ? (request.duration || 0) * 12
      : request.duration || 1;
    autoCalculatedTotal = totalMonthly * durationMultiplier;
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
      n
    );
  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "...";

  return (
    <div
      id="contract-paper-view"
      className={className}
      style={{
        background: "white",
        color: "#000",
        fontFamily: '"Times New Roman", Times, serif',
        ...style,
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div
          className="font-bold leading-tight uppercase"
          style={{ fontSize: "13pt" }}
        >
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </div>
        <div
          className="font-bold leading-tight underline decoration-1 underline-offset-4 mt-1"
          style={{ fontSize: "14pt" }}
        >
          Độc lập - Tự do - Hạnh phúc
        </div>
        <div className="mt-3 italic" style={{ fontSize: "13pt" }}>
          Hôm nay, ngày {day} tháng {month} năm {year}
        </div>
      </div>

      <div className="text-center mb-6">
        <div
          className="font-bold uppercase mb-1"
          style={{ fontSize: "14pt" }}
        >
          HỢP ĐỒNG CHO THUÊ KHO BÃI
        </div>
        <div style={{ fontSize: "13pt" }}>
          Số: {id ? `${id}/HĐTK-${year}` : contractRef || "___"}
        </div>
      </div>

      {/* Body */}
      <div
        className="leading-relaxed text-justify"
        style={{ fontSize: "14pt" }}
      >
        <p className="mb-4">
          Căn cứ Bộ Luật Dân Sự số 91/2015/QH13 đã được Quốc hội nước Cộng hòa
          xã hội chủ nghĩa Việt Nam khóa XIII, kỳ họp thứ 10 thông qua ngày 24
          tháng 11 năm 2015;
        </p>
        <p className="mb-4">Căn cứ vào sự thỏa thuận và nhu cầu của hai bên.</p>

        <div className="mt-6 mb-6">
          <div
            className="font-bold mb-2"
            style={{ fontSize: "14pt" }}
          >
            BÊN CHO THUÊ (BÊN A):
          </div>
          <p>
            <strong>Cơ sở / Kho bãi:</strong> {warehouseName || "Không có tên"}
          </p>
          <p>
            <strong>Đại diện pháp luật:</strong>{" "}
            {ownerLegalName || "Khách hàng"}
          </p>
          <p>
            <strong>Mã số thuế:</strong> {ownerTaxCode || "Chưa cập nhật"}
          </p>
          <p>
            <strong>Địa chỉ kho:</strong> {ownerAddress || "Chưa cập nhật"}
          </p>
          <p>
            <strong>Email:</strong> {ownerEmail || "Chưa cập nhật"}
          </p>
          <p>
            <strong>Điện thoại:</strong> {ownerPhone || "Chưa cập nhật"}
          </p>
        </div>

        <div className="mt-6 mb-6">
          <div
            className="font-bold mb-2"
            style={{ fontSize: "14pt" }}
          >
            BÊN THUÊ (BÊN B):
          </div>
          <p>
            <strong>Đại diện pháp luật:</strong>{" "}
            {renterLegalName || "Khách hàng"}
          </p>
          <p>
            <strong>Mã số thuế:</strong> {renterTaxCode || "Chưa cập nhật"}
          </p>
          <p>
            <strong>Địa chỉ:</strong> {renterAddress || "Chưa cập nhật"}
          </p>
          <p>
            <strong>Email:</strong> {renterEmail || "Chưa cập nhật"}
          </p>
          <p>
            <strong>Điện thoại:</strong> {renterPhone || "Chưa cập nhật"}
          </p>
          {requestIdValue && (
            <p>
              <strong>Liên kết Yêu cầu thuê (Request ID):</strong> #
              {requestIdValue}
            </p>
          )}
        </div>

        <div className="mt-6 mb-4">
          <div
            className="font-bold mb-2"
            style={{ fontSize: "14pt" }}
          >
            ĐIỀU 1: NỘI DUNG HỢP ĐỒNG
          </div>
          <p className="mb-2">
            Bên A đồng ý cho Bên B thuê không gian tại kho bãi{" "}
            <strong>{warehouseName || "đã chỉ định"}</strong>.
          </p>
          <p className="mb-2">
            <strong>Thời hạn hiệu lực của hợp đồng:</strong> Từ ngày{" "}
            {fmtDate(startAt)} đến ngày {fmtDate(endAt)}.
          </p>
          {request && (
            <div className="mt-4 mb-4 p-4 border border-gray-300 bg-gray-50 rounded-md print:border-gray-400 print:bg-transparent">
              <div
                className="font-bold uppercase mb-2 text-gray-700 print:text-black"
                style={{ fontSize: "13pt" }}
              >
                Tham chiếu Yêu cầu thuê (#{requestIdValue})
              </div>
              <p
                className="italic text-gray-600 print:text-black mb-3"
                style={{ fontSize: "13pt" }}
              >
                Chi tiết từ Yêu cầu thuê ban đầu. Lưu ý: Các điều khoản, diện
                tích, hoặc mức giá chính thức trong hợp đồng có thể thay đổi
                so với yêu cầu ban đầu tùy theo thỏa thuận thực tế.
              </p>
              <div
                className="space-y-1 pl-3 border-l-2 border-gray-300 print:border-black"
                style={{ fontSize: "13pt" }}
              >
                <p>
                  - Hàng hóa lưu trữ:{" "}
                  {cargoDescription || "Chưa mô tả"}
                </p>
                <p>
                  - Thời gian thuê: {request.duration}{" "}
                  {request.durationUnit === "MONTHS" ||
                  request.durationUnit === "Tháng"
                    ? "Tháng"
                    : request.durationUnit === "YEARS" ||
                      request.durationUnit === "Năm"
                    ? "Năm"
                    : request.durationUnit}
                  {request.startDate && request.endDate && (
                    <span className="italic ml-1">
                      (Từ{" "}
                      {new Date(request.startDate).toLocaleDateString("vi-VN")}{" "}
                      đến{" "}
                      {new Date(request.endDate).toLocaleDateString("vi-VN")})
                    </span>
                  )}
                </p>
                {request.details && request.details.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">- Phân khu yêu cầu thuê:</p>
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                      {request.details.map((d: any, i: number) => {
                        const lineCost = d.rentedArea * d.priceTierValue;
                        return (
                          <li key={i}>
                            Khu vực {d.sector}: {d.rentedArea} {d.areaUnit} x{" "}
                            {new Intl.NumberFormat("vi-VN").format(
                              d.priceTierValue
                            )}{" "}
                            đ/{d.areaUnit} ={" "}
                            <strong>
                              {new Intl.NumberFormat("vi-VN").format(lineCost)}{" "}
                              đ
                            </strong>
                          </li>
                        );
                      })}
                    </ul>
                    {(() => {
                      const totalMonthly = request.details.reduce(
                        (acc: number, d: any) =>
                          acc + d.rentedArea * d.priceTierValue,
                        0
                      );
                      const isYears =
                        request.durationUnit === "YEARS" ||
                        request.durationUnit === "Năm";
                      const durationMultiplier = isYears
                        ? (request.duration || 0) * 12
                        : request.duration || 1;
                      const totalExpected = totalMonthly * durationMultiplier;
                      const unitLabel =
                        request.durationUnit === "MONTHS" ||
                        request.durationUnit === "Tháng"
                          ? "Tháng"
                          : isYears
                          ? "Năm"
                          : request.durationUnit;
                      return (
                        <div
                          className="mt-3 space-y-1"
                          style={{ fontSize: "13pt" }}
                        >
                          <p>
                            - Phí thuê dự kiến gốc cho phân khu:{" "}
                            <strong>
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(totalMonthly)}
                            </strong>
                          </p>
                          <p>
                            - Tổng chi phí dự kiến gốc ({request.duration}{" "}
                            {unitLabel}):{" "}
                            <strong>
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(totalExpected)}
                            </strong>{" "}
                            <span
                              className="italic text-gray-500 print:text-black"
                              style={{ fontSize: "12pt" }}
                            >
                              *(Ước tính dựa trên đơn giá tháng)
                            </span>
                          </p>
                          {request.offeredPrice && (
                            <p>
                              - Tổng chủ kho chốt giá:{" "}
                              <strong>
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(request.offeredPrice)}
                              </strong>
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Notes & Negotiation */}
                {(request.otherDetail ||
                  request.ownerNote ||
                  request.rejectionReason ||
                  request.renterRejectionReason) && (
                  <div className="mt-4 pt-3 border-t border-gray-300 border-dashed print:border-black">
                    <p className="font-semibold mb-1">
                      - Ghi chú & Lịch sử thương lượng:
                    </p>
                    {request.otherDetail && (
                      <p
                        className="ml-4 italic mb-1"
                        style={{ fontSize: "12pt" }}
                      >
                        <span className="not-italic font-medium">
                          Khách hàng ghi chú:
                        </span>{" "}
                        {request.otherDetail}
                      </p>
                    )}
                    {request.ownerNote && (
                      <p
                        className="ml-4 italic mb-1"
                        style={{ fontSize: "12pt" }}
                      >
                        <span className="not-italic font-medium">
                          Chủ kho phản hồi:
                        </span>{" "}
                        {request.ownerNote}
                      </p>
                    )}
                    {request.rejectionReason && (
                      <p
                        className="ml-4 italic text-red-600 print:text-black mb-1"
                        style={{ fontSize: "12pt" }}
                      >
                        <span className="not-italic font-medium">
                          Lý do chủ kho từ chối:
                        </span>{" "}
                        {request.rejectionReason}
                      </p>
                    )}
                    {request.renterRejectionReason && (
                      <p
                        className="ml-4 italic text-red-600 print:text-black"
                        style={{ fontSize: "12pt" }}
                      >
                        <span className="not-italic font-medium">
                          Lý do khách hàng từ chối:
                        </span>{" "}
                        {request.renterRejectionReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            className="font-bold mb-2 mt-6"
            style={{ fontSize: "14pt" }}
          >
            ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG & THANH TOÁN
          </div>
          <p className="mb-2">
            Tổng giá trị hợp đồng chính thức được hai bên thống nhất xác nhận
            là: <strong>{formatCurrency(totalPrice)}</strong>{" "}
            <em>(Chưa bao gồm thuế GTGT)</em>.
          </p>
          {autoCalculatedTotal !== totalPrice && autoCalculatedTotal > 0 && (
            <p
              className="italic text-gray-600 print:text-black mb-2"
              style={{ fontSize: "13pt" }}
            >
              *(Mức giá trên áp dụng theo thỏa thuận cuối cùng của hợp đồng,
              có thể khác với giá dự kiến ban đầu là{" "}
              {formatCurrency(autoCalculatedTotal)}).
            </p>
          )}
          <p className="mb-4">
            {paymentTerm ||
              "Chưa cập nhật phương thức và kỳ hạn thanh toán cụ thể."}
          </p>

          <div
            className="font-bold mb-2 mt-6"
            style={{ fontSize: "14pt" }}
          >
            ĐIỀU 3: ĐIỀU KHOẢN PHẠT & CAM KẾT CHUNG
          </div>
          <p className="mb-2">
            {penaltyClause ||
              "Chưa cập nhật các điều khoản phạt vi phạm hợp đồng."}
          </p>
          <p className="mb-4">
            {specialTerm ||
              "Chưa có các cam kết hoặc điều khoản đặc biệt nào khác."}
          </p>

          <div
            className="font-bold mb-2 mt-6"
            style={{ fontSize: "14pt" }}
          >
            ĐIỀU 4: TÌNH TRẠNG PHÁP LÝ & HIỆU LỰC
          </div>
          {cancelReason && (
            <p>
              <strong>Lý do hủy/chấm dứt:</strong> {cancelReason}
            </p>
          )}
          <p className="mt-2">
            Hợp đồng này được tạo và lưu trữ trên hệ thống nền tảng AiLogis,
            có giá trị pháp lý tương đương văn bản thỏa thuận điện tử giữa
            các bên kể từ ngày ký ({day}/{month}/{year}).
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-16 grid grid-cols-2 gap-8 text-center break-inside-avoid">
        <div>
          <div
            className="font-bold mb-1"
            style={{ fontSize: "14pt" }}
          >
            ĐẠI DIỆN BÊN A
          </div>
          <p
            className="italic mb-20"
            style={{ fontSize: "13pt" }}
          >
            (Ký, ghi rõ họ tên)
          </p>
          <p className="font-bold" style={{ fontSize: "14pt" }}>
            {ownerLegalName || "Khách hàng"}
          </p>
        </div>
        <div>
          <div
            className="font-bold mb-1"
            style={{ fontSize: "14pt" }}
          >
            ĐẠI DIỆN BÊN B
          </div>
          <p
            className="italic mb-20"
            style={{ fontSize: "13pt" }}
          >
            (Ký, ghi rõ họ tên)
          </p>
          <p className="font-bold">{renterLegalName || "Khách hàng"}</p>
        </div>
      </div>
    </div>
  );
}
