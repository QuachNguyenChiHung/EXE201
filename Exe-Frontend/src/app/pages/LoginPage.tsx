import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { authAPI, bookmarksAPI } from "../../services/apiClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Warehouse } from "lucide-react";
import { toast } from "sonner";
import { api } from "/src/services/asus_api";

const DEMO_ACCOUNTS = [
  { label: "Doanh nghiệp", email: "renter@example.com", role: "renter" },
  { label: "Chủ kho", email: "warehouse@example.com", role: "warehouse" },
  { label: "Nhân viên", email: "employee@example.com", role: "employee" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);
    setAuthError(null);
    try {
      const user = (await api.post("/auth/login", { email, password })).data;
      localStorage.setItem('user', JSON.stringify(user));

      toast.success("Đăng nhập thành công!");
      if (user.role === "RENTER") navigate("/renter");
      else if (user.role === "OWNER") navigate("/warehouse");
      else if (user.role === "EMPLOYEE") navigate("/employee");
      else navigate("/");
    } catch (err: any) {
      setAuthError(err?.message ?? "Đăng nhập thất bại");
      console.error("Login error:", err);
      toast.error(err?.message ?? "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password");
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      {/* Left accent panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white flex items-center justify-center">
            <Warehouse className="h-4 w-4 text-[var(--color-primary)]" />
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
            <div className="w-8 h-8 bg-[var(--color-primary)] flex items-center justify-center">
              <Warehouse className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">logicha</span>
          </Link>

          <div className="mb-8">
            <h1 style={{ fontSize: "1.75rem" }}>Đăng nhập</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">Chào mừng trở lại!</p>
          </div>

          {authError && (
            <div
              className="mb-4 px-4 py-3 text-sm border"
              style={{
                background: "rgba(239,68,68,0.06)",
                borderColor: "rgba(239,68,68,0.35)",
                color: "var(--color-error, #ef4444)",
              }}
            >
              {authError}
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
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                className="rounded-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
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

          {/* Demo accounts */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-3 uppercase tracking-wide">
              Tài khoản demo (mật khẩu: <strong>password</strong>)
            </p>
            <div className="space-y-2 text-xs">
              {DEMO_ACCOUNTS.map(a => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => fillDemo(a.email)}
                  className="w-full text-left bg-[var(--color-bg-secondary)] px-3 py-2 hover:bg-[var(--color-bg-tertiary)] transition-colors flex items-center justify-between"
                >
                  <span>
                    <span className="text-[var(--color-text-muted)]">{a.label}: </span>
                    <span className="text-[var(--color-text)]">{a.email}</span>
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 text-white"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {a.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
