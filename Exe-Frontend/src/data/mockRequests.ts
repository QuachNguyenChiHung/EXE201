import { CompositeRentRequest } from '../types/renter';

export const MockCompositeRentRequests: CompositeRentRequest[] = [
  {
    id_rentRequest: 1,
    id_warehouse: 1,
    id_renter: 1,
    sectionId: 1,
    sectionName: 'Phòng đông lạnh',
    renterName: 'Nguyễn Văn A',
    renterPhone: '+84 901 234 567',
    renterEmail: 'renter@example.com',
    cargoType: 'seafood',
    requestedCapacity: 500,
    durationLabel: '12 tháng',
    startDate: '2026-04-01',
    endDate: '2027-04-01',
    priceTierValue: 340000,
    priceTierUnit: 'month',
    priceTierLabel: 'Giá theo tháng',
    cargo_description: 'Thủy hải sản',
    other_detail: '',
    duration: 12,
    duration_unit: 'month',
    renter_rejection_reason: '',
    message: 'Chúng tôi cần bảo quản thủy hải sản đông lạnh.',
    status: 'inprogress',
    submittedAt: '2026-03-01T08:30:00Z',
    updatedAt: '2026-03-04T14:15:00Z',
    offeredPrice: 330000,
    ownerNote: 'Chào anh/chị, tôi đã xem yêu cầu.',
  },
];

/** Helper selectors */
export const getRequestsByRenter = (id_renter: string | number) =>
  MockCompositeRentRequests.filter(r => r.id_renter == id_renter);

export const getRequestsByWarehouse = (id_warehouse: string | number) =>
  MockCompositeRentRequests.filter(r => r.id_warehouse == id_warehouse);

export const getRequestsByOwnerWarehouses = (warehouseIds: (string | number)[]) =>
  MockCompositeRentRequests.filter(r => r.id_warehouse && warehouseIds.includes(r.id_warehouse as any));