import {
  MapPin,
  Award,
  Package,
  DollarSign,
} from "lucide-react";
import { FilterMetaResponseDTO } from "../../../services/renterService";
import { LocationMultiSelect } from "../../components/renter/LocationMultiSelect";

// ─── Types ────────────────────────────────────────────────────────────────────
export type SelectMode = "single" | "multi" | "range";

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
  rangeIds?: [string, string];
  customComponent?: React.ComponentType<CustomComponentProps>;
}

export interface CustomComponentProps {
  selected: string[];
  onToggle: (value: string) => void;
  onClearAll: () => void;
  provinces: string[];
}

// ─── Attribute definitions ────────────────────────────────────────────────────
export const getAttributes = (meta: FilterMetaResponseDTO): Attribute[] => {
  const locations: string[] = [
    ...(meta.locations || []),
    "Hồ Chí Minh",
    "Hà Nội",
    "Đà Nẵng",
    "Bình Dương",
  ];
  const uniqueLocations = Array.from(new Set(locations)).sort();

  const LocationPicker = ({ selected, onToggle, onClearAll }: CustomComponentProps) => (
    <LocationMultiSelect
      selected={selected}
      onToggle={onToggle}
      onClearAll={onClearAll}
      provinces={uniqueLocations}
    />
  );

  return [
    {
      id: "location",
      icon: <MapPin className="h-4 w-4" />,
      label: "Tỉnh / Thành phố",
      mode: "multi",
      explanation:
        "Chọn địa điểm bạn muốn thuê kho. Có thể chọn nhiều tỉnh thành để mở rộng vùng tìm kiếm và so sánh các lựa chọn.",
      options: [],
      customComponent: LocationPicker,
    },
    {
      id: "capacity",
      icon: <Package className="h-4 w-4" />,
      label: "Khoảng công suất (m²)",
      mode: "range",
      explanation:
        "Nhập khoảng công suất tối thiểu và tối đa bạn muốn tìm kiếm.",
      options: [],
      rangeIds: ["minCapacity", "maxCapacity"],
    },
    {
      id: "price",
      icon: <DollarSign className="h-4 w-4" />,
      label: "Giá (VNĐ/m²/tháng)",
      mode: "range",
      explanation:
        "Nhập mức giá tối thiểu và tối đa để tìm kho phù hợp với ngân sách của bạn.",
      options: [],
      rangeIds: ["minPrice", "maxPrice"],
    },
    {
      id: "certifications",
      icon: <Award className="h-4 w-4" />,
      label: "Chứng nhận yêu cầu",
      mode: "multi",
      explanation:
        "Chứng nhận xác nhận kho đáp ứng tiêu chuẩn an toàn thực phẩm và vệ sinh quốc tế.",
      options: [
        ...(meta.certifications || []).map((c: any) => ({
          value: c.certID.toString(),
          label: c.label,
          hint: c.labelDesc || "",
        })),
        { value: "none", label: "Không yêu cầu", hint: "Phù hợp hàng tiêu thụ nội địa không cần chứng nhận đặc biệt" },
      ],
    },
  ];
};

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
