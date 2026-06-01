export interface RentRequest {
  id_rentRequest: number;
  id_renter?: number; // FK User
  id_warehouse?: number; // FK Warehouse
  cargo_description: string;
  other_detail: string;
  duration: number;
  duration_unit: string;
  status: string;
  renter_rejection_reason: string;
}

export interface RentRequestDetail {
  id: number; // BIGINT
  id_rentRequest: number; // FK RentRequest
  id_section: number; // FK WarehouseSection
  id_price_tier: number; // FK PriceTier
  rented_area: number;
  area_unit: string;
}

export interface Contract {
  id_contract: number;
  id_owner?: number; // FK User
  id_renter?: number; // FK RentRequest (referring to id_renter based on ERD)
  id_rent_request?: number; // FK RentRequest
  cargo_description: string;
  create_at: string;
  status: string;
  update_at: string;
  start_at: string;
  end_at: string;
  cancel_reason: string;
  payment_term: string;
  penalty_clause: string;
  special_term: string;
  owner_legal_name: string;
  owner_tax_code: string;
  owner_email: string;
  owner_phone: string;
  owner_address: string;
  renter_legal_name: string;
  renter_tax_code: string;
  renter_email: string;
  renter_phone: string;
  renter_address: string;
}

export interface Rating {
  id_rating: number;
  rate: number;
  comment: string;
  id_renter?: number; // FK User
  warehouse_id?: number; // FK Warehouse
}

export interface CompositeRentRequest extends RentRequest {
  renterName?: string;
  renterPhone?: string;
  renterEmail?: string;
  renterCompany?: string;
  cargoType?: string;
  requestedCapacity?: number;
  durationLabel?: string;
  startDate?: string;
  endDate?: string;
  priceTierValue?: number;
  priceTierUnit?: string;
  priceTierLabel?: string;
  message?: string;
  submittedAt?: string;
  updatedAt?: string;
  rejectionReason?: string;
  offeredPrice?: number;
  ownerNote?: string;
  sectionId?: string | number;
  sectionName?: string;
  sectionIds?: string[] | number[];
  isWholeWarehouse?: boolean;
}

export interface CompositeContract extends Contract {
  warehouseId?: number; // Added since the old type relied on it
  sectionId?: string | number;
  sectionIds?: string[] | number[];
  isWholeWarehouse?: boolean;
  rentedCapacity?: number;
  monthlyRate?: number;
  contractRef?: string;
  notes?: string;
  inputMode?: string;
  contractTitle?: string;
  ownerName?: string;
  renterCompany?: string;
  pdfFileName?: string;
  pdfFileSize?: number;
  sentAt?: string;
  acceptedAt?: string;
  renterRejectionReason?: string;
}

