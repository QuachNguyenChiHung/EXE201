import { createSlice, createAsyncThunk,type PayloadAction } from '@reduxjs/toolkit';
import { warehouseService, type WarehouseSearchParams } from '../../service';
import type { Warehouse, PaginatedResponse } from '../../model/types';

interface WarehouseState {
    warehouses: Warehouse[];
    currentWarehouse: Warehouse | null;
    myWarehouses: Warehouse[];
    featuredWarehouses: Warehouse[];

    // Pagination
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;

    // UI State
    loading: boolean;
    error: string | null;

    // Filters
    filters: WarehouseSearchParams;
}

const initialState: WarehouseState = {
    warehouses: [],
    currentWarehouse: null,
    myWarehouses: [],
    featuredWarehouses: [],

    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,

    loading: false,
    error: null,

    filters: {},
};

// Async thunks
export const fetchWarehouses = createAsyncThunk<
    PaginatedResponse<Warehouse>,
    WarehouseSearchParams | undefined
>(
    'warehouse/fetchWarehouses',
    async (params, { rejectWithValue }) => {
        try {
            return await warehouseService.getWarehouses(params);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch warehouses');
        }
    }
);

export const fetchWarehouseById = createAsyncThunk<Warehouse, string>(
    'warehouse/fetchWarehouseById',
    async (id, { rejectWithValue }) => {
        try {
            return await warehouseService.getWarehouseById(id);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch warehouse');
        }
    }
);

export const createWarehouse = createAsyncThunk<Warehouse, Partial<Warehouse>>(
    'warehouse/createWarehouse',
    async (data, { rejectWithValue }) => {
        try {
            return await warehouseService.createWarehouse(data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create warehouse');
        }
    }
);

export const updateWarehouse = createAsyncThunk<
    Warehouse,
    { id: string; data: Partial<Warehouse> }
>(
    'warehouse/updateWarehouse',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            return await warehouseService.updateWarehouse(id, data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update warehouse');
        }
    }
);

export const deleteWarehouse = createAsyncThunk<string, string>(
    'warehouse/deleteWarehouse',
    async (id, { rejectWithValue }) => {
        try {
            await warehouseService.deleteWarehouse(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete warehouse');
        }
    }
);

export const fetchMyWarehouses = createAsyncThunk<Warehouse[]>(
    'warehouse/fetchMyWarehouses',
    async (_, { rejectWithValue }) => {
        try {
            return await warehouseService.getMyWarehouses();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch your warehouses');
        }
    }
);

export const fetchFeaturedWarehouses = createAsyncThunk<Warehouse[]>(
    'warehouse/fetchFeaturedWarehouses',
    async (_, { rejectWithValue }) => {
        try {
            return await warehouseService.getFeaturedWarehouses();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured warehouses');
        }
    }
);

export const uploadWarehouseImages = createAsyncThunk<
    { id: string; images: string[] },
    { id: string; files: File[] }
>(
    'warehouse/uploadImages',
    async ({ id, files }, { rejectWithValue }) => {
        try {
            const images = await warehouseService.uploadImages(id, files);
            return { id, images };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to upload images');
        }
    }
);

const warehouseSlice = createSlice({
    name: 'warehouse',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setFilters: (state, action: PayloadAction<WarehouseSearchParams>) => {
            state.filters = action.payload;
        },
        clearFilters: (state) => {
            state.filters = {};
        },
        setCurrentWarehouse: (state, action: PayloadAction<Warehouse | null>) => {
            state.currentWarehouse = action.payload;
        },
        clearCurrentWarehouse: (state) => {
            state.currentWarehouse = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch Warehouses
        builder
            .addCase(fetchWarehouses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWarehouses.fulfilled, (state, action) => {
                state.loading = false;
                state.warehouses = action.payload.data;
                state.total = action.payload.total;
                state.page = action.payload.page;
                state.pageSize = action.payload.pageSize;
                state.totalPages = action.payload.totalPages;
            })
            .addCase(fetchWarehouses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch Warehouse by ID
        builder
            .addCase(fetchWarehouseById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWarehouseById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentWarehouse = action.payload;
            })
            .addCase(fetchWarehouseById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Create Warehouse
        builder
            .addCase(createWarehouse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createWarehouse.fulfilled, (state, action) => {
                state.loading = false;
                state.myWarehouses.push(action.payload);
            })
            .addCase(createWarehouse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Update Warehouse
        builder
            .addCase(updateWarehouse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateWarehouse.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.myWarehouses.findIndex(w => w.id === action.payload.id);
                if (index !== -1) {
                    state.myWarehouses[index] = action.payload;
                }
                if (state.currentWarehouse?.id === action.payload.id) {
                    state.currentWarehouse = action.payload;
                }
            })
            .addCase(updateWarehouse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Delete Warehouse
        builder
            .addCase(deleteWarehouse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteWarehouse.fulfilled, (state, action) => {
                state.loading = false;
                state.myWarehouses = state.myWarehouses.filter(w => w.id !== action.payload);
                if (state.currentWarehouse?.id === action.payload) {
                    state.currentWarehouse = null;
                }
            })
            .addCase(deleteWarehouse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch My Warehouses
        builder
            .addCase(fetchMyWarehouses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyWarehouses.fulfilled, (state, action) => {
                state.loading = false;
                state.myWarehouses = action.payload;
            })
            .addCase(fetchMyWarehouses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch Featured Warehouses
        builder
            .addCase(fetchFeaturedWarehouses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFeaturedWarehouses.fulfilled, (state, action) => {
                state.loading = false;
                state.featuredWarehouses = action.payload;
            })
            .addCase(fetchFeaturedWarehouses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Upload Images
        builder
            .addCase(uploadWarehouseImages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadWarehouseImages.fulfilled, (state, action) => {
                state.loading = false;
                const { id, images } = action.payload;

                // Update in myWarehouses
                const myWarehouse = state.myWarehouses.find(w => w.id === id);
                if (myWarehouse) {
                    myWarehouse.images = [...myWarehouse.images, ...images];
                }

                // Update current warehouse if it matches
                if (state.currentWarehouse?.id === id) {
                    state.currentWarehouse.images = [...state.currentWarehouse.images, ...images];
                }
            })
            .addCase(uploadWarehouseImages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    clearError,
    setFilters,
    clearFilters,
    setCurrentWarehouse,
    clearCurrentWarehouse,
} = warehouseSlice.actions;

export default warehouseSlice.reducer;
