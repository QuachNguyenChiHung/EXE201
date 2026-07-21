import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getUser } from '../../utils/auth';

export default function PaymentFail() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    toast.error('Thanh toán thất bại');
  }, []);

  const getRetryUrl = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'OWNER':
        return '/warehouse/subscription';
      case 'RENTER':
        return '/renter/ai-subscription';
      case 'EMPLOYEE':
        return '/employee';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="bento-container py-12">
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-none rounded-none">
            <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center">
              <XCircle
                className="mb-6"
                size={80}
                style={{ color: 'var(--color-error)' }}
              />

              <h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">
                Thanh toán thất bại
              </h1>

              <p className="text-[var(--color-text-secondary)] text-sm mb-8 leading-relaxed">
                Giao dịch chưa được hoàn tất.
                <br />
                Vui lòng thử lại hoặc liên hệ hỗ trợ nếu cần.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1 rounded-none border border-[var(--color-border)]"
                >
                  Về trang chủ
                </Button>
                <Button
                  onClick={() => navigate(getRetryUrl())}
                  className="flex-1 rounded-none bg-[var(--color-accent)] text-white hover:opacity-90"
                >
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
