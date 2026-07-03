import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/index.tsx";
import { toast } from "../components/Toast/Toast.tsx";
import {
    initBooking,
    setMovieInfo,
    toggleSeat,
    updateCombo,
    startBooking,
    bookingFailed
} from "../pages/User/SelectSeat/slice.ts";
import { useLanguage } from "../contextAPI/LanguageContext.tsx";
import { getSeatsStatusApi, getFoodsByComplexApi, createBookingApi, getMyVouchersApi } from "../axios/booking.tsx";
import { getShowtimeDetailApi } from "../axios/cinemas.tsx";

interface LocationState {
    branchName?: string;
    format?: string;
    time?: string;
    date?: string;
    dateLabel?: string;
    dayOfWeek?: string;
    showtimeId?: string;
}

const seatRows = ["A", "B", "C", "D", "E", "F", "G", "H", "J"];
const standardRows = ["A", "B", "C", "D"];
const vipRows = ["E", "F", "G", "H"];

export default function useSelectSeat() {
    const { id } = useParams<{ id: string }>();
    const { t, language } = useLanguage();
    const movieId = id || "";
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Get parameters passed from BookTicket or use defaults
    const state = (location.state as LocationState) || {};
    const routeBranchName = state.branchName || "CGV Vincom Center Dong Khoi";
    const routeFormat = state.format || "2D Subtitles";
    const routeTime = state.time || "18:30";
    const routeDate = state.date || new Date().toISOString().split("T")[0];
    const routeDateLabel = state.dateLabel || `${new Date().getDate()}/${new Date().getMonth() + 1}`;
    const routeDayOfWeek = state.dayOfWeek || "Mon";
    const routeShowtimeId = state.showtimeId || "";

    const [activeStep, setActiveStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState("vnpay");
    const { isAuthenticated, user: authUser } = useSelector((state: RootState) => state.login);
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [guestErrors, setGuestErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
    const [isClosing, setIsClosing] = useState(false);
    const [paymentTimeLeft, setPaymentTimeLeft] = useState(600);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showQRTransfer, setShowQRTransfer] = useState(false);

    // Dynamic states loaded from API
    const [showtimeDetail, setShowtimeDetail] = useState<any | null>(null);
    const [seatsList, setSeatsList] = useState<any[]>([]);
    const [foodsList, setFoodsList] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Voucher states
    const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
    const [voucherCodeInput, setVoucherCodeInput] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
    const [voucherError, setVoucherError] = useState<string | null>(null);

    // Fetch dynamic data
    useEffect(() => {
        if (!routeShowtimeId) {
            toast.error("Please select a showtime first!");
            navigate(-1);
            return;
        }

        const fetchShowtimeAndSeats = async () => {
            setLoading(true);
            try {
                const showtimeRes = await getShowtimeDetailApi(routeShowtimeId);
                const seatsRes = await getSeatsStatusApi(routeShowtimeId);
                
                setShowtimeDetail(showtimeRes.data);
                setSeatsList(seatsRes.data || []);
                
                const complexId = showtimeRes.data?.Cinema?.cinemaComplexId;
                if (complexId) {
                    const foodsRes = await getFoodsByComplexApi(complexId);
                    setFoodsList(foodsRes.data || []);
                    
                    // Fetch vouchers for this user
                    try {
                        const vouchersRes = await getMyVouchersApi();
                        let vouchers: any[] = [];
                        if (vouchersRes && vouchersRes.data) {
                            if (Array.isArray(vouchersRes.data)) {
                                vouchers = vouchersRes.data;
                            } else if (Array.isArray((vouchersRes.data as any).data)) {
                                vouchers = (vouchersRes.data as any).data;
                            }
                        }
                        const filteredVouchers = (vouchers || []).filter((v: any) => {
                            return !v.cinemaComplexId || v.cinemaComplexId === complexId;
                        });
                        setAvailableVouchers(filteredVouchers);
                    } catch (err) {
                        console.error("Error loading my vouchers:", err);
                    }
                }
            } catch (err) {
                console.error("Error loading showtime & seats:", err);
                toast.error("Failed to load showtime details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchShowtimeAndSeats();
    }, [routeShowtimeId, navigate]);

    // Scroll to top and initialize booking state in Redux when page loaded
    useEffect(() => {
        window.scrollTo(0, 0);
        dispatch(initBooking({
            movieId,
            branchName: routeBranchName,
            format: routeFormat,
            time: routeTime,
            date: routeDate,
            dateLabel: routeDateLabel,
            dayOfWeek: routeDayOfWeek
        }));
    }, [dispatch, movieId, routeBranchName, routeFormat, routeTime, routeDate, routeDateLabel, routeDayOfWeek]);

    // Seat hold countdown timer (10 mins) for Step 3 QR Transfer
    useEffect(() => {
        if (!showQRTransfer) return;
        const timer = setInterval(() => {
            setPaymentTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    toast.error(t("toast_seat_hold_expired"));
                    setShowQRTransfer(false);
                    setActiveStep(1);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [showQRTransfer, t]);

    const formatTimeLeft = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const booking = useSelector((state: RootState) => state.booking);
    
    const selectedSeats = booking.selectedSeats;
    const comboQuantities = booking.comboQuantities;
    const isBooking = booking.isBooking;
    const bookingCode = booking.bookingCode;

    const branchName = showtimeDetail?.Cinema?.CinemaComplex?.name || booking.branchName || routeBranchName;
    const format = showtimeDetail?.format || booking.format || routeFormat;
    const time = showtimeDetail?.showDateTime 
        ? new Date(showtimeDetail.showDateTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })
        : booking.time || routeTime;
    const dateLabel = booking.dateLabel || routeDateLabel;
    const dayOfWeek = booking.dayOfWeek || routeDayOfWeek;

    // Dynamic combos list mapped from backend foods
    const combos = useMemo(() => {
        return foodsList.map(food => {
            let image = food.imageUrl || "🍿";
            if (food.imageUrl && !food.imageUrl.startsWith('http')) {
                const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
                const domain = apiBase.replace('/api', '');
                image = `${domain}/foods/${food.imageUrl}`;
            }
            return {
                id: food.foodId,
                name: food.name,
                description: food.description || "",
                price: food.price,
                image
            };
        });
    }, [foodsList]);

    // Load movie details dynamically from showtime detail
    const movie = useMemo(() => {
        if (!showtimeDetail || !showtimeDetail.Movie) {
            return {
                id: "",
                title: "Loading Movie...",
                genres: [],
                image: "🍿",
                ageRating: "P",
                duration: "0 mins",
                language: "English"
            };
        }
        const data = showtimeDetail.Movie;
        
        let genresArr: string[] = [];
        if (Array.isArray(data.genres)) {
            genresArr = data.genres;
        } else if (typeof data.genres === 'string') {
            genresArr = data.genres.split(',').map((g: string) => g.trim());
        }

        let image = data.imageUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";
        if (data.imageUrl && !data.imageUrl.startsWith('http')) {
            const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://api.mievoh.io.vn/api';
            const domain = apiBase.replace('/api', '');
            image = `${domain}/movies/${data.imageUrl}`;
        }

        return {
            id: data.movieId,
            title: language === "vi" ? (data.title_vi || data.title_en) : (data.title_en || data.title_vi),
            description: language === "vi" ? (data.description_vi || data.description_en) : (data.description_en || data.description_vi),
            genres: genresArr,
            image,
            ageRating: data.ageRestriction || "P",
            duration: data.duration ? `${data.duration} mins` : "120 mins",
            language: data.language || "English"
        };
    }, [showtimeDetail, language]);

    // Dispatch movie title and image to Redux when it is dynamically resolved from API
    useEffect(() => {
        if (movie && movie.title && movie.title !== "Loading Movie...") {
            dispatch(setMovieInfo({
                title: movie.title,
                image: movie.image
            }));
        }
    }, [dispatch, movie]);

    // Room name
    const roomName = showtimeDetail?.Cinema?.name || "Hall 01";

    const updateComboQuantity = (id: string, delta: number) => {
        dispatch(updateCombo({ id, delta }));
    };

    // Construct bookedSeats set dynamically from seats status response
    const bookedSeats = useMemo(() => {
        const set = new Set<string>();
        seatsList.forEach(seat => {
            if (seat.status === "SOLD" || seat.status === "HELD") {
                set.add(seat.name);
            }
        });
        return set;
    }, [seatsList]);

    // Seat click handler
    const handleSeatClick = (seatName: string) => {
        if (bookedSeats.has(seatName)) return;
        dispatch(toggleSeat(seatName));
    };

    // Calculated amounts
    const ticketBreakdown = useMemo(() => {
        let standardCount = 0;
        let vipCount = 0;
        let coupleCount = 0;
        const basePrice = showtimeDetail?.ticketPrice || 75000;

        selectedSeats.forEach(name => {
            const seatObj = seatsList.find(s => s.name === name);
            const type = seatObj?.seatType?.toUpperCase();
            if (type === "COUPLE" || type === "SWEETBOX" || name.startsWith("J")) {
                coupleCount++;
            } else if (type === "VIP") {
                vipCount++;
            } else {
                standardCount++;
            }
        });

        const price = selectedSeats.length * basePrice;

        return {
            standardCount,
            vipCount,
            coupleCount,
            ticketPrice: price
        };
    }, [selectedSeats, seatsList, showtimeDetail]);

    const comboPrice = useMemo(() => {
        let total = 0;
        combos.forEach(c => {
            total += (comboQuantities[c.id] || 0) * c.price;
        });
        return total;
    }, [comboQuantities, combos]);

    const totalPrice = ticketBreakdown.ticketPrice + comboPrice;

    // Voucher calculations
    const discountAmount = useMemo(() => {
        if (!appliedVoucher) return 0;
        let amount = 0;
        if (appliedVoucher.discountType === 'FIXED') {
            amount = appliedVoucher.discountValue;
        } else if (appliedVoucher.discountType === 'PERCENTAGE') {
            amount = Math.floor((totalPrice * appliedVoucher.discountValue) / 100);
            if (appliedVoucher.maxDiscount && amount > appliedVoucher.maxDiscount) {
                amount = appliedVoucher.maxDiscount;
            }
        }
        return amount > totalPrice ? totalPrice : amount;
    }, [appliedVoucher, totalPrice]);

    const finalPrice = totalPrice - discountAmount;

    const handleApplyVoucher = (code: string) => {
        if (!code.trim()) {
            setVoucherError(language === "en" ? "Please enter a voucher code" : "Vui lòng nhập mã giảm giá");
            return;
        }
        const cleanCode = code.toUpperCase().replace(/\s+/g, "");
        const found = availableVouchers.find(v => v.code.toUpperCase() === cleanCode);
        
        if (!found) {
            setVoucherError(language === "en" ? "Invalid code or not applicable to this cinema" : "Mã không hợp lệ hoặc không áp dụng cho rạp này");
            setAppliedVoucher(null);
            return;
        }

        if (found.minPurchase && totalPrice < found.minPurchase) {
            setVoucherError(language === "en" 
                ? `Minimum order value of ${found.minPurchase.toLocaleString()}đ required` 
                : `Yêu cầu giá trị đơn hàng tối thiểu từ ${found.minPurchase.toLocaleString()}đ`);
            setAppliedVoucher(null);
            return;
        }

        setAppliedVoucher(found);
        setVoucherError(null);
        toast.success(language === "en" ? "Voucher applied successfully!" : "Áp dụng mã giảm giá thành công!");
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherCodeInput("");
        setVoucherError(null);
    };

    // Checkout processing states
    const handleGuestChange = (name: "name" | "phone" | "email", value: string) => {
        if (name === "name") setGuestName(value);
        if (name === "phone") setGuestPhone(value);
        if (name === "email") setGuestEmail(value);
        
        const errs = { ...guestErrors };
        if (name === "name") {
            if (value.trim()) delete errs.name;
            else errs.name = "Full name is required";
        }
        if (name === "phone") {
            if (value.trim() && /^[0-9]{10}$/.test(value.trim())) delete errs.phone;
            else if (!value.trim()) errs.phone = "Phone number is required";
            else errs.phone = "Phone number must be exactly 10 digits";
        }
        if (name === "email") {
            if (value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) delete errs.email;
            else if (!value.trim()) errs.email = "Email is required";
            else errs.email = "Invalid email format (e.g. example@gmail.com)";
        }
        setGuestErrors(errs);
    };

    const handleCheckout = () => {
        if (selectedSeats.length === 0) {
            toast.error(t("toast_select_seat_required"));
            return;
        }

        if (!isAuthenticated) {
            toast.error("Please login to proceed with booking.");
            navigate("/login");
            return;
        }

        setShowConfirmModal(true);
    };

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowConfirmModal(false);
            setIsClosing(false);
        }, 300);
    };

    const executeCheckout = async () => {
        setShowConfirmModal(false);
        setIsClosing(false);
        dispatch(startBooking());
        
        try {
            // Map selected seats to their seatId
            const seatIds = selectedSeats.map(name => {
                const seatObj = seatsList.find(s => s.name === name);
                return seatObj ? seatObj.seatId : "";
            }).filter(id => id !== "");

            // Map combo quantities to foods input
            const foodsInput = Object.entries(comboQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([foodId, qty]) => ({
                    foodId,
                    quantity: qty
                }));

            const payload = {
                showtimeId: routeShowtimeId,
                seats: seatIds,
                foods: foodsInput.length > 0 ? foodsInput : undefined,
                voucherCode: appliedVoucher?.code || undefined,
                returnUrl: `${window.location.origin}/vnpay-return`
            };

            const res = await createBookingApi(payload);

            const paymentUrl = res.data?.paymentUrl;
            if (paymentUrl) {
                // Save details to pending bookings in localStorage
                const pendingBookings = JSON.parse(localStorage.getItem("mievoh_pending_bookings") || "{}");
                pendingBookings[res.data.booking.bookingId] = {
                    id: res.data.booking.bookingId,
                    bookingCode: "PENDING",
                    movieId: movieId,
                    movieTitle: movie.title,
                    movieImage: movie.image,
                    branchName: branchName,
                    roomName: roomName,
                    format: format,
                    dayOfWeek: dayOfWeek,
                    dateLabel: dateLabel,
                    time: time,
                    date: routeDate,
                    seats: selectedSeats,
                    combos: Object.entries(comboQuantities)
                        .filter(([_, qty]) => qty > 0)
                        .map(([foodId]) => {
                            const c = combos.find(x => x.id === foodId);
                            return c ? `${comboQuantities[foodId]}x ${c.name}` : "";
                        }).filter(Boolean).join(", ") || "None",
                    comboQuantities: comboQuantities,
                    combosList: combos,
                    comboPrice: comboPrice,
                    totalPrice: finalPrice,
                    status: "Pending",
                    dateBooked: new Date().toLocaleDateString("vi-VN"),
                    movie: movie
                };
                localStorage.setItem("mievoh_pending_bookings", JSON.stringify(pendingBookings));

                // Redirect user to VNPay
                window.location.href = paymentUrl;
            } else {
                throw new Error("No payment URL returned");
            }
        } catch (err: any) {
            console.error("Checkout failed:", err);
            const errMsg = err?.response?.data?.message || err?.message || "Booking failed. Please try again.";
            toast.error(errMsg);
            dispatch(bookingFailed());
        }
    };

    const userPhone = authUser?.soDT || authUser?.phone || "Not updated";
    const userFullName = authUser?.hoTen || authUser?.name || "Guest";
    const userEmailAddress = authUser?.email || "Not updated";

    const formatPrice = (value: number) => {
        return value.toLocaleString("en-US") + " VND";
    };

    return {
        activeStep,
        setActiveStep,
        paymentMethod,
        setPaymentMethod,
        isAuthenticated,
        guestName,
        guestPhone,
        guestEmail,
        guestErrors,
        handleGuestChange,
        showConfirmModal,
        isClosing,
        closeModal,
        paymentTimeLeft,
        formatTimeLeft,
        isVerifying,
        setIsVerifying,
        showQRTransfer,
        setShowQRTransfer,
        movie,
        branchName,
        roomName,
        time,
        dayOfWeek,
        dateLabel,
        format,
        selectedSeats,
        handleSeatClick,
        ticketBreakdown,
        comboPrice,
        comboQuantities,
        updateComboQuantity,
        totalPrice,
        formatPrice,
        bookingCode,
        isBooking,
        handleCheckout,
        executeCheckout,
        userFullName,
        userPhone,
        userEmailAddress,
        navigate,
        seatRows,
        standardRows,
        vipRows,
        bookedSeats,
        combos,
        loading,
        seatsList,
        // Voucher outputs
        availableVouchers,
        voucherCodeInput,
        setVoucherCodeInput,
        appliedVoucher,
        voucherError,
        handleApplyVoucher,
        handleRemoveVoucher,
        discountAmount,
        finalPrice
    };
}
