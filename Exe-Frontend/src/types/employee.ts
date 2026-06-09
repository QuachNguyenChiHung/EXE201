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

export interface CertificationSubmitDTO {
  id: number;
  label: string;
  link: string;
  isVerified: boolean;
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
  details: RentRequestDetailResponseDTO[];
}

export interface ContractResponseDTO {
  id: number;
  requestId: number;
  warehouseName: string;
  renterName: string;
  totalPrice: number;
  signedDate: string;
  status: string;
}

export interface OwnerDetailResponseDTO {
  userInfo: UserDTO;
  warehouses: WarehouseResponseDTO[];
  rentalRequests: RentRequestResponseDTO[];
  contracts: ContractResponseDTO[];
}

export interface RenterDetailResponseDTO {
  userInfo: UserDTO;
  aiSubscriptionPlan: string;
  rentalRequests: RentRequestResponseDTO[];
  contracts: ContractResponseDTO[];
  totalSpending: number;
}
