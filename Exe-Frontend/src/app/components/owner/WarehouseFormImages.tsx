import { Card } from "../../components/ui/card";
import { ImageUploader } from "../../components/ImageUploader";
import { Image as ImageIcon } from "lucide-react";
import { WarehouseImage } from "../../../types";

interface Props {
  images: (string | WarehouseImage)[];
  onChange: (images: string[]) => void;
}

export function WarehouseFormImages({ images, onChange }: Props) {
  // Normalize images to string[]
  const imgUrls = images.map(img => typeof img === 'string' ? img : img.image_url);

  return (
    <Card className="bento-card p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <ImageIcon className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        Hình ảnh kho lạnh
      </h2>
      <ImageUploader
        value={imgUrls}
        onChange={onChange}
        maxFiles={10}
      />
    </Card>
  );
}
