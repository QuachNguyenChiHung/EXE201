import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from "react-router";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Footer } from "../components/Footer";

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Đã xảy ra lỗi";
  let message =
    "Có lỗi không mong đợi xảy ra. Vui lòng thử lại.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Không tìm thấy trang";
      message = "Trang bạn tìm kiếm không tồn tại.";
    } else {
      title = `Lỗi ${error.status}`;
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[var(--color-error)] flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-3">{title}</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors text-sm"
          >
            <Home className="h-4 w-4" />
            Trang chủ
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-2.5 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
        {import.meta.env.DEV && error instanceof Error && (
          <details className="mt-8 text-left">
            <summary className="text-sm text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text)]">
              Chi tiết lỗi (Dev)
            </summary>
            <pre className="mt-2 p-4 bg-[var(--color-bg-tertiary)] text-xs overflow-auto text-[var(--color-error)] max-h-48">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
      <Footer />
    </div>
  );
}