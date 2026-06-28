import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Link } from "react-router";
import { Sparkles, Brain, MessageSquare, Zap, Shield, TrendingUp, Search, Star, Crown } from "lucide-react";

const FEATURES = [
  {
    icon: <Brain className="h-5 w-5 text-white" />,
    bg: "var(--color-primary)",
    title: "Hiểu ngôn ngữ tự nhiên",
    desc: "Mô tả nhu cầu bằng lời nói thông thường — AI sẽ tự phân tích và tìm kho phù hợp nhất cho bạn.",
  },
  {
    icon: <Search className="h-5 w-5 text-white" />,
    bg: "var(--color-info)",
    title: "Tìm kiếm thông minh",
    desc: "AI gợi ý kho dựa trên loại hàng hóa, nhiệt độ, dung tích, giá cả và vị trí — không cần điền từng ô lọc.",
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-white" />,
    bg: "var(--color-accent)",
    title: "Ưu tiên Sponsor & Đánh giá cao",
    desc: "Kho có gói Sponsor và được đánh giá tốt sẽ được ưu tiên hiển thị, giúp bạn nhanh chóng tìm được kho chất lượng.",
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-white" />,
    bg: "var(--color-secondary)",
    title: "Hội thoại liên tục",
    desc: "Tin nhắn lại cuộc trò chuyện, điều chỉnh yêu cầu thoải mái — AI nhớ ngữ cảnh và gợi ý ngày càng chính xác hơn.",
  },
  {
    icon: <Zap className="h-5 w-5 text-white" />,
    bg: "var(--color-warning)",
    title: "Nhanh chóng & Tiết kiệm",
    desc: "Chỉ mất vài giây để nhận gợi ý kho tối ưu, thay vì lọc thủ công hàng chục kết quả.",
  },
  {
    icon: <Shield className="h-5 w-5 text-white" />,
    bg: "var(--color-success)",
    title: "Thông tin đáng tin cậy",
    desc: "AI trích xuất tiêu chí từ mô tả của bạn và đối chiếu với dữ liệu kho thực tế trong hệ thống.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Mô tả nhu cầu",
    desc: "Nhập mô tả bằng tiếng Việt: loại hàng hóa, nhiệt độ bảo quản, ngân sách, vị trí...",
  },
  {
    step: "02",
    title: "AI phân tích & tìm kiếm",
    desc: "AI trích xuất tiêu chí từ lời mô tả, đối chiếu với cơ sở dữ liệu kho lạnh trên toàn quốc.",
  },
  {
    step: "03",
    title: "Nhận gợi ý tức thì",
    desc: "Danh sách kho phù hợp nhất hiển thị ngay, sắp xếp theo mức độ phù hợp và ưu tiên của hệ thống.",
  },
  {
    step: "04",
    title: "Điều chỉnh & trò chuyện",
    desc: "Tiếp tục hỏi để thu hẹp kết quả — AI nhớ ngữ cảnh và đưa ra gợi ý chính xác hơn.",
  },
];

