import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import warehouseReducer from './slices/warehouseSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        warehouse: warehouseReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
    devTools: import.meta.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
