import { api } from './asus_api';
import type {
  User,
  CompositeWarehouse, CompositeRentRequest, CompositeContract, Rating,
  CertificationType, CompositeAiConversations, PriceTier, CompositeWarehouseSection
} from '../types';

const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// ── Helper to normalize backend warehouse ───────────────────────────────────────
function normalizeBackendWarehouse(raw: unknown): CompositeWarehouse | null {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw as Record<string, unknown>;
  const id = Number(w.id ?? (w as Record<string, unknown>)['id_warehouse'] ?? 0);
  if (!id) return null;
  const rawSections = Array.isArray(w.sections) ? (w.sections as Array<Record<string, unknown>>) : [];
  const sections: CompositeWarehouseSection[] = rawSections.map((s) => ({
    id_section: Number(s.id ?? s['id_section'] ?? 0),
    id_warehouse: undefined,
    label: typeof s.name === 'string' ? s.name : typeof s.label === 'string' ? s.label : undefined,
    sector: Number(s.sector ?? 0),
    total_capacity: Number(s.totalCapacity ?? s['total_capacity'] ?? 0),
    available_capacity: Number(s.availableCapacity ?? s['available_capacity'] ?? 0),
    temp_min: Number(s.tempMin ?? s['temp_min'] ?? 0),
    temp_max: Number(s.tempMax ?? s['temp_max'] ?? 0),
    humidity: Number(s.humidity ?? 0),
    hasCertification: Boolean(s.hasCertification),
    name: typeof s.name === 'string' ? s.name : undefined,
    description: typeof s.description === 'string' ? s.description : undefined,
    priceTiers: Array.isArray(s.priceTiers)
      ? (s.priceTiers as Array<Record<string, unknown>>).map(normalizePriceTier)
      : [],
    availability: typeof s.availability === 'string' ? s.availability : undefined,
  }));

  return {
    id_warehouse: id,
    name: String(w.name ?? ''),
    address: String(w.locationAddressText ?? w.address ?? ''),
    description: String(w.description ?? ''),
    location_address_text: String(w.locationAddressText ?? ''),
    location_province: String(w.locationProvince ?? ''),
    location_district: '',
    location_commune: String(w.locationCommune ?? ''),
    location_long: 0,
    location_lat: 0,
    location_postal_code: '',
    isSponsor: Boolean(w.isSponsor),
    status: String(w.status ?? 'ACTIVE'),
    location: {
      address: w.locationAddressText ?? '',
      province: w.locationProvince ?? '',
      commune: w.locationCommune ?? '',
    },
    ownerName: '',
    stats: {
      views: 0,
      rating: Number(w.averageRating ?? 0),
      reviews: Number(w.totalReviews ?? 0),
      available_capacity: sections.reduce((sum, s) => sum + s.available_capacity, 0),
      total_capacity: sections.reduce((sum, s) => sum + s.total_capacity, 0),
      temp_min: sections.length > 0 ? Math.min(...sections.map((s) => s.temp_min)) : 0,
      temp_max: sections.length > 0 ? Math.max(...sections.map((s) => s.temp_max)) : 0,
    },
    certifications: Array.isArray(w.certificates) ? w.certificates : [],
    priceTiers: [],
    sections,
    images: Array.isArray(w.images)
      ? (w.images as Array<Record<string, unknown>>).map((img) => {
        if (typeof img === 'string') return img;
        return {
          id: Number(img.id ?? 0),
          image_url: String(img.imageUrl ?? img['image_url'] ?? ''),
          is_thumbnail: Boolean(img.isThumbnail),
        };
      })
      : [],
    availability: 'AVAILABLE',
    createdAt: '',
    updatedAt: '',
    ratingScore: Number(w.averageRating ?? 0),
    ratingCount: Number(w.totalReviews ?? 0),
    subscriptionTier: 'free',
    pendingRequestCount: Number(w.pendingRequestCount ?? 0),
  };
}

function normalizePriceTier(raw: Record<string, unknown>): PriceTier {
  const areaUnit = String(raw.areaUnit ?? '');
  const label = String(raw.label ?? '');

  const lcLabel = label.toLowerCase();
  let timeUnit: string | undefined;
  let timeCode: string = areaUnit;
  if (lcLabel.includes('năm') || lcLabel.includes('nam') || lcLabel.includes('year')) {
    timeUnit = 'year'; timeCode = 'year';
  } else if (lcLabel.includes('tháng') || lcLabel.includes('thang') || lcLabel.includes('month')) {
    timeUnit = 'month'; timeCode = 'month';
  } else if (lcLabel.includes('tuần') || lcLabel.includes('tuan') || lcLabel.includes('week')) {
    timeUnit = 'week'; timeCode = 'week';
  } else if (lcLabel.includes('ngày') || lcLabel.includes('ngay') || lcLabel.includes('day')) {
    timeUnit = 'day'; timeCode = 'day';
  }

  return {
    id: Number(raw.id ?? 0),
    id_price_tier: Number(raw.id ?? 0),
    label,
    value: Number(raw.value ?? 0),
    unit: timeCode,
    areaUnit,
    timeUnit,
  };
}

