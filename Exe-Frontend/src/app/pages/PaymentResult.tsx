import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { getUser } from '../../utils/auth';

export default function PaymentResult() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return; // Wait until user is loaded

    const isSuccess = location.pathname.includes('success');

    if (user.role === 'OWNER') {
      navigate(`/warehouse/subscription?payment=${isSuccess ? 'success' : 'fail'}`, { replace: true });
    } else if (user.role === 'RENTER') {
      navigate(`/renter?payment=${isSuccess ? 'success' : 'fail'}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [user, location, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Đang xử lý kết quả thanh toán...</p>
      </div>
    </div>
  );
}
