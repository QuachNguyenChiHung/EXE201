import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

import {
  ChevronDown,
  HelpCircle,
  Search,
  Sparkles,
  CreditCard,
  Shield,
  Package,
  Users,
  FileText,
  Settings,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // General
  {
    category: "general",
    question: "Logicha là gì?",
    answer:
      "Logicha là nền tảng kết nối cho thuê kho lạnh hàng đầu Việt Nam. Chúng tôi giúp doanh nghiệp tìm kiếm và thuê kho lạnh phù hợp một cách nhanh chóng, minh bạch và hiệu quả thông qua công nghệ AI tiên tiến.",
  },
  {
    category: "general",
    question: "Logicha hoạt động như thế nào?",
    answer:
      "Logicha kết nối doanh nghiệp cần thuê kho với chủ kho lạnh. Bạn có thể tìm kiếm kho thông qua bộ lọc truyền thống hoặc AI Search, xem thông tin chi tiết, vị trí trên bản đồ, và liên hệ trực tiếp với chủ kho.",
  },
  {
    category: "general",
    question: "Logicha có mất phí không?",
    answer:
      "Việc đăng ký và tìm kiếm kho lạnh hoàn toàn miễn phí. Chỉ có tính năng AI Search sử dụng mô hình pay-per-use (trả phí theo lượt sử dụng) với chi phí hợp lý.",
  },
  {
    category: "general",
    question: "Logicha phục vụ những khu vực nào?",
    answer:
      "Chúng tôi phục vụ trên toàn quốc với hệ thống kho lạnh tại 63 tỉnh thành Việt Nam. Bạn có thể tìm kiếm kho ở bất kỳ địa điểm nào bằng bản đồ tương tác hoặc bộ lọc vị trí.",
  },

  // For Renters
  {
    category: "renter",
    question: "Làm thế nào để tìm kho lạnh phù hợp?",
    answer:
      "Bạn có 2 cách: (1) Sử dụng bộ lọc truyền thống với các tiêu chí như diện tích, nhiệt độ, vị trí, giá cả. (2) Sử dụng AI Search để mô tả nhu cầu bằng ngôn ngữ tự nhiên, hệ thống AI sẽ tìm và gợi ý kho phù hợp nhất.",
  },
  {
    category: "renter",
    question: "AI Search hoạt động như thế nào?",
    answer:
      'AI Search cho phép bạn mô tả nhu cầu bằng tiếng Việt tự nhiên như "Cần thuê kho lạnh 500m² ở Hà Nội để bảo quản hải sản, nhiệt độ -18°C". Hệ thống AI sẽ hiểu yêu cầu và tìm kiếm kho phù hợp. Tính năng này tính phí theo lượt sử dụng.',
  },
  {
    category: "renter",
    question: "Chi phí AI Search là bao nhiêu?",
    answer:
      "AI Search sử dụng mô hình pay-per-use. Mỗi lượt tìm kiếm có chi phí từ 5,000 - 10,000 VNĐ tùy độ phức tạp. Bạn sẽ thấy ước tính chi phí trước khi xác nhận sử dụng.",
  },
  {
    category: "renter",
    question: "Tôi có thể lưu kho yêu thích không?",
    answer:
      "Có. Bạn có thể thêm kho vào danh sách yêu thích để so sánh và theo dõi. Tất cả kho yêu thích được lưu trong Dashboard của bạn.",
  },
  {
    category: "renter",
    question: "Làm thế nào để liên hệ với chủ kho?",
    answer:
      "Sau khi tìm được kho phù hợp, bạn có thể xem thông tin liên hệ của chủ kho (số điện thoại, email) ngay trên trang chi tiết. Bạn liên hệ trực tiếp với chủ kho để thương lượng điều khoản.",
  },

  // For Warehouse Owners
  {
    category: "warehouse",
    question: "Làm thế nào để đăng kho lạnh lên Logicha?",
    answer:
      "Sau khi đăng ký tài khoản Chủ kho, bạn vào Dashboard > Thêm kho mới. Điền đầy đủ thông tin như diện tích, nhiệt độ, địa chỉ, giá thuê, hình ảnh và chứng nhận (nếu có). Sau khi gửi, nhân viên sẽ kiểm duyệt trong 24-48h.",
  },
  {
    category: "warehouse",
    question: "Tôi có cần chứng nhận không?",
    answer:
      "Không bắt buộc, nhưng rất khuyến khích. Kho có chứng nhận (HACCP, ISO, GMP...) sẽ được ưu tiên hiển thị và tạo niềm tin với khách hàng. Kho chưa có chứng nhận sẽ có cảnh báo nhẹ để khách hàng biết.",
  },
  {
    category: "warehouse",
    question: "Logicha có tính phí đăng kho không?",
    answer:
      "Đăng kho hoàn toàn miễn phí. Chúng tôi không tính phí hoa hồng hay phí hàng tháng. Bạn chỉ cần đảm bảo thông tin chính xác và cập nhật tình trạng kho thường xuyên.",
  },
  {
    category: "warehouse",
    question: "Làm thế nào để quản lý đặt chỗ?",
    answer:
      "Bạn tự quản lý đặt chỗ trực tiếp với khách hàng. Logicha cung cấp dashboard để bạn theo dõi lượt xem, lượt liên hệ, và cập nhật tình trạng kho (còn trống/đã thuê).",
  },

  // Technical
  {
    category: "technical",
    question: "Tôi quên mật khẩu, phải làm sao?",
    answer:
      'Nhấn "Quên mật khẩu" ở trang đăng nhập, nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu qua email trong vài phút.',
  },
  {
    category: "technical",
    question: "Làm thế nào để thay đổi thông tin tài khoản?",
    answer:
      'Vào Dashboard > Nhấn vào tên người dùng > Chọn "Cài đặt tài khoản". Tại đây bạn có thể cập nhật tên, số điện thoại, email, và mật khẩu.',
  },
  {
    category: "technical",
    question: "Tôi gặp lỗi khi sử dụng bản đồ?",
    answer:
      "Hãy đảm bảo trình duyệt cho phép truy cập vị trí của bạn. Nếu vẫn lỗi, thử làm mới trang (F5) hoặc xóa cache trình duyệt. Liên hệ support@logicha.vn nếu vấn đề vẫn tiếp tục.",
  },
  {
    category: "technical",
    question: "Logicha có ứng dụng di động không?",
    answer:
      "Hiện tại Logicha là web app responsive hoạt động tốt trên mọi thiết bị. Ứng dụng di động native đang được phát triển và sẽ ra mắt trong quý tới.",
  },

  // Safety & Policy
  {
    category: "policy",
    question: "Thông tin của tôi có được bảo mật không?",
    answer:
      "Có. Chúng tôi tuân thủ nghiêm ngặt các quy định về bảo mật dữ liệu. Thông tin cá nhân được mã hóa và chỉ được sử dụng cho mục đích kết nối thuê kho. Xem thêm tại Chính sách bảo mật.",
  },
  {
    category: "policy",
    question: "Nếu có tranh chấp với chủ kho thì sao?",
    answer:
      "Logicha là nền tảng kết nối, không trực tiếp tham gia vào hợp đồng thuê kho giữa hai bên. Tuy nhiên, chúng tôi sẵn sàng hỗ trợ làm trung gian hòa giải nếu cần. Liên hệ support@logicha.vn.",
  },
  {
    category: "policy",
    question: "Tôi có thể xóa tài khoản không?",
    answer:
      "Có. Vào Cài đặt tài khoản > Xóa tài khoản. Lưu ý rằng việc này sẽ xóa vĩnh viễn tất cả dữ liệu của bạn và không thể khôi phục.",
  },
];

