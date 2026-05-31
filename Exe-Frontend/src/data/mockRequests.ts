import { RentRequest } from '../types';

/**
 * Centralized rental request mock data.
 *
 * Filtering convention:
 *  - Renter view  → filter by renterId === currentUser.id
 *  - Owner view   → filter by warehouseId in owner's warehouse list
 */
export const MockRentRequests: RentRequest[] = [
  {
    id: 'req-1',
    warehouseId: 'storage-1',
    renterId: 1,
    sectionId: 'sec-1-1',
    sectionName: 'Phòng đông lạnh',
    renterName: 'Nguyễn Văn A',
    renterPhone: '+84 901 234 567',
    renterEmail: 'renter@example.com',
    renterCompany: 'ABC Foods Vietnam',
    cargoType: 'seafood',
    requestedCapacity: 500,
    durationLabel: '12 tháng',
    startDate: '2026-04-01',
    endDate: '2027-04-01',
    priceTierValue: 340000,
    priceTierUnit: 'month',
    priceTierLabel: 'Giá theo tháng',
    message:
      'Chúng tôi cần bảo quản thủy hải sản đông lạnh, yêu cầu nhiệt độ ổn định -22°C. Hàng nhập/xuất khoảng 3 lần/tuần.',
    status: 'inprogress',
    submittedAt: '2026-03-01T08:30:00Z',
    updatedAt: '2026-03-04T14:15:00Z',
    offeredPrice: 330000,
    ownerNote:
      'Chào anh/chị, tôi đã xem yêu cầu và rất quan tâm. Hãy liên hệ để chúng ta thảo luận chi tiết về điều khoản hợp đồng và lịch tham quan kho nhé.',
  },
];

/** Helper selectors */
export const getRequestsByRenter = (renterId: string) =>
  MockRentRequests.filter(r => r.renterId === renterId);

export const getRequestsByWarehouse = (warehouseId: string) =>
  MockRentRequests.filter(r => r.warehouseId === warehouseId);

export const getRequestsByOwnerWarehouses = (warehouseIds: string[]) =>
  MockRentRequests.filter(r => warehouseIds.includes(r.warehouseId));seId));