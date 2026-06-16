import React, { useEffect } from 'react';
import { 
  X, MapPin, Users, Phone, FileText, Home, Map, 
  Maximize2, Activity, Info
} from 'lucide-react';

export interface ProvinceData {
  id: string;
  kind: string;
  ma: string;
  ten: string;
  type: string;
  ten_short: string;
  area_km2: number;
  population: number;
  density: number;
  capital: string;
  address: string;
  phone: string;
  decree: string;
  decree_url: string;
  predecessors: string;
  parent_ma: string | null;
  parent_ten: string | null;
  centroid_lon: number;
  centroid_lat: number;
  bbox: number[];
  geom_type: string;
  n_vertices: number;
  macro_region: string;
  predecessors_list: string[];
  n_predecessors: number;
  embed_text: string;
  keywords: string[];
  parent_ten_xa: string | null;
}

interface ProvinceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProvinceData | null;
}

export function ProvinceModal({ isOpen, onClose, data }: ProvinceModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden transition-all transform opacity-100 scale-100">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-block px-2 py-1 bg-white/20 rounded-md text-xs font-semibold tracking-wide uppercase mb-2 backdrop-blur-md">
                {data.type}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{data.ten}</h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Basic Stats */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Thống kê cơ bản
                </h3>
                <div className="space-y-5">
                  <StatRow 
                    icon={<Maximize2 className="w-5 h-5 text-indigo-500" />}
                    label="Diện tích"
                    value={`${data.area_km2.toLocaleString()} km²`}
                  />
                  <StatRow 
                    icon={<Users className="w-5 h-5 text-blue-500" />}
                    label="Dân số"
                    value={`${data.population.toLocaleString()} người`}
                  />
                  <StatRow 
                    icon={<Activity className="w-5 h-5 text-emerald-500" />}
                    label="Mật độ"
                    value={`${data.density.toLocaleString(undefined, { maximumFractionDigits: 1 })} người/km²`}
                  />
                  <StatRow 
                    icon={<Map className="w-5 h-5 text-amber-500" />}
                    label="Khu vực"
                    value={formatMacroRegion(data.macro_region)}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Admin Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Thông tin hành chính
                </h3>
                <div className="space-y-5">
                  <StatRow 
                    icon={<Home className="w-5 h-5 text-rose-500" />}
                    label="Trung tâm"
                    value={data.capital}
                  />
                  <StatRow 
                    icon={<MapPin className="w-5 h-5 text-purple-500" />}
                    label="Địa chỉ"
                    value={data.address}
                  />
                  <StatRow 
                    icon={<Phone className="w-5 h-5 text-teal-500" />}
                    label="Điện thoại"
                    value={data.phone}
                  />
                  <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                    <FileText className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-0.5">Căn cứ</p>
                      <a 
                        href={data.decree_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {data.decree}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Width Section: Predecessors */}
            {data.predecessors && (
              <div className="col-span-1 md:col-span-2">
                <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                  <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    Lịch sử sáp nhập
                  </h4>
                  <p className="text-sm text-indigo-800 leading-relaxed font-medium">
                    Được sáp nhập từ: <span className="font-bold">{data.predecessors}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="p-2.5 bg-slate-50 group-hover:bg-indigo-50 transition-colors rounded-xl border border-slate-100 shrink-0 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function formatMacroRegion(region: string): string {
  const regions: Record<string, string> = {
    'mekong_delta': 'Đồng bằng sông Cửu Long',
    'red_river_delta': 'Đồng bằng sông Hồng',
    'southeast': 'Đông Nam Bộ',
    'central_coast': 'Duyên hải miền Trung',
    'northern_midlands': 'Trung du và miền núi Bắc Bộ',
    'central_highlands': 'Tây Nguyên'
  };
  return regions[region] || region;
}
