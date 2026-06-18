import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { storageAPI } from "../../../services/apiClient";
import { ownerService } from "../../../services/ownerService";
import { CompositeWarehouse, CompositeWarehouseSection, WarehouseImage } from "../../../types";
import { Button } from "../../components/ui/button";
import { Save, ArrowLeft, Loader2, RotateCcw, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { CertFile } from "../../components/owner/WarehouseFormUtils";

import { WarehouseFormBasicInfo } from "../../components/owner/WarehouseFormBasicInfo";
import { WarehouseFormLocation } from "../../components/owner/WarehouseFormLocation";
import { WarehouseFormSections } from "../../components/owner/WarehouseFormSections";
import { WarehouseFormImages } from "../../components/owner/WarehouseFormImages";
import { WarehouseFormCerts } from "../../components/owner/WarehouseFormCerts";

export default function WarehouseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warehouse, setWarehouse] = useState<CompositeWarehouse | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Additional transient states not directly inside `warehouse` object or requiring specific handling
  const [certFiles, setCertFiles] = useState<CertFile[]>([]);

  useEffect(() => {
    const fetchWarehouse = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = (await ownerService.getMyWarehouseDetail(Number(id))) as CompositeWarehouse;
        if (!data) {
          toast.error("Không tìm thấy dữ liệu kho!");
          navigate("/warehouse/my-warehouses");
          return;
        }

        const locationData = await ownerService.getWarehouseLocation(Number(id));

        let rawAddress = data.location_address_text || data.address || "";
        if (data.location_province && rawAddress.endsWith(`, ${data.location_province}`)) {
          rawAddress = rawAddress.slice(0, -(`, ${data.location_province}`.length));
        }
        if (data.location_commune && rawAddress.endsWith(`, ${data.location_commune}`)) {
          rawAddress = rawAddress.slice(0, -(`, ${data.location_commune}`.length));
        }

        // Setup default arrays if null
        setWarehouse({
          ...data,
          location_lat: locationData.locationLat || data.location_lat,
          location_long: locationData.locationLong || data.location_long,
          address: rawAddress,
          sections: data.sections || [],
          images: data.images || [],
          certifications: data.certifications || [],
          stats: data.stats || {
            humidity: 85,
            powerBackup: true,
            securityLevel: "medium",
          },
        });
      } catch (err: any) {
        console.error("Fetch warehouse failed", err);
        toast.error("Lỗi khi tải thông tin kho");
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouse();
  }, [id, navigate]);

  const updateField = (key: keyof CompositeWarehouse, val: any) => {
    setWarehouse((prev) => prev ? { ...prev, [key]: val } : null);
  };

  const updateMultipleFields = (updates: Partial<CompositeWarehouse>) => {
    setWarehouse((prev) => prev ? { ...prev, ...updates } : null);
  };

  const updateSections = (sections: CompositeWarehouseSection[]) => {
    setWarehouse((prev) => prev ? { ...prev, sections } : null);
  };

  const handleToggleStatus = async () => {
    if (!warehouse) return;
    setIsTogglingStatus(true);
    try {
      if (warehouse.status === 'active') {
        await ownerService.hideWarehouse(warehouse.id_warehouse);
        setWarehouse((prev) => prev ? { ...prev, status: 'inactive' } : null);
        toast.success("Đã ngừng hoạt động kho lạnh");
      } else {
        await ownerService.restoreWarehouse(warehouse.id_warehouse);
        setWarehouse((prev) => prev ? { ...prev, status: 'active' } : null);
        toast.success("Đã kích hoạt lại kho lạnh");
      }
    } catch (err: any) {
      console.error("Lỗi khi thay đổi trạng thái:", err);
      toast.error("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouse) return;

    if (!warehouse.name) {
      toast.error("Vui lòng nhập tên kho lạnh");
      return;
    }

    setSaving(true);
    try {
      // Build the DTO mapping for the JSON part, matching AddWarehouse structure
      const dto = {
        name: warehouse.name,
        description: warehouse.description,
        locationAddressText: [warehouse.address, warehouse.location_commune, warehouse.location_province].filter(Boolean).join(", "),
        locationProvince: warehouse.location_province,
        locationCommune: warehouse.location_commune,
        locationLong: warehouse.location_long,
        locationLat: warehouse.location_lat,
        locationPostalCode: warehouse.location_postal_code || "",
        sections: (warehouse.sections || []).map(sec => ({
          id: sec.id_section > 1000000000 ? null : sec.id_section, // Backend expects 'id', null for brand new sections
          sector: sec.sector,
          totalCapacity: sec.total_capacity,
          availableCapacity: sec.available_capacity,
          tempMin: parseFloat(String(sec.temp_min)) || 0,
          tempMax: parseFloat(String(sec.temp_max)) || 0,
          humidity: parseFloat(String(sec.humidity)) || 0,
          hasCertification: sec.hasCertification,
          priceTiers: (sec.priceTiers || []).map((pt: any) => ({
            label: pt.label,
            value: pt.value,
            unit: pt.unit,
            areaUnit: pt.area_unit
          }))
        }))
      };

      console.log("[WarehouseForm] Submitting update for:", warehouse.id_warehouse, dto);
      await ownerService.updateWarehouse(warehouse.id_warehouse, dto);
      toast.success("Cập nhật kho lạnh thành công!");
      navigate("/warehouse/my-warehouses");
    } catch (err: any) {
      console.error("[WarehouseForm] Error updating warehouse:", err);
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[var(--color-primary)]" />
          <p className="text-[var(--color-text-secondary)]">Đang tải thông tin kho lạnh...</p>
        </div>
      </div>
    );
  }

  if (!warehouse) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-20">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate("/warehouse/my-warehouses")}
            className="flex items-center gap-2 text-sm mb-4 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Về danh sách kho
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">Chỉnh sửa kho lạnh</h1>
              <p className="text-[var(--color-text-secondary)]">Cập nhật thông tin chi tiết cho kho lạnh của bạn</p>
            </div>
            <div className="flex items-center gap-3">
              {warehouse.status === 'active' ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="text-[var(--color-error)] hover:bg-red-50 border-[var(--color-error)]"
                  onClick={handleToggleStatus}
                  disabled={isTogglingStatus}
                >
                  {isTogglingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <EyeOff className="h-4 w-4 mr-2" />}
                  Ngừng hoạt động
                </Button>
              ) : (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="text-[var(--color-success)] hover:bg-green-50 border-[var(--color-success)]"
                  onClick={handleToggleStatus}
                  disabled={isTogglingStatus}
                >
                  {isTogglingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                  Kích hoạt lại
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                <RotateCcw className="h-4 w-4 mr-2" /> Khôi phục
              </Button>
            </div>
          </div>
        </div>

        {/* ── Main Form ── */}
        <form onSubmit={handleSave} className="space-y-6">
          
          <WarehouseFormBasicInfo 
            warehouse={warehouse} 
            onChange={updateField} 
          />

          <WarehouseFormLocation 
            warehouse={warehouse} 
            onChange={updateMultipleFields} 
          />

          <WarehouseFormImages 
            images={warehouse.images || []} 
            onChange={(imgs) => updateField("images", imgs)} 
          />

          <WarehouseFormSections 
            sections={warehouse.sections || []} 
            onChange={updateSections} 
          />

          <WarehouseFormCerts 
            certFiles={certFiles}
            setCertFiles={setCertFiles}
            existingCerts={warehouse.certifications || []}
            setExistingCerts={(certs) => updateField("certifications", certs)}
          />

          {/* ── Submit Buttons ── */}
          <div className="flex items-center gap-4 pt-6 border-t border-[var(--color-border)] sticky bottom-0 bg-[var(--color-bg)] py-4 z-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/warehouse/my-warehouses")}
              className="flex-1 bg-white"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
