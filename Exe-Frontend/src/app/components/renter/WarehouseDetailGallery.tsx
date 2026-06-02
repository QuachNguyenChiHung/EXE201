import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, AlertTriangle, CheckCircle, Heart, Share2, MapPin } from 'lucide-react';
import { CompositeWarehouse } from '../../../types';

interface WarehouseDetailGalleryProps {
    warehouse: CompositeWarehouse;
    isBookmarked: boolean;
    onToggleBookmark: () => void;
}

const FALLBACK_GALLERY = [
    "https://images.unsplash.com/photo-1649260791830-5404cc5af05b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1758789667762-56175fe4601c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
];

export function WarehouseDetailGallery({ warehouse, isBookmarked, onToggleBookmark }: WarehouseDetailGalleryProps) {
    const navigate = useNavigate();
    const [activeImage, setActiveImage] = useState(0);

    const galleryImages = warehouse.images && warehouse.images.length > 0
        ? warehouse.images
        : FALLBACK_GALLERY;

    return (
        <>
            {/* Breadcrumb */}
            <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <button
                            onClick={() => navigate("/renter/search")}
                            className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Kết quả tìm kiếm
                        </button>
                        <span>/</span>
                        <span className="text-[var(--color-text)] truncate max-w-[200px]">
                            {warehouse.name}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                {/* ─── HERO GALLERY ─── */}
                <div
                    className="relative rounded-2xl overflow-hidden mb-6 bg-black"
                    style={{ height: "480px" }}
                >
                    <img
                        src={typeof galleryImages[activeImage] === 'string' ? galleryImages[activeImage] as string : (galleryImages[activeImage] as any).image_url}
                        alt={`${warehouse.name} - ảnh ${activeImage + 1}`}
                        className="w-full h-full object-cover transition-all duration-500"
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    {/* Navigation arrows */}
                    <button
                        onClick={() =>
                            setActiveImage(
                                (i) => (i - 1 + galleryImages.length) % galleryImages.length
                            )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() =>
                            setActiveImage(
                                (i) => (i + 1) % galleryImages.length
                            )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Image counter */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                        <Eye className="h-3.5 w-3.5" />
                        {activeImage + 1} / {galleryImages.length}
                    </div>

                    {/* Bottom info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-end justify-between">
                            <div>
                                <h1
                                    className="mb-1 text-white font-extrabold"
                                    style={{ fontSize: "1.75rem" }}
                                >
                                    {warehouse.name}
                                </h1>
                                <div className="flex items-center gap-3 text-white/90 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        <span>
                                            {warehouse.address}, {warehouse.location_commune}, {warehouse.location_province}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onToggleBookmark}
                                    className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all"
                                    style={{
                                        background: isBookmarked ? "var(--color-primary)" : "rgba(255,255,255,0.2)",
                                        color: "#fff",
                                    }}
                                >
                                    <Heart className="h-5 w-5" style={{ fill: isBookmarked ? "#fff" : "none" }} />
                                </button>
                                <button className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all">
                                    <Share2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
