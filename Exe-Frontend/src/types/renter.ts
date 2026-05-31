// ── Renter ──────────────────────────────────────────────────────────────────
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
    warehouseId: number;
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
