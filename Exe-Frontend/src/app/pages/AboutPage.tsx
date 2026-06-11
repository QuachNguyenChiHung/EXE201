import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

import { Link } from "react-router";
import {
  Warehouse,
  Target,
  Users,
  TrendingUp,
  Shield,
  Sparkles,
  Clock,
  MapPin,
  Award,
  Heart,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="bento-container py-12">
        {/* Hero */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[var(--color-primary)] flex items-center justify-center">
              <Warehouse className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
              Về chúng tôi
            </span>
          </div>
          <h1 className="mb-4" style={{ fontSize: "3rem" }}>
            Về Logicha
          </h1>
          <p
            className="text-[var(--color-text-secondary)] max-w-2xl"
            style={{ fontSize: "1.125rem" }}
          >
            Nền tảng kết nối cho thuê kho lạnh hàng đầu Việt
            Nam, mang đến giải pháp lưu trữ thông minh cho doanh
            nghiệp.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-px bg-[var(--color-border)] mb-16">
          <div className="bg-[var(--color-surface)] p-8">
            <div className="w-10 h-10 bg-[var(--color-primary)] flex items-center justify-center mb-4">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h2 className="mb-3">Sứ mệnh</h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              Kết nối doanh nghiệp cần kho lạnh với chủ kho một
              cách nhanh chóng, minh bạch và hiệu quả. Chúng tôi
              cam kết mang đến trải nghiệm tìm kiếm đơn giản
              nhất thông qua công nghệ AI tiên tiến.
            </p>
          </div>
          <div className="bg-[var(--color-surface)] p-8">
            <div className="w-10 h-10 bg-[var(--color-secondary)] flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h2 className="mb-3">Tầm nhìn</h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              Trở thành nền tảng số 1 Việt Nam trong lĩnh vực
              cho thuê kho lạnh, góp phần tối ưu hóa chuỗi cung
              ứng lạnh và phát triển ngành logistics bền vững.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="mb-2">Giá trị cốt lõi</h2>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Những giá trị chúng tôi cam kết mang lại
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-[var(--color-border)]">
            {[
              {
                icon: (
                  <Sparkles className="h-5 w-5 text-white" />
                ),
                bg: "var(--color-primary)",
                title: "Công nghệ AI tiên tiến",
                desc: "Tìm kiếm kho lạnh bằng ngôn ngữ tự nhiên, thông minh và chính xác",
              },
              {
                icon: <Shield className="h-5 w-5 text-white" />,
                bg: "var(--color-info)",
                title: "Minh bạch & An toàn",
                desc: "Thông tin rõ ràng, chứng nhận đầy đủ, giao dịch được bảo vệ",
              },
              {
                icon: <Clock className="h-5 w-5 text-white" />,
                bg: "var(--color-success)",
                title: "Nhanh chóng",
                desc: "Tìm kiếm và kết nối trong vài phút, tiết kiệm thời gian quý báu",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="bg-[var(--color-surface)] p-8"
              >
                <div
                  className="w-10 h-10 flex items-center justify-center mb-4"
                  style={{ background: v.bg }}
                >
                  {v.icon}
                </div>
                <h3 className="mb-2">{v.title}</h3>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="mb-2">Tính năng nổi bật</h2>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Những gì làm Logicha trở nên khác biệt
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-border)]">
            {[
              {
                icon: (
                  <Sparkles className="h-4 w-4 text-white" />
                ),
                bg: "var(--color-primary)",
                title: "AI Search",
                desc: "Tìm kiếm bằng ngôn ngữ tự nhiên, AI hiểu và gợi ý kho phù hợp nhất",
              },
              {
                icon: <MapPin className="h-4 w-4 text-white" />,
                bg: "var(--color-info)",
                title: "Bản đồ tương tác",
                desc: "Xem vị trí kho trên bản đồ, tính toán khoảng cách và lộ trình",
              },
              {
                icon: <Award className="h-4 w-4 text-white" />,
                bg: "var(--color-warning)",
                title: "Kiểm tra chứng nhận",
                desc: "Hệ thống cảnh báo kho chưa có chứng nhận, đảm bảo an toàn",
              },
              {
                icon: <Users className="h-4 w-4 text-white" />,
                bg: "var(--color-secondary)",
                title: "Quản lý đa vai trò",
                desc: "Dành cho doanh nghiệp thuê kho, chủ kho và nhân viên quản lý",
              },
              {
                icon: <Heart className="h-4 w-4 text-white" />,
                bg: "var(--color-error)",
                title: "Yêu thích & So sánh",
                desc: "Lưu kho yêu thích và so sánh để đưa ra quyết định tốt nhất",
              },
              {
                icon: (
                  <TrendingUp className="h-4 w-4 text-white" />
                ),
                bg: "var(--color-accent)",
                title: "Thống kê & Báo cáo",
                desc: "Dashboard chi tiết, theo dõi hiệu quả kinh doanh real-time",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-[var(--color-surface)] p-6"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 flex items-center justify-center shrink-0"
                    style={{ background: f.bg }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="mb-1">{f.title}</h4>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>



        {/* CTA */}
        <div className="bg-[var(--color-primary)] text-white p-12 text-center">
          <h2 className="text-white mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto text-sm">
            Tham gia Logicha ngay hôm nay để trải nghiệm cách
            tìm kiếm và thuê kho lạnh hiện đại nhất
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register?role=renter"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-[var(--color-primary)] hover:bg-blue-50 transition-colors text-sm font-semibold"
            >
              Tìm kho lạnh
            </Link>
            <Link
              to="/register?role=warehouse"
              className="inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white hover:text-[var(--color-primary)] transition-colors text-sm font-semibold"
            >
              Cho thuê kho
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}