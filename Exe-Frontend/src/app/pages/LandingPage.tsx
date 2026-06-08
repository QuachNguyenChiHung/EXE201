import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import {
  Warehouse,
  Search,
  Sparkles,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect } from "react";
export default function LandingPage() {
  const navigate = useNavigate();

  // If a user is already logged in, redirect them to their dashboard
  // (roles stored as uppercase in localStorage via `getUser()` elsewhere)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        const role = user?.role ? (user.role as string).toLowerCase() : null;
        if (role === 'renter') navigate('/renter');
        else if (role === 'owner' || role === 'warehouse') navigate('/warehouse');
        else if (role === 'employee') navigate('/employee');
      }
    } catch (e) {
      // ignore parse errors
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section
        className="relative text-white overflow-hidden"
        style={{
          backgroundImage: `url(${'https://hrchannels.com/uptalent/attachments/images/20210505/1620184557639-Vai_tro_cua_Warehouse_00.png'})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "480px",
        }}
      >
        {/* Dark shader overlay for readability */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(10, 30, 70, 0.62)" }}
        />
        <div className="relative bento-container py-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-block bg-white text-[var(--color-primary)] text-xs px-3 py-1 uppercase tracking-widest">
              Nền tảng kho lạnh Việt Nam
            </div>
            <h1 style={{ fontSize: "3rem", color: "#ffffff" }}>
              Cho thuê kho lạnh
              <br />
              thông minh & nhanh chóng
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                maxWidth: "520px",
                color: "#bfdbfe",
              }}
            >
              Kết nối doanh nghiệp với chủ kho lạnh khắp Việt
              Nam. Tìm kiếm bằng AI hoặc bộ lọc chi tiết.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                size="lg"
                onClick={() =>
                  navigate("/register?role=renter")
                }
                className="rounded-none bg-white text-[var(--color-primary)] hover:bg-blue-50"
              >
                Tìm kho lạnh ngay
              </Button>
              <Button
                size="lg"
                onClick={() =>
                  navigate("/register?role=warehouse")
                }
                className="rounded-none bg-transparent border-2 border-white text-white hover:bg-white hover:text-[var(--color-primary)]"
              >
                Cho thuê kho của bạn
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <section className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="bento-container py-6">
          <div className="grid grid-cols-3 divide-x divide-[var(--color-border)]">
            {[
              { value: "500+", label: "Kho lạnh đã đăng ký" },
              {
                value: "1,200+",
                label: "Doanh nghiệp tin dùng",
              },
              { value: "63", label: "Tỉnh thành phủ sóng" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center px-6"
              >
                <div className="text-2xl font-extrabold text-[var(--color-primary)]">
                  {stat.value}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="bento-section">
        <div className="bento-container">
          <div className="bento-header">
            <h2>Tính năng nổi bật</h2>
            <p className="text-[var(--color-text-secondary)] mt-2">
              Giải pháp toàn diện cho nhu cầu kho lạnh của bạn
            </p>
          </div>

          {/* ── Row 1: featured AI card (2/3) + filter card (1/3) ── */}
          <div className="flex flex-col gap-px bg-[var(--color-border)] mb-px">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--color-border)]">
              {/* Featured — AI Search */}
              <div className="md:col-span-2 bg-[var(--color-surface)] p-8 flex flex-col justify-between min-h-[200px]">
                <div>
                  <div
                    className="w-12 h-12 flex items-center justify-center mb-5"
                    style={{ background: "rgba(37,99,235,0.1)" }}
                  >
                    <Sparkles className="h-7 w-7 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="mb-2">Tìm kiếm bằng AI</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm max-w-md">
                    Mô tả yêu cầu bằng ngôn ngữ tự nhiên — AI tự phân tích,
                    lọc và đề xuất kho lạnh phù hợp nhất trong vài giây.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <span
                    className="text-xs px-2.5 py-1 uppercase tracking-wide"
                    style={{
                      background: "rgba(37,99,235,0.08)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Claude-powered
                  </span>
                  <span
                    className="text-xs px-2.5 py-1 uppercase tracking-wide"
                    style={{
                      background: "rgba(37,99,235,0.08)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Tiếng Việt tự nhiên
                  </span>
                </div>
              </div>

              {/* Bộ lọc chi tiết */}
              <div className="bg-[var(--color-surface)] p-8 min-h-[200px]">
                <div
                  className="w-12 h-12 flex items-center justify-center mb-5"
                  style={{ background: "rgba(16,185,129,0.1)" }}
                >
                  <Search className="h-7 w-7 text-[var(--color-secondary)]" />
                </div>
                <h3 className="mb-2">Bộ lọc chi tiết</h3>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Lọc theo vị trí, nhiệt độ, công suất, chứng chỉ và nhiều
                  tiêu chí khác.
                </p>
              </div>
            </div>

            {/* ── Row 2: 4 equal cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border)]">
              {[
                {
                  icon: <Warehouse className="h-6 w-6 text-[var(--color-accent)]" />,
                  iconBg: "rgba(245,158,11,0.1)",
                  title: "Quản lý dễ dàng",
                  desc: "Công cụ quản lý kho hiện đại cho chủ kho — dễ sử dụng, hiệu quả.",
                },
                {
                  icon: <Shield className="h-6 w-6 text-[var(--color-success)]" />,
                  iconBg: "rgba(34,197,94,0.1)",
                  title: "An toàn & Chứng chỉ",
                  desc: "Xác minh HACCP, ISO. Cảnh báo rõ ràng với kho chưa đạt chuẩn.",
                },
                {
                  icon: <TrendingUp className="h-6 w-6 text-[var(--color-info)]" />,
                  iconBg: "rgba(2,132,199,0.1)",
                  title: "Bản đồ & Định tuyến",
                  desc: "Xem vị trí kho trên bản đồ, tính tuyến đường từ địa chỉ của bạn.",
                },
                {
                  icon: <Users className="h-6 w-6 text-[var(--color-warning)]" />,
                  iconBg: "rgba(234,179,8,0.1)",
                  title: "Thanh toán linh hoạt",
                  desc: "Phí AI theo lượng dùng thực tế. Minh bạch và tiết kiệm chi phí.",
                },
              ].map((f) => (
                <div key={f.title} className="bg-[var(--color-surface)] p-6">
                  <div
                    className="w-10 h-10 flex items-center justify-center mb-4"
                    style={{ background: f.iconBg }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="mb-2" style={{ fontSize: "0.95rem" }}>{f.title}</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="bento-section">
        <div className="bento-container">
          <div className="bg-[var(--color-text)] text-white p-12">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-white">Sẵn sàng bắt đầu?</h2>
              <p className="text-gray-300">
                Tham gia ngay hôm nay để trải nghiệm nền tảng
                kho lạnh thông minh nhất Việt Nam
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate("/register")}
                  className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                >
                  Đăng ký miễn phí
                </Button>
                <Button
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="rounded-none bg-transparent border-2 border-gray-500 text-white hover:border-white"
                >
                  Đăng nhập
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}