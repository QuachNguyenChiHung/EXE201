/**
 * apiClient.ts — Mock data client.
 * All data operations now use in-memory mock data.
 */
import type {
  User,
  CompositeWarehouse, CompositeRentRequest, CompositeContract, Rating,
  CertificationType, CompositeAiConversations
} from '../types';
import { MockUsers } from '../data/mockUsers';
import { MockWarehouseData } from '../data/mockWarehouses';
import { MockCompositeRentRequests } from '../data/mockRequests';
import { MockCompositeContracts } from '../data/mockContracts';
import { MockRatings } from '../data/mockRatings';

// ── In-memory data stores ─────────────────────────────────────────────────────
let users: User[] = [...MockUsers];
let warehouses: CompositeWarehouse[] = [...MockWarehouseData];
let requests: CompositeRentRequest[] = [...MockCompositeRentRequests];
let contracts: CompositeContract[] = [...MockCompositeContracts];
let ratings: Rating[] = [...MockRatings];
let bookmarks: Record<string, string[]> = {};
let certTypes: any[] = [
  { id_certification: 1, label: 'HACCP', update: new Date().toISOString(), law_references: 'Hazard Analysis Critical Control Point' },
  { id_certification: 2, label: 'ISO 22000', update: new Date().toISOString(), law_references: 'Food Safety Management' },
  { id_certification: 3, label: 'GMP', update: new Date().toISOString(), law_references: 'Good Manufacturing Practice' },
  { id_certification: 4, label: 'GDP', update: new Date().toISOString(), law_references: 'Good Distribution Practice' },
  { id_certification: 5, label: 'ISO 9001', update: new Date().toISOString(), law_references: 'Quality Management' },
  { id_certification: 6, label: 'ATTP', update: new Date().toISOString(), law_references: 'An toàn thực phẩm' },
];

// ── Helper to simulate async delay ────────────────────────────────────────────
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));
// removed duplicate bookmarks

// ── Resource CRUD clients (mock implementation) ───────────────────────────────
export const usersAPI = {
  getAll: async () => { await delay(); return [...users]; },
  getById: async (id: number) => { await delay(); const user = users.find(u => u.id_user === id); if (!user) throw new Error('User not found'); return user; },
  create: async (data: User) => { await delay(); users.push(data); return data; },
  update: async (id: number, data: Partial<User>) => { await delay(); const idx = users.findIndex(u => u.id_user === id); if (idx === -1) throw new Error('User not found'); users[idx] = { ...users[idx], ...data }; return users[idx]; },
  delete: async (id: number) => { await delay(); users = users.filter(u => u.id_user !== id); return { success: true }; },
};
export const warehousesAPI = {
  getAll: async () => { await delay(); return [...warehouses]; },
  getById: async (id: string | number) => { await delay(); const wh = warehouses.find(w => w.id_warehouse === Number(id)); if (!wh) throw new Error('Warehouse not found'); return wh; },
  create: async (data: CompositeWarehouse) => { await delay(); warehouses.push(data); return data; },
  update: async (id: string | number, data: Partial<CompositeWarehouse>) => { await delay(); const idx = warehouses.findIndex(w => w.id_warehouse === Number(id)); if (idx === -1) throw new Error('Warehouse not found'); warehouses[idx] = { ...warehouses[idx], ...data }; return warehouses[idx]; },
  delete: async (id: string | number) => { await delay(); warehouses = warehouses.filter(w => w.id_warehouse !== Number(id)); return { success: true }; },
};

export const requestsAPI = {
  getAll: async () => { await delay(); return [...requests]; },
  getById: async (id: string | number) => { await delay(); const req = requests.find(r => r.id_rentRequest === Number(id)); if (!req) throw new Error('Request not found'); return req; },
  create: async (data: CompositeRentRequest) => { await delay(); requests.push(data); return data; },
  update: async (id: string | number, data: Partial<CompositeRentRequest>) => { await delay(); const idx = requests.findIndex(r => r.id_rentRequest === Number(id)); if (idx === -1) throw new Error('Request not found'); requests[idx] = { ...requests[idx], ...data }; return requests[idx]; },
  delete: async (id: string | number) => { await delay(); requests = requests.filter(r => r.id_rentRequest !== Number(id)); return { success: true }; },
};

