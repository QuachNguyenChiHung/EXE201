import { api } from './asus_api';
import { WarehouseResponseDTO } from '../types/employee';
import type { CompositeWarehouse } from '../types';
import type { AiSubscriptionTier } from '../types/public';
import type { WarehouseRatingResponse } from '../types/warehouse';

export interface FilterMetaResponseDTO {
    locations: string[];
    statuses: string[];
    sponsorTiers: any[];
    certifications: any[];
}

export interface RentRequestDetailCreateDTO {
    sectionId: number;
    priceTierId: number;
    rentedArea: number;
    areaUnit: string;
}

export interface RentRequestCreateDTO {
    warehouseId: number;
    cargoDescription: string;
    otherDetail: string;
    duration: number;
    durationUnit: string;
    startDate: string;
    endDate: string;
    renterOfferedPrice: number | null;
    details: RentRequestDetailCreateDTO[];
}

const mapPriceTiers = (tiers: any[]) => {
    return (tiers || []).map((pt: any) => {
        let timeUnit = pt.unit;
        const labelStr = (pt.label || "").toLowerCase();
        if (labelStr.includes('tháng') || labelStr.includes('month')) timeUnit = 'month';
        else if (labelStr.includes('ngày') || labelStr.includes('day')) timeUnit = 'day';
        else if (labelStr.includes('tuần') || labelStr.includes('week')) timeUnit = 'week';
        else if (labelStr.includes('năm') || labelStr.includes('year')) timeUnit = 'year';

        return {
            ...pt,
            timeUnit: timeUnit,
            areaUnit: pt.areaUnit || pt.area_unit || 'm3',
        };
    });
};

const mapAiTierResponse = (t: any): AiSubscriptionTier => ({
    id_ai_subscription: t.id ?? t.id_ai_subscription,
    label: t.label ?? '',
    desciption: t.description ?? t.desciption ?? '',
    token_input: t.tokenInput ?? t.token_input ?? 0,
    token_output: t.tokenOutput ?? t.token_output ?? 0,
    price: t.price ?? 0,
    unit: t.unit ?? 'VND',
    create_at: t.createdAt ?? t.create_at ?? '',
    update_at: t.updatedAt ?? t.update_at ?? '',
});

const mapWarehouseResponse = (w: any): CompositeWarehouse => {
    return {
        ...w,
        id_warehouse: w.id_warehouse || w.id,
        location_province: w.location_province || w.locationProvince,
        location_commune: w.location_commune || w.locationCommune,
        location_address_text: w.location_address_text || w.locationAddressText,
        status: (w.status || "").toLowerCase(),
        certifications: w.certifications || w.certificates || w.certificates || [],
        images: (w.images || []).map((img: any) => ({
            ...img,
            image_url: img.image_url || img.imageUrl
        })),
        priceTiers: mapPriceTiers(w.priceTiers),
        sections: (w.sections || []).map((s: any) => ({
            ...s,
            id_section: s.id_section || s.id,
            label: s.label,
            name: s.label || s.name || `Khu vực ${s.sector}`,
            total_capacity: s.total_capacity || s.totalCapacity,
            available_capacity: s.available_capacity || s.availableCapacity,
            temp_min: s.temp_min || s.tempMin,
            temp_max: s.temp_max || s.tempMax,
            humidity: s.humidity,
            priceTiers: mapPriceTiers(s.priceTiers)
        })),
        ratingScore: w.averageRating ?? w.ratingScore ?? 0,
        ratingCount: w.totalReviews ?? w.ratingCount ?? 0,
        sponsorTierLabel: w.sponsorTier?.label ?? null,
    };
};

export interface RenterStatisticResponseDTO {
    totalWarehouseWithActiveContract: number;
    totalAiConversation: number;
    totalTokenUsage: number;
    totalBilling: number;
    aiSubscriptionInUse: string;
    totalRentRequest: number;
    totalOwnerUpdatedRequest: number;
    totalActiveContract: number;
    endOfContract: number;
}

