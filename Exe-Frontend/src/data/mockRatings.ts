import { WarehouseRating } from '../types';

/**
 * Seed ratings tied to warehouses storage-1 … storage-6.
 * Extracted here so both ratingSlice and DataLoader can reference them.
 */
export const MockRatings: WarehouseRating[] = [

  // ── storage-1 — Kho lạnh Cát Lái (avg ≈ 4.7) ──────────────────────────────
  {
    id: 'r-1-1', warehouseId: 'storage-1', contractId: 'c-seed-1-1',
    renterId: 'renter-seed-1', renterName: 'Nguyễn Văn Hùng',
    renterCompany: 'Công ty TNHH Thực phẩm Sạch', stars: 5,
    comment: 'Kho sạch sẽ, nhiệt độ duy trì rất ổn định suốt 6 tháng thuê. Đội ngũ kỹ thuật phản hồi nhanh mỗi khi có sự cố nhỏ. Vị trí cảng Cát Lái cực kỳ thuận tiện cho xuất hàng.',
    createdAt: '2024-08-12T08:00:00.000Z', updatedAt: '2024-08-12T08:00:00.000Z',
  },
  {
    id: 'r-1-2', warehouseId: 'storage-1', contractId: 'c-seed-1-2',
    renterId: 'renter-seed-2', renterName: 'Trần Thị Lan',
    renterCompany: 'Hải sản Đại Dương Export', stars: 5,
    comment: 'Phòng đông lạnh đạt chuẩn xuất khẩu EU. Giấy tờ HACCP đầy đủ, kiểm tra FDA không gặp vướng mắc gì. Sẽ gia hạn hợp đồng thêm 1 năm.',
    createdAt: '2024-09-03T10:30:00.000Z', updatedAt: '2024-09-03T10:30:00.000Z',
  },
  {
    id: 'r-1-3', warehouseId: 'storage-1', contractId: 'c-seed-1-3',
    renterId: 'renter-seed-3', renterName: 'Lê Thanh Tùng',
    renterCompany: 'Vinafarm Logistics', stars: 4,
    comment: 'Chất lượng bảo quản tốt, nhân viên nhiệt tình. Chỉ tiếc là bãi đỗ xe container hơi hẹp vào giờ cao điểm.',
    createdAt: '2024-10-17T14:20:00.000Z', updatedAt: '2024-10-17T14:20:00.000Z',
  },
  {
    id: 'r-1-4', warehouseId: 'storage-1', contractId: 'c-seed-1-4',
    renterId: 'renter-seed-4', renterName: 'Phạm Minh Khoa',
    renterCompany: 'Sài Gòn Dairy Co.', stars: 5,
    comment: 'Khu bảo quản lạnh phù hợp hoàn hảo cho sữa và chế phẩm từ sữa. Nhiệt độ không dao động quá ±0.5°C.',
    createdAt: '2024-11-05T09:00:00.000Z', updatedAt: '2024-11-05T09:00:00.000Z',
  },
  {
    id: 'r-1-5', warehouseId: 'storage-1', contractId: 'c-seed-1-5',
    renterId: 'renter-seed-5', renterName: 'Hoàng Thị Mai',
    renterCompany: 'FreshVeg Trading', stars: 5,
    comment: 'Khu đóng gói & xuất hàng rất chuyên nghiệp, giúp tiết kiệm thêm 1 công đoạn vận chuyển.',
    createdAt: '2025-01-20T11:45:00.000Z', updatedAt: '2025-01-20T11:45:00.000Z',
  },
  {
    id: 'r-1-6', warehouseId: 'storage-1', contractId: 'c-seed-1-6',
    renterId: 'renter-seed-6', renterName: 'Vũ Đức Anh',
    renterCompany: 'Seacold Vietnam', stars: 4,
    comment: 'Ổn định và đáng tin cậy. Mình đã thuê 3 lần ở đây. Giá hơi nhỉnh so với các kho khác ở Bình Dương.',
    createdAt: '2025-03-08T07:30:00.000Z', updatedAt: '2025-03-08T07:30:00.000Z',
  },

  // ── storage-2 — Kho lạnh Tân Thuận (avg ≈ 4.3) ────────────────────────────
  {
    id: 'r-2-1', warehouseId: 'storage-2', contractId: 'c-seed-2-1',
    renterId: 'renter-seed-7', renterName: 'Đinh Quốc Bảo',
    renterCompany: 'Quốc Bảo Seafood', stars: 5,
    comment: 'Kho đông lạnh giữ nhiệt rất tốt cho thủy sản, đạt tiêu chuẩn xuất khẩu Nhật Bản.',
    createdAt: '2024-07-22T08:15:00.000Z', updatedAt: '2024-07-22T08:15:00.000Z',
  },
  {
    id: 'r-2-2', warehouseId: 'storage-2', contractId: 'c-seed-2-2',
    renterId: 'renter-seed-8', renterName: 'Nguyễn Thị Phương',
    renterCompany: 'Mekong Agri Export', stars: 4,
    comment: 'Vị trí gần cảng rất tiện, xe tải vào được thoải mái. Khu đóng gói sạch và thoáng.',
    createdAt: '2024-09-14T13:00:00.000Z', updatedAt: '2024-09-14T13:00:00.000Z',
  },
  {
    id: 'r-2-3', warehouseId: 'storage-2', contractId: 'c-seed-2-3',
    renterId: 'renter-seed-9', renterName: 'Trương Văn Long',
    renterCompany: 'Saigon Pharma Logistics', stars: 4,
    comment: 'Đội ngũ hỗ trợ phản hồi qua app rất nhanh. Hệ thống camera và bảo vệ 24/7 khiến mình yên tâm.',
    createdAt: '2024-12-01T10:00:00.000Z', updatedAt: '2024-12-01T10:00:00.000Z',
  },
  {
    id: 'r-2-4', warehouseId: 'storage-2', contractId: 'c-seed-2-4',
    renterId: 'renter-seed-10', renterName: 'Lý Thị Hoa',
    renterCompany: 'Nam Hoa Frozen Foods', stars: 3,
    comment: 'Kho ổn nhưng khu đóng gói hơi nhỏ so với volume hàng của mình.',
    createdAt: '2025-02-10T15:30:00.000Z', updatedAt: '2025-02-10T15:30:00.000Z',
  },

  // ── storage-3 — Kho lạnh Bình Dương (avg ≈ 3.9) ───────────────────────────
  {
    id: 'r-3-1', warehouseId: 'storage-3', contractId: 'c-seed-3-1',
    renterId: 'renter-seed-11', renterName: 'Bùi Văn Thắng',
    renterCompany: 'Thắng Lợi Ice Cream', stars: 4,
    comment: 'Kho đông lạnh công nghiệp với sức chứa lớn, phù hợp cho kem. Giá rất cạnh tranh.',
    createdAt: '2024-06-10T09:30:00.000Z', updatedAt: '2024-06-10T09:30:00.000Z',
  },
  {
    id: 'r-3-2', warehouseId: 'storage-3', contractId: 'c-seed-3-2',
    renterId: 'renter-seed-12', renterName: 'Cao Thị Ngọc',
    renterCompany: 'Bình Dương Veggie Farm', stars: 3,
    comment: 'Khu bảo quản mát dùng được nhưng hệ thống chiếu sáng bên trong khá tối.',
    createdAt: '2024-08-25T14:00:00.000Z', updatedAt: '2024-08-25T14:00:00.000Z',
  },
  {
    id: 'r-3-3', warehouseId: 'storage-3', contractId: 'c-seed-3-3',
    renterId: 'renter-seed-13', renterName: 'Đặng Minh Tuấn',
    renterCompany: 'Tuấn Phát Food Industry', stars: 5,
    comment: 'Dung tích 5.000m³ đông lạnh là lợi thế lớn. Giá năm rất hợp lý.',
    createdAt: '2024-11-30T08:45:00.000Z', updatedAt: '2024-11-30T08:45:00.000Z',
  },
  {
    id: 'r-3-4', warehouseId: 'storage-3', contractId: 'c-seed-3-4',
    renterId: 'renter-seed-14', renterName: 'Phan Thị Thu',
    renterCompany: 'Thu Hương Flower Export', stars: 3,
    comment: 'Khu mát phù hợp bảo quản hoa tươi ngắn hạn. Không có chứng chỉ HACCP là nhược điểm lớn.',
    createdAt: '2025-01-07T11:15:00.000Z', updatedAt: '2025-01-07T11:15:00.000Z',
  },

  // ── storage-4 — Kho lạnh Hà Nội (avg ≈ 4.5) ───────────────────────────────
  {
    id: 'r-4-1', warehouseId: 'storage-4', contractId: 'c-seed-4-1',
    renterId: 'renter-seed-15', renterName: 'Ngô Thị Hương',
    renterCompany: 'Hanoi Fresh Produce', stars: 5,
    comment: 'Kho mát giữ rau củ quả tươi rất tốt, tỉ lệ hỏng hàng giảm xuống dưới 2%.',
    createdAt: '2024-05-18T07:00:00.000Z', updatedAt: '2024-05-18T07:00:00.000Z',
  },
  {
    id: 'r-4-2', warehouseId: 'storage-4', contractId: 'c-seed-4-2',
    renterId: 'renter-seed-16', renterName: 'Lưu Văn Chiến',
    renterCompany: 'Bắc Việt Seafood', stars: 4,
    comment: 'Kho đông lạnh đạt chuẩn HACCP, yên tâm khi xuất sang thị trường EU.',
    createdAt: '2024-07-30T09:30:00.000Z', updatedAt: '2024-07-30T09:30:00.000Z',
  },
  {
    id: 'r-4-3', warehouseId: 'storage-4', contractId: 'c-seed-4-3',
    renterId: 'renter-seed-17', renterName: 'Trần Văn Đức',
    renterCompany: 'Hà Nội Pharma Cold Chain', stars: 5,
    comment: 'Lý tưởng cho dược phẩm cần kiểm soát nhiệt độ nghiêm ngặt.',
    createdAt: '2024-09-12T14:00:00.000Z', updatedAt: '2024-09-12T14:00:00.000Z',
  },
  {
    id: 'r-4-4', warehouseId: 'storage-4', contractId: 'c-seed-4-4',
    renterId: 'renter-seed-18', renterName: 'Phùng Thị Tâm',
    renterCompany: 'Tâm Ngọc Dairy', stars: 5,
    comment: 'Thuê kho mát để chứa sữa tươi tiệt trùng. Nhiệt độ dao động rất nhỏ.',
    createdAt: '2024-11-22T10:15:00.000Z', updatedAt: '2024-11-22T10:15:00.000Z',
  },
  {
    id: 'r-4-5', warehouseId: 'storage-4', contractId: 'c-seed-4-5',
    renterId: 'renter-seed-19', renterName: 'Hoàng Quang Minh',
    renterCompany: 'Minh Tâm Frozen', stars: 4,
    comment: 'Kho lớn, vị trí Hoàng Mai thuận tiện cho cả vận chuyển nội thành và ra Bắc Giang.',
    createdAt: '2025-02-14T08:00:00.000Z', updatedAt: '2025-02-14T08:00:00.000Z',
  },
  {
    id: 'r-4-6', warehouseId: 'storage-4', contractId: 'c-seed-4-6',
    renterId: 'renter-seed-20', renterName: 'Đinh Thị Liên',
    renterCompany: 'Thăng Long Flower Co.', stars: 3,
    comment: 'Kho mát ổn định nhưng thủ tục đăng ký xuất nhập kho hơi rườm rà.',
    createdAt: '2025-03-01T13:00:00.000Z', updatedAt: '2025-03-01T13:00:00.000Z',
  },

  // ── storage-5 — Kho lạnh Đà Nẵng (avg ≈ 4.1) ─────────────────────────────
  {
    id: 'r-5-1', warehouseId: 'storage-5', contractId: 'c-seed-5-1',
    renterId: 'renter-seed-21', renterName: 'Trương Công Minh',
    renterCompany: 'Đà Nẵng Seaport Logistics', stars: 5,
    comment: 'Kho hải sản tốt nhất miền Trung mình từng thuê. Gần sân bay tiện cho hàng air freight.',
    createdAt: '2024-06-28T07:30:00.000Z', updatedAt: '2024-06-28T07:30:00.000Z',
  },
  {
    id: 'r-5-2', warehouseId: 'storage-5', contractId: 'c-seed-5-2',
    renterId: 'renter-seed-22', renterName: 'Võ Thị Thanh',
    renterCompany: 'Central Fresh Agri', stars: 4,
    comment: 'Khu mát phù hợp rau củ và trái cây xuất khẩu. Giá năm rẻ hơn HN và HCM tới 15%.',
    createdAt: '2024-09-05T11:00:00.000Z', updatedAt: '2024-09-05T11:00:00.000Z',
  },
  {
    id: 'r-5-3', warehouseId: 'storage-5', contractId: 'c-seed-5-3',
    renterId: 'renter-seed-23', renterName: 'Lê Văn Khải',
    renterCompany: 'Khải Hoàn Fishery', stars: 3,
    comment: 'Kho đạt yêu cầu bảo quản hải sản nhưng hệ thống thông gió cần được nâng cấp.',
    createdAt: '2025-01-15T16:00:00.000Z', updatedAt: '2025-01-15T16:00:00.000Z',
  },
  {
    id: 'r-5-4', warehouseId: 'storage-5', contractId: 'c-seed-5-4',
    renterId: 'renter-seed-24', renterName: 'Mai Thị Hồng',
    renterCompany: 'Hồng Phúc Organic Farm', stars: 4,
    comment: 'Kho mát bảo quản xoài và thanh long xuất Nhật rất tốt. Quy trình xuất nhập kho nhanh gọn.',
    createdAt: '2025-02-20T09:45:00.000Z', updatedAt: '2025-02-20T09:45:00.000Z',
  },

  // ── storage-6 — Kho lạnh Long An (avg ≈ 3.6) ──────────────────────────────
  {
    id: 'r-6-1', warehouseId: 'storage-6', contractId: 'c-seed-6-1',
    renterId: 'renter-seed-25', renterName: 'Nguyễn Thanh Hải',
    renterCompany: 'ĐBSCL Fruit Co.', stars: 4,
    comment: 'Giá rẻ nhất vùng ĐBSCL, phù hợp cho doanh nghiệp nông sản vừa và nhỏ.',
    createdAt: '2025-04-10T08:00:00.000Z', updatedAt: '2025-04-10T08:00:00.000Z',
  },
  {
    id: 'r-6-2', warehouseId: 'storage-6', contractId: 'c-seed-6-2',
    renterId: 'renter-seed-26', renterName: 'Trần Thị Bảo Châu',
    renterCompany: 'Bảo Châu Rice Export', stars: 3,
    comment: 'Kho ổn với nông sản đông lạnh ngắn hạn. Phù hợp nội địa hơn xuất khẩu.',
    createdAt: '2025-05-02T14:30:00.000Z', updatedAt: '2025-05-02T14:30:00.000Z',
  },
  {
    id: 'r-6-3', warehouseId: 'storage-6', contractId: 'c-seed-6-3',
    renterId: 'renter-seed-27', renterName: 'Lê Văn Tài',
    renterCompany: 'Tài Lộc Vegetables', stars: 4,
    comment: 'Thuê khu mát rau củ, chất lượng bảo quản ổn với giá chỉ 200k/m³/tháng.',
    createdAt: '2025-06-15T10:00:00.000Z', updatedAt: '2025-06-15T10:00:00.000Z',
  },
];

/** Quick lookup helpers */
export const getRatingsByWarehouse = (warehouseId: string) =>
  MockRatings.filter(r => r.warehouseId === warehouseId);

export const getRatingsByRenter = (renterId: string) =>
  MockRatings.filter(r => r.renterId === renterId);
