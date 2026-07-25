import { useEffect, useState } from 'react';
import { Loader2, CreditCard } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { TransactionResponseDTO } from '../../types/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { relativeTimeUtc } from '../../utils/datetime';

const TYPE_LABELS: Record<string, string> = {
  RENTAL_FEE: 'Phí thuê kho',
  SPONSOR_SUBSCRIPTION: 'Gói tài trợ',
  AI_SUBSCRIPTION: 'Gói AI',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Đang chờ', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  COMPLETED: { label: 'Hoàn thành', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  FAILED: { label: 'Thất bại', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

export default function PaymentHistory() {
  const [transactions, setTransactions] = useState<TransactionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService.getTransactionHistory()
      .then(setTransactions)
      .catch(() => toast.error('Không thể tải lịch sử giao dịch'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="bento-container py-8">
        <div className="mb-6 flex items-center gap-3">
          <CreditCard className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Lịch sử giao dịch</h1>
        </div>

        <Card className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-none rounded-none">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CreditCard className="h-12 w-12 mb-4" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-[var(--color-text-secondary)]">Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left">
                      <th className="px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Thời gian</th>
                      <th className="px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Loại giao dịch</th>
                      <th className="px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Số tiền</th>
                      <th className="px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Trạng thái</th>
                      <th className="px-4 py-3 font-semibold text-[var(--color-text-secondary)]">Mô tả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const statusCfg = STATUS_CONFIG[tx.status] ?? { label: tx.status, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
                      return (
                        <tr key={tx.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]">
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                            {relativeTimeUtc(tx.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                            {TYPE_LABELS[tx.type] ?? tx.type}
                          </td>
                          <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-primary)' }}>
                            {fmtCurrency(tx.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              style={{ color: statusCfg.color, background: statusCfg.bg }}
                            >
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                            {tx.description ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
