const UTC_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7 Vietnam

export function parseServerDatetime(dateStr: string): Date {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime()) && !dateStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(d.getTime() + UTC_OFFSET_MS);
  }
  return d;
}

export function relativeTimeUtc(iso: string | undefined): string {
  if (!iso) return '—';
  const date = parseServerDatetime(iso);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 2) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export function formatRelativeTimeVn(dateStr: string): string {
  try {
    const date = parseServerDatetime(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} giờ trước`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}