export const contractsAPI = {
  getAll: async () => { await delay(); return [...contracts]; },
  getById: async (id: string | number) => { await delay(); const contract = contracts.find(c => c.id_contract === Number(id)); if (!contract) throw new Error('Contract not found'); return contract; },
  create: async (data: CompositeContract) => { await delay(); contracts.push(data); return data; },
  update: async (id: string | number, data: Partial<CompositeContract>) => { await delay(); const idx = contracts.findIndex(c => c.id_contract === Number(id)); if (idx === -1) throw new Error('Contract not found'); contracts[idx] = { ...contracts[idx], ...data }; return contracts[idx]; },
  delete: async (id: string | number) => { await delay(); contracts = contracts.filter(c => c.id_contract !== Number(id)); return { success: true }; },
};

export const ratingsAPI = {
  getAll: async () => { await delay(); return [...ratings]; },
  getById: async (id: string | number) => { await delay(); const rating = ratings.find(r => r.id_rating === Number(id)); if (!rating) throw new Error('Rating not found'); return rating; },
  create: async (data: Rating) => { await delay(); ratings.push(data); return data; },
  update: async (id: string | number, data: Partial<Rating>) => { await delay(); const idx = ratings.findIndex(r => r.id_rating === Number(id)); if (idx === -1) throw new Error('Rating not found'); ratings[idx] = { ...ratings[idx], ...data }; return ratings[idx]; },
  delete: async (id: string | number) => { await delay(); ratings = ratings.filter(r => r.id_rating !== Number(id)); return { success: true }; },
};

export const certTypesAPI = {
  getAll: async () => { await delay(); return [...certTypes]; },
  getById: async (id: string | number) => { await delay(); const cert = certTypes.find(c => c.id_certification === Number(id)); if (!cert) throw new Error('Cert type not found'); return cert; },
  create: async (data: CertificationType) => { await delay(); certTypes.push(data); return data; },
  update: async (id: string | number, data: Partial<CertificationType>) => { await delay(); const idx = certTypes.findIndex(c => c.id_certification === Number(id)); if (idx === -1) throw new Error('Cert type not found'); certTypes[idx] = { ...certTypes[idx], ...data }; return certTypes[idx]; },
  delete: async (id: string | number) => { await delay(); certTypes = certTypes.filter(c => c.id_certification !== Number(id)); return { success: true }; },
};

