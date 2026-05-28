// ── User & Auth ────────────────────────────────────────────────────────────
export type UserRole = 'renter' | 'warehouse' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

/** User record that includes a hashed/plain password for local-only auth simulation */
export interface RegisteredUser extends User {
  password: string;
}

export interface AuthState {
  users: RegisteredUser[];          // all known accounts
  user: User | null;                // currently logged-in user
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// ── Certifications ──────────────────────────────────────────────────────────
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  documentUrl?: string;
}

// ── Certification Types (managed by employees) ──────────────────────────────
export type CertTypeCategory = 'food_safety' | 'quality' | 'environment' | 'distribution' | 'manufacturing' | 'other';

export interface CertificationType {
  id: string;
  code: string;        // e.g. "ISO 22000", "HACCP"
  name: string;        // full display name
  description: string;
  category: CertTypeCategory;
  createdAt: string;
}

// ── Pricing ────────────────────────────────────────────────────────────────
export type PriceUnit = 'month' | 'day' | 'year';

// ── Subscription Tiers (boost search ranking) ─────────────────────────────
export type SubscriptionTierLevel = 'free' | 'silver' | 'gold' | 'platinum';

export interface SubscriptionTierConfig {
  level: SubscriptionTierLevel;
  label: string;
  labelVi: string;
  color: string;         // badge accent color
  bgColor: string;       // badge background
  icon: string;          // emoji or icon key
  boostFactor: number;   // search ranking multiplier (1.0 = no boost)
  monthlyPrice: number;  // VND per month (0 = free)
  benefits: string[];
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTierLevel, SubscriptionTierConfig> = {
  free: {
    level: 'free',
    label: 'Free',
    labelVi: 'Miễn phí',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    icon: '📦',
    boostFactor: 1.0,
    monthlyPrice: 0,
    benefits: ['Hiển thị cơ bản trong kết quả tìm kiếm', 'Tối đa 3 phân khu'],
  },
  silver: {
    level: 'silver',
    label: 'Silver',
    labelVi: 'Bạc',
    color: '#6b7280',
    bgColor: '#e8ecf1',
    icon: '🥈',
    boostFactor: 1.5,
    monthlyPrice: 500000,
    benefits: ['Ưu tiên +50% trong tìm kiếm', 'Tối đa 10 phân khu', 'Huy hiệu Silver trên kết quả'],
  },
  gold: {
    level: 'gold',
    label: 'Gold',
    labelVi: 'Vàng',
    color: '#b45309',
    bgColor: '#fef3c7',
    icon: '🥇',
    boostFactor: 2.5,
    monthlyPrice: 1500000,
    benefits: ['Ưu tiên +150% trong tìm kiếm', 'Phân khu không giới hạn', 'Huy hiệu Gold nổi bật', 'Hỗ trợ ưu tiên'],
  },
  platinum: {
    level: 'platinum',
    label: 'Platinum',
    labelVi: 'Bạch kim',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    icon: '💎',
    boostFactor: 4.0,
    monthlyPrice: 3500000,
    benefits: ['Ưu tiên +300% trong tìm kiếm', 'Luôn hiển thị đầu danh sách', 'Huy hiệu Platinum đặc biệt', 'Hỗ trợ VIP 24/7', 'Báo cáo phân tích nâng cao'],
  },
};

export const TIER_ORDER: SubscriptionTierLevel[] = ['free', 'silver', 'gold', 'platinum'];

export interface PriceTier {
  id: string;
  label: string;   // e.g. "Giá theo tháng"
  value: number;   // VND per m³
  unit: PriceUnit;
}

// ── Warehouse sections / zones ───────────────────────────────────────────────
export interface WarehouseSection {
  id: string;
  name: string;
  description?: string;
  capacity: number;           // m³ total
  availableCapacity: number;
  temperatureMin: number;
  temperatureMax: number;
  priceTiers: PriceTier[];
  availability: 'available' | 'partially' | 'full';
}

export interface Location {
  address: string;
  city: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
  postalCode?: string;
}

export interface ColdStorageStats {
  totalCapacity: number;
  availableCapacity: number;
  temperatureMin: number;
  temperatureMax: number;
  humidity: number;
  powerBackup: boolean;
  securityLevel: 'basic' | 'medium' | 'high';
}

export interface ColdStorage {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  location: Location;
  stats: ColdStorageStats;
  certifications: Certification[];
  hasCertification: boolean;
  pricePerCubicMeter: number;
  priceTiers?: PriceTier[];
  sections?: WarehouseSection[];
  images: string[];
  availability: 'available' | 'partially' | 'full';
  features: string[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'pending' | 'inactive';
  ratingScore?: number;   // average star rating (1–5), undefined = no ratings yet
  ratingCount?: number;   // total number of ratings
  subscriptionTier?: SubscriptionTierLevel;  // owner-purchased tier for search boost
}

// ── Rent Requests ────────────────────────────────────────────────────────────
export type RentRequestStatus = 'sent' | 'viewed' | 'rejected' | 'inprogress' | 'contracted';

export interface RentRequest {
  id: string;
  warehouseId: string;
  renterId: string;
  sectionId?: string;
  sectionName?: string;
  sectionIds?: string[];        // multiple sections selected
  isWholeWarehouse?: boolean;   // renter wants entire warehouse (owner negotiates)
  // Renter info (denormalized so owner view doesn't need a user lookup)
  renterName: string;
  renterPhone: string;
  renterEmail: string;
  renterCompany?: string;
  // Request details
  cargoType: string;
  requestedCapacity: number;   // m³
  durationLabel: string;       // e.g. "6 tháng"
  startDate: string;
  endDate?: string;
  priceTierValue?: number;     // VND/m³/unit — the tier the renter selected
  priceTierUnit?: string;
  priceTierLabel?: string;
  message?: string;
  // Lifecycle
  status: RentRequestStatus;
  submittedAt: string;
  updatedAt: string;
  // Owner response (populated when owner acts)
  rejectionReason?: string;
  offeredPrice?: number;       // owner counter-price
  ownerNote?: string;
}

// ── Rental Contracts ─────────────────────────────────────────────────────────
export type ContractStatus =
  | 'draft'           // owner created, not yet sent
  | 'pending_renter'  // sent to renter, awaiting signature
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'cancelled';

/** How the contract was composed */
export type ContractInputMode = 'form' | 'pdf';

export interface RentalContract {
  id: string;
  requestId?: string;          // link back to originating request
  renterId: string;
  ownerId?: string;
  warehouseId: string;
  sectionId?: string;
  sectionIds?: string[];        // multiple sections (mirrors request.sectionIds)
  isWholeWarehouse?: boolean;   // entire warehouse request
  rentedCapacity: number;      // m³
  startDate: string;
  endDate: string;
  monthlyRate: number;         // VND/m³
  status: ContractStatus;
  contractRef: string;
  notes?: string;

