import {
  Thermometer,
  MapPin,
  Package,
  DollarSign,
  Shield,
  Award,
  Zap,
  TrendingUp,
} from "lucide-react";
import { vietnamProvinces, availableFeatures } from "../../../data";

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
    id: "temperatureZone",
    icon: <Thermometer className="h-4 w-4" />,
    label: "Dải nhiệt độ yêu cầu",
    mode: "multi",
    explanation:
      "Chọn một hoặc nhiều dải nhiệt độ bạn cần. Kết quả sẽ bao gồm kho hỗ trợ bất kỳ dải nào trong số đã chọn.",
    options: [
      { value: "deep_freeze", label: "Đông lạnh sâu", hint: "-25°C đến -18°C" },
      { value: "freeze", label: "Đông lạnh", hint: "-18°C đến -10°C" },
      { value: "cold", label: "Lạnh", hint: "-10°C đến 0°C" },
      { value: "cool", label: "Mát", hint: "0°C đến 8°C" },
      { value: "climate", label: "Kiểm soát khí hậu", hint: "8°C đến 15°C" },
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
      ...vietnamProvinces.map((p) => ({ value: p, label: p, hint: "" })),
      { value: "other", label: "Tỉnh thành khác", hint: "Mở rộng tìm kiếm toàn quốc" },
    ],
  },
  {
    id: "capacity",
    icon: <Package className="h-4 w-4" />,
    label: "Công suất cần thuê",
    mode: "multi",
    explanation:
      "Chọn một hoặc nhiều mức công suất. Kho sẽ được lọc nếu diện tích còn trống rơi vào bất kỳ mức nào bạn chọn.",
    options: [
      { value: "xs", label: "Nhỏ  < 200 m³", hint: "Dưới 200 m³" },
      { value: "sm", label: "Vừa nhỏ  200–500 m³", hint: "200 đến 500 m³" },
      { value: "md", label: "Trung bình  500–2000 m³", hint: "500 đến 2000 m³" },
      { value: "lg", label: "Lớn  2000–5000 m³", hint: "2000 đến 5000 m³" },
      { value: "xl", label: "Rất lớn  > 5000 m³", hint: "Hơn 5000 m³" },
    ],
  },
  {
    id: "budget",
    icon: <DollarSign className="h-4 w-4" />,
    label: "Ngân sách thuê kho",
    mode: "multi",
    explanation:
      "Chọn một hoặc nhiều khoảng giá. Kết quả sẽ gộp tất cả kho nằm trong bất kỳ khoảng giá nào bạn chọn.",
    options: [
      { value: "budget", label: "Tiết kiệm  < 200k đ", hint: "Dưới 200,000 VND" },
      { value: "mid", label: "Trung bình  200–350k đ", hint: "200,000 đến 350,000 VND" },
      { value: "high", label: "Cao cấp  350–500k đ", hint: "350,000 đến 500,000 VND" },
      { value: "premium", label: "Hạng sang  > 500k đ", hint: "Trên 500,000 VND" },
      { value: "any", label: "Không giới hạn", hint: "Ưu tiên chất lượng và sự phù hợp hơn giá cả" },
    ],
  },
  {
    id: "certifications",
    icon: <Award className="h-4 w-4" />,
    label: "Chứng nhận yêu cầu",
    mode: "multi",
    explanation:
      "Chứng nhận xác nhận kho đáp ứng tiêu chuẩn an toàn thực phẩm và vệ sinh quốc tế.",
    options: [
      { value: "1", label: "HACCP", hint: "Phân tích mối nguy & kiểm soát điểm tới hạn" },
      { value: "2", label: "ISO 22000", hint: "Hệ thống quản lý ATTP quốc tế" },
      { value: "3", label: "GMP", hint: "Thực hành sản xuất tốt" },
      { value: "4", label: "GDP", hint: "Thực hành phân phối tốt" },
      { value: "5", label: "ISO 9001", hint: "Quản lý chất lượng" },
      { value: "6", label: "ATTP", hint: "An toàn thực phẩm" },
      { value: "none", label: "Không yêu cầu", hint: "Phù hợp hàng tiêu thụ nội địa không cần chứng nhận đặc biệt" },
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
      { value: "high", label: "Bảo mật cao", hint: "Camera 24/7, bảo vệ tuần tra, kiểm soát ra vào bằng thẻ từ/vân tay" },
      { value: "medium", label: "Bảo mật trung bình", hint: "Camera an ninh, hệ thống kiểm soát ra vào cơ bản" },
      { value: "basic", label: "Cơ bản", hint: "Khóa an ninh, camera cổng — phù hợp hàng phổ thông" },
      { value: "any", label: "Không quan trọng", hint: "AI không lọc theo tiêu chí bảo mật" },
    ],
  },
  {
    id: "features",
    icon: <Zap className="h-4 w-4" />,
    label: "Tiện ích & Dịch vụ đặc biệt",
    mode: "multi",
    explanation:
      "Tiện ích bổ sung giúp tối ưu logistics. Chọn những gì thực sự cần thiết cho hoạt động của bạn.",
    options: availableFeatures.map((f) => ({ value: f, label: f, hint: "" })),
  },
  {
    id: "availability",
    icon: <TrendingUp className="h-4 w-4" />,
    label: "Tình trạng kho",
    mode: "multi",
    explanation:
      'Chọn một hoặc nhiều tình trạng. Kho "còn trống" nhận hàng ngay; "còn một phần" vẫn có diện tích.',
    options: [
      { value: "available", label: "Còn trống", hint: "Có thể nhận hàng ngay lập tức, không cần chờ đợi" },
      { value: "partially", label: "Còn một phần", hint: "Còn diện tích, phù hợp lượng hàng nhỏ hơn tổng công suất" },
      { value: "all", label: "Tất cả", hint: "Hiển thị tất cả — hữu ích để so sánh và lập kế hoạch trước" },
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
