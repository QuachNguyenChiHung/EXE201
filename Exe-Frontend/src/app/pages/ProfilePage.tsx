import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { userService, UserProfileUpdateDTO } from '../../services/userService';
import type { UserProfileDTO } from '../../services/userService';
import { getUser } from '../../utils/auth';
import { ArrowLeft, Save, Loader2, Camera, User, Phone, Building2, FileText, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [form, setForm] = useState<UserProfileUpdateDTO>({ fullName: '', phone: '', companyName: '', companyTaxCode: '' });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserProfileUpdateDTO, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = user?.role === 'OWNER';

  // Load profile on mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    userService.getMyProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          fullName: p.fullName || '',
          phone: p.phone || '',
          companyName: p.company?.companyName || '',
          companyTaxCode: p.company?.companyTaxCode || '',
        });
      })
      .catch(() => {
        toast.error('Không tể tải thông tin hồ sơ');
        navigate(-1);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const setField = (field: keyof UserProfileUpdateDTO, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof UserProfileUpdateDTO, string>> = {};
    if (!form.fullName.trim()) {
      errors.fullName = 'Họ và tên không được để trống';
    }
    if (!form.phone.trim()) {
      errors.phone = 'Số điện thoại không được để trống';
    } else if (!/^[\d\s+()-]{7,15}$/.test(form.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    if (isOwner && form.companyTaxCode && !/^\d{10,14}$/.test(form.companyTaxCode.replace(/\s/g, ''))) {
      errors.companyTaxCode = 'Mã số thuế phải có 10–14 chữ số';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const updated = await userService.updateMyProfile(form);
      setProfile(updated);
      setForm({
        fullName: updated.fullName || '',
        phone: updated.phone || '',
        companyName: updated.company?.companyName || '',
        companyTaxCode: updated.company?.companyTaxCode || '',
      });
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message || 'Cập nhật thất bại';
      toast.error(typeof msg === 'string' ? msg : 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('Vui lòng chọn file hình ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Kích thước ảnh không được vượt quá 5 MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const updated = await userService.uploadAvatar(file);
      setProfile(updated);
      // Also update the form in case the user hasn't saved yet
      setForm((prev) => ({ ...prev, fullName: updated.fullName || prev.fullName }));
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message;
      toast.error(typeof msg === 'string' ? `Tải ảnh thất bại: ${msg}` : 'Tải ảnh đại diện thất bại. Vui lòng thử lại.');
    } finally {
      setUploadingAvatar(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Hồ sơ cá nhân</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Quản lý thông tin cá nhân và ảnh đại diện của bạn
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Avatar card */}
          <Card className="bento-card p-6">
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--color-primary)]" />
              Ảnh đại diện
            </h2>
            <div className="flex items-center gap-6">
              {/* Avatar preview */}
              <div className="relative shrink-0">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Ảnh đại diện"
                    className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-border)]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center border-2 border-[var(--color-border)]">
                    <User className="h-10 w-10 text-[var(--color-primary)]" />
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex flex-col gap-3">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Đăng tải ảnh JPG, PNG hoặc WebP. Tối đa 5 MB.
                </p>
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    id="avatar-upload"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {uploadingAvatar ? 'Đang tải lên...' : 'Chọn ảnh'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Basic info card */}
          <Card className="bento-card p-6">
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
              Thông tin cơ bản
            </h2>
            <div className="space-y-4">
              {/* Email — read-only */}
              <div>
                <Label htmlFor="email" className="text-[var(--color-text-secondary)]">
                  Email
                </Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="mt-1 bg-[var(--color-bg-secondary)] cursor-not-allowed opacity-70"
                />
              </div>

              {/* Full name */}
              <div>
                <Label htmlFor="fullName">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                  className="mt-1"
                />
                {formErrors.fullName && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">{formErrors.fullName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="0xxx xxx xxx"
                    className="pl-10"
                  />
                </div>
                {formErrors.phone && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">{formErrors.phone}</p>
                )}
              </div>

              {/* Role — read-only */}
              <div>
                <Label htmlFor="role" className="text-[var(--color-text-secondary)]">
                  Vai trò
                </Label>
                <Input
                  id="role"
                  value={
                    profile?.role === 'RENTER' ? 'Người thuê kho' :
                    profile?.role === 'OWNER' ? 'Chủ kho lạnh' :
                    profile?.role === 'EMPLOYEE' ? 'Nhân viên' : profile?.role || ''
                  }
                  disabled
                  className="mt-1 bg-[var(--color-bg-secondary)] cursor-not-allowed opacity-70"
                />
              </div>

              {/* Status — read-only */}
              <div>
                <Label htmlFor="status" className="text-[var(--color-text-secondary)]">
                  Trạng thái tài khoản
                </Label>
                <Input
                  id="status"
                  value={
                    profile?.status === 'ACTIVE' ? 'Hoạt động' :
                    profile?.status === 'INACTIVE' ? 'Bị vô hiệu hóa' :
                    profile?.status === 'BANNED' ? 'Bị cấm' : profile?.status || ''
                  }
                  disabled
                  className="mt-1 bg-[var(--color-bg-secondary)] cursor-not-allowed opacity-70"
                />
              </div>
            </div>
          </Card>

          {/* Company info card — owner only */}
          {isOwner && (
            <Card className="bento-card p-6">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[var(--color-primary)]" />
                Thông tin doanh nghiệp
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Tên công ty</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => setField('companyName', e.target.value)}
                    placeholder="Tên công ty của bạn"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="companyTaxCode">Mã số thuế</Label>
                  <div className="relative mt-1">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                    <Input
                      id="companyTaxCode"
                      value={form.companyTaxCode}
                      onChange={(e) => setField('companyTaxCode', e.target.value)}
                      placeholder="0123456789"
                      className="pl-10"
                    />
                  </div>
                  {formErrors.companyTaxCode && (
                    <p className="mt-1 text-xs text-[var(--color-error)]">{formErrors.companyTaxCode}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
