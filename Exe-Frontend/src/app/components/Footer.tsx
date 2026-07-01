import { Link } from "react-router";
import logoUrl from "../../assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)]">
      <div className="bento-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-md">
                <img src={logoUrl} alt="Logicha" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-xl tracking-tight">
                Logicha
              </span>
            </Link>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-xs">
              Nền tảng cho thuê kho lạnh hàng đầu Việt Nam. Kết
              nối doanh nghiệp với chủ kho thông minh và hiệu
              quả.
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-4">
              Liên kết
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                >
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link
                  to="/register?role=renter"
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                >
                  Tìm kho lạnh
                </Link>
              </li>
              <li>
                <Link
                  to="/register?role=warehouse"
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                >
                  Cho thuê kho
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-4">
              Liên hệ
            </div>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li>ailogisgroup@gmail.com</li>
              <li>+84 915 280 028</li>
              <li>Hồ Chí Minh, Việt Nam</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[var(--color-text-muted)] text-sm">
            © 2026 logicha. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a
              href="#"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            >
              Điều khoản
            </a>
            <a
              href="#"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            >
              Bảo mật
            </a>
            <a
              href="#"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            >
              Cookies
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}