import { CompositeRentRequest } from '../../../types/renter';
import { Send, Eye, MessageSquare, XCircle, FileText, Clock, CheckCircle } from 'lucide-react';
import React from 'react';

export type RequestStatus = CompositeRentRequest['status'];
export type IncomingRequest = CompositeRentRequest;

export const CARGO_LABEL: Record<string, string> = {
  frozen_food: 'Thực phẩm đông lạnh',
  seafood: 'Hải sản tươi sống',
  vegetables: 'Rau củ quả tươi',
  dairy: 'Sữa & chế phẩm',
  pharma: 'Dược phẩm / y tế',
  beverage: 'Đồ uống / nước giải khát',
  cosmetics: 'Mỹ phẩm',
  chemical: 'Hóa chất kiểm soát',
  other: 'Loại hàng khác',
};

export const UNIT_LABEL: Record<string, string> = { month: 'tháng', day: 'ngày', year: 'năm' };

export const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Đang chờ', color: '#f59e0b', icon: <Clock className="h-3 w-3" /> },
  NEGOTIATING: { label: 'Đang thương lượng', color: '#3b82f6', icon: <MessageSquare className="h-3 w-3" /> },
  APPROVED: { label: 'Đã chấp nhận', color: '#22c55e', icon: <CheckCircle className="h-3 w-3" /> },
  REJECTED: { label: 'Đã từ chối', color: '#ef4444', icon: <XCircle className="h-3 w-3" /> },
};

export type FilterTab = 'all' | RequestStatus;
export const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'PENDING', label: 'Đang chờ' },
  { key: 'NEGOTIATING', label: 'Đang thương lượng' },
  { key: 'APPROVED', label: 'Đã chấp nhận' },
  { key: 'REJECTED', label: 'Đã từ chối' },
];

export const CONTRACT_CFG: Record<string, { label: string; sublabel: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: { label: 'Nháp hợp đồng', sublabel: 'Chưa gửi cho người thuê', color: '#6b7280', bg: 'rgba(107,114,128,0.07)', icon: <FileText className="h-3.5 w-3.5" /> },
  pending_renter: { label: 'Chờ người thuê ký', sublabel: 'Đã gửi — đang đợi xác nhận', color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', icon: <Clock className="h-3.5 w-3.5" /> },
  active: { label: 'Hợp đồng đang hiệu lực', sublabel: 'Người thuê đã ký — đang chạy', color: '#22c55e', bg: 'rgba(34,197,94,0.07)', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  expired: { label: 'Hợp đồng hết hạn', sublabel: 'Đã kết thúc', color: '#9ca3af', bg: 'rgba(156,163,175,0.07)', icon: <XCircle className="h-3.5 w-3.5" /> },
  cancelled: { label: 'Hợp đồng đã hủy', sublabel: 'Đã bị hủy', color: '#ef4444', bg: 'rgba(239,68,68,0.07)', icon: <XCircle className="h-3.5 w-3.5" /> },
};

export const fmtDate = (iso: string | undefined) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export function relativeTime(iso: string | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 2) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return fmtDate(iso);
}