export default function AIDescriptionPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="bento-container py-12">

        {/* ── Hero ── */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary)] text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Công nghệ AI tiên tiến
          </div>
          <h1 className="mb-4" style={{ fontSize: "3rem" }}>
            Tìm kiếm kho lạnh bằng <span className="text-[var(--color-primary)]">AI</span>
          </h1>
          <p
            className="text-[var(--color-text-secondary)] max-w-2xl mx-auto"
            style={{ fontSize: "1.125rem" }}
          >
            Chỉ cần mô tả nhu cầu bằng ngôn ngữ tự nhiên — AI của Logicha sẽ phân tích và gợi ý
            kho lạnh phù hợp nhất trong vài giây.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link
              to="/register?role=renter"
              className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity text-sm font-semibold"
            >
              Trải nghiệm ngay
            </Link>
            <Link
              to="/faq"
              className="inline-flex items-center justify-center px-6 py-3 bg-transparent border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm font-semibold"
            >
              Tìm hiểu thêm
            </Link>
          </div>
        </div>

        {/* ── Example prompts ── */}
        <div className="mb-16">
          <h2 className="mb-2 text-center">Ví dụ câu hỏi bạn có thể đặt</h2>
          <p className="text-[var(--color-text-secondary)] text-sm text-center mb-8">
            Không cần điền form — chỉ cần hỏi bằng lời
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              "Kho lạnh ở Hồ Chí Minh, bảo quản hải sản đông lạnh, ngân sách dưới 500 triệu/tháng",
              "Tìm kho rẻ nhất có nhiệt độ từ -20°C trở xuống",
              "So sánh 3 kho có chứng chỉ HACCP ở Hà Nội",
              "Kho nào gần cảng Cát Lái, có đủ chỗ cho 1000 m³ hàng?",
              "Gợi ý kho cho thuê theo ngày, giá dưới 50 triệu",
              "Kho nào có đánh giá tốt nhất ở Đà Nẵng?",
            ].map((example, i) => (
              <div
                key={i}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-sm text-[var(--color-text-secondary)] italic leading-relaxed"
              >
                &ldquo;{example}&rdquo;
              </div>
            ))}
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="mb-16">
          <h2 className="mb-2 text-center">Cách AI Search hoạt động</h2>
          <p className="text-[var(--color-text-secondary)] text-sm text-center mb-8">
            Bốn bước đơn giản để tìm được kho lạnh lý tưởng
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step}>
                <div className="text-5xl font-extrabold text-[var(--color-primary)] opacity-10 mb-2">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Features ── */}
        <div className="mb-16">
          <h2 className="mb-2 text-center">Tính năng nổi bật</h2>
          <p className="text-[var(--color-text-secondary)] text-sm text-center mb-8">
            Không chỉ tìm kiếm — AI của Logicha còn mang đến trải nghiệm tư vấn thông minh
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-border)]">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-[var(--color-surface)] p-6">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center shrink-0"
                    style={{ background: f.bg }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">{f.title}</h4>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sponsor & rating note ── */}
        <div className="mb-16 bg-[var(--color-surface)] border border-[var(--color-border)] p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Ưu tiên kho chất lượng cao</h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">
                Khi nhiều kho có mức độ phù hợp tương đương, AI sẽ ưu tiên gợi ý các kho theo thứ
                tự:
              </p>
              <ol className="text-sm text-[var(--color-text-secondary)] space-y-1 list-decimal list-inside">
                <li>Kho có gói Sponsor (hạng Gold &gt; Silver &gt; Bronze)</li>
                <li>Kho có đánh giá và lượt đánh giá cao</li>
                <li>Kho có chứng nhận chất lượng (HACCP, ISO, GDP...)</li>
              </ol>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mt-3">
                Nhờ đó, bạn luôn nhận được gợi ý kho tốt nhất — không phải kho phổ biến nhất.
              </p>
            </div>
          </div>
        </div>

        {/* ── Pricing / subscription ── */}
        <div className="mb-16">
          <h2 className="mb-2 text-center">Gói sử dụng AI Search</h2>
          <p className="text-[var(--color-text-secondary)] text-sm text-center mb-8">
            Chọn gói phù hợp để bắt đầu trải nghiệm tìm kiếm thông minh
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
              <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                Miễn phí
              </div>
              <div className="text-3xl font-extrabold mb-1">0đ</div>
              <div className="text-sm text-[var(--color-text-secondary)] mb-6">mãi mãi</div>
              <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-success)] mt-0.5">✓</span>
                  Tìm kiếm kho lạnh thông thường
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-text-muted)] mt-0.5">✗</span>
                  <span className="line-through opacity-50">AI Search</span>
                </li>
              </ul>
              <Link
                to="/register?role=renter"
                className="block mt-6 text-center px-4 py-2 border border-[var(--color-border)] text-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                Đăng ký miễn phí
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[var(--color-primary)] text-white p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[var(--color-warning)] text-white text-xs font-bold rounded-full">
                Phổ biến
              </div>
              <div className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-2">
                Pro
              </div>
              <div className="text-3xl font-extrabold mb-1">59.000đ</div>
              <div className="text-sm text-white/70 mb-6">/ tháng</div>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-start gap-2">
                  <span className="text-white mt-0.5">✓</span>
                  Tất cả tính năng tìm kiếm
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-0.5">✓</span>
                  AI Search không giới hạn
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-0.5">✓</span>
                  Gợi ý kho ưu tiên Sponsor
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-0.5">✓</span>
                  Hội thoại AI liên tục
                </li>
              </ul>
              <Link
                to="/renter/ai-subscription"
                className="block mt-6 text-center px-4 py-2 bg-white text-[var(--color-primary)] text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                Mua ngay
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
              <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                Doanh nghiệp
              </div>
              <div className="text-3xl font-extrabold mb-1">199.000đ</div>
              <div className="text-sm text-[var(--color-text-secondary)] mb-6">/ tháng</div>
              <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-success)] mt-0.5">✓</span>
                  Tất cả tính năng Pro
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-success)] mt-0.5">✓</span>
                  So sánh kho nâng cao
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-success)] mt-0.5">✓</span>
                  Ưu tiên hiển thị kho của bạn
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-success)] mt-0.5">✓</span>
                  Hỗ trợ ưu tiên
                </li>
              </ul>
              <Link
                to="/renter/ai-subscription"
                className="block mt-6 text-center px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Mua ngay
              </Link>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="bg-[var(--color-primary)] text-white p-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-4">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-white mb-4">Sẵn sàng tìm kho lạnh thông minh?</h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto text-sm">
            Đăng ký ngay để trải nghiệm AI Search miễn phí — tìm kho lạnh phù hợp trong vài giây.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register?role=renter"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-[var(--color-primary)] hover:bg-blue-50 transition-colors text-sm font-semibold"
            >
              Bắt đầu miễn phí
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white hover:text-[var(--color-primary)] transition-colors text-sm font-semibold"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
