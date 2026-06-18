export interface Warehouse {
  id_warehouse: number;
  id_owner?: number; // FK User
  name: string;
  address: string;
  description: string;
  location_address_text: string;
  location_province: string;
  location_commune: string;
  location_long: number;
  location_lat: number;
  location_postal_code: string;
  isSponsor: boolean;
  sponsor_type?: number; // FK SponsorTier
  status: string;
  create_at?: string;
  update_at?: string;
}

export interface WarehouseImage {
  id: number; // BIGINT
  id_warehouse: number; // FK Warehouse
  image_url: string;
  is_thumbnail: boolean;
  display_order: number;
}

export interface WarehouseSection {
  id_section: number;
  id_warehouse?: number; // FK Warehouse
  label?: string;
  sector: number;
  total_capacity: number;
  available_capacity: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  hasCertification: boolean;
}

export interface PriceTier {
  id?: number;
  id_price_tier: number;
  id_warehouseSection?: number; // FK WarehouseSection
  label: string;
  value: number;
  unit: string;
  timeUnit?: string;
  area_unit: string;
}

export interface CertificationType {
  id_certification: number;
  label: string;
  update: string;
  law_references: string;
  // Optional fields matching backend DTO
  certID?: string;
  labelDesc?: string;
  pdfLink?: string | null;
}

export interface CertificationSubmit {
  id_cerfSubmit: number;
  link: string;
  isVerified: boolean;
  id_type?: number; // FK CertificationType
}

export interface WarehouseCertification {
  id_warehouse: number; // FK Warehouse
  id_cerfSubmit: number; // FK CertificationSubmit
}

export interface Bookmark {
  id_bookmark: number;
  id_user?: number; // FK User
  id_warehouse?: number; // FK Warehouse
}

export interface CompositeWarehouseSection extends WarehouseSection {
  name?: string;
  description?: string;
  priceTiers?: PriceTier[] | any[];
  availability?: string;
}

export interface CompositeWarehouse extends Warehouse {
  ownerName?: string;
  location?: any;
  stats?: any;
  certifications?: any[];
  pricePerCubicMeter?: number;
  priceTiers?: PriceTier[] | any[];
  sections?: CompositeWarehouseSection[];
  images?: string[] | WarehouseImage[];
  availability?: string;
  createdAt?: string;
  updatedAt?: string;
  ratingScore?: number;
  ratingCount?: number;
  subscriptionTier?: SubscriptionTierLevel;
  pendingRequestCount?: number;
}

export type SubscriptionTierLevel = 'free' | 'silver' | 'gold' | 'platinum';



export interface SubscriptionTierConfig {
    level: SubscriptionTierLevel;
    label: string;
    labelVi: string;
    color: string;
    bgColor: string;
    icon: string;
    boostFactor: number;
    monthlyPrice: number;
    benefits: string[];
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTierLevel, SubscriptionTierConfig> = {
    free: { level: 'free', label: 'Free', labelVi: 'Miễn phí', color: '#6b7280', bgColor: '#f3f4f6', icon: '📦', boostFactor: 1.0, monthlyPrice: 0, benefits: [] },
    silver: { level: 'silver', label: 'Silver', labelVi: 'Bạc', color: '#6b7280', bgColor: '#e8ecf1', icon: '🥈', boostFactor: 1.5, monthlyPrice: 500000, benefits: [] },
    gold: { level: 'gold', label: 'Gold', labelVi: 'Vàng', color: '#b45309', bgColor: '#fef3c7', icon: '🥇', boostFactor: 2.5, monthlyPrice: 1500000, benefits: [] },
    platinum: { level: 'platinum', label: 'Platinum', labelVi: 'Bạch kim', color: '#7c3aed', bgColor: '#ede9fe', icon: '💎', boostFactor: 4.0, monthlyPrice: 3500000, benefits: [] },
};


