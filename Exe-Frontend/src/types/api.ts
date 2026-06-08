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
  usage?: { input_tokens: number; output_tokens: number };
}

export interface AIStatusResult {
  model: string;
  keyConfigured: boolean;
  apiReachable: boolean;
  latencyMs: number | null;
  error: string | null;
}
