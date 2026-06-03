import { useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { warehousesAPI } from "../../../services/apiClient";
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
    latitude: 21.0285,
    longitude: 105.8542,
    total_capacity: 0,
    available_capacity: 0,
    type: "cold",
    status: "active",
    availability: "available",
    certifications: [],
    features: [],
    images: [],
    sections: [],
    stats: {
      humidity: 85,
      powerBackup: true,
      securityLevel: "medium",
    },
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

    setSaving(true);
    try {
      let finalImages = warehouse.images || [];

      // Generate a new ID based on current time for the mock
      const newId = Date.now().toString();

      const newWarehouse: Partial<CompositeWarehouse> = {
        ...warehouse,
        id_warehouse: newId as unknown as number, // Let API handle real ID assignment
        images: finalImages,
        create_at: new Date().toISOString(),
        update_at: new Date().toISOString(),
      };

      console.log("[WarehouseForm] Submitting creation for:", newWarehouse);
      await warehousesAPI.create(newWarehouse);
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
