// Address formatting helpers for warehouse locations.
//
// Rule:
//   • Both commune (quận/huyện/thành phố thuộc thành phố) and province present
//     → "<province>, <commune>"
//   • Commune missing → "<province>, <last segment of location_address_text>"
//   • Both missing → ""
//
// The fallback string `locationAddressText` is expected to be a free-text,
// comma-separated address (e.g. "12 Nguyễn Huệ, Phường Bến Nghé, Thành phố Hồ
// Chí Minh"). We use its last comma-separated segment as a stand-in for the
// missing commune so the address still reads sensibly.

export interface AddressParts {
    province?: string | null;
    commune?: string | null;
    locationAddressText?: string | null;
}

function lastSegment(value: string | null | undefined): string {
    if (!value) return "";
    const parts = value
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : "";
}

/**
 * Format a warehouse's address for compact display (e.g. on cards, table rows).
 *
 * Order is `<province>, <commune-or-last-segment>`.
 */
export function formatShortAddress(parts: AddressParts): string {
    const province = (parts.province ?? "").trim();
    const commune = (parts.commune ?? "").trim();

    if (province && commune) {
        return `${province}, ${commune}`;
    }
    if (province && !commune) {
        const fallback = lastSegment(parts.locationAddressText);
        return fallback ? `${province}, ${fallback}` : province;
    }
    if (!province && commune) {
        // Province absent — best-effort: use the last segment of the address text
        // to surface at least the city-like part, otherwise fall back to the commune.
        const fallback = lastSegment(parts.locationAddressText);
        return fallback ? `${fallback}, ${commune}` : commune;
    }
    return "";
}