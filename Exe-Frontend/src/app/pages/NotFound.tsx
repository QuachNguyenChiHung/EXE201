import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="flex items-center justify-center h-[calc(100vh-56px)] px-4">
        <div className="text-center max-w-sm">
          <div className="text-8xl font-extrabold text-[var(--color-primary)] mb-4">
            404
          </div>
          <div className="w-full h-0.5 bg-[var(--color-border)] mb-6" />
          <h1 className="mb-2" style={{ fontSize: "1.5rem" }}>
            Không tìm thấy trang
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mb-8">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được
            di chuyển.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="rounded-none border border-[var(--color-border)]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
            >
              <Home className="h-4 w-4 mr-2" />
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}