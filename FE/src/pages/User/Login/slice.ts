import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { loginApi } from "../../../axios/auth.tsx";

// Types
export type LoginCredentials = {
    email: string;
    password: string;
};

export type AuthUser = any;

type LoginState = {
    loading: boolean;
    user: AuthUser | null;
    error: string | null;
    isAuthenticated: boolean;
};

const getInitialUser = () => {
    try {
        const userStr = localStorage.getItem('auth_user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};

const getInitialIsAuthenticated = () => {
    try {
        return localStorage.getItem('auth_isAuthenticated') === 'true';
    } catch {
        return false;
    }
};

const initialState: LoginState = {
    loading: false,
    user: getInitialUser(),
    error: null,
    isAuthenticated: getInitialIsAuthenticated(),
};

export const loginUser = createAsyncThunk<
    any,
    LoginCredentials,
    { rejectValue: string }
>(
    "login/loginUser",
    async (credentials, { rejectWithValue }) => {
        try {
            // Verify basic fields are provided
            if (!credentials.email || !credentials.password) {
                return rejectWithValue("Email and password cannot be empty");
            }

            const response = await loginApi({
                email: credentials.email,
                password: credentials.password,
            });

            // NestJS wraps its response payload in a { message, statusCode, data } object
            const responseData = (response as any).data || response;
            const user = responseData.user;
            const token = responseData.token?.accessToken || responseData.accessToken;

            if (!user) {
                return rejectWithValue("Invalid API response format: user object not found");
            }

            // Return response format matching slice.ts fulfilled expectations
            return {
                content: {
                    user: {
                        name: user.fullName || user.email,
                        email: user.email,
                        fullName: user.fullName || user.email,
                        hoTen: user.fullName || user.email,
                        role: user.userType || "USER",
                        avatar: user.avatar || "/images/avatar.jpg"
                    },
                    token: token
                }
            };
        } catch (err: any) {
            // Extract meaningful error message from backend response if available
            const errorMessage = err?.response?.data?.message || err?.message || "Login failed";
            return rejectWithValue(errorMessage);
        }
    }
);


const loginSlice = createSlice({
    name: "login",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
            try {
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_isAuthenticated');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('lastActivity');
            } catch { }
        },
        setAuthenticated: (state, action: PayloadAction<AuthUser | null>) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.error = null;
        },
        updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
                try {
                    localStorage.setItem('auth_user', JSON.stringify(state.user));
                } catch { }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                // API format: prefer content.user then content, else root
                const payload = action.payload as any;
                const user = payload?.content?.user ?? payload?.content ?? payload?.user ?? null;
                // Persist access token from API if available (for authenticated endpoints like /binh-luan)
                const token = payload?.content?.token || payload?.token || user?.token || user?.accessToken;
                if (user && token) {
                    (user as any).token = token;
                }
                state.user = user;
                state.isAuthenticated = !!user;
                state.error = null;
                // Persist to localStorage for reload resilience
                try {
                    if (user) {
                        localStorage.setItem('auth_user', JSON.stringify(user));
                        localStorage.setItem('auth_isAuthenticated', 'true');
                        if (token) localStorage.setItem('accessToken', token);
                    } else {
                        localStorage.removeItem('auth_user');
                        localStorage.removeItem('auth_isAuthenticated');
                        localStorage.removeItem('accessToken');
                    }
                } catch { }
            })
            .addCase(loginUser.rejected, (state, action: PayloadAction<string | undefined>) => {
                state.loading = false;
                state.error = action.payload ?? "Login failed";
                state.isAuthenticated = false;
            });
    },
});

export const { clearError, logout, setAuthenticated, updateUser } = loginSlice.actions;
export default loginSlice.reducer; 