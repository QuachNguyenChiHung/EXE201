import { Card } from "../../components/ui/card";
import { ImageUploader } from "../../components/ImageUploader";
import { Image as ImageIcon } from "lucide-react";
import { WarehouseImage } from "../../../types";

interface Props {
  images: (string | File | WarehouseImage)[];
  onChange: (images: (string | File)[]) => void;
}

export function WarehouseFormImages({ images, onChange }: Props) {
  // Normalize images
  const imgItems = images.map(img => {
    if (typeof img === 'string') return img;
    if (img instanceof File) return img;
    return img.image_url;
  });

  return (
    <Card className="bento-card p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <ImageIcon className="h-5 w-5" style={{ color: "var(--color-primary)" }} />
        Hình ảnh kho lạnh
      </h2>
      <ImageUploader
        value={imgItems}
        onChange={onChange}
        maxFiles={10}
        returnFiles={true}
      />
    </Card>
  );
}