export const renterService = {
    getDashboardStatistics: async (expireDays: number = 30): Promise<RenterStatisticResponseDTO> => {
        const response = await api.get('/renters/statistics', { params: { expireDays } });
        return response.data;
    },

    createRentRequest: async (request: RentRequestCreateDTO): Promise<any> => {
        const response = await api.post('/renters/requests', request);
        return response.data;
    },

    getMyRequests: async (page: number = 0, size: number = 6, status?: string): Promise<{ content: any[], totalPages: number, totalElements: number }> => {
        const params: any = { page, size };
        if (status) params.status = status;
        const response = await api.get('/renters/requests', { params });
        return {
            content: response.data.content || [],
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0
        };
    },

    cancelRequest: async (requestId: number, reason?: string): Promise<any> => {
        const response = await api.patch(`/renters/requests/${requestId}/cancel`, { reason });
        return response.data;
    },

    acceptOffer: async (requestId: number): Promise<any> => {
        const response = await api.patch(`/renters/requests/${requestId}/accept-offer`);
        return response.data;
    },

    counterOffer: async (requestId: number, note?: string, newPrice?: number): Promise<any> => {
        const response = await api.patch(`/renters/requests/${requestId}/counter-offer`, { note, newPrice });
        return response.data;
    },

    toggleBookmark: async (warehouseId: number): Promise<string> => {
        const response = await api.post(`/renters/bookmarks/${warehouseId}`);
        return response.data;
    },

    getMyBookmarks: async (): Promise<CompositeWarehouse[]> => {
        const response = await api.get('/renters/bookmarks');
        return (response.data || []).map(mapWarehouseResponse);
    },

    getActiveWarehouses: async (page: number = 0, size: number = 6): Promise<{ content: CompositeWarehouse[], totalPages: number, totalElements: number }> => {
        const response = await api.get('/warehouses', { params: { page, size } });
        return {
            content: (response.data.content || []).map(mapWarehouseResponse),
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0
        };
    },

    getPopularWarehouses: async (page: number = 0, size: number = 6): Promise<{ content: CompositeWarehouse[], totalPages: number, totalElements: number }> => {
        const response = await api.get('/warehouses/popular', { params: { page, size } });
        return {
            content: (response.data.content || []).map(mapWarehouseResponse),
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0
        };
    },

    searchWarehouses: async (params: any): Promise<{ content: CompositeWarehouse[], totalPages: number, totalElements: number }> => {
        const response = await api.get('/warehouses/search', { params });
        return {
            content: (response.data.content || []).map(mapWarehouseResponse),
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0
        };
    },

    getFilterMeta: async (): Promise<FilterMetaResponseDTO> => {
        const response = await api.get('/warehouses/filter-meta');
        return response.data;
    },

    getWarehouseDetail: async (id: string | number): Promise<CompositeWarehouse> => {
        const response = await api.get(`/warehouses/${id}`);
        return mapWarehouseResponse(response.data);
    },

    getWarehouseLocation: async (id: string | number): Promise<{ locationLat: number, locationLong: number }> => {
        const response = await api.get(`/warehouses/${id}/location`);
        return response.data;
    },

    getMyContracts: async (page: number = 0, size: number = 6, status?: string): Promise<{ content: CompositeContract[], totalPages: number, totalElements: number }> => {
        const params: any = { page, size };
        if (status) params.status = status;
        const response = await api.get('/contracts', { params });
        return {
            content: (response.data.content || []).map(mapContractResponse),
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0,
        };
    },

    signContract: async (contractId: number): Promise<CompositeContract> => {
        const response = await api.patch(`/renters/contracts/${contractId}/sign`);
        return mapContractResponse(response.data);
    },

    rejectContract: async (contractId: number, reason?: string): Promise<CompositeContract> => {
        const response = await api.patch(`/renters/contracts/${contractId}/reject`, { reason });
        return mapContractResponse(response.data);
    },

    // AI SUBSCRIPTION
    getAiTiers: async (): Promise<AiSubscriptionTier[]> => {
        const response = await api.get('/renters/ai-tiers');
        return (response.data || []).map(mapAiTierResponse);
    },

    buyAiTier: async (tierId: number): Promise<{ paymentUrl?: string }> => {
        const response = await api.post(`/renters/ai-tiers/${tierId}/pay`);
        return response.data;
    },

    getMyActiveAiSubscription: async (): Promise<any | null> => {
        try {
            const response = await api.get('/renters/ai-subscription');
            return response.data;
        } catch (err: any) {
            if (err?.response?.status === 404) return null;
            throw err;
        }
    },

    getRenterAiSubscriptionStatus: async (): Promise<{ hasActiveTier: boolean; tierLabel?: string }> => {
        try {
            const stats = await api.get<RenterStatisticResponseDTO>('/renters/statistics', { params: { expireDays: 0 } });
            const hasActiveTier = stats.data.aiSubscriptionInUse !== 'Chưa đăng ký' && !!stats.data.aiSubscriptionInUse;
            return { hasActiveTier, tierLabel: stats.data.aiSubscriptionInUse };
        } catch {
            return { hasActiveTier: false };
        }
    },

    // ── Reviews ────────────────────────────────────────────────────────────────

    getWarehouseRatings: async (warehouseId: number): Promise<WarehouseRatingResponse> => {
        const response = await api.get<ReviewResponseDTO[]>(`/warehouses/${warehouseId}/reviews`);
        const reviews = response.data || [];
        const avg = reviews.length > 0
            ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
            : 0;
        return { averageRating: avg, totalReviews: reviews.length, reviews };
    },

    createReview: async (warehouseId: number, rating: number, comment?: string): Promise<Review> => {
        const response = await api.post<any>(`/renters/warehouses/${warehouseId}/ratings`, { rating, comment });
        return {
            id: response.data.id,
            userId: 0,
            warehouseId,
            renterName: response.data.renterName,
            rating: response.data.rating,
            comment: response.data.comment,
        };
    },
};

