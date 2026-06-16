export interface LatLng {
  latitude: number;
  longitude: number;
}

export const geometryService = {
  /**
   * Thuật toán Ray-Casting kiểm tra một điểm LatLng có nằm trong Polygon hay không.
   * Chuyển đổi từ logic của geometry_utils.dart
   */
  isPointInPolygon: (point: LatLng, polygon: LatLng[]): boolean => {
    if (!polygon || polygon.length === 0) return false;

    let i: number;
    let j: number = polygon.length - 1;
    let oddNodes = false;
    const x = point.longitude;
    const y = point.latitude;

    for (i = 0; i < polygon.length; i++) {
      if (
        ((polygon[i].latitude < y && polygon[j].latitude >= y) ||
          (polygon[j].latitude < y && polygon[i].latitude >= y)) &&
        (polygon[i].longitude +
          ((y - polygon[i].latitude) / (polygon[j].latitude - polygon[i].latitude)) *
            (polygon[j].longitude - polygon[i].longitude) <
          x)
      ) {
        oddNodes = !oddNodes;
      }
      j = i;
    }

    return oddNodes;
  },

  /**
   * Kiểm tra xem điểm có nằm trong Bounding Box (BBox) hay không
   * bbox format: [minLon, minLat, maxLon, maxLat]
   */
  isPointInBBox: (point: LatLng, bbox: number[]): boolean => {
    if (!bbox || bbox.length !== 4) return false;
    const [minLon, minLat, maxLon, maxLat] = bbox;
    return (
      point.longitude >= minLon &&
      point.longitude <= maxLon &&
      point.latitude >= minLat &&
      point.latitude <= maxLat
    );
  },

  /**
   * Tính khoảng cách giữa 2 điểm bằng công thức Haversine
   * Trả về khoảng cách theo đơn vị mét
   */
  calculateDistance: (point1: LatLng, point2: LatLng): number => {
    const R = 6371e3; // Bán kính Trái Đất (mét)
    const phi1 = (point1.latitude * Math.PI) / 180;
    const phi2 = (point2.latitude * Math.PI) / 180;
    const deltaPhi = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const deltaLambda = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
  },

  /**
   * Tìm vị trí chung (general location) dựa trên tọa độ truyền vào.
   * Áp dụng dữ liệu vùng (regions) có chứa bbox, centroid_lat, centroid_lon.
   */
  findGeneralLocation: (point: LatLng, regions: any[]): any | null => {
    if (!regions || regions.length === 0) return null;

    // Bước 1: Lọc các vùng mà điểm nằm trong Bounding Box
    const candidates = regions.filter((region) => {
      if (region.bbox && region.bbox.length === 4) {
        return geometryService.isPointInBBox(point, region.bbox);
      }
      return false;
    });

    if (candidates.length === 0) {
      // Nếu không nằm trong bbox nào, tìm vùng có centroid gần nhất
      let nearestRegion = null;
      let minDistance = Infinity;
      
      for (const region of regions) {
        if (region.centroid_lat && region.centroid_lon) {
          const dist = geometryService.calculateDistance(point, {
            latitude: region.centroid_lat,
            longitude: region.centroid_lon,
          });
          if (dist < minDistance) {
            minDistance = dist;
            nearestRegion = region;
          }
        }
      }
      return nearestRegion;
    }

    // Bước 2: Nếu dữ liệu có chi tiết Polygon, dùng thuật toán Ray-Casting để xác định chính xác
    for (const candidate of candidates) {
      if (candidate.polygon && Array.isArray(candidate.polygon)) {
        if (geometryService.isPointInPolygon(point, candidate.polygon)) {
          return candidate;
        }
      }
    }

    // Bước 3: Nếu không có polygon data (như trong sapnhap-bando-vn.json hiện tại),
    // tìm centroid gần nhất trong các candidates đã lọc qua BBox
    let nearestCandidate = candidates[0];
    let minDistance = Infinity;
    for (const candidate of candidates) {
      if (candidate.centroid_lat && candidate.centroid_lon) {
        const dist = geometryService.calculateDistance(point, {
          latitude: candidate.centroid_lat,
          longitude: candidate.centroid_lon,
        });
        if (dist < minDistance) {
          minDistance = dist;
          nearestCandidate = candidate;
        }
      }
    }

    return nearestCandidate;
  }
};
