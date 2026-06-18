import React, { createContext, useContext, useState, useCallback } from 'react';
import { SeatStatus, Food } from '../../axios/booking';

// ==================== Types ====================

export interface BookingMovie {
  movieId: string;
  title_vi: string | null;
  title_en: string | null;
  imageUrl: string | null;
  duration: number | null;
  ageRestriction: string | null;
}

export interface BookingShowtime {
  showtimeId: string;
  showDateTime: string;
  format: string;
  ticketPrice: number;
  cinemaId: string;
  cinemaName: string; // Hall name (e.g. "Cinema 1")
  cinemaComplexId: string;
  cinemaComplexName: string; // Complex name (e.g. "CGV Vincom Đồng Khởi")
  cinemaComplexAddress: string;
}

export interface SelectedFood {
  food: Food;
  quantity: number;
}

export interface BookingState {
  movie: BookingMovie | null;
  showtime: BookingShowtime | null;
  selectedSeats: SeatStatus[];
  selectedFoods: SelectedFood[];
  currentStep: number; // 1=Showtime, 2=Seat, 3=Combo, 4=Payment, 5=Ticket
  // Payment result
  bookingResult: {
    bookingId: string;
    ticketCode: string;
    paymentUrl: string;
    totalPrice: number;
  } | null;
}

interface BookingContextType {
  state: BookingState;
  setMovie: (movie: BookingMovie) => void;
  setShowtime: (showtime: BookingShowtime) => void;
  addSeat: (seat: SeatStatus) => void;
  removeSeat: (seatId: string) => void;
  clearSeats: () => void;
  setFoodQuantity: (food: Food, quantity: number) => void;
  clearFoods: () => void;
  setStep: (step: number) => void;
  setBookingResult: (result: BookingState['bookingResult']) => void;
  resetBooking: () => void;
  // Computed values
  seatsTotalPrice: number;
  foodsTotalPrice: number;
  totalPrice: number;
}

// ==================== Initial State ====================

const initialState: BookingState = {
  movie: null,
  showtime: null,
  selectedSeats: [],
  selectedFoods: [],
  currentStep: 1,
  bookingResult: null,
};

// ==================== Context ====================

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// ==================== Provider ====================

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);

  const setMovie = useCallback((movie: BookingMovie) => {
    setState(prev => ({ ...prev, movie }));
  }, []);

  const setShowtime = useCallback((showtime: BookingShowtime) => {
    setState(prev => ({ ...prev, showtime }));
  }, []);

  const addSeat = useCallback((seat: SeatStatus) => {
    setState(prev => {
      // Max 8 seats
      if (prev.selectedSeats.length >= 8) return prev;
      // Avoid duplicates
      if (prev.selectedSeats.find(s => s.seatId === seat.seatId)) return prev;
      return { ...prev, selectedSeats: [...prev.selectedSeats, seat] };
    });
  }, []);

  const removeSeat = useCallback((seatId: string) => {
    setState(prev => ({
      ...prev,
      selectedSeats: prev.selectedSeats.filter(s => s.seatId !== seatId),
    }));
  }, []);

  const clearSeats = useCallback(() => {
    setState(prev => ({ ...prev, selectedSeats: [] }));
  }, []);

  const setFoodQuantity = useCallback((food: Food, quantity: number) => {
    setState(prev => {
      const existing = prev.selectedFoods.findIndex(f => f.food.foodId === food.foodId);
      let newFoods = [...prev.selectedFoods];

      if (quantity <= 0) {
        // Remove
        if (existing >= 0) {
          newFoods.splice(existing, 1);
        }
      } else {
        if (existing >= 0) {
          newFoods[existing] = { food, quantity };
        } else {
          newFoods.push({ food, quantity });
        }
      }

      return { ...prev, selectedFoods: newFoods };
    });
  }, []);

  const clearFoods = useCallback(() => {
    setState(prev => ({ ...prev, selectedFoods: [] }));
  }, []);

  const setStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const setBookingResult = useCallback((result: BookingState['bookingResult']) => {
    setState(prev => ({ ...prev, bookingResult: result }));
  }, []);

  const resetBooking = useCallback(() => {
    setState(initialState);
  }, []);

  // Computed prices
  const seatsTotalPrice = state.selectedSeats.length * (state.showtime?.ticketPrice || 0);

  const foodsTotalPrice = state.selectedFoods.reduce(
    (sum, item) => sum + item.food.price * item.quantity,
    0
  );

  const totalPrice = seatsTotalPrice + foodsTotalPrice;

  return (
    <BookingContext.Provider
      value={{
        state,
        setMovie,
        setShowtime,
        addSeat,
        removeSeat,
        clearSeats,
        setFoodQuantity,
        clearFoods,
        setStep,
        setBookingResult,
        resetBooking,
        seatsTotalPrice,
        foodsTotalPrice,
        totalPrice,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

// ==================== Hook ====================

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
