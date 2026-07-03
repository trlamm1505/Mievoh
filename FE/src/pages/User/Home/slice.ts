import { createSlice } from "@reduxjs/toolkit";

// Types for location data
export interface Location {
    id: number;
    tenViTri: string;
    tinhThanh: string;
    quocGia: string;
    hinhAnh: string;
}



export interface LocationState {
    locations: Location[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
    suggestions: Location[];
    showSuggestions: boolean;
    featured: Location[];
}

const initialState: LocationState = {
    locations: [],
    loading: false,
    error: null,
    searchQuery: "",
    suggestions: [],
    showSuggestions: false,
    featured: [],
};

const locationSlice = createSlice({
    name: "location",
    initialState,
    reducers: {
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
            if (action.payload.length === 0) {
                state.suggestions = [];
                state.showSuggestions = false;
            }
        },
        setShowSuggestions: (state, action) => {
            state.showSuggestions = action.payload;
        },
        clearSuggestions: (state) => {
            state.suggestions = [];
            state.showSuggestions = false;
        },
        selectLocation: (state, action) => {
            state.searchQuery = action.payload.tenViTri;
            state.suggestions = [];
            state.showSuggestions = false;
        },
        clearError: (state) => {
            state.error = null;
        },
    },

});

export const { setSearchQuery, setShowSuggestions, clearSuggestions, selectLocation, clearError } = locationSlice.actions;

export default locationSlice.reducer;
