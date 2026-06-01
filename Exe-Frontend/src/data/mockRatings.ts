import { Rating } from '../types/renter';

export const MockRatings: Rating[] = [
  {
    id_rating: 1,
    warehouse_id: 1,
    id_renter: 1,
    rate: 5,
    comment: 'Kho sạch sẽ, nhiệt độ duy trì rất ổn định.',
  },
  {
    id_rating: 2,
    warehouse_id: 1,
    id_renter: 1,
    rate: 4,
    comment: 'Chất lượng bảo quản tốt, nhân viên nhiệt tình.',
  },
  {
    id_rating: 3,
    warehouse_id: 2,
    id_renter: 1,
    rate: 5,
    comment: 'Kho đông lạnh giữ nhiệt rất tốt cho thủy sản.',
  }
];

/** Quick lookup helpers */
export const getRatingsByWarehouse = (warehouse_id: string | number) =>
  MockRatings.filter(r => r.warehouse_id == warehouse_id);

export const getRatingsByRenter = (id_renter: number) =>
  MockRatings.filter(r => r.id_renter == id_renter);
