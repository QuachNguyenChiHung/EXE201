import { Link, useNavigate, useLocation } from "react-router";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { getUser, setUser, getBookmarks } from "../../utils/auth";
import {
  Warehouse,
  User,
  LogOut,
  Search,
  Sparkles,
  LayoutDashboard,
  ClipboardList,
  Heart,
  Send,
  Bell,
  FileText,
  Crown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// ─── Active bottom-border indicator ──────────────────────────────────────────
const ACTIVE_BAR = {
  position: "absolute" as const,
  bottom: 0,
  left: 0,
  right: 0,
  height: "2px",
  background: "var(--color-primary)",
};

/** Wraps a ghost Button with an active bottom-border underline */
function NavBtn({
  onClick,
  active,
  className = "",
  children,
}: {
  onClick: () => void;
  active: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full flex items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={`rounded-none ${className}`}
        style={active ? { color: "var(--color-primary)" } : undefined}
      >
        {children}
      </Button>
      {active && <div style={ACTIVE_BAR} />}
    </div>
  );
}

/** Wraps a raw <button> (e.g. badge buttons) with an active bottom-border underline */
function NavRawBtn({
  onClick,
  active,
  className = "",
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full flex items-center">
      <button
        onClick={onClick}
        title={title}
        className={className}
        style={active ? { color: "var(--color-primary)" } : undefined}
      >
        {children}
      </button>
      {active && <div style={ACTIVE_BAR} />}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
export function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUserState] = useState(getUser());
  const [bookmarkCount, setBookmarkCount] = useState(getBookmarks().length);

  useEffect(() => {
    const handleStorageChange = () => {
      setUserState(getUser());
      setBookmarkCount(getBookmarks().length);
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    setUser(null);
    setUserState(null);
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (user.role) {
      case "renter": return "/renter";
      case "warehouse": return "/warehouse";
      case "employee": return "/employee";
      default: return "/";
    }
  };

  const isActive = (base: string, exact = false) => {
    if (exact) return pathname === base;
    return pathname === base || pathname.startsWith(base + "/");
  };

  const isAuthenticated = !!user;

  return (
    <nav
      className="border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0"
      style={{ zIndex: "var(--z-sticky)" }}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 h-14 flex justify-between items-stretch">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[var(--color-primary)] flex items-center justify-center">
            <Warehouse className="h-4 w-4 text-white" />
          </div>
          <span
            className="font-extrabold text-lg tracking-tight text-[var(--color-text)]"
            style={{ letterSpacing: "-0.02em" }}
          >
            Logicha
          </span>
        </Link>

        {/* Nav actions */}
        <div className="flex items-stretch gap-0">
          {isAuthenticated && user ? (
            <>
              {/* ── Dashboard ── */}
              <NavBtn
                onClick={() => navigate(getDashboardLink())}
                active={isActive(getDashboardLink(), true)}
                className="hidden sm:flex"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </NavBtn>

              {/* ── Renter nav ── */}
              {user.role === "renter" && (
                <>
                  <NavBtn
                    onClick={() => navigate("/renter/search")}
                    active={isActive("/renter/search")}
                    className="hidden sm:flex"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Tìm kiếm
                  </NavBtn>

                  <NavBtn
                    onClick={() => navigate("/renter/ai-search")}
                    active={isActive("/renter/ai-search")}
                    className="hidden sm:flex"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Search
                  </NavBtn>

                  <NavBtn
                    onClick={() => navigate("/renter/rented")}
                    active={isActive("/renter/rented")}
                    className="hidden sm:flex"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Kho đang thuê
                  </NavBtn>

                  <NavBtn
                    onClick={() => navigate("/renter/requests")}
                    active={isActive("/renter/requests")}
                    className="hidden sm:flex"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Yêu cầu thuê
                  </NavBtn>

                  {/* Bookmarks icon with badge */}
                  <NavRawBtn
                    onClick={() => navigate("/renter/bookmarks")}
                    active={isActive("/renter/bookmarks")}
                    title="Kho đã lưu"
                    className="relative hidden sm:flex items-center justify-center w-9 hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    <Heart
                      className="h-4 w-4"
                      style={{
                        color:
                          bookmarkCount > 0
                            ? "var(--color-error)"
                            : isActive("/renter/bookmarks")
                              ? "var(--color-primary)"
                              : "var(--color-text-muted)",
                        fill:
                          bookmarkCount > 0
                            ? "var(--color-error)"
                            : "none",
                      }}
                    />
                    {bookmarkCount > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[10px] text-white"
                        style={{
                          background: "var(--color-error)",
                          fontWeight: 700,
                        }}
                      >
                        {bookmarkCount > 9 ? "9+" : bookmarkCount}
                      </span>
                    )}
                  </NavRawBtn>
                </>
              )}

              {/* ── Warehouse owner nav ── */}
              {user.role === "warehouse" && (
                <>
                  <NavBtn
                    onClick={() => navigate("/warehouse/my-warehouses")}
                    active={isActive("/warehouse/my-warehouses")}
                    className="hidden sm:flex"
                  >
                    <Warehouse className="h-4 w-4 mr-2" />
                    Kho của tôi
                  </NavBtn>

                  <NavRawBtn
                    onClick={() => navigate("/warehouse/requests")}
                    active={isActive("/warehouse/requests")}
                    className="relative hidden sm:flex items-center gap-1.5 px-3 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    <Bell className="h-4 w-4" />
                    <span style={{ color: isActive("/warehouse/requests") ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                      Yêu cầu thuê
                    </span>
                    <span
                      className="w-4 h-4 flex items-center justify-center text-[10px] text-white"
                      style={{ background: "var(--color-error)", fontWeight: 700 }}
                    >
                      3
                    </span>
                  </NavRawBtn>

                  <NavBtn
                    onClick={() => navigate("/warehouse/contracts")}
                    active={isActive("/warehouse/contracts")}
                    className="hidden sm:flex"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Hợp đồng
                  </NavBtn>

                  <NavBtn
                    onClick={() => navigate("/warehouse/subscription")}
                    active={isActive("/warehouse/subscription")}
                    className="hidden sm:flex"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Gói VIP
                  </NavBtn>
                </>
              )}

              {/* ── User dropdown ── */}
              <div className="flex items-center ml-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none gap-2"
                    >
                      <div className="w-6 h-6 bg-[var(--color-primary-100)] flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                      </div>
                      <span className="hidden sm:inline">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-none border border-[var(--color-border)] bg-white"
                  >
                    <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate(getDashboardLink())}
                      className="rounded-none"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>

                    {user.role === "renter" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => navigate("/renter/search")}
                          className="rounded-none"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Tìm kiếm kho
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/renter/ai-search")}
                          className="rounded-none"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Search
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/renter/rented")}
                          className="rounded-none"
                        >
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Kho đang thuê
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/renter/requests")}
                          className="rounded-none"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Yêu cầu thuê kho
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/renter/bookmarks")}
                          className="rounded-none"
                        >
                          <Heart
                            className="h-4 w-4 mr-2"
                            style={{ color: "var(--color-error)" }}
                          />
                          Kho đã lưu
                          {bookmarkCount > 0 && (
                            <span
                              className="ml-auto text-xs px-1.5 py-0.5 text-white"
                              style={{ background: "var(--color-error)" }}
                            >
                              {bookmarkCount}
                            </span>
                          )}
                        </DropdownMenuItem>
                      </>
                    )}

                    {user.role === "warehouse" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => navigate("/warehouse/my-warehouses")}
                          className="rounded-none"
                        >
                          <Warehouse className="h-4 w-4 mr-2" />
                          Kho của tôi
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/warehouse/requests")}
                          className="rounded-none"
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Yêu cầu thuê kho
                          <span
                            className="ml-auto text-xs px-1.5 py-0.5 text-white"
                            style={{ background: "var(--color-error)" }}
                          >
                            3
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/warehouse/contracts")}
                          className="rounded-none"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Hợp đồng
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate("/warehouse/subscription")}
                          className="rounded-none"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Gói VIP
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="rounded-none text-[var(--color-error)]"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <>
              {/* ── Public nav ── */}
              <NavBtn
                onClick={() => navigate("/about")}
                active={isActive("/about")}
                className="hidden md:flex"
              >
                Về chúng tôi
              </NavBtn>

              <NavBtn
                onClick={() => navigate("/faq")}
                active={isActive("/faq")}
                className="hidden md:flex"
              >
                FAQ
              </NavBtn>

              <div className="flex items-center gap-1 ml-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="rounded-none"
                  style={
                    isActive("/login")
                      ? { color: "var(--color-primary)" }
                      : undefined
                  }
                >
                  Đăng nhập
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                >
                  Đăng ký
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}