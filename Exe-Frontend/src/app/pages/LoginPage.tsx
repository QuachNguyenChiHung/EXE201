import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { bookmarksAPI } from "../../services/apiClient";
import { authService } from "../../services/authService";
import { userService } from "../../services/userService";
import { renterService } from "../../services/renterService";
import { AISubscriptionConfirmModal } from "../components/renter/AISubscriptionConfirmModal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Warehouse } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "../../assets/logo.png";
import type { User, AiSubscriptionTier } from "../../types/public";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // Khi đăng nhập sai nhưng chưa bị khóa, lưu số lần đã sai để cảnh báo FE.
  // Ưu tiên giá trị từ BE (remainingAttempts); chỉ fallback local khi BE
  // không trả về.
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  // Thời điểm mở khóa (từ BE 423 response). Khi đến thời điểm này, tự
  // động clear locked + attemptsUsed.
  const [lockUntil, setLockUntil] = useState<string | null>(null);
  const MAX_ATTEMPTS = 5;
  const navigate = useNavigate();

  // Renewal prompt — shown post-login when the renter's AI subscription window
  // has lapsed (aiRenewalTierId from the login response). Navigation is held
  // back until the user confirms or dismisses the modal.
  const [renewalTiers, setRenewalTiers] = useState<AiSubscriptionTier[]>([]);
  const [renewalTier, setRenewalTier] = useState<AiSubscriptionTier | null>(null);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const roleHomePath = (role: string) => {
    if (role === "RENTER") return "/renter";
    if (role === "OWNER") return "/warehouse";
    if (role === "EMPLOYEE") return "/employee";
    return "/";
  };

  const handleRenewalConfirm = async () => {
    if (!renewalTier) return;
    setRenewalLoading(true);
    try {
      const res = await renterService.buyAiTier(renewalTier.id_ai_subscription);
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
        return;
      }
      toast.success(`Đăng ký gói "${renewalTier.label}" thành công!`);
    } catch (err: any) {
      toast.error(err?.message ?? "Không thể gia hạn gói AI. Vui lòng thử lại.");
    } finally {
      setRenewalLoading(false);
      setRenewalTier(null);
      if (pendingPath) navigate(pendingPath);
    }
  };

  const handleRenewalClose = () => {
    setRenewalTier(null);
    if (pendingPath) navigate(pendingPath);
  };

  // Auto-unlock khi lock window kết thúc. Tính theo lockUntil từ BE; nếu
  // BE không trả về, fallback 5 phút (giá trị mặc định).
  useEffect(() => {
    if (!locked || !lockUntil) return;
    const target = new Date(lockUntil).getTime();
    const ms = target - Date.now();
    if (Number.isNaN(target) || ms <= 0) {
      setLocked(false);
      setAttemptsUsed(0);
      setLockUntil(null);
      return;
    }
    const t = setTimeout(() => {
      setLocked(false);
      setAttemptsUsed(0);
      setLockUntil(null);
    }, ms);
    return () => clearTimeout(t);
  }, [locked, lockUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    // Chặn submit nếu tài khoản đang bị khóa tạm — không gọi BE để tránh gia
    // hạn khóa. Người dùng vẫn có thể sửa email/mật khẩu để đăng nhập tài khoản
    // khác trong khi chờ.
    if (locked) {
      toast.error(
        authError ||
          "Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau 5 phút."
      );
      return;
    }

    setLoading(true);
    setAuthError(null);
    try {
      const user = await authService.login({ email, password });

      toast.success("Đăng nhập thành công!");
      // Reset các state lỗi khi đăng nhập thành công.
      setAttemptsUsed(0);
      setLocked(false);
      setLockUntil(null);

      const homePath = roleHomePath(user.role);

      // Renter whose AI subscription window lapsed — hold navigation and show
      // the renewal prompt instead. If the tier lookup fails for any reason,
      // fail open and navigate normally rather than blocking login.
      if (user.role === "RENTER" && user.ai_renewal_tier_id) {
        try {
          const tiers = await renterService.getAiTiers();
          const tier = tiers.find(t => t.id_ai_subscription === user.ai_renewal_tier_id);
          if (tier) {
            setRenewalTiers(tiers);
            setRenewalTier(tier);
            setPendingPath(homePath);
            return;
          }
        } catch {
          // ignore — fall through to normal navigation below
        }
      }

      navigate(homePath);
    } catch (err: any) {
      const status = err?.response?.status;
      // 423 LOCKED — tài khoản đang bị khóa tạm do nhập sai mật khẩu quá nhiều
      // lần. Vô hiệu hóa nút submit cho đến khi backend tự mở khóa sau 5 phút.
      if (status === 423) {
        setLocked(true);
        setAttemptsUsed(MAX_ATTEMPTS);
        // Lưu lockUntil từ BE để useEffect tự động clear locked khi hết hạn.
        const beLockUntil = err?.response?.data?.lockUntil;
        setLockUntil(typeof beLockUntil === "string" ? beLockUntil : null);
        const lockMsg =
          err?.response?.data?.message ||
          "Bạn đã nhập sai mật khẩu quá nhiều lần. Tài khoản đã bị khóa tạm thời 5 phút để bảo vệ an toàn. Vui lòng thử lại sau.";
        setAuthError(lockMsg);
        toast.error(lockMsg);
        return;
      }

      // 401 BAD CREDENTIALS — sai email hoặc mật khẩu. Ưu tiên dùng
      // remainingAttempts từ BE (giá trị chính xác sau reset/idle). Fallback
      // local increment khi BE không trả về trường này.
      if (status === 401) {
        const serverRemaining = err?.response?.data?.remainingAttempts;
        if (typeof serverRemaining === "number" && serverRemaining >= 0) {
          const used = Math.max(0, MAX_ATTEMPTS - serverRemaining);
          setAttemptsUsed(used);
          if (serverRemaining === 0) {
            setAuthError(
              "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại."
            );
          } else {
            setAuthError(
              `Email hoặc mật khẩu không chính xác. Còn ${serverRemaining} lần thử trước khi tài khoản bị khóa tạm thời.`
            );
          }
        } else {
          // Fallback (BE chưa hỗ trợ remainingAttempts): legacy local increment.
          const newAttempts = attemptsUsed + 1;
          setAttemptsUsed(newAttempts);
          const remaining = MAX_ATTEMPTS - newAttempts;
          if (newAttempts >= MAX_ATTEMPTS) {
            setAuthError(
              "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại."
            );
          } else {
            setAuthError(
              `Email hoặc mật khẩu không chính xác. Còn ${remaining} lần thử trước khi tài khoản bị khóa tạm thời.`
            );
          }
        }
        toast.error("Đăng nhập thất bại");
        return;
      }

      // Các lỗi khác (mạng, 500, v.v.)
      const fallback =
        err?.response?.data?.message ||
        err?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";
      setAuthError(fallback);
      toast.error(fallback);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      {/* Left accent panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-16 h-16 flex items-center justify-center overflow-hidden rounded-md bg-white p-0.5">
            <img src={logoUrl} alt="Logicha" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">Logicha</span>
        </Link>
        <div className="space-y-4">
          <h2 className="text-white" style={{ fontSize: "2.5rem" }}>
            Kho lạnh thông minh
            <br />
            dành cho doanh nghiệp
          </h2>
          <p className="text-blue-200">
            Tìm và quản lý kho lạnh dễ dàng trên nền tảng số hàng đầu Việt Nam.
          </p>
        </div>
        <p className="text-blue-300 text-sm">© 2026 logicha</p>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-16 h-16 flex items-center justify-center overflow-hidden rounded-md bg-[var(--color-primary)] p-0.5">
              <img src={logoUrl} alt="Logicha" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">logicha</span>
          </Link>

          <div className="mb-8">
            <h1 style={{ fontSize: "1.75rem" }}>Đăng nhập</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">Chào mừng trở lại!</p>
          </div>

          {authError && (
            <div
              className="mb-4 px-4 py-3 text-sm border flex items-start gap-2"
              style={
                locked
                  ? {
                      background: "rgba(245,158,11,0.08)",
                      borderColor: "rgba(245,158,11,0.4)",
                      color: "var(--color-warning, #b45309)",
                    }
                  : {
                      background: "rgba(239,68,68,0.06)",
                      borderColor: "rgba(239,68,68,0.35)",
                      color: "var(--color-error, #ef4444)",
                    }
              }
              role={locked ? "warning" : "alert"}
            >
              <span className="font-semibold leading-none mt-0.5">
                {locked ? "🔒" : "⚠"}
              </span>
              <span className="flex-1">{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  // User chỉnh email — không rõ ràng là cùng tài khoản nữa,
                  // nên clear cả lock + attempts + lockUntil + authError.
                  if (locked) setLocked(false);
                  if (lockUntil) setLockUntil(null);
                  if (attemptsUsed > 0) setAttemptsUsed(0);
                  if (authError) setAuthError(null);
                }}
                disabled={loading}
                className="rounded-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (authError) setAuthError(null);
                }}
                disabled={loading}
                className="rounded-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-none bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-[var(--color-primary)] hover:underline">
              Đăng ký ngay
            </Link>
          </p>

        </div>
      </div>

      {/* currentTierId intentionally omitted — this is a same-tier renewal, not
          an upgrade, so the modal shows its "Xác nhận đăng ký gói AI" title. */}
      <AISubscriptionConfirmModal
        tier={renewalTier}
        aiTiers={renewalTiers}
        loading={renewalLoading}
        onClose={handleRenewalClose}
        onConfirm={handleRenewalConfirm}
      />
    </div>
  );
}