// ── Resource CRUD (real backend) ───────────────────────────────────────────────
export const usersAPI = {
  getAll: async () => { const res = await api.get('/users'); return unwrapPage(res.data); },
  getById: async (id: number) => { const res = await api.get(`/users/${id}`); return res.data; },
  create: async (data: User) => { const res = await api.post('/users', data); return res.data; },
  update: async (id: number, data: Partial<User>) => { const res = await api.put(`/users/${id}`, data); return res.data; },
  delete: async (id: number) => { const res = await api.delete(`/users/${id}`); return res.data; },
};

function unwrapPage(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'content' in (data as any)) {
    return (data as any).content;
  }
  return [];
}

export const warehousesAPI = {
  getAll: async () => { const res = await api.get('/warehouses'); return unwrapPage(res.data); },
  getById: async (id: string | number) => { const res = await api.get(`/warehouses/${id}`); return res.data; },
  create: async (data: CompositeWarehouse) => { const res = await api.post('/warehouses', data); return res.data; },
  update: async (id: string | number, data: Partial<CompositeWarehouse>) => { const res = await api.put(`/warehouses/${id}`, data); return res.data; },
  delete: async (id: string | number) => { const res = await api.delete(`/warehouses/${id}`); return res.data; },
};

export const requestsAPI = {
  getAll: async () => { const res = await api.get('/rent-requests'); return unwrapPage(res.data); },
  getById: async (id: string | number) => { const res = await api.get(`/rent-requests/${id}`); return res.data; },
  create: async (data: CompositeRentRequest) => { const res = await api.post('/rent-requests', data); return res.data; },
  update: async (id: string | number, data: Partial<CompositeRentRequest>) => { const res = await api.put(`/rent-requests/${id}`, data); return res.data; },
  delete: async (id: string | number) => { const res = await api.delete(`/rent-requests/${id}`); return res.data; },
};

export const contractsAPI = {
  getAll: async () => { const res = await api.get('/contracts'); return res.data; },
  getById: async (id: string | number) => { const res = await api.get(`/contracts/${id}`); return res.data; },
  create: async (data: CompositeContract) => { const res = await api.post('/contracts', data); return res.data; },
  update: async (id: string | number, data: Partial<CompositeContract>) => { const res = await api.put(`/contracts/${id}`, data); return res.data; },
  delete: async (id: string | number) => { const res = await api.delete(`/contracts/${id}`); return res.data; },
};

export const ratingsAPI = {
  getAll: async () => { const res = await api.get('/ratings'); return unwrapPage(res.data); },
  getById: async (id: string | number) => { const res = await api.get(`/ratings/${id}`); return res.data; },
  create: async (data: Rating) => { const res = await api.post('/ratings', data); return res.data; },
  update: async (id: string | number, data: Partial<Rating>) => { const res = await api.put(`/ratings/${id}`, data); return res.data; },
  delete: async (id: string | number) => { const res = await api.delete(`/ratings/${id}`); return res.data; },
};

export const certTypesAPI = {
  getAll: async () => { const res = await api.get('/certification-types'); return res.data; },
  getById: async (id: string | number) => { const res = await api.get(`/certification-types/${id}`); return res.data; },
  create: async (data: CertificationType) => { const res = await api.post('/certification-types', data); return res.data; },
  update: async (id: string | number, data: Partial<CertificationType>) => { const res = await api.put(`/certification-types/${id}`, data); return res.data; },
  delete: async (id: string | number) => { const res = await api.delete(`/certification-types/${id}`); return res.data; },
};

// ── Auth endpoints (real backend) ──────────────────────────────────────────────
export const authAPI = {
  login: async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (user: User): Promise<User> => {
    const res = await api.post('/auth/register', user);
    return res.data;
  },
};

// ── Bookmarks endpoints (real backend) ────────────────────────────────────────
export const bookmarksAPI = {
  getByUser: async (userId: number) => {
    const res = await api.get(`/users/${userId}/bookmarks`);
    return res.data;
  },

  saveForUser: async (userId: number, warehouseIds: string[]) => {
    const res = await api.post(`/users/${userId}/bookmarks`, { warehouseIds });
    return res.data;
  },
};

// ── Seed endpoints (no-ops — backend manages its own data) ─────────────────────
import { SeedCheckResult, SeedPayload } from '../types';

