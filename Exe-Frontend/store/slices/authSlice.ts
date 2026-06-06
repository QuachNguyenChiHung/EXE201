import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { userService, setAuthToken, clearAuth } from '../../service';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '../../model/types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: !!localStorage.getItem('auth_token'),
    loading: false,
    error: null,
};

// Async thunks
export const login = createAsyncThunk<AuthResponse, LoginCredentials>(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await userService.login(credentials);
            setAuthToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

export const register = createAsyncThunk<AuthResponse, RegisterData>(
    'auth/register',
    async (data, { rejectWithValue }) => {
        try {
            const response = await userService.register(data);
            setAuthToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Registration failed');
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await userService.logout();
            clearAuth();
        } catch (error: any) {
            // Clear auth even if API call fails
            clearAuth();
            return rejectWithValue(error.response?.data?.message || 'Logout failed');
        }
    }
);

export const getCurrentUser = createAsyncThunk<User>(
    'auth/getCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const user = await userService.getCurrentUser();
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        } catch (error: any) {
            clearAuth();
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
        }
    }
);

export const updateProfile = createAsyncThunk<User, Partial<User>>(
    'auth/updateProfile',
    async (data, { rejectWithValue }) => {
        try {
            const user = await userService.updateProfile(data);
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Update failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(action.payload));
        },
        logoutLocal: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            clearAuth();
        },
        // Initialize user from localStorage
        initializeAuth: (state) => {
            const token = localStorage.getItem('auth_token');
            const userStr = localStorage.getItem('user');

            if (token && userStr) {
                try {
                    state.token = token;
                    state.user = JSON.parse(userStr);
                    state.isAuthenticated = true;
                } catch (error) {
                    clearAuth();
                }
            }
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Register
        builder
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Logout
        builder
            .addCase(logout.pending, (state) => {
                state.loading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.error = null;
            })
            .addCase(logout.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
            });

        // Get Current User
        builder
            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(getCurrentUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.user = null;
                state.isAuthenticated = false;
            });

        // Update Profile
        builder
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, setUser, logoutLocal, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