  // ── Input mode ─────────────────────────────────────────────────────────
  inputMode?: ContractInputMode;

  // ── Contract metadata ───────────────────────────────────────────────────
  contractTitle?: string;

  // ── Party A — Owner (Bên A) ─────────────────────────────────────────────
  ownerLegalName?: string;
  ownerTaxCode?: string;
  ownerAddress?: string;
  ownerName?: string;    // short display name (= ownerLegalName alias)
  ownerPhone?: string;
  ownerEmail?: string;

  // ── Party B — Renter (Bên B) ────────────────────────────────────────────
  renterLegalName?: string;
  renterTaxCode?: string;
  renterAddress?: string;
  renterCompany?: string;
  renterPhone?: string;
  renterEmail?: string;

  // ── Contract terms ──────────────────────────────────────────────────────
  cargoDescription?: string;
  paymentTerms?: string;
  penaltyClause?: string;
  specialTerms?: string;

  // ── PDF attachment (simulated) ──────────────────────────────────────────
  pdfFileName?: string;
  pdfFileSize?: number;   // bytes

  // ── Lifecycle timestamps ─────────────────────────────────────────────────
  sentAt?: string;
  acceptedAt?: string;
  renterRejectionReason?: string;
}

// ── Search & Filter ──────────────────────────────────────────────────────────
export interface FilterOptions {
  provinces: string[];
  cities: string[];
  keyword?: string;
  minCapacity?: number;
  maxCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
  temperatureRange?: { min: number; max: number };
  availability?: ('available' | 'partially')[];
  certificationRequired?: boolean;
  features?: string[];
  securityLevel?: ('basic' | 'medium' | 'high')[];
}

export interface SearchResult {
  items: ColdStorage[];
  total: number;
  page: number;
  pageSize: number;
}

// ── AI Search ────────────────────────────────────────────────────────────────
export interface AIQuery {
  id: string;
  userId: string;
  query: string;
  parsedFilters: FilterOptions;
  results: ColdStorage[];
  timestamp: string;
  tokensUsed: number;
  cost: number;
}

export interface AIUsage {
  userId: string;
  totalQueries: number;
  totalTokens: number;
  totalCost: number;
  monthlyQueries: number;
  monthlyTokens: number;
  monthlyCost: number;
  history: AIQuery[];
}

// ── Warehouse Ratings ─────────────────────────────────────────────────────────
export interface WarehouseRating {
  id: string;
  warehouseId: string;
  contractId: string;    // the contract that grants the right to rate
  renterId: string;
  renterName: string;
  renterCompany?: string;
  stars: number;         // 1-5
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Legacy Inquiry (kept for backward compat) ────────────────────────────────
export interface Inquiry {
  id: string;
  renterId: string;
  storageId: string;
  message: string;
  requestedCapacity: number;
  startDate: string;
  endDate?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
}

// ── Redux Root State shape ───────────────────────────────────────────────────
export interface RootState {
  auth: AuthState;
  warehouses: {
    list: ColdStorage[];
    loading: boolean;
    error: string | null;
    filters: FilterOptions;
    searchResults: SearchResult | null;
  };
  requests: {
    list: RentRequest[];
    loading: boolean;
    error: string | null;
  };
  contracts: {
    list: RentalContract[];
    loading: boolean;
    error: string | null;
  };
  bookmarks: {
    ids: string[];
    compareIds: string[];
  };
  ai: {
    usage: AIUsage | null;
    loading: boolean;
    currentQuery: AIQuery | null;
  };
  ratings: {
    list: WarehouseRating[];
  };
}