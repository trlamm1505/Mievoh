import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface BookingState {
    movieId: string | null;
    movieTitle: string;
    movieImage: string;
    branchName: string;
    format: string;
    time: string;
    date: string;
    dateLabel: string;
    dayOfWeek: string;
    selectedSeats: string[];
    comboQuantities: Record<string, number>;
    isBooking: boolean;
    bookingSuccess: boolean;
    bookingCode: string;
}

const initialState: BookingState = {
    movieId: null,
    movieTitle: "",
    movieImage: "",
    branchName: "",
    format: "",
    time: "",
    date: "",
    dateLabel: "",
    dayOfWeek: "",
    selectedSeats: [],
    comboQuantities: {},
    isBooking: false,
    bookingSuccess: false,
    bookingCode: ""
};

const bookingSlice = createSlice({
    name: "booking",
    initialState,
    reducers: {
        initBooking: (state, action: PayloadAction<{
            movieId: string;
            branchName: string;
            format: string;
            time: string;
            date: string;
            dateLabel: string;
            dayOfWeek: string;
        }>) => {
            state.movieId = action.payload.movieId;
            state.branchName = action.payload.branchName;
            state.format = action.payload.format;
            state.time = action.payload.time;
            state.date = action.payload.date;
            state.dateLabel = action.payload.dateLabel;
            state.dayOfWeek = action.payload.dayOfWeek;
            state.movieTitle = "";
            state.movieImage = "";
            state.selectedSeats = [];
            state.comboQuantities = {};
            state.isBooking = false;
            state.bookingSuccess = false;
            state.bookingCode = "";
        },
        setMovieInfo: (state, action: PayloadAction<{ title: string; image: string }>) => {
            state.movieTitle = action.payload.title;
            state.movieImage = action.payload.image;
        },
        toggleSeat: (state, action: PayloadAction<string>) => {
            const seatCode = action.payload;
            if (state.selectedSeats.includes(seatCode)) {
                state.selectedSeats = state.selectedSeats.filter(s => s !== seatCode);
            } else {
                if (state.selectedSeats.length < 8) {
                    state.selectedSeats.push(seatCode);
                }
            }
        },
        updateCombo: (state, action: PayloadAction<{ id: string; delta: number }>) => {
            const { id, delta } = action.payload;
            const current = state.comboQuantities[id] || 0;
            state.comboQuantities[id] = Math.max(0, current + delta);
        },
        startBooking: (state) => {
            state.isBooking = true;
        },
        bookingFinished: (state, action: PayloadAction<string>) => {
            state.isBooking = false;
            state.bookingSuccess = true;
            state.bookingCode = action.payload;
        },
        bookingFailed: (state) => {
            state.isBooking = false;
        },
        resetBooking: (state) => {
            state.selectedSeats = [];
            state.comboQuantities = {};
            state.isBooking = false;
            state.bookingSuccess = false;
            state.bookingCode = "";
        }
    }
});

export const {
    initBooking,
    setMovieInfo,
    toggleSeat,
    updateCombo,
    startBooking,
    bookingFinished,
    bookingFailed,
    resetBooking
} = bookingSlice.actions;

export default bookingSlice.reducer;
