import { Sparkles, AlertCircle } from "lucide-react";
import { WarehouseCard } from "../../components/WarehouseCard";
import { CompositeWarehouse } from "../../../types";

interface AIResultGridProps {
    displayedList: CompositeWarehouse[];
    warehousesRevealed: boolean;
}

export function AIResultGrid({ displayedList, warehousesRevealed }: AIResultGridProps) {
    if (!warehousesRevealed) {
        return (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col items-center justify-center text-center" style={{ minHeight: "480px" }}>
                <div className="w-16 h-16 bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-5"><Sparkles className="h-8 w-8 text-[var(--color-text-muted)]" /></div>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto leading-relaxed">
                    Đặt câu hỏi cho AI ở bên trái để xem danh sách kho phù hợp.<br /><br />
                    Ví dụ: <em>"Kho nào rẻ nhất?"</em> hoặc <em>"So sánh top 3 lựa chọn"</em>.
                </p>
            </div>
        );
    }

    if (displayedList.length > 0) {
        return (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayedList.map((w) => (
                        <WarehouseCard key={w.id_warehouse} warehouse={w} compact openInNewTab />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-12 text-center">
            <div className="w-14 h-14 bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-4"><AlertCircle className="h-7 w-7 text-[var(--color-text-muted)]" /></div>
            <h3 className="mb-2">Không có kết quả</h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto">Thử hỏi AI để gợi ý điều chỉnh, hoặc quay lại bước 1 để thay đổi tiêu chí.</p>
        </div>
    );
}
