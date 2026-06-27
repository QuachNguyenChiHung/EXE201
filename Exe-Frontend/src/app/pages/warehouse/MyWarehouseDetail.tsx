import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { ownerService } from "../../../services/ownerService";
import { PRICE_TIER_OPTIONS } from "../../components/owner/WarehouseFormUtils";
import { CompositeWarehouse } from "../../../types";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Loader2, Activity, MapPin, LayoutGrid, Building, ShieldCheck, Thermometer, Droplets, Image as ImageIcon, Tag, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { formatShortAddress } from "../../utils/addressFormat";
import { WarehouseMapDisplay } from "../../components/owner/WarehouseMapDisplay";
import { WarehouseReviewsSection } from "../../components/renter/WarehouseReviewsSection";

const FallbackImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
   const [error, setError] = useState(false);
   if (error || !src) {
      return (
         <div className={`flex flex-col items-center justify-center bg-[var(--color-bg-secondary)] ${className || "h-48 w-full object-cover rounded-md"}`}>
            <span className="text-xs uppercase tracking-wide mt-1" style={{ color: 'var(--color-text-muted)' }}>Không có ảnh</span>
         </div>
      );
   }
   return (
      <img
         src={src}
         alt={alt}
         onError={() => setError(true)}
         className={className || "h-48 w-full object-cover rounded-md shadow-sm"}
      />
   );
};

