import type { Certification } from './employee';
import type { Location, PriceTier, PriceUnit } from './public';

// ── Warehouse / Owner ───────────────────────────────────────────────────────
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
    id: number;
    id_warehouse: number;
    id_owner: number;
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
    ratingScore?: number;
    ratingCount?: number;
    subscriptionTier?: SubscriptionTierLevel;
}

export interface WarehouseRating {
    id_rating: number;
    warehouse_id: number;
    contractId: string;    // the contract that grants the right to rate
    id_renter: number;
    renterName: string;
    renterCompany?: string;
    stars: number;         // 1-5
    comment?: string;
    createdAt: string;
    updatedAt: string;
}
