import { useState } from "react";
import { CompositeWarehouseSection, PriceTier } from "../../../types";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { Plus, X, LayoutGrid, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { PRICE_TIER_OPTIONS, UNIT_AREA_SHORT, UNIT_SHORT } from "./WarehouseFormUtils";

interface Props {
  sections: CompositeWarehouseSection[];
  onChange: (sections: CompositeWarehouseSection[]) => void;
}

export function WarehouseFormSections({ sections, onChange }: Props) {
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<number>>(new Set(sections.map(s => s.id_section)));

  const toggleSection = (id: number) => {
    const next = new Set(expandedSectionIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedSectionIds(next);
  };

  const addSection = () => {
    const id = Date.now();
    onChange([
      ...sections,
      {
        id_section: id,
        sector: sections.length + 1,
        name: "",
        description: "",
        total_capacity: 0,
        available_capacity: 0,
        temp_min: -18,
        temp_max: 5,
        humidity: 85,
        hasCertification: true,
        availability: "available",
        priceTiers: [
          { id_price_tier: Date.now() + 1, unit: "month", label: "Giá theo tháng", value: 0, area_unit: "m3" }
        ]
      }
    ]);
    setExpandedSectionIds(new Set([...expandedSectionIds, id]));
  };

  const removeSection = (id: number) => {
    onChange(sections.filter((s) => s.id_section !== id));
  };

  const updateSection = (id: number, key: keyof CompositeWarehouseSection, value: any) => {
    onChange(sections.map((s) => {
      if (s.id_section === id) {
        const next = { ...s, [key]: value };
        if (key === "total_capacity") {
          next.available_capacity = value;
        }
        return next;
      }
      return s;
    }));
  };

  const addPriceTier = (sectionId: number) => {
    onChange(
      sections.map((s) => {
        if (s.id_section === sectionId) {
          const newTier: PriceTier = {
            id_price_tier: Date.now(),
            label: "Giá theo ngày",
            unit: "day",
            value: 0,
            area_unit: "m3"
          };
          return { ...s, priceTiers: [...(s.priceTiers || []), newTier] };
        }
        return s;
      })
    );
  };

  const updatePriceTier = (sectionId: number, tierId: number, updates: Partial<PriceTier>) => {
    onChange(
      sections.map((s) => {
        if (s.id_section === sectionId) {
          const updatedTiers = (s.priceTiers || []).map((t) =>
            t.id_price_tier === tierId ? { ...t, ...updates } : t
          );
          return { ...s, priceTiers: updatedTiers };
        }
        return s;
      })
    );
  };

  const removePriceTier = (sectionId: number, tierId: number) => {
    onChange(
      sections.map((s) => {
        if (s.id_section === sectionId) {
          return {
            ...s,
            priceTiers: (s.priceTiers || []).filter((t) => t.id_price_tier !== tierId),
          };
        }
        return s;
      })
    );
  };

  return (
    <Card className="bento-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
          Phân khu & Bảng giá
        </h2>
        <Button
          type="button"
          onClick={addSection}
          className="flex items-center gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" /> Thêm khu vực
        </Button>
      </div>

      <div className="space-y-6">
        {sections.map((s, index) => {
          const isExpanded = expandedSectionIds.has(s.id_section);
          return (
            <div key={s.id_section} className="border-2 border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors select-none"
                onClick={() => toggleSection(s.id_section)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-[var(--color-primary)] text-white text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)]">
                      Khu vực {s.sector || index + 1}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {s.total_capacity} m³ • Nhiệt độ: {s.temp_min}°C đến {s.temp_max}°C
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSection(s.id_section);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </div>
              </div>

              {/* Body */}
              {isExpanded && (
                <div className="p-4 border-t border-[var(--color-border)] bg-white/50 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Tổng sức chứa (m³)</Label>
                      <Input
                        type="text"
                        placeholder="VD: 500"
                        value={s.total_capacity ? s.total_capacity.toLocaleString('vi-VN') : ""}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, '');
                          updateSection(s.id_section, "total_capacity", rawValue ? parseInt(rawValue, 10) : 0);
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Nhiệt độ tối thiểu (°C)</Label>
                      <Input
                        type="text"
                        placeholder="VD: -20"
                        value={s.temp_min !== undefined ? s.temp_min : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.-]/g, '');
                          updateSection(s.id_section, "temp_min", val as any);
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Nhiệt độ tối đa (°C)</Label>
                      <Input
                        type="text"
                        placeholder="VD: -15"
                        value={s.temp_max !== undefined ? s.temp_max : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.-]/g, '');
                          updateSection(s.id_section, "temp_max", val as any);
                        }}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Độ ẩm tiêu chuẩn (%)</Label>
                      <Input
                        type="text"
                        placeholder="VD: 85"
                        value={s.humidity !== undefined ? s.humidity : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.-]/g, '');
                          updateSection(s.id_section, "humidity", val as any);
                        }}
                        className="mt-1"
                      />
                    </div>
                    </div>

                  {/* Price Tiers */}
                  <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 border border-[var(--color-border)]">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="flex items-center gap-2 font-semibold">
                        <Tag className="h-4 w-4" /> Bảng giá thuê
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addPriceTier(s.id_section)}
                        disabled={(s.priceTiers?.length ?? 0) >= 4}
                        className="h-8 text-xs flex items-center gap-1 disabled:opacity-50"
                        title={(s.priceTiers?.length ?? 0) >= 4 ? "Đã đủ 4 mốc giá (tối đa)" : undefined}
                      >
                        <Plus className="h-3 w-3" /> Thêm mốc giá
                      </Button>
                    </div>
                    
                    {s.priceTiers && s.priceTiers.length > 0 ? (
                      <div className="space-y-3">
                        {s.priceTiers.map((tier) => (
                          <div key={tier.id_price_tier} className="flex flex-wrap sm:flex-nowrap items-start gap-2 bg-white p-2 rounded-md border border-gray-200">
                            <div className="flex-1 min-w-[150px]">
                              <Select
                                value={tier.unit}
                                onValueChange={(val) => {
                                  const option = PRICE_TIER_OPTIONS.find(o => o.unit === val);
                                  updatePriceTier(s.id_section, tier.id_price_tier, {
                                    unit: val,
                                    label: option?.label || val
                                  });
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PRICE_TIER_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.unit} value={opt.unit}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-full sm:w-48 flex items-center relative">
                              <Input
                                type="text"
                                placeholder="Nhập giá"
                                value={tier.value ? tier.value.toLocaleString('vi-VN') : ""}
                                onChange={(e) => {
                                  const rawValue = e.target.value.replace(/\D/g, '');
                                  updatePriceTier(s.id_section, tier.id_price_tier, { value: rawValue ? parseInt(rawValue, 10) : 0 });
                                }}
                                className="h-9 pr-6"
                              />
                              <span className="absolute right-2 text-xs font-semibold text-gray-500 pointer-events-none">₫</span>
                            </div>
                            <div className="flex items-center px-3 h-9 bg-gray-50 border rounded-md text-sm text-gray-600 shrink-0">
                              / {UNIT_SHORT[tier.unit] || tier.unit} / {UNIT_AREA_SHORT[tier.area_unit] || tier.area_unit}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-gray-400 hover:text-red-500"
                              onClick={() => removePriceTier(s.id_section, tier.id_price_tier)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500 italic">
                        Chưa có thông tin giá. Nhấn "Thêm mốc giá" để bắt đầu (tối đa 4 mốc giá).
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sections.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-bg-secondary)]">
            <LayoutGrid className="h-10 w-10 mx-auto text-[var(--color-text-muted)] mb-3" />
            <h3 className="text-[var(--color-text)] font-semibold mb-1">Chưa có phân khu nào</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">Thêm ít nhất một phân khu để khách hàng có thể đặt thuê.</p>
            <Button type="button" onClick={addSection}>
              <Plus className="h-4 w-4 mr-2" /> Thêm khu vực đầu tiên
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
