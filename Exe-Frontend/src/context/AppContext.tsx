/**
 * AppContext.tsx - Simple context-based state management
 * Replaces Redux with React Context + mock API
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, ColdStorage, RentRequest, RentalContract, WarehouseRating } from '../types';
import { 
  authAPI, 
  warehousesAPI, 
  requestsAPI, 
  contractsAPI, 
  ratingsAPI,
  bookmarksAPI,
  usersAPI 
} from '../services/apiClient';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Data
  users: User[];
  warehouses: ColdStorage[];
  requests: RentRequest[];
  contracts: RentalContract[];
  ratings: WarehouseRating[];
  
  // Bookmarks
  bookmarkedIds: string[];
  compareIds: string[];
  
  // Loading states
  loading: {
    users: boolean;
    warehouses: boolean;
    requests: boolean;
    contracts: boolean;
    ratings: boolean;
  };
}

interface AppContextValue extends AppState {
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  
  // Data actions
  refreshUsers: () => Promise<void>;
  refreshWarehouses: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  refreshContracts: () => Promise<void>;
  refreshRatings: () => Promise<void>;
  
  // User actions
  adminUpdateUser: (id: string, updates: Partial<User>) => Promise<void>;
  
  // Warehouse actions
  createWarehouse: (warehouse: ColdStorage) => Promise<void>;
  updateWarehouse: (id: string, updates: Partial<ColdStorage>) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
  
  // Request actions
  createRequest: (request: RentRequest) => Promise<void>;
  updateRequest: (id: string, updates: Partial<RentRequest>) => Promise<void>;
  withdrawRequest: (id: string) => Promise<void>;
  
  // Contract actions
  createContract: (contract: RentalContract) => Promise<void>;
  updateContract: (id: string, updates: Partial<RentalContract>) => Promise<void>;
  cancelContract: (id: string) => Promise<void>;
  
  // Rating actions
  submitRating: (rating: WarehouseRating) => Promise<void>;
  updateRating: (id: string, updates: Partial<WarehouseRating>) => Promise<void>;
  deleteRating: (id: string) => Promise<void>;
  
  // Bookmark actions
  toggleBookmark: (warehouseId: string) => Promise<void>;
  toggleCompare: (warehouseId: string) => void;
  clearCompare: () => void;
  clearAllBookmarks: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    isAuthenticated: false,
    users: [],
    warehouses: [],
    requests: [],
    contracts: [],
    ratings: [],
    bookmarkedIds: [],
    compareIds: [],
    loading: {
      users: false,
      warehouses: false,
      requests: false,
      contracts: false,
      ratings: false,
    },
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setState(prev => ({ ...prev, user, isAuthenticated: true }));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Load bookmarks when user changes
  useEffect(() => {
    if (state.user) {
      bookmarksAPI.getByUser(state.user.id).then(data => {
        setState(prev => ({ ...prev, bookmarkedIds: data.warehouseIds }));
      }).catch(console.error);
    } else {
      setState(prev => ({ ...prev, bookmarkedIds: [], compareIds: [] }));
    }
  }, [state.user?.id]);

  // Auth actions
  const login = async (email: string, password: string) => {
    const user = await authAPI.login(email, password);
    localStorage.setItem('user', JSON.stringify(user));
    setState(prev => ({ ...prev, user, isAuthenticated: true }));
  };

  const logout = () => {
    localStorage.removeItem('user');
    setState(prev => ({ 
      ...prev, 
      user: null, 
      isAuthenticated: false,
      bookmarkedIds: [],
      compareIds: [],
    }));
  };

  const setUser = (user: User | null) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setState(prev => ({ ...prev, user, isAuthenticated: true }));
    } else {
      logout();
    }
  };

  // Data refresh actions
  const refreshUsers = async () => {
    setState(prev => ({ ...prev, loading: { ...prev.loading, users: true } }));
    try {
      const users = await usersAPI.getAll();
      setState(prev => ({ ...prev, users }));
    } finally {
      setState(prev => ({ ...prev, loading: { ...prev.loading, users: false } }));
    }
  };

  const refreshWarehouses = async () => {
    setState(prev => ({ ...prev, loading: { ...prev.loading, warehouses: true } }));
    try {
      const warehouses = await warehousesAPI.getAll();
      setState(prev => ({ ...prev, warehouses }));
    } finally {
      setState(prev => ({ ...prev, loading: { ...prev.loading, warehouses: false } }));
    }
  };

  const refreshRequests = async () => {
    setState(prev => ({ ...prev, loading: { ...prev.loading, requests: true } }));
    try {
      const requests = await requestsAPI.getAll();
      setState(prev => ({ ...prev, requests }));
    } finally {
      setState(prev => ({ ...prev, loading: { ...prev.loading, requests: false } }));
    }
  };

  const refreshContracts = async () => {
    setState(prev => ({ ...prev, loading: { ...prev.loading, contracts: true } }));
    try {
      const contracts = await contractsAPI.getAll();
      setState(prev => ({ ...prev, contracts }));
    } finally {
      setState(prev => ({ ...prev, loading: { ...prev.loading, contracts: false } }));
    }
  };

  const refreshRatings = async () => {
    setState(prev => ({ ...prev, loading: { ...prev.loading, ratings: true } }));
    try {
      const ratings = await ratingsAPI.getAll();
      setState(prev => ({ ...prev, ratings }));
    } finally {
      setState(prev => ({ ...prev, loading: { ...prev.loading, ratings: false } }));
    }
  };

  // User actions
  const adminUpdateUser = async (id: string, updates: Partial<User>) => {
    await usersAPI.update(id, updates);
    await refreshUsers();
  };

  // Warehouse actions
  const createWarehouse = async (warehouse: ColdStorage) => {
    await warehousesAPI.create(warehouse);
    await refreshWarehouses();
  };

  const updateWarehouse = async (id: string, updates: Partial<ColdStorage>) => {
    await warehousesAPI.update(id, updates);
    await refreshWarehouses();
  };

  const deleteWarehouse = async (id: string) => {
    await warehousesAPI.delete(id);
    await refreshWarehouses();
  };

  // Request actions
  const createRequest = async (request: RentRequest) => {
    await requestsAPI.create(request);
    await refreshRequests();
  };

  const updateRequest = async (id: string, updates: Partial<RentRequest>) => {
    await requestsAPI.update(id, updates);
    await refreshRequests();
  };

  const withdrawRequest = async (id: string) => {
    await requestsAPI.delete(id);
    await refreshRequests();
  };

  // Contract actions
  const createContract = async (contract: RentalContract) => {
    await contractsAPI.create(contract);
    await refreshContracts();
  };

  const updateContract = async (id: string, updates: Partial<RentalContract>) => {
    await contractsAPI.update(id, updates);
    await refreshContracts();
  };

  const cancelContract = async (id: string) => {
    await contractsAPI.update(id, { status: 'cancelled' as any });
    await refreshContracts();
  };

  // Rating actions
  const submitRating = async (rating: WarehouseRating) => {
    await ratingsAPI.create(rating);
    await refreshRatings();
    await refreshWarehouses(); // Refresh to update rating stats
  };

  const updateRating = async (id: string, updates: Partial<WarehouseRating>) => {
    await ratingsAPI.update(id, updates);
    await refreshRatings();
    await refreshWarehouses();
  };

  const deleteRating = async (id: string) => {
    await ratingsAPI.delete(id);
    await refreshRatings();
    await refreshWarehouses();
  };

  // Bookmark actions
  const toggleBookmark = async (warehouseId: string) => {
    if (!state.user) return;
    
    const newBookmarks = state.bookmarkedIds.includes(warehouseId)
      ? state.bookmarkedIds.filter(id => id !== warehouseId)
      : [...state.bookmarkedIds, warehouseId];
    
    await bookmarksAPI.saveForUser(state.user.id, newBookmarks);
    setState(prev => ({ ...prev, bookmarkedIds: newBookmarks }));
  };

  const toggleCompare = (warehouseId: string) => {
    setState(prev => ({
      ...prev,
      compareIds: prev.compareIds.includes(warehouseId)
        ? prev.compareIds.filter(id => id !== warehouseId)
        : [...prev.compareIds, warehouseId],
    }));
  };

  const clearCompare = () => {
    setState(prev => ({ ...prev, compareIds: [] }));
  };

  const clearAllBookmarks = async () => {
    if (!state.user) return;
    await bookmarksAPI.saveForUser(state.user.id, []);
    setState(prev => ({ ...prev, bookmarkedIds: [] }));
  };

  const value: AppContextValue = {
    ...state,
    login,
    logout,
    setUser,
    refreshUsers,
    refreshWarehouses,
    refreshRequests,
    refreshContracts,
    refreshRatings,
    adminUpdateUser,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    createRequest,
    updateRequest,
    withdrawRequest,
    createContract,
    updateContract,
    cancelContract,
    submitRating,
    updateRating,
    deleteRating,
    toggleBookmark,
    toggleCompare,
    clearCompare,
    clearAllBookmarks,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
