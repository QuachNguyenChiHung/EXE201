import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, ShieldCheck, Lock } from "lucide-react";
import logoUrl from "../../assets/logo.png";
import { authService } from "../../services/authService";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [blocked, setBlocked] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const cooldownRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) window.clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = (seconds: number) => {
    if (cooldownRef.current) window.clearInterval(cooldownRef.current);
    cooldownRef.current = window.setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) {
            window.clearInterval(cooldownRef.current);
            cooldownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Detect the backend's EMPLOYEE-block response (BE message contains the
  // substring "nhân viên"). When that happens we bounce the user back to the
  // email step and disable the OTP flow so they can't keep submitting codes.
  const EMPLOYEE_BLOCK_MARKER = "nhân viên";
  const EMPLOYEE_BLOCK_MESSAGE =
    "Tài khoản nhân viên không thể đặt lại mật khẩu qua OTP. " +
    "Vui lòng liên hệ quản trị viên hoặc dùng chức năng đổi mật khẩu trong trang cá nhân.";

  const handleEmployeeBlock = (rawMsg: string) => {
    setBlocked(true);
    setStep("email");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    toast.error(EMPLOYEE_BLOCK_MESSAGE);
  };

  const isEmployeeBlockMessage = (msg: string) =>
    msg?.toLowerCase().includes(EMPLOYEE_BLOCK_MARKER);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }
    if (blocked || resendCooldown > 0) return;

    setSubmitting(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      toast.success(res.message);
      // Reset OTP state when a new code is requested.
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("otp");
      startCooldown(res.cooldownSeconds || 60);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Gửi mã thất bại";
      if (isEmployeeBlockMessage(msg)) {
        handleEmployeeBlock(msg);
        return;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (otp.length < 6) {
      toast.error("Vui lòng nhập đầy đủ mã 6 số");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.verifyOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      toast.success(res.message || "Mã xác thực hợp lệ");
      setStep("password");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Mã xác thực không đúng";
      if (isEmployeeBlockMessage(msg)) {
        handleEmployeeBlock(msg);
      } else {
        setError(msg);
        toast.error(msg);
        // Stay on OTP step so the user can correct it.
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length < 6) {
      toast.error("Vui lòng nhập đầy đủ mã 6 số");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      toast.success(res.message || "Đặt lại mật khẩu thành công!");
      navigate("/login");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Đặt lại mật khẩu thất bại";
      if (isEmployeeBlockMessage(msg)) {
        handleEmployeeBlock(msg);
      } else {
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-16 h-16 flex items-center justify-center overflow-hidden rounded-md bg-white p-0.5">
            <img src={logoUrl} alt="Logicha" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">Logicha</span>
        </Link>
        <div className="space-y-4">
          <h2 className="text-white" style={{ fontSize: "2.5rem" }}>
            {step === "email" ? "Quên mật khẩu?" : "Đặt lại mật khẩu"}
          </h2>
          <p className="text-blue-200">
            {step === "email"
              ? "Nhập email của bạn, chúng tôi sẽ gửi mã xác thực để bạn đặt lại mật khẩu."
              : step === "otp"
              ? "Nhập mã xác thực đã được gửi tới email của bạn."
              : "Đặt mật khẩu mới cho tài khoản của bạn."}
          </p>
        </div>
        <p className="text-blue-300 text-sm">© 2026 logicha</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-16 h-16 flex items-center justify-center overflow-hidden rounded-md bg-[var(--color-primary)] p-0.5">
              <img src={logoUrl} alt="Logicha" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">logicha</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              if (step === "otp") {
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
                setStep("email");
              } else if (step === "password") {
                setStep("otp");
              } else {
                navigate("/login");
              }
            }}
            className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === "email" ? "Về trang đăng nhập" : "Quay lại"}
          </button>

          <div className="mb-8">
            <h1 style={{ fontSize: "1.75rem" }}>
              {step === "email" ? "Quên mật khẩu" : "Đặt lại mật khẩu"}
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              {step === "email"
                ? "Nhập email đã đăng ký để nhận mã xác thực."
                : step === "otp"
                ? `Mã đã được gửi tới ${email}.`
                : `Mã đã được xác nhận — đặt mật khẩu mới cho ${email}.`}
            </p>
          </div>

          {error && (
            <div
              className="mb-4 px-4 py-3 text-sm border"
              style={{
                background: "rgba(239,68,68,0.06)",
                borderColor: "rgba(239,68,68,0.35)",
                color: "var(--color-error, #ef4444)",
              }}
            >
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (blocked) setBlocked(false);
                    }}
                    disabled={submitting || blocked}
                    className="pl-10 rounded-none"
                    autoFocus
                  />
                </div>
              </div>

              {blocked && (
                <div
                  className="px-4 py-3 text-sm border"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    borderColor: "rgba(245,158,11,0.35)",
                    color: "var(--color-warning, #b45309)",
                  }}
                >
                  {EMPLOYEE_BLOCK_MESSAGE}
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-none bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
                disabled={submitting || blocked || !email.trim()}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang gửi mã...
                  </span>
                ) : (
                  "Gửi mã xác thực"
                )}
              </Button>
            </form>
          ) : step === "otp" ? (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label>Mã xác thực</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    disabled={submitting}
                    containerClassName="gap-3"
                  >
                    <InputOTPGroup className="gap-3">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-12 w-12 text-lg border first:rounded-none last:rounded-none rounded-none"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] text-center mt-1">
                  Mã có hiệu lực trong 10 phút.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => handleVerifyOtp()}
                className="w-full rounded-none bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
                disabled={submitting || otp.length < 6}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xác nhận...
                  </span>
                ) : (
                  "Xác nhận mã"
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={resendCooldown > 0 || submitting}
                  className="text-[var(--color-primary)] hover:underline disabled:text-[var(--color-text-muted)] disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Gửi lại mã sau ${resendCooldown}s` : "Gửi lại mã"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setStep("email");
                  }}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                  disabled={submitting}
                >
                  Đổi email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div
                className="flex items-center justify-center gap-2 text-sm"
                style={{ color: "var(--color-success, #10b981)" }}
              >
                <ShieldCheck className="h-4 w-4" />
                Mã xác thực đã được xác nhận.
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={submitting}
                    className="pl-10 rounded-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    className="pl-10 rounded-none"
                    style={{
                      borderColor:
                        confirmPassword && newPassword !== confirmPassword
                          ? "var(--color-error, #ef4444)"
                          : undefined,
                    }}
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs" style={{ color: "var(--color-error, #ef4444)" }}>
                    Mật khẩu xác nhận không khớp
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full rounded-none bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang đặt lại mật khẩu...
                  </span>
                ) : (
                  "Đặt lại mật khẩu"
                )}
              </Button>

              <div className="flex items-center justify-start text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("otp");
                  }}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                  disabled={submitting}
                >
                  ← Quay lại sửa mã
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
            Nhớ mật khẩu rồi?{" "}
            <Link to="/login" className="text-[var(--color-primary)] hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
