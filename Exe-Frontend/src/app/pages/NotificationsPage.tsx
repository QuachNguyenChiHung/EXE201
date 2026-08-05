import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { useApp } from '../../context/AppContext';
import { useWebSocketMessage } from '../../hooks/useWebSocket';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { formatRelativeTimeVn } from '../../utils/datetime';
import type { Notification } from '../../types';

export default function NotificationsPage() {
  const { markNotificationsRead } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback((p: number) => {
    setLoading(true);
    notificationService.getNotifications(p, 20)
      .then((res) => {
        setNotifications(res.content);
        setTotalPages(res.totalPages);
      })
      .catch(() => toast.error('Không thể tải danh sách thông báo'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  useWebSocketMessage('NOTIFICATION', useCallback(() => {
    if (page === 0) fetchPage(0);
  }, [page, fetchPage]));

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead();
      fetchPage(page);
    } catch {
      toast.error('Không thể đánh dấu đã đọc');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="bento-container py-8">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center" style={{ background: 'var(--color-primary-100, rgba(59,130,246,0.1))' }}>
              <Bell className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)] leading-tight">Thông báo</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{unreadCount} thông báo chưa đọc</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <Card className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-none rounded-none">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="h-12 w-12 mb-4" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-[var(--color-text-secondary)]">Chưa có thông báo nào</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Thông báo mới sẽ xuất hiện ở đây.</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="group flex items-start gap-3 px-4 py-3.5 border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-bg)]"
                    style={!n.read ? { background: 'rgba(59,130,246,0.05)' } : undefined}
                  >
                    <div
                      className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full"
                      style={{ background: !n.read ? 'var(--color-primary)' : 'var(--color-bg-secondary)' }}
                    >
                      <Bell className="h-4 w-4" style={{ color: !n.read ? '#fff' : 'var(--color-text-muted)' }} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-sm leading-snug ${!n.read ? 'font-medium' : ''}`} style={{ color: 'var(--color-text)' }}>
                        {n.message}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {formatRelativeTimeVn(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <span
                        className="mt-2 h-2 w-2 rounded-full shrink-0"
                        style={{ background: 'var(--color-primary)' }}
                        aria-label="Chưa đọc"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded mt-4">
            <span className="text-sm text-[var(--color-text-secondary)]">
              Trang {page + 1} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
