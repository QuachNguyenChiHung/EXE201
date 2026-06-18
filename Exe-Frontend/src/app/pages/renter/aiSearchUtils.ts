import { CompositeWarehouse, SUBSCRIPTION_TIERS } from "../../../types";

export function applyLocalFilter(
    warehouses: CompositeWarehouse[],
    selections: Record<string, string[]>,
): CompositeWarehouse[] {
    let result = warehouses.filter((w) => w.status === "active");

    const locs = selections["location"] ?? [];
    if (locs.length > 0 && !locs.includes("other")) {
        result = result.filter((w) =>
            locs.some(
                (p) =>
                    (w.location_province || "").toLowerCase().includes(p.toLowerCase()) ||
                    (w.location_commune || "").toLowerCase().includes(p.toLowerCase()),
            ),
        );
    }

    const temps = selections["temperatureZone"] ?? [];
    if (temps.length > 0) {
        const ranges: Record<string, [number, number]> = {
            deep_freeze: [-30, -18],
            freeze: [-18, -10],
            cold: [-10, 0],
            cool: [0, 8],
            climate: [8, 15],
        };
        result = result.filter((w) =>
            temps.some((t) => {
                const [min, max] = ranges[t] ?? [-30, 15];
                const mainOk = (w.stats?.temperatureMin ?? 0) <= max && (w.stats?.temperatureMax ?? 0) >= min;
                const sectionOk =
                    w.sections?.some((s) => s.temp_min <= max && s.temp_max >= min) ?? false;
                return mainOk || sectionOk;
            }),
        );
    }

    const caps = selections["capacity"] ?? [];
    if (caps.length > 0) {
        const ranges: Record<string, [number, number]> = {
            xs: [0, 200],
            sm: [200, 500],
            md: [500, 2000],
            lg: [2000, 5000],
            xl: [5000, Infinity],
        };
        result = result.filter((w) =>
            caps.some((c) => {
                const [min, max] = ranges[c] ?? [0, Infinity];
                const mainOk = (w.stats?.availableCapacity ?? 0) >= min && (w.stats?.availableCapacity ?? 0) <= max;
                const sectionOk =
                    w.sections?.some((s) => s.available_capacity >= min && s.available_capacity <= max) ?? false;
                return mainOk || sectionOk;
            }),
        );
    }

    const budgets = selections["budget"] ?? [];
    if (budgets.length > 0 && !budgets.includes("any")) {
        const budgetRanges: Record<string, [number, number]> = {
            budget: [0, 200000],
            mid: [200001, 350000],
            high: [350001, 500000],
            premium: [500001, Infinity],
        };
        result = result.filter((w) =>
            budgets.some((b) => {
                const [min, max] = budgetRanges[b] ?? [0, Infinity];
                const wPrice = w.pricePerCubicMeter || 0;
                if (wPrice >= min && wPrice <= max) return true;
                if (w.priceTiers?.some((t) => t.unit === "month" && t.value >= min && t.value <= max))
                    return true;
                return (
                    w.sections?.some((s) =>
                        s.priceTiers?.some((t) => t.unit === "month" && t.value >= min && t.value <= max),
                    ) ?? false
                );
            }),
        );
    }

    const certs = (selections["certifications"] ?? []).filter((v) => v !== "none");
    if (certs.length > 0) {
        result = result.filter((w) => {
            if (!w.certifications || w.certifications.length === 0) return false;
            return w.certifications.some((c: any) => certs.includes(c.id_type?.toString()));
        });
    }

    const secLevels = (selections["security"] ?? []).filter((s) => s !== "any");
    if (secLevels.length > 0) {
        result = result.filter((w) => secLevels.includes(w.stats?.securityLevel));
    }


    const availValues = (selections["availability"] ?? []).filter((a) => a !== "all");
    if (availValues.length > 0) {
        result = result.filter((w) => w.availability && availValues.includes(w.availability));
    }

    // Sort by subscription tier boost (higher tier = higher priority)
    result.sort((a, b) => {
        const boostA = SUBSCRIPTION_TIERS[a.subscriptionTier ?? 'free'].boostFactor;
        const boostB = SUBSCRIPTION_TIERS[b.subscriptionTier ?? 'free'].boostFactor;
        if (boostB !== boostA) return boostB - boostA;
        return (b.ratingScore ?? 0) - (a.ratingScore ?? 0);
    });

    return result;
}

