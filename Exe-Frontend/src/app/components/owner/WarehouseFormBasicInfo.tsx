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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Trạng thái kho</Label>
              <Select
                value={warehouse.status || "pending"}
                onValueChange={(val) => onChange("status", val)}
              >
                <SelectTrigger id="status" className="mt-1">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Đang hoạt động (Hiển thị)
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      Đã ẩn (Không hiển thị)
                    </div>
                  </SelectItem>
                  <SelectItem value="pending" disabled>
                    <div className="flex items-center gap-2 text-yellow-600">
                      Chờ duyệt
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bento-card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-orange-500" />
          Thông số tổng quan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="humidity">Độ ẩm tiêu chuẩn (%)</Label>
            <Input
              id="humidity"
              type="number"
              min="0"
              max="100"
              placeholder="VD: 85"
              value={stats.humidity !== undefined ? stats.humidity : ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange("stats", { ...stats, humidity: val ? parseInt(val) : undefined });
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="securityLevel">Mức độ an ninh</Label>
            <Select
              value={stats.securityLevel || "medium"}
              onValueChange={(val) => onChange("stats", { ...stats, securityLevel: val })}
            >
              <SelectTrigger id="securityLevel" className="mt-1">
                <SelectValue placeholder="Chọn mức độ an ninh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Cơ bản (Khóa thường, bảo vệ part-time)</SelectItem>
                <SelectItem value="medium">Trung bình (Camera 24/7, bảo vệ ca)</SelectItem>
                <SelectItem value="high">Cao (Camera, bảo vệ 24/7, kiểm soát ra vào)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <Checkbox
              id="powerBackup"
              checked={stats.powerBackup ?? false}
              onCheckedChange={(val) => onChange("stats", { ...stats, powerBackup: !!val })}
            />
            <Label htmlFor="powerBackup" className="cursor-pointer">
              Có hệ thống điện dự phòng (Máy phát điện)
            </Label>
          </div>
        </div>
      </Card>
    </>
  );
}
