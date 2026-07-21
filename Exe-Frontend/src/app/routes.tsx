import { createBrowserRouter } from 'react-router';
import type { ComponentType } from 'react';

// Auth guard — small, eagerly loaded so route protection is instant.
import { ProtectedRoute } from './components/ProtectedRoute';

// Tiny / public pages — eager (first-paint)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import ErrorPage from './pages/ErrorPage';
import NotFound from './pages/NotFound';

// ── Code-split all role-specific pages ───────────────────────────────────────
// react-router 7's `lazy` field expects a function that resolves to a partial
// RouteObject (with `Component` / `element` / `path` set), not a raw module.
// So we use `lazy: () => import("...").then(m => ({ Component: m.default }))`.
//
// Big wins:
//   • leaflet + react-leaflet (warehouse form maps) no longer ship in the
//     initial bundle for landing/login/etc.
//   • recharts (dashboards) only loads when the user opens a dashboard.
//   • motion (animations) splits across pages instead of one mega-bundle.
//   • react-dnd, cmdk, embla-carousel, react-slick, etc. stay page-local.
const lazyPage = (loader: () => Promise<{ default: ComponentType<any> }>) => () =>
  loader().then((m) => ({ Component: m.default }));

export const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────────────────────
  {
    path: '/',
    Component: LandingPage,
    ErrorBoundary: ErrorPage,
  },
  {
    path: '/login',
    Component: LoginPage,
    ErrorBoundary: ErrorPage,
  },
  {
    path: '/register',
    Component: RegisterPage,
    ErrorBoundary: ErrorPage,
  },
  {
    path: '/about',
    Component: AboutPage,
    ErrorBoundary: ErrorPage,
  },
  {
    path: '/faq',
    Component: FAQPage,
    ErrorBoundary: ErrorPage,
  },

  // ── Renter routes (role: RENTER) ───────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['RENTER']} />,
    ErrorBoundary: ErrorPage,
    children: [
      { path: '/renter', lazy: lazyPage(() => import('./pages/renter/RenterDashboard')) },
      { path: '/renter/rented', lazy: lazyPage(() => import('./pages/renter/RentedProperties')) },
      { path: '/renter/requests', lazy: lazyPage(() => import('./pages/renter/RentalRequests')) },
      { path: '/renter/bookmarks', lazy: lazyPage(() => import('./pages/renter/Bookmarks')) },
      { path: '/renter/search', lazy: lazyPage(() => import('./pages/renter/SearchWarehouse')) },
      { path: '/renter/ai-search', lazy: lazyPage(() => import('./pages/renter/AISearchWarehouse')) },
      { path: '/renter/ai-subscription', lazy: lazyPage(() => import('./pages/renter/AISubscriptionPage')) },
      { path: '/renter/warehouse/:id', lazy: lazyPage(() => import('./pages/renter/WarehouseDetail')) },
    ],
  },

  // ── Warehouse owner routes (role: OWNER) ──────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['OWNER']} />,
    ErrorBoundary: ErrorPage,
    children: [
      { path: '/warehouse', lazy: lazyPage(() => import('./pages/warehouse/WarehouseDashboard')) },
      { path: '/warehouse/requests', lazy: lazyPage(() => import('./pages/warehouse/WarehouseRequests')) },
      { path: '/warehouse/contracts', lazy: lazyPage(() => import('./pages/warehouse/OwnerContracts')) },
      { path: '/warehouse/contracts/create/:requestId', lazy: lazyPage(() => import('./pages/warehouse/CreateContract')) },
      { path: '/warehouse/contracts/edit/:contractId', lazy: lazyPage(() => import('./pages/warehouse/EditContract')) },
      { path: '/warehouse/my-warehouses', lazy: lazyPage(() => import('./pages/warehouse/MyWarehouses')) },
      { path: '/warehouse/add', lazy: lazyPage(() => import('./pages/warehouse/AddWarehouse')) },
      { path: '/warehouse/edit/:id', lazy: lazyPage(() => import('./pages/warehouse/EditWarehouse')) },
      { path: '/warehouse/detail/:id', lazy: lazyPage(() => import('./pages/warehouse/MyWarehouseDetail')) },
      { path: '/warehouse/subscription', lazy: lazyPage(() => import('./pages/warehouse/SubscriptionManagement')) },
    ],
  },

  // ── Employee routes (role: EMPLOYEE) ──────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['EMPLOYEE']} />,
    ErrorBoundary: ErrorPage,
    children: [
      { path: '/employee', lazy: lazyPage(() => import('./pages/employee/EmployeeDashboard')) },
      { path: '/employee/warehouses', lazy: lazyPage(() => import('./pages/employee/ManageWarehouses')) },
      { path: '/employee/users', lazy: lazyPage(() => import('./pages/employee/ManageUsers')) },
      { path: '/employee/cert-types', lazy: lazyPage(() => import('./pages/employee/ManageCertTypes')) },
      { path: '/employee/contracts', lazy: lazyPage(() => import('./pages/employee/ManageContracts')) },
      { path: '/employee/ai-tiers', lazy: lazyPage(() => import('./pages/employee/ManageAiTiers')) },
      { path: '/employee/sponsor-tiers', lazy: lazyPage(() => import('./pages/employee/ManageSponsorTiers')) },
    ],
  },

  // ── Shared Authenticated routes ───────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['RENTER', 'OWNER', 'EMPLOYEE']} />,
    ErrorBoundary: ErrorPage,
    children: [
      { path: '/shared/requests/:id', lazy: lazyPage(() => import('./pages/shared/SharedRequestDetail')) },
      { path: '/shared/contracts/:id', lazy: lazyPage(() => import('./pages/shared/SharedContractDetail')) },
      { path: '/payment-success', lazy: lazyPage(() => import('./pages/PaymentSuccess')) },
      { path: '/payment-fail', lazy: lazyPage(() => import('./pages/PaymentFail')) },
      { path: '/profile', lazy: lazyPage(() => import('./pages/ProfilePage')) },
    ],
  },

  // ── 404 ────────────────────────────────────────────────────────────────────
  {
    path: '*',
    Component: NotFound,
    ErrorBoundary: ErrorPage,
  },
]);
