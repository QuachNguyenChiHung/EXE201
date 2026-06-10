import { createElement } from 'react';
import { createBrowserRouter } from 'react-router';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import ErrorPage from './pages/ErrorPage';

// Auth guard
import { ProtectedRoute } from './components/ProtectedRoute';

// Renter pages
import RenterDashboard from './pages/renter/RenterDashboard';
import SearchWarehouse from './pages/renter/SearchWarehouse';
import AISearchWarehouse from './pages/renter/AISearchWarehouse';
import WarehouseDetail from './pages/renter/WarehouseDetail';
import RentedProperties from './pages/renter/RentedProperties';
import Bookmarks from './pages/renter/Bookmarks';
import RentalRequests from './pages/renter/RentalRequests';

// Warehouse owner pages
import WarehouseDashboard from './pages/warehouse/WarehouseDashboard';
import AddWarehouse from './pages/warehouse/AddWarehouse';
import EditWarehouse from './pages/warehouse/EditWarehouse';
import MyWarehouses from './pages/warehouse/MyWarehouses';
import WarehouseRequests from './pages/warehouse/WarehouseRequests';
import OwnerContracts from './pages/warehouse/OwnerContracts';
import CreateContract from './pages/warehouse/CreateContract';
import SubscriptionManagement from './pages/warehouse/SubscriptionManagement';

// Employee pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import ManageWarehouses from './pages/employee/ManageWarehouses';
import ManageUsers from './pages/employee/ManageUsers';
import ManageCertTypes from './pages/employee/ManageCertTypes';
import ManageContracts from './pages/employee/ManageContracts';
import ManageRequestDetail from './pages/employee/ManageRequestDetail';
import ManageContractDetail from './pages/employee/ManageContractDetail';

// Shared
import NotFound from './pages/NotFound';

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
    element: createElement(ProtectedRoute, { allowedRoles: ['RENTER'] }),
    ErrorBoundary: ErrorPage,
    children: [
      { path: '/renter', Component: RenterDashboard },
      { path: '/renter/rented', Component: RentedProperties },
      { path: '/renter/requests', Component: RentalRequests },
      { path: '/renter/bookmarks', Component: Bookmarks },
      { path: '/renter/search', Component: SearchWarehouse },
      { path: '/renter/ai-search', Component: AISearchWarehouse },
      { path: '/renter/warehouse/:id', Component: WarehouseDetail },
    ],
  },

  // ── Warehouse owner routes (role: OWNER) ──────────────────────────────
  {
    element: createElement(ProtectedRoute, { allowedRoles: ['OWNER'] }),
    ErrorBoundary: ErrorPage,
    children: [
      { path: '/warehouse', Component: WarehouseDashboard },
      { path: '/warehouse/requests', Component: WarehouseRequests },
      { path: '/warehouse/contracts', Component: OwnerContracts },
      { path: '/warehouse/contracts/create/:requestId', Component: CreateContract },
      { path: '/warehouse/my-warehouses', Component: MyWarehouses },
      { path: '/warehouse/add', Component: AddWarehouse },
      { path: '/warehouse/edit/:id', Component: EditWarehouse },
      { path: '/warehouse/subscription', Component: SubscriptionManagement },
    ],
  },

  // ── Employee routes (role: EMPLOYEE) ──────────────────────────────────────
  {
    element: createElement(ProtectedRoute, { allowedRoles: ['EMPLOYEE'] }),
    ErrorBoundary: ErrorPage,
    children: [
      { path: '/employee', Component: EmployeeDashboard },
      { path: '/employee/warehouses', Component: ManageWarehouses },
      { path: '/employee/users', Component: ManageUsers },
      { path: '/employee/cert-types', Component: ManageCertTypes },
      { path: '/employee/contracts', Component: ManageContracts },
      { path: '/employee/requests/:id', Component: ManageRequestDetail },
      { path: '/employee/contracts/:id', Component: ManageContractDetail },
    ],
  },

  // ── 404 ────────────────────────────────────────────────────────────────────
  {
    path: '*',
    Component: NotFound,
    ErrorBoundary: ErrorPage,
  },
]);