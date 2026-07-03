import { configureStore } from "@reduxjs/toolkit";
import locationReducer from "../pages/User/Home/slice.ts";
import loginReducer from "../pages/User/Login/slice.ts";
import bookingReducer from "../pages/User/SelectSeat/slice.ts";

export const store = configureStore({
    reducer: {
        location: locationReducer,
        login: loginReducer,
        booking: bookingReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

// TypeScript: augment Window to include __REDUX_STORE__
declare global {
    interface Window {
        __REDUX_STORE__?: typeof store;
    }
}

// Make store available globally for sessionManager
if (typeof window !== 'undefined') {
    window.__REDUX_STORE__ = store;
}

// Useful typed exports for Redux usage across the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
