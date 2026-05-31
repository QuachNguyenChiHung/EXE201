import type { ColdStorage, WarehouseRating } from './warehouse';
import type { RentRequest, RentalContract } from './renter';

// ── Public / Shared (used by all roles) ─────────────────────────────────────
export type UserRole = 'renter' | 'warehouse' | 'employee';

export interface Company {
    id_company: number;
    company_name: string;
    company_tax_code: string;
    user_id: number;
}

export interface User {
    id_user: number;
    email: string;
    name: string;
    role: UserRole;
    img_link?: string;
    create_at: string;
    status: string;
    phone?: string;
    hash_tax_code?: string;
    ai_tier?: number;
    company?: Company;
}

/** User record that includes a hashed/plain password for local-only auth simulation */
export interface RegisteredUser extends User {
    hash_password: string;
}

export interface AuthState {
    users: RegisteredUser[];          // all known accounts
    user: User | null;                // currently logged-in user
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export type PriceUnit = 'month' | 'day' | 'year';

export interface Location {
    address: string;
    city: string;
    province: string;
    country: string;
    latitude: number;
    longitude: number;
    postalCode?: string;
}

export interface PriceTier {
    id: string;
    label: string;   // e.g. "Giá theo tháng"
    value: number;   // VND per m³
    unit: PriceUnit;
}

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
