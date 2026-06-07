export type LogLevel = 'info' | 'warning' | 'error';
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: string;
}

export interface Company {
  id_company: number;
  company_name: string;
  company_tax_code: string;
}

export interface AiSubscriptionTier {
  id_ai_subscription: number;
  label: string;
  desciption: string;
  token_input: number;
  token_output: number;
  price: number;
  unit: string;
  create_at: string;
  update_at: string;
}

export type UserRole = 'RENTER' | 'OWNER' | 'EMPLOYEE';

export interface User {
  id_user: number;
  name: string;
  img_link?: string;
  create_at: string;
  role: UserRole;
  company?: Company;
  hash_password?: string;
  status: string;
  email: string;
  phone: string;
  hash_tax_code?: string;
  ai_tier?: number; // FK AiSubscriptionTier
  id_company?: number; // FK Company
}

export interface SponsorTier {
  id_SponsorTier: number;
  priority_level: number;
  pricing_per_month: number;
  year_pack_sale: number;
  label: string;
  update_at: string;
}

export interface Transaction {
  id_transaction: number;
  id_subscription?: number; // FK AiSubscriptionTier
  id_sponsor?: number; // FK SponsorTier
  id_buyer?: number; // FK User
  status: string;
  create_at: string;
  invoice_date: string;
  type: string;
}

export interface AiConversations {
  id_ai_conversations: number;
  id_user?: number; // FK User
  criteria: any; // json
  message: any; // json
  total_input_tokens: number;
  total_output_tokens: number;
  create_at: string;
  update_at: string;
}

export interface CompositeAiConversations extends AiConversations {
  userName?: string;
  userEmail?: string;
  warehouseCount?: number;
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
  items: any[];
  total: number;
  page: number;
  pageSize: number;
}

