import {
  Box,
  Thermometer,
  MapPin,
  Package,
  DollarSign,
  Shield,
  Award,
  Zap,
  TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type SelectMode = "single" | "multi";

export interface AttrOption {
  value: string;
  label: string;
  hint: string;
}

export interface Attribute {
  id: string;
  icon: React.ReactNode;
  label: string;
  explanation: string;
  mode: SelectMode;
  options: AttrOption[];
}

// ─── Attribute definitions ────────────────────────────────────────────────────
export const ATTRIBUTES: Attribute[] = [
  {
    id: "productType",
    icon: <Box className="h-4 w-4" />,
    label: "Loại hàng hóa cần bảo quản",
    mode: "multi",
    explanation:
      "Chọn loại hàng hóa bạn cần lưu trữ. Mỗi loại đòi hỏi dải nhiệt độ và điều kiện khác nhau, giúp AI đề xuất kho tối ưu nhất.",
    options: [
      {
        value: "seafood",
        label: "🦐 Thủy hải sản",
        hint: "Cá, tôm, mực — cần đông lạnh sâu -25°C đến -18°C",
      },
      {
        value: "meat",
        label: "🥩 Thịt & Gia cầm",
        hint: "Bò, lợn, gà, vịt — cần đông lạnh -18°C đến -10°C",
      },
      {
        value: "vegetables",
        label: "🥦 Rau củ quả tươi",
        hint: "Rau, trái cây — kho mát 0°C đến 8°C",
      },
      {
        value: "dairy",
        label: "🥛 Sữa & Nước uống",
        hint: "Sữa tươi, nước ép — kho mát 2°C đến 8°C",
      },
      {
        value: "pharma",
        label: "💊 Dược phẩm & Vaccine",
        hint: "Thuốc, vaccine — kiểm soát nhiệt độ chặt chẽ theo chuẩn GSP",
      },
      {
        value: "processed",
        label: "🍱 Thực phẩm chế biến",
        hint: "Thức ăn nhanh, thực phẩm đông lạnh đóng gói",
      },
      {
        value: "fruit",
        label: "🍊 Trái cây nhiệt đới",
        hint: "Xoài, bơ, chuối — kiểm soát khí hậu 8–15°C",
      },
      {
        value: "flower",
        label: "🌸 Hoa & Cây cảnh",
        hint: "Hoa tươi — kho mát 2°C đến 6°C",
      },
    ],
  },
  {
    id: "temperatureZone",
    icon: <Thermometer className="h-4 w-4" />,
    label: "Dải nhiệt độ yêu cầu",
    mode: "multi",
    explanation:
      "Chọn một hoặc nhiều dải nhiệt độ bạn cần. Kết quả sẽ bao gồm kho hỗ trợ bất kỳ dải nào trong số đã chọn — hữu ích khi hàng hóa cần nhiều chế độ bảo quản khác nhau.",
    options: [
      {
        value: "deep_freeze",
        label: "Đông lạnh sâu",
        hint: "-25°C đến -18°C — thủy hải sản, kem, hải sản xuất khẩu",
      },
      {
        value: "freeze",
        label: "Đông lạnh",
        hint: "-18°C đến -10°C — thịt, cá, gia cầm",
      },
      {
        value: "cold",
        label: "Lạnh",
        hint: "-10°C đến 0°C — thực phẩm đặc thù, một số rau củ",
      },
      {
        value: "cool",
        label: "Mát",
        hint: "0°C đến 8°C — sữa, rau tươi, nước uống",
      },
      {
        value: "climate",
        label: "Kiểm soát khí hậu",
        hint: "8°C đến 15°C — trái cây nhiệt đới, hoa, rượu vang",
      },
    ],
  },
  {
    id: "location",
    icon: <MapPin className="h-4 w-4" />,
    label: "Tỉnh / Thành phố",
    mode: "multi",
    explanation:
      "Chọn địa điểm bạn muốn thuê kho. Có thể chọn nhiều tỉnh thành để mở rộng vùng tìm kiếm và so sánh các lựa chọn.",
    options: [
      {
        value: "hanoi",
        label: "Hà Nội",
        hint: "Thủ đô — trung tâm phân phối miền Bắc",
      },
      {
        value: "hcmc",
        label: "TP. Hồ Chí Minh",
        hint: "Trung tâm thương mại — mật độ kho cao nhất cả nước",
      },
      {
        value: "danang",
        label: "Đà Nẵng",
        hint: "Cửa ngõ miền Trung — gần cảng Tiên Sa",
      },
      {
        value: "haiphong",
        label: "Hải Phòng",
        hint: "Cảng biển quốc tế — thuận lợi xuất nhập khẩu",
      },
      {
        value: "cantho",
        label: "Cần Thơ",
        hint: "Trung tâm ĐBSCL — kho thủy sản phong phú",
      },
      {
        value: "binhduong",
        label: "Bình Dương",
        hint: "Khu công nghiệp tập trung — logistics rất phát triển",
      },
      {
        value: "dongnai",
        label: "Đồng Nai",
        hint: "Gần sân bay Long Thành — logistics hàng không",
      },
      {
        value: "vungtau",
        label: "Vũng Tàu",
        hint: "Cảng dầu khí — kho đặc thù công nghiệp nặng",
      },
      {
        value: "longan",
        label: "Long An",
        hint: "Cửa ngõ miền Tây — nông sản và trái cây",
      },
      {
        value: "other",
        label: "Tỉnh thành khác",
        hint: "Mở rộng tìm kiếm toàn quốc",
      },
    ],
  },
  {
    id: "capacity",
    icon: <Package className="h-4 w-4" />,
    label: "Công suất cần thuê",
    mode: "multi",
    explanation:
      "Chọn một hoặc nhiều mức công suất. Kho sẽ được lọc nếu diện tích còn trống rơi vào bất kỳ mức nào bạn chọn — phù hợp khi bạn đang cân nhắc nhiều phương án quy mô.",
    options: [
      {
        value: "xs",
        label: "Nhỏ  < 200 m³",
        hint: "Phù hợp doanh nghiệp nhỏ, nhà hàng, hoặc thử nghiệm thị trường",
      },
      {
        value: "sm",
        label: "Vừa nhỏ  200–500 m³",
        hint: "Doanh nghiệp vừa, siêu thị nhỏ, nhà phân phối địa phương",
      },
      {
        value: "md",
        label: "Trung bình  500–2000 m³",
        hint: "Nhà phân phối, công ty thực phẩm, xuất khẩu vừa",
      },
      {
        value: "lg",
        label: "Lớn  2000–5000 m³",
        hint: "Tập đoàn, nhà máy chế biến, trung tâm phân phối",
      },
      {
        value: "xl",
        label: "Rất lớn  > 5000 m³",
        hint: "Kho trung chuyển, xuất nhập khẩu quy mô lớn",
      },
    ],
  },
  {
    id: "budget",
    icon: <DollarSign className="h-4 w-4" />,
    label: "Ngân sách thuê kho",
    mode: "multi",
    explanation:
      "Chọn một hoặc nhiều khoảng giá. Kết quả sẽ gộp tất cả kho nằm trong bất kỳ khoảng giá nào bạn chọn — giúp so sánh nhiều phân khúc cùng lúc.",
    options: [
      {
        value: "budget",
        label: "Tiết kiệm  < 200k đ",
        hint: "Kho cơ bản, vị trí ngoại thành, phù hợp hàng phổ thông",
      },
      {
        value: "mid",
        label: "Trung bình  200–350k đ",
        hint: "Cân bằng chi phí & tiện ích, phổ biến nhất",
      },
      {
        value: "high",
        label: "Cao cấp  350–500k đ",
        hint: "Kho tiêu chuẩn quốc tế, đủ điều kiện xuất khẩu",
      },
      {
        value: "premium",
        label: "Hạng sang  > 500k đ",
        hint: "Kho dược phẩm, chuẩn GSP, kiểm soát đặc biệt",
      },
      {
        value: "any",
        label: "Không giới hạn",
        hint: "Ưu tiên chất lượng và sự phù hợp hơn giá cả",
      },
    ],
  },
  {
    id: "certifications",
    icon: <Award className="h-4 w-4" />,
    label: "Chứng nhận yêu cầu",
    mode: "multi",
    explanation:
      "Chứng nhận xác nhận kho đáp ứng tiêu chuẩn an toàn thực phẩm và vệ sinh quốc tế. Bắt buộc với hàng xuất khẩu sang EU, Mỹ, Nhật Bản.",
    options: [
      {
        value: "haccp",
        label: "HACCP",
        hint: "Phân tích mối nguy & kiểm soát điểm tới hạn — tiêu chuẩn cơ bản",
      },
      {
        value: "iso22000",
        label: "ISO 22000",
        hint: "Hệ thống quản lý ATTP quốc tế — uy tín toàn cầu",
      },
      {
        value: "gmp",
        label: "GMP",
        hint: "Thực hành sản xuất tốt — bắt buộc với dược phẩm",
      },
      {
        value: "fssc",
        label: "FSSC 22000",
        hint: "Tiêu chuẩn cao nhất về ATTP — yêu cầu của nhiều nhà bán lẻ quốc tế",
      },
      {
        value: "brc",
        label: "BRC",
        hint: "Tiêu chuẩn Anh Quốc — cần thiết khi xuất khẩu sang châu Âu",
      },
      {
        value: "none",
        label: "Không yêu cầu",
        hint: "Phù hợp hàng tiêu thụ nội địa không cần chứng nhận đặc biệt",
      },
    ],
  },
  {
    id: "security",
    icon: <Shield className="h-4 w-4" />,
    label: "Mức độ bảo mật",
    mode: "multi",
    explanation:
      "Chọn một hoặc nhiều mức bảo mật chấp nhận được. Kho sẽ hiển thị nếu hệ thống an ninh khớp bất kỳ mức nào bạn đã chọn.",
    options: [
      {
        value: "high",
        label: "Bảo mật cao",
        hint: "Camera 24/7, bảo vệ tuần tra, kiểm soát ra vào bằng thẻ từ/vân tay",
      },
      {
        value: "medium",
        label: "Bảo mật trung bình",
        hint: "Camera an ninh, hệ thống kiểm soát ra vào cơ bản",
      },
      {
        value: "basic",
        label: "Cơ bản",
        hint: "Khóa an ninh, camera cổng — phù hợp hàng phổ thông",
      },
      {
        value: "any",
        label: "Không quan trọng",
        hint: "AI không lọc theo tiêu chí bảo mật",
      },
    ],
  },
  {
    id: "features",
    icon: <Zap className="h-4 w-4" />,
    label: "Tiện ích & Dịch vụ đặc biệt",
    mode: "multi",
    explanation:
      "Tiện ích bổ sung giúp tối ưu logistics. Chọn những gì thực sự cần thiết cho hoạt động của bạn — mỗi tiện ích có thể ảnh hưởng đến giá thuê.",
    options: [
      {
        value: "port",
        label: "⚓ Gần cảng biển",
        hint: "Trong bán kính 10km — giảm chi phí vận chuyển hàng nhập/xuất",
      },
      {
        value: "airport",
        label: "✈️ Gần sân bay",
        hint: "Logistics hàng không — phù hợp hàng tươi sống xuất khẩu nhanh",
      },
      {
        value: "industrial",
        label: "🏭 Gần khu công nghiệp",
        hint: "Trong hoặc lân cận KCN — thuận tiện cho nhà máy",
      },
      {
        value: "24h",
        label: "🕐 Hoạt động 24/7",
        hint: "Nhận & xuất hàng bất kỳ giờ — linh hoạt cho logistics quốc tế",
      },
      {
        value: "loading",
        label: "🚛 Bốc xếp tại chỗ",
        hint: "Đội bốc xếp chuyên nghiệp và xe nâng sẵn sàng",
      },
      {
        value: "transport",
        label: "🚚 Xe lạnh tích hợp",
        hint: "Dịch vụ vận chuyển bằng xe tải lạnh — giao hàng tận nơi",
      },
      {
        value: "packing",
        label: "📦 Phòng đóng gói",
        hint: "Không gian đóng gói và dán nhãn ngay trong khu vực kho",
      },
      {
        value: "monitoring",
        label: "📡 Giám sát online",
        hint: "Dashboard theo dõi nhiệt độ & độ ẩm real-time qua app",
      },
    ],
  },
  {
    id: "availability",
    icon: <TrendingUp className="h-4 w-4" />,
    label: "Tình trạng kho",
    mode: "multi",
    explanation:
      'Chọn một hoặc nhiều tình trạng. Kho "còn trống" nhận hàng ngay; "còn một phần" vẫn có diện tích; chọn cả hai để xem toàn bộ lựa chọn khả dụng.',
    options: [
      {
        value: "available",
        label: "Còn trống",
        hint: "Có thể nhận hàng ngay lập tức, không cần chờ đợi",
      },
      {
        value: "partially",
        label: "Còn một phần",
        hint: "Còn diện tích, phù hợp lượng hàng nhỏ hơn tổng công suất",
      },
      {
        value: "all",
        label: "Tất cả",
        hint: "Hiển thị tất cả — hữu ích để so sánh và lập kế hoạch trước",
      },
    ],
  },
];

// ─── Quick suggestion pills for the chat ─────────────────────────────────────
export const QUICK_SUGGESTIONS: string[] = [
  "Kho nào rẻ nhất?",
  "So sánh top 3 lựa chọn",
  "Chỉ kho có chứng nhận",
  "Kho bảo mật cao nhất",
  "Kho công suất lớn nhất",
  "Kho nào còn trống ngay?",
  "Xem tất cả lại",
];
