import { useNavigate } from 'react-router';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CompositeWarehouse, SUBSCRIPTION_TIERS } from '../../../types';
import { SubscriptionTierBadge } from '../SubscriptionTierBadge';
import { getMinMaxPrice, fmtVnd, Thumb, MainImage } from './MyWarehouseUtils';
import {
  Edit, MapPin, Thermometer, Package, Tag, LayoutGrid, Image as ImageIcon,
  EyeOff, RotateCcw, Clock, Shield, Upload, FileText, Plus, Crown, TrendingUp,
} from 'lucide-react';

export function MyWarehouseCard({
  warehouse,
  isHidden,
  isPending,
  onRestore,
  onHide,
  onReuploadCerts,
}: {
  warehouse: CompositeWarehouse;
  isHidden: boolean;
  isPending: boolean;
  onRestore: (w: CompositeWarehouse) => void;
  onHide: (w: CompositeWarehouse) => void;
  onReuploadCerts: (w: CompositeWarehouse) => void;
}) {
  const navigate = useNavigate();

  const priceRange = getMinMaxPrice(warehouse);
  const hasSections = (warehouse.sections?.length ?? 0) > 0;
  const availSects = warehouse.sections?.filter(s => s.availability !== 'full').length ?? 0;
  const imgs = warehouse.images ?? [];

  return (
    <Card
      key={warehouse.id_warehouse}
      className={`bento-card overflow-hidden transition-opacity ${isHidden ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-col md:flex-row">
        {/* ── Image strip ───────────────────────────────────── */}
        <div
          className="md:w-56 flex-shrink-0 relative overflow-hidden"
          style={{ minHeight: 160, background: 'var(--color-bg-secondary)' }}
        >
          {/* Main cover photo */}
          <MainImage src={typeof imgs[0] === 'string' ? imgs[0] : (imgs[0] as any)?.url || ''} alt={warehouse.name} />

          {/* Greyscale overlay when hidden */}
          {isHidden && (
            <div className="absolute inset-0 bg-black/20" style={{ mixBlendMode: 'saturation' }} />
          )}

          {/* Mini thumbnail strip at bottom */}
          {imgs.length > 1 && (
            <div
              className="absolute bottom-0 left-0 right-0 p-1.5 flex gap-1"
              style={{ background: 'rgba(0,0,0,0.45)' }}
            >
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-8 h-8 overflow-hidden border border-white/30 flex-shrink-0"
                >
                  <Thumb src={typeof imgs[i] === 'string' ? imgs[i] : (imgs[i] as any)?.url || ''} />
                </div>
              ))}
              {imgs.length > 4 && (
                <div
                  className="w-8 h-8 flex items-center justify-center border border-white/30 flex-shrink-0"
                  style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.6rem', fontWeight: 700 }}
                >
                  +{imgs.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Image count badge (top-right) */}
          {imgs.length > 0 && (
            <div
              className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5"
              style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.6rem', borderRadius: 2 }}
            >
              <ImageIcon style={{ width: 9, height: 9 }} />
              {imgs.length}
            </div>
          )}

          {/* Status badge (top-left) */}
          <div className="absolute top-2 left-2">
            <Badge
              className={
                isHidden ? 'bg-gray-500' :
                  warehouse.status === 'pending' ? 'bg-[var(--color-warning)]' :
                    warehouse.availability === 'available' ? 'bg-[var(--color-success)]' :
                      warehouse.availability === 'partially' ? 'bg-[var(--color-warning)]' :
                        'bg-[var(--color-error)]'
              }
              style={{ fontSize: '0.65rem' }}
            >
              {isHidden ? 'Đã ẩn' :
                warehouse.status === 'pending' ? 'Chờ duyệt' :
                  warehouse.availability === 'available' ? 'Còn trống' :
                    warehouse.availability === 'partially' ? 'Gần đầy' : 'Đầy'}
            </Badge>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────── */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-lg font-semibold truncate" style={{ color: isHidden ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                  {warehouse.name}
                </h3>
                <SubscriptionTierBadge tier={warehouse.subscriptionTier} size="sm" />
                {isHidden && (
                  <EyeOff className="h-4 w-4 shrink-0 text-gray-400" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {warehouse.address}, {warehouse.location_commune}, {warehouse.location_province}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0">
              {isPending && (
                <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-amber-300 text-amber-600 bg-amber-50">
                  <Clock className="h-3.5 w-3.5" /> Chờ duyệt
                </span>
              )}
              {isHidden ? (
                <Button
                  variant="outline" size="sm"
                  className="flex items-center gap-1.5 text-[var(--color-success)] border-[var(--color-success)] hover:bg-green-50"
                  onClick={() => onRestore(warehouse)}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Khôi phục
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => navigate(`/warehouse/edit/${warehouse.id_warehouse}`)}
                    className="flex items-center gap-1.5"
                  >
                    <Edit className="h-3.5 w-3.5" /> Sửa
                  </Button>
                  {!isPending && (
                    <Button
                      variant="outline" size="sm"
                      className="text-[var(--color-error)] hover:bg-red-50"
                      onClick={() => onHide(warehouse)}
                      title="Ẩn kho — không hiển thị cho người thuê"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-[var(--color-border)] px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Package className="h-3 w-3" style={{ color: 'var(--color-primary)' }} />
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Tổng sức chứa</p>
              </div>
              <p className="font-semibold text-sm">{warehouse.stats?.totalCapacity?.toLocaleString() || 0} m³</p>
            </div>
            <div className="border border-[var(--color-border)] px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Package className="h-3 w-3" style={{ color: 'var(--color-success)' }} />
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Còn trống</p>
              </div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-success)' }}>
                {warehouse.stats?.availableCapacity?.toLocaleString() || 0} m³
              </p>
            </div>
            <div className="border border-[var(--color-border)] px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Thermometer className="h-3 w-3" style={{ color: 'var(--color-info)' }} />
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Nhiệt độ</p>
              </div>
              <p className="font-semibold text-sm">
                {warehouse.stats?.temperatureMin}°C ~ {warehouse.stats?.temperatureMax}°C
              </p>
            </div>
            <div className="border border-[var(--color-border)] px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Tag className="h-3 w-3" style={{ color: 'var(--color-primary)' }} />
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Giá thuê</p>
              </div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>
                {fmtVnd(priceRange.min)}
                {priceRange.max && (
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, fontSize: '0.75rem' }}>
                    {' '}– {fmtVnd(priceRange.max)}
                  </span>
                )}
                <span className="font-normal text-[10px]" style={{ color: 'var(--color-text-muted)' }}>/m³</span>
              </p>
            </div>
          </div>

          {/* Sections info */}
          {hasSections && (
            <div
              className="mt-3 flex items-center gap-2 text-xs px-3 py-1.5"
              style={{ background: 'rgba(37,99,235,0.06)', color: 'var(--color-primary)' }}
            >
              <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
              <span>
                <strong>{availSects}</strong>/{warehouse.sections!.length} phân khu còn trống
              </span>
            </div>
          )}

          {/* Subscription tier info strip */}
          {(() => {
            const tier = warehouse.subscriptionTier ?? 'free';
            const cfg = SUBSCRIPTION_TIERS[tier];
            return (
              <div
                className="mt-3 flex items-center justify-between gap-3 px-3 py-2"
                style={{
                  background: cfg.bgColor,
                  borderLeft: `3px solid ${cfg.color}`,
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span style={{ fontSize: '0.9rem' }}>{cfg.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: cfg.color }}>
                    Gói {cfg.label}
                  </span>
                  <span className="text-[10px] opacity-70" style={{ color: cfg.color }}>·</span>
                  <span className="flex items-center gap-0.5 text-[10px]" style={{ color: cfg.color }}>
                    <TrendingUp className="h-3 w-3" />
                    {cfg.boostFactor === 1
                      ? 'Xếp hạng cơ bản'
                      : `+${Math.round((cfg.boostFactor - 1) * 100)}% ưu tiên tìm kiếm`}
                  </span>
                </div>
                {tier !== 'platinum' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 shrink-0 text-xs"
                    style={{ borderColor: cfg.color, color: cfg.color }}
                    onClick={() => navigate('/warehouse/subscription')}
                  >
                    <Crown className="h-3 w-3" />
                    {tier === 'free' ? 'Nâng cấp' : 'Đổi gói'}
                  </Button>
                )}
              </div>
            );
          })()}

          {/* ── CertificationType status + re-upload for pending warehouses ── */}
          {isPending && (warehouse.certifications ?? []).length > 0 && (() => {
            const total = warehouse.certifications!.length;
            const withDoc = warehouse.certifications!.filter(c => c.documentUrl).length;
            const missing = total - withDoc;
            return (
              <div
                className="mt-3 flex items-center justify-between gap-3 px-3 py-2 border"
                style={{
                  borderColor: missing > 0 ? 'var(--color-warning)' : 'var(--color-success, #22c55e)',
                  background: missing > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: missing > 0 ? 'var(--color-warning)' : 'var(--color-success, #22c55e)' }} />
                  <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    {missing > 0
                      ? `${missing}/${total} chứng nhận thiếu file PDF`
                      : `${total} chứng nhận đã có file PDF`}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 shrink-0 text-xs"
                  onClick={() => onReuploadCerts(warehouse)}
                >
                  <Upload className="h-3 w-3" />
                  {missing > 0 ? 'Tải lên PDF' : 'Quản lý'}
                </Button>
              </div>
            );
          })()}

          {/* No certifications yet — allow adding for pending */}
          {isPending && (warehouse.certifications ?? []).length === 0 && (
            <div
              className="mt-3 flex items-center justify-between gap-3 px-3 py-2 border border-dashed"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Chưa có chứng nhận — thêm để đẩy nhanh phê duyệt
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 shrink-0 text-xs"
                onClick={() => onReuploadCerts(warehouse)}
              >
                <Plus className="h-3 w-3" /> Thêm
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
