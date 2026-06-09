import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router';
import { authService, RegisterRequestDTO } from '../../services/authService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Warehouse, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole, User } from '../../types';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as UserRole) || 'RENTER';

  const [role, setRole] = useState<UserRole>(initialRole);
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', name: '', phone: '',
    company_name: '', company_tax_code: '', img_link: '', hash_tax_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc (*)');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      const payload: RegisterRequestDTO = {
        email: formData.email,
        password: formData.password,
        fullName: formData.name,
        phone: formData.phone,
        role: role,
        companyName: formData.company_name || undefined,
        companyTaxCode: formData.company_tax_code || undefined,
      };
      
      const responseMessage = await authService.register(payload);
      toast.success(responseMessage || 'Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: any) {
      setAuthError(err?.message ?? 'Đăng ký thất bại');
      toast.error(err?.message ?? 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string | null;
      if (result) set('img_link', result);
    };
    reader.readAsDataURL(file);
  };

  const roles: { value: UserRole; icon: React.ReactNode; label: string; desc: string }[] = [
    {
      value: 'RENTER',
      icon: <Building2 className="h-5 w-5" />,
      label: 'Doanh nghiệp thuê kho',
      desc: 'Tìm và thuê kho lạnh để bảo quản hàng hóa',
    },
    {
      value: 'OWNER',
      icon: <Warehouse className="h-5 w-5" />,
      label: 'Chủ kho lạnh',
      desc: 'Đăng ký kho và cho thuê diện tích',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[var(--color-primary)] flex items-center justify-center">
            <Warehouse className="h-4 w-4 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">logicha</span>
        </Link>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8">

          <div className="mb-6">
            <h1 style={{ fontSize: '1.75rem' }}>Tạo tài khoản</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Chọn loại tài khoản phù hợp với bạn
            </p>
          </div>

          {/* Server error banner */}
          {authError && (
            <div
              className="mb-5 px-4 py-3 text-sm border flex items-start gap-2"
              style={{
                background: 'rgba(239,68,68,0.06)',
                borderColor: 'rgba(239,68,68,0.35)',
                color: 'var(--color-error, #ef4444)',
              }}
            >
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{authError}</span>
            </div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-px bg-[var(--color-border)] mb-7">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className="flex items-start gap-3 p-4 text-left transition-colors relative"
                style={{
                  background: role === r.value
                    ? 'var(--color-primary-50, rgba(37,99,235,0.07))'
                    : 'var(--color-surface)',
                  borderTop: role === r.value
                    ? '2px solid var(--color-primary)'
                    : '2px solid transparent',
                }}
                onMouseEnter={e => {
                  if (role !== r.value)
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-secondary)';
                }}
                onMouseLeave={e => {
                  if (role !== r.value)
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)';
                }}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center shrink-0"
                  style={{
                    background: role === r.value
                      ? 'var(--color-primary)'
                      : 'var(--color-bg-secondary)',
                    color: role === r.value ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    {r.label}
                    {role === r.value && (
                      <CheckCircle2
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: 'var(--color-primary)' }}
                      />
                    )}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {r.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Họ và tên *</Label>
                <Input
                  id="name"
                  placeholder="Nguyễn Văn A"
                  value={formData.name}
                  onChange={e => set('name', e.target.value)}
                  disabled={loading}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={e => set('email', e.target.value)}
                  disabled={loading}
                  className="rounded-none"
                />
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Mật khẩu * (tối thiểu 6 ký tự)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => set('password', e.target.value)}
                  disabled={loading}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  disabled={loading}
                  className="rounded-none"
                  style={{
                    borderColor:
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'var(--color-error, #ef4444)'
                        : undefined,
                  }}
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }}>
                    Mật khẩu không khớp
                  </p>
                )}
              </div>
            </div>

            {/* Phone + User Tax Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+84 901 234 567"
                  value={formData.phone}
                  onChange={e => set('phone', e.target.value)}
                  disabled={loading}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hash_tax_code">Mã số thuế cá nhân</Label>
                <Input
                  id="hash_tax_code"
                  placeholder="Nhập mã số thuế cá nhân"
                  value={formData.hash_tax_code}
                  onChange={e => set('hash_tax_code', e.target.value)}
                  disabled={loading}
                  className="rounded-none"
                />
              </div>
            </div>

            {/* Avatar upload */}
            <div className="space-y-1.5">
              <Label htmlFor="img_link">Ảnh đại diện</Label>
              <input
                id="img_link"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="rounded-none p-2 block w-full text-sm border-2 border-black text-[var(--color-text-secondary)]"
              />
            </div>

            {/* Company Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="company_name">Tên công ty</Label>
                <Input
                  id="company_name"
                  placeholder={role === 'RENTER' ? 'ABC Foods Vietnam' : 'Cold Storage Co.'}
                  value={formData.company_name}
                  onChange={e => set('company_name', e.target.value)}
                  disabled={loading}
                  className="rounded-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company_tax_code">Mã số thuế công ty</Label>
                <Input
                  id="company_tax_code"
                  placeholder="Mã số thuế công ty"
                  value={formData.company_tax_code}
                  onChange={e => set('company_tax_code', e.target.value)}
                  disabled={loading}
                  className="rounded-none"
                />
              </div>
            </div>

            {/* Terms notice */}
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Bằng cách đăng ký, bạn đồng ý với{' '}
              <span className="underline cursor-pointer" style={{ color: 'var(--color-primary)' }}>
                Điều khoản dịch vụ
              </span>{' '}
              và{' '}
              <span className="underline cursor-pointer" style={{ color: 'var(--color-primary)' }}>
                Chính sách bảo mật
              </span>{' '}
              của Logicha.
            </p>

            <Button
              type="submit"
              className="w-full rounded-none bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo tài khoản...
                </span>
              ) : (
                'Tạo tài khoản'
              )}
            </Button>
          </form>

          <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[var(--color-primary)] hover:underline font-medium">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