const categories = [
  { id: "all", name: "Tất cả", icon: HelpCircle },
  { id: "general", name: "Chung", icon: FileText },
  { id: "renter", name: "Doanh nghiệp thuê kho", icon: Search },
  { id: "warehouse", name: "Chủ kho", icon: Package },
  { id: "technical", name: "Kỹ thuật", icon: Settings },
  { id: "policy", name: "Chính sách", icon: Shield },
];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] =
    useState("all");
  const [openIndex, setOpenIndex] = useState<number | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "all" ||
      faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      faq.question
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      faq.answer
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (index: number) =>
    setOpenIndex(openIndex === index ? null : index);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <div className="bento-container py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[var(--color-info)] flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
              Trợ giúp
            </span>
          </div>
          <h1 className="mb-3">Câu hỏi thường gặp</h1>
          <p className="text-[var(--color-text-secondary)] max-w-xl">
            Tìm câu trả lời cho những thắc mắc của bạn về
            Logicha
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl">
          {filteredFAQs.length === 0 ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-12 text-center">
              <HelpCircle className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-[var(--color-text-secondary)] text-sm">
                Không tìm thấy câu hỏi nào phù hợp. Thử tìm kiếm
                khác hoặc liên hệ với chúng tôi.
              </p>
            </div>
          ) : (
            <div className="border border-[var(--color-border)]">
              {filteredFAQs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className={`border-b border-[var(--color-border)] last:border-b-0 ${isOpen ? "bg-[var(--color-primary-50)]" : "bg-[var(--color-surface)]"}`}
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full flex items-center justify-between text-left px-6 py-4"
                    >
                      <span className="text-sm pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 border-t border-[var(--color-primary-200)]">
                        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed pt-4">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="max-w-4xl mt-16">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-10 text-center">
            <h2 className="mb-2">Vẫn còn thắc mắc?</h2>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="mailto:support@logicha.vn"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-[var(--color-primary)] text-white text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                support@logicha.vn
              </a>
              <a
                href="tel:+84123456789"
                className="inline-flex items-center justify-center px-6 py-2.5 border border-[var(--color-border)] text-sm hover:border-[var(--color-primary)] transition-colors"
              >
                +84 123 456 789
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}