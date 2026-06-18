import React from "react";
import {
    Send, Eye, XCircle, MessageSquare, FileText, AlertCircle, CheckCircle, Clock
} from "lucide-react";
import { RentRequestStatus } from "../../../types";

export type RequestStatus = RentRequestStatus;
export type FilterTab = "all" | RequestStatus;

export const CARGO_LABEL: Record<string, string> = {
    frozen_food: "Thực phẩm đông lạnh",
    seafood: "Hải sản tươi sống",
    vegetables: "Rau củ quả tươi",
    dairy: "Sữa & chế phẩm",
    pharma: "Dược phẩm / y tế",
    beverage: "Đồ uống / nước giải khát",
    cosmetics: "Mỹ phẩm",
    chemical: "Hóa chất kiểm soát",
    other: "Loại hàng khác",
};

export const UNIT_LABEL: Record<string, string> = {
    month: "tháng", day: "ngày", year: "năm",
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    PENDING: { label: "Đang chờ", color: "#f59e0b", icon: <Clock className="h-3 w-3" />, description: "Đang chờ chủ kho phản hồi." },
    APPROVED: { label: "Đã chấp nhận", color: "#22c55e", icon: <CheckCircle className="h-3 w-3" />, description: "Chủ kho đã chấp nhận yêu cầu này." },
    REJECTED: { label: "Từ chối", color: "#ef4444", icon: <XCircle className="h-3 w-3" />, description: "Chủ kho đã từ chối yêu cầu này." },
};

export const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "PENDING", label: "Đang chờ" },
    { key: "APPROVED", label: "Đã chấp nhận" },
    { key: "REJECTED", label: "Từ chối" },
];

export const CONTRACT_CFG: Record<string, { label: string; sublabel: string; color: string; bg: string; actionLabel: string; icon: React.ReactNode }> = {
    draft: { label: "Đang soạn hợp đồng", sublabel: "Chủ kho chưa gửi cho bạn", color: "#6b7280", bg: "rgba(107,114,128,0.07)", actionLabel: "Xem chi tiết", icon: <FileText className="h-3.5 w-3.5" /> },
    pending_renter: { label: "Chờ bạn ký xác nhận", sublabel: "Chủ kho đã gửi hợp đồng", color: "#7c3aed", bg: "rgba(124,58,237,0.07)", actionLabel: "Xem & ký hợp đồng", icon: <AlertCircle className="h-3.5 w-3.5" /> },
    active: { label: "Hợp đồng đang hiệu lực", sublabel: "Đã ký — đang chạy", color: "#22c55e", bg: "rgba(34,197,94,0.07)", actionLabel: "Xem hợp đồng", icon: <CheckCircle className="h-3.5 w-3.5" /> },
    expired: { label: "Hợp đồng hết hạn", sublabel: "Đã kết thúc", color: "#9ca3af", bg: "rgba(156,163,175,0.07)", actionLabel: "Xem hợp đồng", icon: <XCircle className="h-3.5 w-3.5" /> },
    cancelled: { label: "Hợp đồng đã hủy", sublabel: "Đã bị hủy", color: "#ef4444", bg: "rgba(239,68,68,0.07)", actionLabel: "Xem hợp đồng", icon: <XCircle className="h-3.5 w-3.5" /> },
};

export const fmtDate = (iso: string | undefined) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch { return iso; }
};

export const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export function relativeTime(iso: string | undefined): string {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (mins < 2) return "vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return fmtDate(iso);
}