export const seedAPI = {
  check: async (): Promise<SeedCheckResult> => {
    await delay();
    return { seeded: false, meta: null };
  },

  seed: async (_payload: SeedPayload, _force = false, _dataVersion?: string) => {
    await delay();
    return { status: 'no-op', counts: {} };
  },

  clear: async () => {
    await delay();
    return { status: 'no-op', message: 'Backend manages its own data' };
  },

  status: async () => {
    await delay();
    return {
      counts: { users: 0, warehouses: 0, requests: 0, contracts: 0, ratings: 0 },
      seededAt: null,
      seeded: false,
    };
  },

  seedResource: async (resource: string, items: any[], _force = false) => {
    await delay();
    return { status: 'no-op', resource, count: items.length };
  },

  clearResource: async (resource: string) => {
    await delay();
    return { status: 'no-op', resource, cleared: 0 };
  },
};

// ── Storage: image upload (real backend) ────────────────────────────────────────
export const storageAPI = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/storage/upload', formData);
    return res.data.url ?? res.data;
  },

  uploadDoc: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/storage/upload-doc', formData);
    return res.data.url ?? res.data;
  },
};

// ── AI Chat (real backend) ─────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
import { AIRequestPayload, AIResponsePayload, AIStatusResult } from '../types';

let conversations: CompositeAiConversations[] = [];

export const aiAPI = {
  chat: async (payload: AIRequestPayload): Promise<AIResponsePayload> => {
    const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const token = user?.token;
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query: payload.prompt,
        conversationHistory: JSON.stringify(payload.conversationHistory ?? []),
        criteria: payload.criteria ?? {},
        matchingWarehouses: (payload.matchingWarehouses ?? []).map(
          ({ id_owner: _o, ownerName: _n, ...rest }: any) => rest
        ),
        isInitialHandshake: payload.isInitialHandshake ?? false,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const refinedIds: string[] | undefined = Array.isArray(data.refinedWarehouseIds)
      ? data.refinedWarehouseIds.map((v: unknown) => String(v))
      : data.warehouses?.content?.map((w: { id?: number }) => String(w.id ?? ''));
    return {
      text: data.response ?? '',
      refinedWarehouseIds: refinedIds?.filter((id: string) => id !== ''),
      warehouses: Array.isArray(data.warehouses?.content)
        ? (data.warehouses.content as unknown[]).map(normalizeBackendWarehouse).filter((w): w is CompositeWarehouse => w !== null)
        : undefined,
      usage: { input_tokens: data.inputTokens ?? 0, output_tokens: data.outputTokens ?? 0 },
      tokenExhausted: data.tokenExhausted === true,
    };
  },

  contextChat: async (payload: { query: string; conversationHistory: { role: "user" | "ai"; content: string }[]; warehouses: CompositeWarehouse[] }): Promise<AIResponsePayload> => {
    const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const token = user?.token;
    const res = await fetch(`${API_BASE}/ai/context-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query: payload.query,
        conversationHistory: JSON.stringify(payload.conversationHistory ?? []),
        warehouses: payload.warehouses.map(({ id_owner: _o, ownerName: _n, ...rest }) => rest),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const refinedIds: string[] | undefined = Array.isArray(data.refinedWarehouseIds)
      ? data.refinedWarehouseIds.map((v: unknown) => String(v))
      : undefined;
    return {
      text: data.response ?? '',
      refinedWarehouseIds: refinedIds?.filter((id: string) => id !== ''),
      warehouses: undefined,
      usage: { input_tokens: data.inputTokens ?? 0, output_tokens: data.outputTokens ?? 0 },
      tokenExhausted: data.tokenExhausted === true,
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
    const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const token = user?.token;
    await fetch(`${API_BASE}/ai/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        messages: JSON.stringify(Array.isArray(conv.message) ? conv.message : []),
        criteria: JSON.stringify(conv.criteria ?? {}),
        totalInputTokens: conv.total_input_tokens ?? 0,
        totalOutputTokens: conv.total_output_tokens ?? 0,
        warehouseCount: conv.warehouseCount ?? 0,
      }),
    });
    return conv;
  },

  getConversationsByUser: async (_userId: number): Promise<CompositeAiConversations[]> => {
    const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const token = user?.token;
    const res = await fetch(`${API_BASE}/ai/conversations/my`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return data.map(c => ({
      id_ai_conversations: c.id,
      id_user: undefined,
      criteria: c.criteria,
      message: c.messages,
      total_input_tokens: c.totalInputTokens ?? 0,
      total_output_tokens: c.totalOutputTokens ?? 0,
      create_at: c.createdAt,
      update_at: c.updatedAt,
    }));
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

// ── Health / diagnostics ────────────────────────────────────────────────────────
export const healthAPI = {
  check: async () => { await delay(); return { status: 'ok' }; },
  kvPing: async () => { await delay(); return { status: 'ok', message: 'Real backend connected' }; },
};
