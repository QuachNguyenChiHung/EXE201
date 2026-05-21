// User Types
export type UserRole = 'renter' | 'warehouse' | 'employee';

export interface User {
    id: string;
    email: string;
    password?: string; // Optional for security
    name: string;
    role: UserRole;
    company_name?: string;
    phone?: string;
    avatar_url?: string;
    created_at?: string;
}

// Location Types
export interface Location {
    address: string;
    city: string;
    province: string;
    country: string;
    latitude?: number;
    longitude?: number;
    postal_code?: string;
}

// Certification Types
export interface Certification {
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    documentUrl?: string;
}

export type CertificationCategory =
    | 'food_safety'
    | 'quality'
    | 'environment'
    | 'distribution'
    | 'manufacturing'
    | 'other';

export interface CertificationType {
    id: string;
    code: string;
    name: string;
    description?: string;
    category: CertificationCategory;
    created_at?: string;
}

// Price Tier Types
export interface PriceTier {
    id: string;
    label: string;
    value: number;
    unit: string;
}

// Warehouse Section Types
export interface WarehouseSection {
    id: string;
    name: string;
    description?: string;
    capacity: number;
    availableCapacity: number;
    temperatureMin?: number;
    temperatureMax?: number;
    priceTiers: PriceTier[];
    availability: 'available' | 'partially' | 'full';
}

// Warehouse Types
export type SecurityLevel = 'basic' | 'medium' | 'high';
export type WarehouseAvailability = 'available' | 'partially' | 'full';
export type WarehouseStatus = 'active' | 'pending' | 'inactive';
export type SubscriptionTier = 'free' | 'silver' | 'gold' | 'platinum';

export interface Warehouse {
    id: string;
    owner_id: string;
    owner_name: string;
    name: string;
    description?: string;

    // Location
    location_address: string;
    location_city: string;
    location_province: string;
    location_country: string;
    location_latitude?: number;
    location_longitude?: number;
    location_postal_code?: string;

    // Stats
    total_capacity: number;
    available_capacity: number;
    temperature_min?: number;
    temperature_max?: number;
    humidity?: number;
    power_backup: boolean;
    security_level?: SecurityLevel;

    // Certifications
    certifications: Certification[];
    has_certification: boolean;

    // Pricing
    price_per_cubic_meter: number;
    price_tiers: PriceTier[];

    // Sections
    sections: WarehouseSection[];

    // Images & Features
    images: string[];
    features: string[];

    availability: WarehouseAvailability;
    status: WarehouseStatus;

    // Rating
    rating_score?: number;
    rating_count: number;

    subscription_tier: SubscriptionTier;

    created_at?: string;
    updated_at?: string;
}

// Rent Request Types
export type RentRequestStatus = 'sent' | 'viewed' | 'rejected' | 'inprogress' | 'contracted';

export interface RentRequest {
    id: string;
    warehouse_id: string;
    renter_id: string;

    section_id?: string;
    section_name?: string;
    section_ids: string[];
    is_whole_warehouse: boolean;

    // Denormalized renter info
    renter_name: string;
    renter_phone?: string;
    renter_email?: string;
    renter_company?: string;

    // Request details
    cargo_type?: string;
    requested_capacity: number;
    duration_label?: string;
    start_date?: string;
    end_date?: string;
    price_tier_value?: number;
    price_tier_unit?: string;
    price_tier_label?: string;
    message?: string;

    // Lifecycle
    status: RentRequestStatus;
    submitted_at?: string;
    updated_at?: string;

    // Owner response
    rejection_reason?: string;
    offered_price?: number;
    owner_note?: string;
}

// Contract Types
export type ContractStatus =
    | 'draft'
    | 'pending_renter'
    | 'active'
    | 'expiring_soon'
    | 'expired'
    | 'cancelled';

export type ContractInputMode = 'form' | 'pdf';

export interface Contract {
    id: string;
    request_id?: string;
    renter_id: string;
    owner_id?: string;
    warehouse_id: string;

    section_id?: string;
    section_ids: string[];
    is_whole_warehouse: boolean;
    rented_capacity: number;

    start_date: string;
    end_date: string;
    monthly_rate: number;

    status: ContractStatus;
    contract_ref?: string;
    notes?: string;

    // Input mode
    input_mode?: ContractInputMode;
    contract_title?: string;

    // Party A (Owner)
    owner_legal_name?: string;
    owner_tax_code?: string;
    owner_address?: string;
    owner_name?: string;
    owner_phone?: string;
    owner_email?: string;

    // Party B (Renter)
    renter_legal_name?: string;
    renter_tax_code?: string;
    renter_address?: string;
    renter_company?: string;
    renter_phone?: string;
    renter_email?: string;

    // Terms
    cargo_description?: string;
    payment_terms?: string;
    penalty_clause?: string;
    special_terms?: string;

    // PDF
    pdf_file_name?: string;
    pdf_file_size?: number;

    // Lifecycle timestamps
    sent_at?: string;
    accepted_at?: string;
    renter_rejection_reason?: string;
}

// Rating Types
export interface Rating {
    id: string;
    warehouse_id: string;
    contract_id: string;
    renter_id: string;
    renter_name: string;
    renter_company?: string;
    stars: number; // 1-5
    comment?: string;
    created_at?: string;
    updated_at?: string;
}

// Bookmark Types
export interface Bookmark {
    user_id: string;
    warehouse_ids: string[];
}

// AI Conversation Types
export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

export interface AIConversation {
    id: string;
    user_id: string;
    user_name: string;
    user_email?: string;
    criteria: Record<string, any>;
    messages: AIMessage[];
    warehouse_count: number;
    total_input_tokens: number;
    total_output_tokens: number;
    created_at?: string;
    updated_at?: string;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Auth Types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    company_name?: string;
    phone?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}
