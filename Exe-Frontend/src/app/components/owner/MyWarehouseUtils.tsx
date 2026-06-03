import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { CompositeWarehouse } from '../../../types';

export function getMinMaxPrice(warehouse: CompositeWarehouse): { min: number; max: number | null } {
  const monthlyPrices: number[] = [];
  warehouse.sections?.forEach(s =>
    s.priceTiers?.forEach(t => {
      if (t.unit === 'month' && t.value > 0) monthlyPrices.push(t.value);
    }),
  );
  if (monthlyPrices.length > 0) {
    const mn = Math.min(...monthlyPrices);
    const mx = Math.max(...monthlyPrices);
    return { min: mn, max: mn !== mx ? mx : null };
  }
  const tierPrices = (warehouse.priceTiers ?? [])
    .filter(t => t.unit === 'month' && t.value > 0)
    .map(t => t.value);
  if (tierPrices.length > 0) {
    const mn = Math.min(...tierPrices);
    const mx = Math.max(...tierPrices);
    return { min: mn, max: mn !== mx ? mx : null };
  }
  return { min: warehouse.pricePerCubicMeter || 0, max: null };
}

export const fmtVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export function Thumb({ src, alt = '' }: { src?: string; alt?: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <ImageIcon style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.4)' }} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setErr(true)}
    />
  );
}

export function MainImage({ src, alt }: { src?: string; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2"
        style={{ background: 'var(--color-bg-secondary)' }}
      >
        <ImageIcon className="h-8 w-8" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Chưa có ảnh</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      style={{ position: 'absolute', inset: 0 }}
      onError={() => setErr(true)}
    />
  );
}
