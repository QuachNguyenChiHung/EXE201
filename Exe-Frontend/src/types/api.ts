export interface SeedCheckResult {
  seeded: boolean;
  meta: { ts: string; counts: Record<string, number>; dataVersion?: string } | null;
}

export interface SeedPayload {
  users: any[];
  warehouses: any[];
  requests: any[];
  contracts: any[];
  ratings: any[];
}

export interface AIRequestPayload {
  prompt: string;
  criteria: Record<string, string[]>;
  matchingWarehouses: any[];
  conversationHistory: { role: "user" | "ai"; content: string }[];
  isInitialHandshake: boolean;
  hasCriteria: boolean;
}

export interface AIResponsePayload {
  text: string;
  refinedWarehouseIds?: string[];
  warehouses?: any[];
  usage?: { input_tokens: number; output_tokens: number };
  tokenExhausted?: boolean;
}

export interface AIContextRequestPayload {
  query: string;
  conversationHistory: { role: "user" | "ai"; content: string }[];
  warehouses: any[];
}

export interface AIStatusResult {
  model: string;
  keyConfigured: boolean;
  apiReachable: boolean;
  latencyMs: number | null;
  error: string | null;
}

export interface TransactionResponseDTO {
  id: number;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  providerTxnRef: string | null;
  providerTransactionNo: string | null;
  providerPayDate: string | null;
  description: string | null;
}