export interface ContractResponseDTO {
    id: number;
    requestId: number;
    warehouseName: string;
    cargoDescription: string;
    startAt: string;
    endAt: string;
    paymentTerm: string;
    penaltyClause: string;
    specialTerm: string;
    cancelReason: string;
    ownerSigned: boolean;
    renterSigned: boolean;
    ownerLegalName: string;
    ownerTaxCode: string;
    ownerEmail: string;
    ownerPhone: string;
    ownerAddress: string;
    renterLegalName: string;
    renterTaxCode: string;
    renterEmail: string;
    renterPhone: string;
    renterAddress: string;
    totalPrice: number;
    status: string;
}

export interface CompositeContract {
    id_contract: number;
    id_rent_request?: number;
    cargo_description: string;
    create_at: string;
    status: string;
    update_at: string;
    start_at: string;
    end_at: string;
    cancel_reason: string;
    payment_term: string;
    penalty_clause: string;
    special_term: string;
    owner_legal_name: string;
    owner_tax_code: string;
    owner_email: string;
    owner_phone: string;
    owner_address: string;
    renter_legal_name: string;
    renter_tax_code: string;
    renter_email: string;
    renter_phone: string;
    renter_address: string;
    total_price: number;
    ownerSigned: boolean;
    renterSigned: boolean;
    id_warehouse?: number;
    contractRef?: string;
    ownerName?: string;
    renterCompany?: string;
    rentedCapacity?: number;
    monthlyRate?: number;
    notes?: string;
    pdfFileName?: string;
}

function mapContractResponse(c: any): CompositeContract {
    return {
        id_contract: c.id,
        id_rent_request: c.requestId,
        cargo_description: c.cargoDescription,
        create_at: c.createdAt || new Date().toISOString(),
        status: c.status,
        update_at: c.updatedAt || new Date().toISOString(),
        start_at: c.startAt,
        end_at: c.endAt,
        cancel_reason: c.cancelReason,
        payment_term: c.paymentTerm,
        penalty_clause: c.penaltyClause,
        special_term: c.specialTerm,
        owner_legal_name: c.ownerLegalName,
        owner_tax_code: c.ownerTaxCode,
        owner_email: c.ownerEmail,
        owner_phone: c.ownerPhone,
        owner_address: c.ownerAddress,
        renter_legal_name: c.renterLegalName,
        renter_tax_code: c.renterTaxCode,
        renter_email: c.renterEmail,
        renter_phone: c.renterPhone,
        renter_address: c.renterAddress,
        total_price: c.totalPrice,
        ownerSigned: c.ownerSigned,
        renterSigned: c.renterSigned,
        id_warehouse: c.id_warehouse,
        warehouseName: c.warehouseName,
        ownerName: c.ownerLegalName,
        renterCompany: c.renterLegalName,
    };
}