// ── Auth endpoints (mock implementation) ──────────────────────────────────────
export const authAPI = {
  /**
   * Validate credentials against mock data.
   * Returns User (without password) on success, throws 401 on bad credentials.
   */
  login: async (email: string, password: string): Promise<User> => {
    await delay();
    const user = users.find(u => u.email === email && u.hash_password === password);
    if (!user) throw new Error('Invalid credentials');
    const { hash_password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  /**
   * Create a new user in mock data.
   * Returns User (without password) on success, throws 409 on duplicate email.
   */
  register: async (user: User): Promise<User> => {
    await delay();
    if (users.find(u => u.email === user.email)) {
      throw new Error('Email already exists');
    }
    users.push(user);
    const { hash_password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
};

// ── Bookmarks endpoints (mock implementation) ─────────────────────────────────
export const bookmarksAPI = {
  getByUser: async (userId: number) => {
    await delay();
    return { warehouseIds: bookmarks[userId] || [] };
  },

  saveForUser: async (userId: number, warehouseIds: string[]) => {
    await delay();
    bookmarks[userId] = warehouseIds;
    return { warehouseIds };
  },
};

// ── Seed endpoints (mock implementation) ──────────────────────────────────────
import { SeedCheckResult, SeedPayload } from '../types';

let seeded = false;
let seedMeta: { ts: string; counts: Record<string, number>; dataVersion?: string } | null = null;

export const seedAPI = {
  check: async (): Promise<SeedCheckResult> => {
    await delay();
    return { seeded, meta: seedMeta };
  },

  seed: async (payload: SeedPayload, force = false, dataVersion?: string) => {
    await delay();
    if (seeded && !force) {
      return { status: 'already seeded', counts: {} };
    }

    users = [...payload.users];
    warehouses = [...payload.warehouses];
    requests = [...payload.requests];
    contracts = [...payload.contracts];
    ratings = [...payload.ratings];

    seeded = true;
    seedMeta = {
      ts: new Date().toISOString(),
      counts: {
        users: users.length,
        warehouses: warehouses.length,
        requests: requests.length,
        contracts: contracts.length,
        ratings: ratings.length,
      },
      dataVersion,
    };

    return { status: 'seeded', counts: seedMeta.counts };
  },

  clear: async () => {
    await delay();
    users = [];
    warehouses = [];
    requests = [];
    contracts = [];
    ratings = [];
    bookmarks = {};
    seeded = false;
    seedMeta = null;
    return { status: 'cleared', message: 'All data cleared' };
  },

  status: async () => {
    await delay();
    return {
      counts: {
        users: users.length,
        warehouses: warehouses.length,
        requests: requests.length,
        contracts: contracts.length,
        ratings: ratings.length,
      },
      seededAt: seedMeta?.ts || null,
      seeded,
    };
  },

  seedResource: async (resource: string, items: any[], force = false) => {
    await delay();
    // Simple resource seeding
    return { status: 'seeded', resource, count: items.length };
  },

  clearResource: async (resource: string) => {
    await delay();
    return { status: 'cleared', resource, cleared: 0 };
  },
};

// ── Storage: image upload (mock implementation) ───────────────────────────────
export const storageAPI = {
  /**
   * Mock image upload - returns a placeholder URL.
   */
  uploadImage: async (file: File): Promise<string> => {
    await delay(300);
    // Return a mock URL based on file name
    return `https://images.unsplash.com/photo-${Date.now()}?w=1080`;
  },

  /**
   * Mock document upload - returns a placeholder URL.
   */
  uploadDoc: async (file: File): Promise<string> => {
    await delay(300);
    return `https://example.com/docs/${file.name}`;
  },
};

// ── AI Chat endpoint (mock implementation) ────────────────────────────────────
import { AIRequestPayload, AIResponsePayload, AIStatusResult } from '../types';

let conversations: CompositeAiConversations[] = [];

export const aiAPI = {
  chat: async (payload: AIRequestPayload): Promise<AIResponsePayload> => {
    await delay(500);
    // Mock AI response
    return {
      text: 'Đây là phản hồi mô phỏng từ AI. Trong môi trường thực tế, đây sẽ là phản hồi từ Claude AI.',
      refinedWarehouseIds: payload.matchingWarehouses.slice(0, 3).map((w: any) => w.id),
      usage: { input_tokens: 100, output_tokens: 50 },
    };
  },

  status: async (): Promise<AIStatusResult> => {
    await delay();
    return {
      model: 'mock-model',
      keyConfigured: true,
      apiReachable: true,
      latencyMs: 100,
      error: null,
    };
  },

  saveConversation: async (conv: CompositeAiConversations): Promise<CompositeAiConversations> => {
    await delay();
    conversations.push(conv);
    return conv;
  },

  getConversationsByUser: async (userId: number): Promise<CompositeAiConversations[]> => {
    await delay();
    return conversations.filter(c => c.id_user === userId);
  },

  getAllConversations: async (): Promise<CompositeAiConversations[]> => {
    await delay();
    return [...conversations];
  },

  deleteConversation: async (id: number) => {
    await delay();
    conversations = conversations.filter(c => c.id_ai_conversations !== Number(id));
    return { success: true };
  },
};


// ── Health / diagnostics (mock implementation) ────────────────────────────────
export const healthAPI = {
  check: async () => { await delay(); return { status: 'ok' }; },
  kvPing: async () => { await delay(); return { status: 'ok', message: 'Mock data ready' }; },
};