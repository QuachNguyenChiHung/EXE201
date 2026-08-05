import { MapPin, Package, Thermometer, Zap, Shield, CheckCircle, LayoutGrid, Trash2, ExternalLink } from 'lucide-react';
import { CompositeWarehouse } from '../../../types';
import { CertificationList, PriceDisplay, SectionsDisplay } from './WarehouseDisplays';
import { Link } from 'react-router';
import { formatShortAddress } from '../../utils/addressFormat';

const secLabel = (s: string) =>
    ({ basic: 'Cơ bản', medium: 'Trung bình', high: 'Cao' }[s] ?? s);

const availLabel = (a: string) =>
    ({ available: 'Còn trống', partially: 'Gần đầy', full: 'Đầy' }[a] ?? a);

interface CompareRow {
    label: string;
    icon: React.ReactNode;
    render: (w: CompositeWarehouse) => React.ReactNode;
}

const ROWS: CompareRow[] = [
    {
        label: 'Vị trí',
        icon: <MapPin className="h-3.5 w-3.5" />,
        render: (w) => (
            <span>{formatShortAddress({
                province: w.location_province,
                commune: w.location_commune,
                locationAddressText: w.location_address_text,
            })}</span>
        ),
    },
    {
        label: 'Tổng công suất',
        icon: <Package className="h-3.5 w-3.5" />,
        render: (w) => {
            const total = w.sections?.reduce((sum, s) => sum + (s.total_capacity || 0), 0) || 0;
            return total > 0 ? `${total.toLocaleString()} m³` : 'N/A';
        },
    },
    {
        label: 'Còn trống',
        icon: <Package className="h-3.5 w-3.5" />,
        render: (w) => {
            const avail = w.sections?.reduce((sum, s) => sum + (s.available_capacity || 0), 0) || 0;
            return avail > 0 ? `${avail.toLocaleString()} m³` : '0 m³';
        },
    },
    {
        label: 'Nhiệt độ tối thiểu',
        icon: <Thermometer className="h-3.5 w-3.5" />,
        render: (w) => {
            if (!w.sections || w.sections.length === 0) return 'N/A';
            const min = Math.min(...w.sections.map(s => s.temp_min ?? Infinity));
            return min === Infinity ? 'N/A' : `${min}°C`;
        },
    },
    {
        label: 'Nhiệt độ tối đa',
        icon: <Thermometer className="h-3.5 w-3.5" />,
        render: (w) => {
            if (!w.sections || w.sections.length === 0) return 'N/A';
            const max = Math.max(...w.sections.map(s => s.temp_max ?? -Infinity));
            return max === -Infinity ? 'N/A' : `${max}°C`;
        },
    },
    {
        label: 'Độ ẩm',
        icon: <Zap className="h-3.5 w-3.5" />,
        render: (w) => {
            if (!w.sections || w.sections.length === 0) return 'N/A';
            const humidities = w.sections.map(s => s.humidity).filter((h): h is number => h !== undefined && h !== null);
            if (humidities.length === 0) return 'N/A';
            const minH = Math.min(...humidities);
            const maxH = Math.max(...humidities);
            return minH === maxH ? `${minH}%` : `${minH}% ~ ${maxH}%`;
        },
    },
    {
        label: 'Giá thuê',
        icon: <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>₫</span>,
        render: (w) => <PriceDisplay warehouse={w} />,
    },
    {
        label: 'Phân khu',
        icon: <LayoutGrid className="h-3.5 w-3.5" />,
        render: (w) => <SectionsDisplay warehouse={w} />,
    },

    {
        label: 'Chứng chỉ',
        icon: <CheckCircle className="h-3.5 w-3.5" />,
        render: (w) => <CertificationList warehouse={w} />,
    },
    {
        label: 'Tình trạng',
        icon: <Package className="h-3.5 w-3.5" />,
        render: (w) => {
            const total = w.sections?.reduce((sum, s) => sum + (s.total_capacity || 0), 0) || 0;
            const avail = w.sections?.reduce((sum, s) => sum + (s.available_capacity || 0), 0) || 0;
            
            let availability = 'available';
            if (total > 0 && avail === 0) availability = 'full';
            else if (total > 0 && avail < total * 0.2) availability = 'partially';

            const color =
                availability === 'available'
                    ? 'var(--color-success)'
                    : availability === 'partially'
                        ? 'var(--color-warning)'
                        : 'var(--color-error)';
            return <span style={{ color, fontWeight: 500 }}>{availLabel(availability)}</span>;
        },
    },
];

interface CompareTableProps {
    warehouses: CompositeWarehouse[];
    onRemove: (id: number) => void;
}

export function CompareTable({ warehouses, onRemove }: CompareTableProps) {
    if (warehouses.length < 2) return null;

    return (
        <div className="flex-1 overflow-x-auto" style={{ minWidth: 0 }}>
            <table className="w-full border-collapse text-sm table-fixed">
                <colgroup>
                    <col style={{ width: '20%' }} />
                    {warehouses.map((w) => (
                        <col key={w.id_warehouse} style={{ width: `${80 / warehouses.length}%` }} />
                    ))}
                </colgroup>
                <thead>
                    <tr>
                        <th
                            className="border-b border-r border-[var(--color-border)] px-4 py-3 text-left"
                            style={{ background: 'var(--color-surface)' }}
                        />
                        {warehouses.map((w) => {
                            return (
                                <th
                                    key={w.id_warehouse}
                                    className="border-b border-r border-[var(--color-border)] px-4 py-3 min-w-[200px]"
                                    style={{
                                        background: 'var(--color-surface)',
                                        verticalAlign: 'top',
                                    }}
                                >
                                    <div className="flex flex-col gap-2 mt-2">
                                        <span className="font-bold text-base truncate block text-left" title={w.name}>
                                            {w.name}
                                        </span>
                                        <div className="flex gap-2">
                                            <Link
                                                to={`/warehouse/${w.id_warehouse}`}
                                                className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 border border-[var(--color-border)] bg-white hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                                            >
                                                Chi tiết <ExternalLink className="h-3 w-3" />
                                            </Link>
                                            <button
                                                onClick={() => onRemove(w.id_warehouse)}
                                                className="w-8 flex items-center justify-center border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:border-[var(--color-error)] transition-colors"
                                                title="Bỏ khỏi so sánh"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {ROWS.map((row, idx) => (
                        <tr key={idx}>
                            <td
                                className="border-b border-r border-[var(--color-border)] px-4 py-3 text-[var(--color-text-secondary)]"
                                style={{ background: 'var(--color-bg-secondary)' }}
                            >
                                <div className="flex items-center gap-2 font-semibold">
                                    {row.icon}
                                    {row.label}
                                </div>
                            </td>
                            {warehouses.map((w) => (
                                <td
                                    key={w.id_warehouse}
                                    className="border-b border-r border-[var(--color-border)] px-4 py-3 text-center"
                                >
                                    {row.render(w)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
