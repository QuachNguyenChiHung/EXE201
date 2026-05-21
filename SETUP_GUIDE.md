# Setup Guide - Redux, Axios & TypeScript Models

This guide explains the complete setup for Redux Toolkit, Axios, and TypeScript models in your application.

## 📁 Project Structure

```
Exe-Frontend/
├── model/               # TypeScript types and interfaces
│   ├── types.ts        # All type definitions
│   └── index.ts        # Type exports
│
├── service/            # API service layer
│   ├── api.ts          # Axios instance configuration
│   ├── userService.ts  # User-related API calls
│   ├── warehouseService.ts  # Warehouse-related API calls
│   └── index.ts        # Service exports
│
└── store/              # Redux store configuration
    ├── index.ts        # Store setup
    ├── hooks.ts        # Typed Redux hooks
    └── slices/
        ├── authSlice.ts       # Authentication state
        └── warehouseSlice.ts  # Warehouse state
```

## 🚀 Configuration

### 1. Environment Variables

Create a `.env` file in the `Exe-Frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENV=development
```

### 2. Axios Configuration

The Axios instance is pre-configured with:
- Base URL from environment variables
- Request timeout (30 seconds)
- Authorization header injection from localStorage
- Global error handling (401, 403, 404, 500)
- Automatic token refresh on requests

### 3. Redux Store

The Redux store is configured with:
- **Auth Slice**: User authentication and profile management
- **Warehouse Slice**: Warehouse CRUD operations and search
- Redux DevTools (enabled in development)

## 📝 Usage Examples

### Using Redux in Components

```tsx
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, logout } from '../store/slices/authSlice';
import { fetchWarehouses } from '../store/slices/warehouseSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const { warehouses } = useAppSelector((state) => state.warehouse);

  const handleLogin = async () => {
    try {
      await dispatch(login({ email: 'user@example.com', password: 'password' })).unwrap();
      // Login successful
    } catch (error) {
      // Handle error
      console.error('Login failed:', error);
    }
  };

  const loadWarehouses = async () => {
    try {
      await dispatch(fetchWarehouses({ page: 1, pageSize: 10 })).unwrap();
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Using API Services Directly

```tsx
import { userService, warehouseService } from '../service';
import type { User, Warehouse } from '../model';

// Login
const loginUser = async () => {
  try {
    const response = await userService.login({
      email: 'user@example.com',
      password: 'password'
    });
    console.log('Logged in:', response.user);
  } catch (error) {
    console.error('Login error:', error);
  }
};

// Get warehouses with filters
const searchWarehouses = async () => {
  try {
    const result = await warehouseService.getWarehouses({
      city: 'Hanoi',
      minCapacity: 100,
      page: 1,
      pageSize: 20
    });
    console.log('Warehouses:', result.data);
  } catch (error) {
    console.error('Search error:', error);
  }
};

// Create warehouse
const createNewWarehouse = async () => {
  try {
    const warehouse = await warehouseService.createWarehouse({
      name: 'My Warehouse',
      location_address: '123 Main St',
      location_city: 'Hanoi',
      location_province: 'Hanoi',
      total_capacity: 1000,
      available_capacity: 1000,
      price_per_cubic_meter: 50000,
      // ... other fields
    });
    console.log('Created:', warehouse);
  } catch (error) {
    console.error('Create error:', error);
  }
};
```

### TypeScript Types

```tsx
import type { 
  User, 
  Warehouse, 
  RentRequest, 
  Contract,
  UserRole,
  WarehouseStatus 
} from '../model';

// Type-safe function parameters
function displayUser(user: User) {
  console.log(`${user.name} (${user.role})`);
}

// Type-safe state
interface ComponentState {
  warehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  filter: WarehouseStatus;
}
```

## 🔐 Authentication Flow

1. **Login/Register**: User credentials → API → Token stored in localStorage
2. **Authenticated Requests**: Axios interceptor adds token to all requests
3. **Token Refresh**: On 401 error, user is redirected to login
4. **Logout**: Token cleared from localStorage and Redux state

## 🗄️ Redux State Structure

```typescript
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    loading: boolean,
    error: string | null
  },
  warehouse: {
    warehouses: Warehouse[],
    currentWarehouse: Warehouse | null,
    myWarehouses: Warehouse[],
    featuredWarehouses: Warehouse[],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number,
    loading: boolean,
    error: string | null,
    filters: WarehouseSearchParams
  }
}
```

## 🎯 Available Redux Actions

### Auth Actions
- `login(credentials)` - User login
- `register(data)` - User registration
- `logout()` - User logout
- `getCurrentUser()` - Fetch current user profile
- `updateProfile(data)` - Update user profile
- `initializeAuth()` - Initialize auth from localStorage

### Warehouse Actions
- `fetchWarehouses(params)` - Get paginated warehouses
- `fetchWarehouseById(id)` - Get single warehouse
- `createWarehouse(data)` - Create new warehouse
- `updateWarehouse({ id, data })` - Update warehouse
- `deleteWarehouse(id)` - Delete warehouse
- `fetchMyWarehouses()` - Get user's warehouses
- `fetchFeaturedWarehouses()` - Get featured warehouses
- `uploadWarehouseImages({ id, files })` - Upload images

## 🛠️ API Endpoints (Expected)

The service layer expects these API endpoints:

### Auth
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

### Users
- `GET /users/me` - Get current user
- `PUT /users/me` - Update current user
- `POST /users/change-password` - Change password

### Warehouses
- `GET /warehouses` - List warehouses (with filters)
- `GET /warehouses/:id` - Get single warehouse
- `POST /warehouses` - Create warehouse
- `PUT /warehouses/:id` - Update warehouse
- `DELETE /warehouses/:id` - Delete warehouse
- `GET /warehouses/my` - Get user's warehouses
- `GET /warehouses/featured` - Get featured warehouses
- `POST /warehouses/:id/images` - Upload images

## 📦 Dependencies

Already installed:
- `axios` - HTTP client
- `@reduxjs/toolkit` - Redux state management
- `react-redux` - React bindings for Redux
- `react-router-dom` - Routing (if needed)

## 🎨 Next Steps

1. Create your React components and connect them to Redux
2. Set up your backend API to match the expected endpoints
3. Configure environment variables for different environments (dev, staging, prod)
4. Add additional Redux slices as needed (contracts, ratings, etc.)
5. Implement protected routes using the auth state
6. Add loading indicators and error boundaries

## 💡 Tips

- Use `useAppDispatch` and `useAppSelector` instead of plain Redux hooks for type safety
- Always handle async action errors with try/catch
- Store sensitive data (tokens) only in localStorage, never in Redux state serialization
- Use Redux DevTools for debugging state changes
- Consider adding Redux Persist if you need to persist more than just auth