export function buildFilterSummary(list: CompositeWarehouse[]): string {
    if (list.length === 0) {
        return "Không tìm thấy kho lạnh nào khớp với tất cả tiêu chí bạn chọn.\n\nThử bỏ bớt một vài điều kiện (ví dụ: mở rộng vùng địa lý, bỏ chứng nhận, hoặc tăng ngân sách).";
    }
    const certCount = list.filter((w) => w.certifications && (w.certifications as any[]).length > 0).length;
    const availCount = list.filter((w) => w.availability === "available").length;
    const fmtPrice = (n: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
    const minP = Math.min(...list.map((w) => w.pricePerCubicMeter || 0));
    const maxP = Math.max(...list.map((w) => w.pricePerCubicMeter || 0));
    return (
        `Tìm thấy **${list.length} kho lạnh** phù hợp với tiêu chí của bạn!\n\n` +
        `**Tổng quan nhanh:**\n` +
        `- ${availCount}/${list.length} kho còn trống ngay\n` +
        `- ${certCount}/${list.length} kho có chứng nhận\n` +
        `- Giá dao động: ${fmtPrice(minP)} – ${fmtPrice(maxP)}/m³/tháng\n\n` +
        `Hãy gửi câu hỏi để AI phân tích sâu hơn! Ví dụ: _"Kho nào rẻ nhất?"_, _"So sánh top 3"_, hoặc _"Chỉ kho bảo mật cao"_.`
    );
}

export const isAINotConfigured = (err: any): boolean =>
    err?.message?.includes("ANTHROPIC_API_KEY") ||
    err?.message?.includes("AI_BACKEND_NOT_CONFIGURED") ||
    err?.message?.includes("AI_KEY_NOT_CONFIGURED");

export const fmtCurrency = (n: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export function buildSearchParams(selections: Record<string, string[]>): any {
    const params: any = { page: 0, size: 50 }; // Fetch up to 50 for AI context

    const locs = selections["location"] ?? [];
    if (locs.length > 0 && locs[0] !== "other") {
        params.province = locs[0];
    }

    const caps = selections["capacity"] ?? [];
    if (caps.length > 0) {
        const ranges: Record<string, [number, number]> = {
            xs: [0, 200],
            sm: [200, 500],
            md: [500, 2000],
            lg: [2000, 5000],
            xl: [5000, Infinity],
        };
        let minArea = Infinity;
        let maxArea = 0;
        caps.forEach((c) => {
            const [min, max] = ranges[c] ?? [0, Infinity];
            if (min < minArea) minArea = min;
            if (max > maxArea) maxArea = max;
        });
        if (minArea !== Infinity && minArea > 0) params.minArea = minArea;
        if (maxArea > 0 && maxArea !== Infinity) params.maxArea = maxArea;
    }

    const budgets = selections["budget"] ?? [];
    if (budgets.length > 0 && !budgets.includes("any")) {
        const budgetRanges: Record<string, [number, number]> = {
            budget: [0, 200000],
            mid: [200001, 350000],
            high: [350001, 500000],
            premium: [500001, Infinity],
        };
        let minPrice = Infinity;
        let maxPrice = 0;
        budgets.forEach((b) => {
            const [min, max] = budgetRanges[b] ?? [0, Infinity];
            if (min < minPrice) minPrice = min;
            if (max > maxPrice) maxPrice = max;
        });
        if (minPrice !== Infinity && minPrice > 0) params.minPrice = minPrice;
        if (maxPrice > 0 && maxPrice !== Infinity) params.maxPrice = maxPrice;
    }

    const certs = (selections["certifications"] ?? []).filter((v) => v !== "none");
    if (certs.length > 0) {
        params.certTypeId = Number(certs[0]);
    }

    return params;
}
