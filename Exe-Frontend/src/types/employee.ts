// Employee specific types could be added here if needed, currently covered in other files
export interface EmployeeData {}

export interface UserDTO {
  id: number;
  email: string;
  fullName: string;
  companyName: string;
  role: string;
  status: string;
}

export interface CompanyResponseDTO {
  id: number;
  companyName: string;
  companyTaxCode: string;
}

export interface UserProfileDTO {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  role: string;
  status: string;
  company: CompanyResponseDTO | null;
}

export interface CertificationSubmitDTO {
  id: number;
  label: string;
  link: string;
  status: string;
  rejectReason?: string;
}

export interface WarehouseEmployeeDTO {
  id_warehouse: number;
  id_owner: number;
  name: string;
  address: string;
  location_commune: string;
  location_province: string;
  status: string;
  ownerName: string;
  pricePerCubicMeter: number;
  stats: Record<string, any>;
  sections: Record<string, any>[];
  certifications: CertificationSubmitDTO[];
}

export interface WarehouseImageDTO {
  id: number;
  imageUrl: string;
  isThumbnail: boolean;
}

export interface PriceTierDTO {
  label: string;
  value: number;
  unit: string;
  areaUnit: string;
}

export interface WarehouseSectionDTO {
  sector: number;
  totalCapacity: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  hasCertification: boolean;
  priceTiers: PriceTierDTO[];
}

export interface WarehouseResponseDTO {
  id: number;
  name: string;
  description: string;
  locationAddressText: string;
  locationProvince: string;
  locationCommune: string;
  sections: WarehouseSectionDTO[];
  images: WarehouseImageDTO[];
  certificates: CertificationSubmitDTO[];
  status: string;
  viewCountByDate: Record<string, number>;
}

export interface RentRequestDetailResponseDTO {
  id: number;
  sector: number;
  priceTierLabel: string;
  priceTierValue: number;
  rentedArea: number;
  areaUnit: string;
}

export interface RentRequestResponseDTO {
  id: number;
  warehouseName: string;
  cargoDescription: string;
  duration: number;
  durationUnit: string;
  status: string;
  otherDetail?: string;
  renterRejectionReason?: string;
  rejectionReason?: string;
  offeredPrice?: number;
  ownerNote?: string;
  details: RentRequestDetailResponseDTO[];
}

export interface ContractResponseDTO {
  id: number;
  requestId: number;
  warehouseName: string;
  cargoDescription: string;
  startAt: string;
  endAt: string;
  paymentTerm: string;
  penaltyClause: string;
  specialTerm: string;
  cancelReason: string;

  ownerLegalName: string;
  ownerTaxCode: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAddress: string;

  renterLegalName: string;
  renterTaxCode: string;
  renterEmail: string;
  renterPhone: string;
  renterAddress: string;

  totalPrice: number;
  status: string;
}

export interface OwnerDetailResponseDTO {
  userInfo: UserProfileDTO;
  warehouses: WarehouseResponseDTO[];
  rentalRequests: RentRequestResponseDTO[];
  contracts: ContractResponseDTO[];
}

export interface RenterDetailResponseDTO {
  userInfo: UserProfileDTO;
  aiSubscriptionPlan: string;
  rentalRequests: RentRequestResponseDTO[];
  contracts: ContractResponseDTO[];
  totalSpending: number;
}

export interface AiTierDTO {
  id?: number;
  label: string;
  description: string;
  tokenInput: number;
  tokenOutput: number;
  price: number;
  unit: string;
  activeUsersCount?: number;
}

export interface SponsorTierDTO {
  id?: number;
  priorityLevel: number;
  pricingPerMonth: number;
  yearPackSale: number;
  label: string;
  activeWarehousesCount?: number;
  isActive?: boolean;
}
