import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getUser } from '../../utils/auth';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    toast.success('Thanh toán thành công');
  }, []);

  const getPackageUrl = () => {
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
              <CheckCircle2
                className="mb-6"
                size={80}
                style={{ color: 'var(--color-success)' }}
              />

              <h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">
                Thanh toán thành công!
              </h1>

              <p className="text-[var(--color-text-secondary)] text-sm mb-8 leading-relaxed">
                Giao dịch của bạn đã được xử lý thành công.
                <br />
                Cảm ơn bạn đã sử dụng dịch vụ.
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
                  onClick={() => navigate(getPackageUrl())}
                  className="flex-1 rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                >
                  Xem gói đã mua
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
