// ── Employee ────────────────────────────────────────────────────────────────
export type ResourceKey = 'users' | 'warehouses' | 'requests' | 'contracts' | 'ratings';

export type LogLevel = 'info' | 'success' | 'error' | 'warn';

export interface Certification {
    id: number;
    label: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    documentUrl?: string;
}

export interface CertificationSubmit {
    id: number;
    link: string;
    isVerified: boolean;
    id_type: number;
}

export interface CertificationType {
    id: number;
    label: string;
    update: string;
    law_references: string;
}


