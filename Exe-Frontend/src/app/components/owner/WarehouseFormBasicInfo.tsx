import { CompositeWarehouse } from "../../../types";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Card } from "../../components/ui/card";
import { FileText, Thermometer, Shield, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";

interface Props {
  warehouse: CompositeWarehouse;
  onChange: (key: keyof CompositeWarehouse, val: any) => void;
}

export function WarehouseFormBasicInfo({ warehouse, onChange }: Props) {
  const stats = warehouse.stats || {};
  return (
    <>
      <Card className="bento-card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
          Thông tin cơ bản
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">
              Tên kho <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Nhập tên kho lạnh..."
              value={warehouse.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Mô tả tổng quan</Label>
            <Textarea
              id="description"
              placeholder="Mô tả về kho lạnh, vị trí, đặc điểm nổi bật..."
              value={warehouse.description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              className="mt-1 min-h-[120px]"
            />
          </div>
        </div>
      </Card>
    </>
  );
}
