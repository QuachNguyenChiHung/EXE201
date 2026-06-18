/**
 * AppContext.tsx - Simple context-based state management
 * Replaces Redux with React Context + mock API
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, CompositeWarehouse, CompositeRentRequest, CompositeContract, Rating } from '../types';
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
  isAuthenticated: boolean;

  // Data
  users: User[];
  warehouses: CompositeWarehouse[];
  requests: CompositeRentRequest[];
  contracts: CompositeContract[];
  ratings: Rating[];

  // Compare
  compareWarehouses: CompositeWarehouse[];

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


  // Data actions
  refreshUsers: () => Promise<void>;
  refreshWarehouses: () => Promise<void>;
  refreshRequests: () => Promise<void>;
  refreshContracts: () => Promise<void>;
  refreshRatings: () => Promise<void>;

  // User actions
  adminUpdateUser: (id: number, updates: Partial<User>) => Promise<void>;

  // Warehouse actions
  createWarehouse: (warehouse: CompositeWarehouse) => Promise<void>;
  updateWarehouse: (id: string | number, updates: Partial<CompositeWarehouse>) => Promise<void>;
  deleteWarehouse: (id: string | number) => Promise<void>;

  // Request actions
  createRequest: (request: CompositeRentRequest) => Promise<void>;
  updateRequest: (id: string | number, updates: Partial<CompositeRentRequest>) => Promise<void>;
  withdrawRequest: (id: string | number) => Promise<void>;

  // Contract actions
  createContract: (contract: CompositeContract) => Promise<void>;
  updateContract: (id: string | number, updates: Partial<CompositeContract>) => Promise<void>;
  cancelContract: (id: string | number) => Promise<void>;

  // Rating actions
  submitRating: (rating: Rating) => Promise<void>;
  updateRating: (id: string | number, updates: Partial<Rating>) => Promise<void>;
  deleteRating: (id: string | number) => Promise<void>;

  // Compare actions
  compareIds: number[];
  toggleCompare: (warehouse: CompositeWarehouse) => void;
  clearCompare: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    users: [],
    warehouses: [],
    requests: [],
    contracts: [],
    ratings: [],
    compareWarehouses: [],
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
  const adminUpdateUser = async (id: number, updates: Partial<User>) => {
    await usersAPI.update(id, updates);
    await refreshUsers();
  };

  // Warehouse actions
  const createWarehouse = async (warehouse: CompositeWarehouse) => {
    await warehousesAPI.create(warehouse as any);
    await refreshWarehouses();
  };

  const updateWarehouse = async (id: string | number, updates: Partial<CompositeWarehouse>) => {
    await warehousesAPI.update(id as any, updates as any);
    await refreshWarehouses();
  };

  const deleteWarehouse = async (id: string | number) => {
    await warehousesAPI.delete(id as any);
    await refreshWarehouses();
  };

  // Request actions
  const createRequest = async (request: CompositeRentRequest) => {
    await requestsAPI.create(request as any);
    await refreshRequests();
  };

  const updateRequest = async (id: string | number, updates: Partial<CompositeRentRequest>) => {
    await requestsAPI.update(id as any, updates as any);
    await refreshRequests();
  };

  const withdrawRequest = async (id: string | number) => {
    await requestsAPI.delete(id as any);
    await refreshRequests();
  };

  // Contract actions
  const createContract = async (contract: CompositeContract) => {
    await contractsAPI.create(contract as any);
    await refreshContracts();
  };

  const updateContract = async (id: string | number, updates: Partial<CompositeContract>) => {
    await contractsAPI.update(id as any, updates as any);
    await refreshContracts();
  };

  const cancelContract = async (id: string | number) => {
    await contractsAPI.update(id as any, { status: 'cancelled' as any });
    await refreshContracts();
  };

  // Rating actions
  const submitRating = async (rating: Rating) => {
    await ratingsAPI.create(rating as any);
    await refreshRatings();
    await refreshWarehouses(); // Refresh to update rating stats
  };

  const updateRating = async (id: string | number, updates: Partial<Rating>) => {
    await ratingsAPI.update(id as any, updates as any);
    await refreshRatings();
    await refreshWarehouses();
  };

  const deleteRating = async (id: string | number) => {
    await ratingsAPI.delete(id as any);
    await refreshRatings();
    await refreshWarehouses();
  };

  // Compare actions
  const toggleCompare = (warehouse: CompositeWarehouse) => {
    setState(prev => {
      const exists = prev.compareWarehouses.some(w => w.id_warehouse === warehouse.id_warehouse);
      return {
        ...prev,
        compareWarehouses: exists
          ? prev.compareWarehouses.filter(w => w.id_warehouse !== warehouse.id_warehouse)
          : [...prev.compareWarehouses, warehouse],
      };
    });
  };

  const clearCompare = () => {
    setState(prev => ({ ...prev, compareWarehouses: [] }));
  };

  const value: AppContextValue = {
    ...state,
    compareIds: state.compareWarehouses.map(w => w.id_warehouse),
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
    toggleCompare,
    clearCompare,
  };

  // Auto-load mock data on app start so pages have initial data without needing Data Migration
  useEffect(() => {
    // Fire-and-forget — these populate the in-memory mock stores exposed by services/apiClient
    refreshUsers().catch(() => { });
    refreshWarehouses().catch(() => { });
    refreshRequests().catch(() => { });
    refreshContracts().catch(() => { });
    refreshRatings().catch(() => { });
  }, []);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