export default function MyWarehouseDetail() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();

   const [loading, setLoading] = useState(true);
   const [warehouse, setWarehouse] = useState<CompositeWarehouse | null>(null);

   // Stats & Ratings
   const [viewStats, setViewStats] = useState<any[] | null>(null);
   const [viewStatsDays, setViewStatsDays] = useState<number | 'ALL'>(7);
   const [loadingStats, setLoadingStats] = useState(false);

   // Requests & Contracts
   const [requests, setRequests] = useState<any[]>([]);
   const [contracts, setContracts] = useState<any[]>([]);

   // Location Map
   const [location, setLocation] = useState<{ locationLat: number, locationLong: number } | null>(null);

   useEffect(() => {
      const fetchAllData = async () => {
         if (!id) return;
         try {
            setLoading(true);
            const warehouseId = parseInt(id);

            // Fetch details
            const detailData = await ownerService.getMyWarehouseDetail(warehouseId);
            setWarehouse(detailData);

            // Fetch requests for this warehouse
            ownerService.getWarehouseRentRequests(warehouseId)
               .then(setRequests)
               .catch(e => console.error("Failed to load requests", e));

            // Fetch contracts for this warehouse
            ownerService.getWarehouseContracts(warehouseId)
               .then(setContracts)
               .catch(e => console.error("Failed to load contracts", e));

            // Fetch location
            ownerService.getWarehouseLocation(warehouseId)
               .then(setLocation)
               .catch(e => console.error("Failed to load location", e));

         } catch (err: any) {
            console.error("Fetch warehouse failed", err);
            toast.error("Không tìm thấy thông tin kho lạnh!");
            navigate("/warehouse/my-warehouses");
         } finally {
            setLoading(false);
         }
      };
      fetchAllData();
   }, [id, navigate]);

   useEffect(() => {
      if (warehouse && warehouse.id_warehouse) {
         setLoadingStats(true);
         let daysToFetch = 7;
         if (viewStatsDays === 'ALL') {
            daysToFetch = 365; // Just a large number for all time
         } else {
            daysToFetch = viewStatsDays;
         }

         ownerService.getWarehouseViewStats(warehouse.id_warehouse, daysToFetch)
            .then(res => {
               let formatted: any[] = [];
               if (res.dates && res.viewTrend) {
                  formatted = res.dates.map((d: string, i: number) => ({ name: d, views: res.viewTrend[i] || 0 }));
               } else if (res.dates && res.views) {
                  formatted = res.dates.map((d: string, i: number) => ({ name: d, views: res.views[i] || 0 }));
               } else if (res.dates && res.data) {
                  formatted = res.dates.map((d: string, i: number) => ({ name: d, views: res.data[i] || 0 }));
               } else if (Array.isArray(res)) {
                  formatted = res;
               }
               if (formatted.length > 0 && typeof formatted[0] === 'object' && 'name' in formatted[0]) {
                  formatted.sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
               }
               setViewStats(formatted);
            })
            .catch(err => console.error("Failed to fetch view stats", err))
            .finally(() => setLoadingStats(false));
      }
   }, [warehouse, viewStatsDays]);

   if (loading) {
      return (
         <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
            <div className="text-center">
               <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[var(--color-primary)]" />
               <p className="text-[var(--color-text-secondary)]">Đang tải chi tiết kho lạnh...</p>
            </div>
         </div>
      );
   }

   if (!warehouse) return null;

   const isHidden = warehouse.status === 'inactive';
   const statusLabel = isHidden ? 'Đã ẩn' :
      warehouse.status === 'pending' ? 'Chờ duyệt' :
         warehouse.availability === 'available' ? 'Còn trống' :
            warehouse.availability === 'partially' ? 'Gần đầy' : 'Đầy';
   const statusColor = isHidden ? 'bg-gray-500' :
      warehouse.status === 'pending' ? 'bg-[var(--color-warning)]' :
         warehouse.availability === 'available' ? 'bg-[var(--color-success)]' :
            warehouse.availability === 'partially' ? 'bg-[var(--color-warning)]' :
               'bg-[var(--color-error)]';

   const thumbUrl = warehouse.images && warehouse.images.length > 0 ? (warehouse.images[0] as any).image_url || warehouse.images[0] : '';

   return (
      <div className="min-h-screen bg-[var(--color-bg)] pb-20">
         <Navbar />

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* ── Header ── */}
            <div className="mb-8">
               <button
                  type="button"
                  onClick={() => navigate("/warehouse/my-warehouses")}
                  className="flex items-center gap-2 text-sm mb-4 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
               >
                  <ArrowLeft className="h-4 w-4" /> Về danh sách kho
               </button>
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-[var(--color-text)]">{warehouse.name}</h1>
                        <Badge className={`${statusColor} text-white`}>{statusLabel}</Badge>
                     </div>
                     <p className="text-[var(--color-text-secondary)] flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {((warehouse as any).locationAddressText) || warehouse.location_address_text || warehouse.address || "Chưa cập nhật địa chỉ"}, {formatShortAddress({
                            province: ((warehouse as any).locationProvince) || warehouse.location_province,
                            commune: ((warehouse as any).locationCommune) || warehouse.location_commune,
                            locationAddressText: ((warehouse as any).locationAddressText) || warehouse.location_address_text,
                        })}
                     </p>
                  </div>
                  <div className="flex items-center gap-3">
                     <Button onClick={() => navigate(`/warehouse/edit/${warehouse.id_warehouse}`)} className="bg-[var(--color-primary)] text-white">
                        Chỉnh sửa kho
                     </Button>
                  </div>
               </div>
            </div>

            {/* ── Main Content ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

               <div className="lg:col-span-2 space-y-6">

                  {/* Overview & Image */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-md">
                     <div className="md:col-span-1">
                        <FallbackImage src={thumbUrl as string} alt={warehouse.name} className="h-full w-full object-cover rounded-md shadow-sm aspect-video md:aspect-square" />
                     </div>
                     <div className="md:col-span-2 space-y-4">
                        <div>
                           <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Building className="h-5 w-5 text-[var(--color-text-muted)]" /> Tổng quan</h3>
                           <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                              {warehouse.description || "Không có mô tả cho kho này."}
                           </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
                           <div>
                              <p className="text-xs text-[var(--color-text-muted)] mb-1">Tổng sức chứa</p>
                              <p className="text-lg font-bold">{warehouse.stats?.totalCapacity?.toLocaleString()} m³</p>
                           </div>
                           <div>
                              <p className="text-xs text-[var(--color-text-muted)] mb-1">Còn trống</p>
                              <p className="text-lg font-bold text-[var(--color-success)]">{warehouse.stats?.availableCapacity?.toLocaleString()} m³</p>
                           </div>
                           <div>
                              <p className="text-xs text-[var(--color-text-muted)] mb-1">Nhiệt độ</p>
                              <p className="text-sm font-semibold">{warehouse.stats?.temperatureMin}°C đến {warehouse.stats?.temperatureMax}°C</p>
                           </div>
                           <div>
                              <p className="text-xs text-[var(--color-text-muted)] mb-1">Số phân khu</p>
                              <p className="text-sm font-semibold">{warehouse.sections?.length || 0} khu</p>
                           </div>
                           <div>
                              <p className="text-xs text-[var(--color-text-muted)] mb-1">Yêu cầu chờ duyệt</p>
                              <p className="text-sm font-semibold text-[var(--color-warning)]">{warehouse.pendingRequestCount || 0} yêu cầu</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Images Section */}
                  {warehouse.images && warehouse.images.length > 0 && (
                     <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-md">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-[var(--color-text-muted)]" /> Hình ảnh kho ({warehouse.images.length})</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                           {warehouse.images.map((img: any, idx: number) => (
                              <FallbackImage key={idx} src={img.image_url || img.imageUrl || img} alt={`Ảnh ${idx + 1}`} className="h-32 w-48 object-cover rounded-md flex-shrink-0" />
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Map Display */}
                  {location && location.locationLat && location.locationLong && (
                     <WarehouseMapDisplay
                        lat={location.locationLat}
                        long={location.locationLong}
                        addressText={(warehouse as any).locationAddressText || warehouse.location_address_text || warehouse.address}
                     />
                  )}

                  {/* Sections List */}
                  {warehouse.sections && warehouse.sections.length > 0 && (
                     <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-md">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-[var(--color-primary)]" /> Phân khu & Bảng giá ({warehouse.sections.length})</h3>
                        <div className="space-y-6">
                           {warehouse.sections.map((sec: any, idx: number) => (
                              <div key={idx} className="border-2 border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
                                 {/* Header */}
                                 <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)]">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-[var(--color-primary)] text-white text-sm">
                                          {sec.sector || idx + 1}
                                       </div>
                                       <div>
                                          <h3 className="font-semibold text-[var(--color-text)]">
                                             {sec.name || `Phân khu ${sec.sector || idx + 1}`}
                                          </h3>
                                          <p className="text-xs text-[var(--color-text-secondary)]">
                                             {sec.totalCapacity} m³ • Nhiệt độ: {sec.tempMin}°C đến {sec.tempMax}°C
                                          </p>
                                       </div>
                                    </div>
                                    <Badge variant="outline" className={sec.availability === 'full' || sec.availableCapacity === 0 ? 'text-red-500 border-red-200 bg-red-50' : 'text-green-600 border-green-200 bg-green-50'}>
                                       {sec.availableCapacity > 0 ? `Trống ${sec.availableCapacity} m³` : 'Đã đầy'}
                                    </Badge>
                                 </div>
                                 {/* Body */}
                                 <div className="p-4 border-t border-[var(--color-border)] bg-white/50 space-y-5">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                       <div>
                                          <span className="text-[var(--color-text-muted)] block mb-1">Độ ẩm</span>
                                          <p className="font-medium">{sec.humidity || 0}%</p>
                                       </div>
                                       <div className="col-span-1 sm:col-span-3">
                                          <span className="text-[var(--color-text-muted)] block mb-1">Chứng nhận</span>
                                          <p className="font-medium flex items-center gap-1">{sec.hasCertification ? <ShieldCheck className="h-4 w-4 text-green-500" /> : 'Không yêu cầu'}{sec.hasCertification && 'Yêu cầu có chứng nhận'}</p>
                                       </div>
                                    </div>

                                    {/* Price Tiers */}
                                    <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 border border-[var(--color-border)]">
                                       <div className="flex items-center mb-3">
                                          <span className="flex items-center gap-2 font-semibold text-[var(--color-text)]">
                                             <Tag className="h-4 w-4" /> Bảng giá thuê
                                          </span>
                                       </div>
                                       {sec.priceTiers && sec.priceTiers.length > 0 ? (
                                          <div className="space-y-3">
                                             {sec.priceTiers.map((pt: any, pIdx: number) => (
                                                <div key={pIdx} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                                                   <div className="flex-1 font-medium text-[var(--color-text)]">
                                                      {pt.label}
                                                   </div>
                                                   <div className="font-bold text-[var(--color-primary)] text-base">
                                                      {pt.value.toLocaleString()} ₫
                                                   </div>
                                                   <div className="px-3 py-1 bg-gray-50 border rounded-md text-xs text-gray-600 font-medium">
                                                      / {PRICE_TIER_OPTIONS.find(o => o.unit === pt.unit)?.label ?? pt.label ?? pt.unit} / {pt.areaUnit || 'm³'}
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       ) : (
                                          <div className="text-center py-4 text-sm text-gray-500 italic">
                                             Chưa có thông tin giá.
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Certificates */}
                  {warehouse.certifications && warehouse.certifications.length > 0 && (
                     <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-md">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[var(--color-success)]" /> Chứng nhận & Tiêu chuẩn ({warehouse.certifications.length})</h3>
                        <div className="space-y-3">
                           {warehouse.certifications.map((cert: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center p-3 border border-[var(--color-border)] rounded-md">
                                 <div className="flex items-center gap-3">
                                    <ShieldCheck className={`h-5 w-5 ${cert.status === 'VERIFIED' ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`} />
                                    <div>
                                       <p className="font-medium">{cert.link ? decodeURIComponent(cert.link.split('/').pop() || '') : cert.label}</p>
                                       {cert.documentUrl && (
                                          <a href={cert.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-primary)] hover:underline">
                                             Xem tài liệu đính kèm
                                          </a>
                                       )}
                                    </div>
                                 </div>
                                 <Badge variant="outline" className={cert.status === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-200' : cert.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                                    {cert.status === 'VERIFIED' ? 'Đã xác thực' : cert.status === 'REJECTED' ? 'Bị từ chối' : 'Chờ duyệt'}
                                 </Badge>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Chart Section */}
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-md">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                           <Activity className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                           Lượt truy cập kho
                        </h3>
                        <select
                           value={viewStatsDays}
                           onChange={(e) => {
                              const val = e.target.value;
                              setViewStatsDays(val === 'ALL' ? 'ALL' : Number(val));
                           }}
                           className="text-sm border border-[var(--color-border)] rounded px-3 py-1.5 bg-[var(--color-surface)] outline-none focus:border-[var(--color-primary)]"
                        >
                           <option value={7}>7 ngày qua</option>
                           <option value={30}>30 ngày qua</option>
                           <option value="ALL">Tất cả</option>
                        </select>
                     </div>
                     {loadingStats ? (
                        <div className="flex items-center justify-center py-10 text-[var(--color-text-muted)]">
                           <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                     ) : (!viewStats || viewStats.length === 0) ? (
                        <p className="text-sm text-[var(--color-text-muted)] text-center py-10">Chưa có dữ liệu thống kê.</p>
                     ) : (
                        <div className="h-[300px] w-full mt-4">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={viewStats} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                 <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickMargin={10} minTickGap={30} />
                                 <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                                 <RechartsTooltip
                                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '6px', fontSize: '13px' }}
                                    itemStyle={{ color: 'var(--color-text)' }}
                                 />
                                 <Line type="monotone" dataKey="views" name="Lượt xem" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     )}
                  </div>



                  {/* Ratings */}
                  <WarehouseReviewsSection
                     warehouseId={warehouse.id_warehouse}
                     warehouseName={warehouse.name}
                     canReview={false}
                  />
               </div>

               <div className="space-y-6">
                  {/* Requests */}
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-md">
                     <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <MessageSquare className="h-5 w-5 text-[var(--color-primary)]" />
                        Yêu cầu thuê ({requests.length})
                     </h3>
                     {requests.length > 0 ? (
                        <div className="space-y-4">
                           {requests.slice(0, 5).map((req, idx) => {
                              const totalArea = req.details?.reduce((sum: number, d: any) => sum + (d.rentedArea || 0), 0) || 0;
                              const sectorList = req.details?.map((d: any) => `Khu ${d.sector}`).join(', ') || '';

                              return (
                                 <div
                                    key={idx}
                                    onClick={() => navigate(`/shared/requests/${req.id}`)}
                                    className="p-4 border border-[var(--color-border)] rounded-md flex flex-col gap-3 bg-[var(--color-bg-secondary)] cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                                 >
                                    <div className="flex justify-between items-start">
                                       <div>
                                          <p className="text-sm font-semibold text-[var(--color-text)] line-clamp-1" title={req.cargoDescription}>
                                             {req.cargoDescription || `Yêu cầu thuê #${req.id}`}
                                          </p>
                                          <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                             Thời gian thuê: <span className="font-medium text-[var(--color-text-secondary)]">{req.duration} {req.durationUnit}</span>
                                          </p>
                                       </div>
                                       <Badge variant="outline" className={
                                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                             req.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-200' :
                                                req.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' : ''
                                       }>
                                          {req.status === 'PENDING' ? 'Chờ duyệt' : req.status === 'APPROVED' ? 'Đã duyệt' : req.status === 'REJECTED' ? 'Từ chối' : req.status}
                                       </Badge>
                                    </div>

                                    {req.details && req.details.length > 0 && (
                                       <div className="flex gap-4 text-xs pt-3 border-t border-[var(--color-border)]">
                                          <div>
                                             <span className="text-[var(--color-text-muted)]">Tổng diện tích:</span>
                                             <span className="ml-1 font-medium text-[var(--color-text)]">{totalArea} m³</span>
                                          </div>
                                          <div>
                                             <span className="text-[var(--color-text-muted)]">Vị trí:</span>
                                             <span className="ml-1 font-medium text-[var(--color-text)]">{sectorList}</span>
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              );
                           })}
                           {requests.length > 5 && (
                              <Button variant="link" className="w-full text-sm text-[var(--color-primary)]" onClick={() => navigate('/warehouse/requests')}>
                                 Xem tất cả yêu cầu
                              </Button>
                           )}
                        </div>
                     ) : (
                        <p className="text-sm text-[var(--color-text-muted)]">Chưa có yêu cầu thuê nào.</p>
                     )}
                  </div>

                  {/* Contracts */}
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-md">
                     <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-[var(--color-success)]" />
                        Hợp đồng thuê ({contracts.length})
                     </h3>
                     {contracts.length > 0 ? (
                        <div className="space-y-4">
                           {contracts.slice(0, 5).map((contract, idx) => (
                              <div
                                 key={idx}
                                 onClick={() => {
                                    const reqId = contract.id_rent_request || contract.id_rentRequest || contract.rentRequestId;
                                    if (reqId) {
                                       navigate(`/warehouse/contracts/create/${reqId}`);
                                    } else {
                                       navigate(`/warehouse/contracts`);
                                    }
                                 }}
                                 className="p-4 border border-[var(--color-border)] rounded-md flex flex-col gap-3 bg-[var(--color-bg-secondary)] cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                              >
                                 <div className="flex justify-between items-start">
                                    <div>
                                       <p className="text-sm font-semibold text-[var(--color-text)]">
                                          Hợp đồng #{contract.id}
                                       </p>
                                       <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                          Từ {contract.startAt ? new Date(contract.startAt).toLocaleDateString('vi-VN') : 'N/A'} đến {contract.endAt ? new Date(contract.endAt).toLocaleDateString('vi-VN') : 'N/A'}
                                       </p>
                                    </div>
                                    <Badge variant="outline" className={
                                       contract.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-200' :
                                          contract.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                             'bg-gray-50 text-gray-600 border-gray-200'
                                    }>
                                       {contract.status === 'ACTIVE' ? 'Đang hiệu lực' : contract.status === 'COMPLETED' ? 'Đã hoàn thành' : contract.status}
                                    </Badge>
                                 </div>
                                 <div className="flex gap-4 text-xs pt-3 border-t border-[var(--color-border)]">
                                    <div>
                                       <span className="text-[var(--color-text-muted)]">Tổng tiền:</span>
                                       <span className="ml-1 font-medium text-[var(--color-text)]">{contract.totalPrice?.toLocaleString() || 0} ₫</span>
                                    </div>
                                 </div>
                              </div>
                           ))}
                           {contracts.length > 5 && (
                              <Button variant="link" className="w-full text-sm text-[var(--color-primary)]" onClick={() => navigate('/warehouse/contracts')}>
                                 Xem tất cả hợp đồng
                              </Button>
                           )}
                        </div>
                     ) : (
                        <p className="text-sm text-[var(--color-text-muted)]">Chưa có hợp đồng nào.</p>
                     )}
                  </div>
               </div>

            </div>
         </div>
         <Footer />
      </div>
   );
}
