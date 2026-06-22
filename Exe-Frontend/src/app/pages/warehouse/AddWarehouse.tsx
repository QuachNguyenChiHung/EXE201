import { useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { ownerService } from "../../../services/ownerService";
import { PRICE_TIER_OPTIONS } from "../../components/owner/WarehouseFormUtils";
import { CompositeWarehouse, CompositeWarehouseSection } from "../../../types";
import { Button } from "../../components/ui/button";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CertFile } from "../../components/owner/WarehouseFormUtils";

import { WarehouseFormBasicInfo } from "../../components/owner/WarehouseFormBasicInfo";
import { WarehouseFormLocation } from "../../components/owner/WarehouseFormLocation";
import { WarehouseFormSections } from "../../components/owner/WarehouseFormSections";
import { WarehouseFormImages } from "../../components/owner/WarehouseFormImages";
import { WarehouseFormCerts } from "../../components/owner/WarehouseFormCerts";

export default function AddWarehouse() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);

  const [warehouse, setWarehouse] = useState<Partial<CompositeWarehouse>>({
    name: "",
    description: "",
    address: "",
    location_commune: "",
    location_province: "",
    location_lat: 10.8231,
    location_long: 106.6297,
    status: "active",
    availability: "available",
    certifications: [],
    images: [],
    sections: [],
  });

  const [certFiles, setCertFiles] = useState<CertFile[]>([]);

  const updateField = (key: keyof CompositeWarehouse, val: any) => {
    setWarehouse((prev) => ({ ...prev, [key]: val }));
  };

  const updateMultipleFields = (updates: Partial<CompositeWarehouse>) => {
    setWarehouse((prev) => ({ ...prev, ...updates }));
  };

  const updateSections = (sections: CompositeWarehouseSection[]) => {
    setWarehouse((prev) => ({ ...prev, sections }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouse.name) {
      toast.error("Vui lòng nhập tên kho lạnh");
      return;
    }

    if (certFiles.some((cert) => !cert.certTypeId)) {
      toast.error("Vui lòng chọn loại chứng chỉ cho tất cả file đã tải lên");
      return;
    }

    setSaving(true);
    try {
      // 1. Build the DTO mapping for the JSON part
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
          sector: sec.sector,
          totalCapacity: sec.total_capacity,
          availableCapacity: sec.available_capacity,
          tempMin: parseFloat(String(sec.temp_min)) || 0,
          tempMax: parseFloat(String(sec.temp_max)) || 0,
          humidity: parseFloat(String(sec.humidity)) || 0,
          hasCertification: sec.hasCertification,
          priceTiers: (sec.priceTiers || []).map((pt: any) => {
            const byLabel = PRICE_TIER_OPTIONS.find(o => o.label === pt.label);
            const byUnit = PRICE_TIER_OPTIONS.find(o => o.unit === pt.unit);
            const match = byLabel || byUnit;
            return {
              label: match?.label || pt.label,
              value: pt.value,
              unit: match?.unit || pt.unit || "month",
              areaUnit: pt.areaUnit || "m3"
            };
          })
        }))
      };

      // 2. Construct FormData
      const formData = new FormData();

      // We append the JSON DTO as a Blob so the backend can parse it as application/json
      formData.append(
        "warehouse",
        new Blob([JSON.stringify(dto)], { type: "application/json" })
      );

      // 3. Append images
      if (warehouse.images && warehouse.images.length > 0) {
        warehouse.images.forEach((img: any) => {
          if (img instanceof File) {
            formData.append("images", img);
          }
        });
      }

      // 4. Append certificates
      if (certFiles && certFiles.length > 0) {
        certFiles.forEach((cert) => {
          if (cert.file && cert.certTypeId) {
            formData.append("certFiles", cert.file);
            formData.append("certTypeIds", String(cert.certTypeId));
          }
        });
      }

      console.log("[WarehouseForm] Submitting creation for:", dto);
      await ownerService.createWarehouse(formData);
      toast.success("Thêm kho lạnh mới thành công!");
      navigate("/warehouse/my-warehouses");
    } catch (err: any) {
      console.error("[WarehouseForm] Error adding warehouse:", err);
      toast.error("Thêm mới thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

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
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">Thêm kho lạnh mới</h1>
            <p className="text-[var(--color-text-secondary)]">Điền thông tin chi tiết để đăng tải kho lạnh của bạn lên hệ thống</p>
          </div>
        </div>

        {/* ── Main Form ── */}
        <form onSubmit={handleSave} className="space-y-6">

          <WarehouseFormBasicInfo
            warehouse={warehouse as CompositeWarehouse}
            onChange={updateField}
          />

          <WarehouseFormLocation
            warehouse={warehouse as CompositeWarehouse}
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
              {saving ? "Đang xử lý..." : "Đăng tải kho lạnh"}
            </Button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
