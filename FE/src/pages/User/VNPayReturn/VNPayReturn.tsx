import { useEffect, useState, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { getBookingByIdApi } from "../../../axios/booking.tsx";
import { useLanguage } from "../../../contextAPI/LanguageContext.tsx";
import { XCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function VNPayReturn() {
    const { t, language } = useLanguage();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<"success" | "failed" | "error">("failed");
    const [errorMessage, setErrorMessage] = useState("");
    const [bookingData, setBookingData] = useState<any | null>(null);

    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const responseCode = queryParams.get("vnp_ResponseCode");
    const txnRef = queryParams.get("vnp_TxnRef"); // bookingId

    const formatPrice = (value: number) => {
        return value.toLocaleString("en-US") + "đ";
    };

    useEffect(() => {
        if (!responseCode || !txnRef) {
            setLoading(false);
            setStatus("error");
            setErrorMessage(language === "vi" ? "Thiếu tham số thanh toán." : "Missing payment parameters.");
            return;
        }

        let pollInterval: any = null;

        const verifyPayment = async () => {
            setLoading(true);
            const pendingBookings = JSON.parse(localStorage.getItem("mievoh_pending_bookings") || "{}");
            const pending = pendingBookings[txnRef];

            // If not found in pending, maybe it's already in booking history
            const history = JSON.parse(localStorage.getItem("mievoh_booking_history") || "[]");
            const foundInHistory = history.find((h: any) => h.id === txnRef);

            if (foundInHistory) {
                setBookingData(foundInHistory);
                setStatus("success");
                setLoading(false);
                return;
            }

            if (responseCode === "00") {
                if (!pending) {
                    setLoading(false);
                    setStatus("error");
                    setErrorMessage(language === "vi" ? "Không tìm thấy thông tin đặt vé đang chờ xử lý. Vui lòng kiểm tra Lịch sử đặt vé." : "Could not find pending booking details. Please check your Booking History.");
                    return;
                }

                let attempts = 0;
                const maxAttempts = 10;

                pollInterval = setInterval(async () => {
                    attempts++;
                    try {
                        const res = await getBookingByIdApi(txnRef);
                        const foundBooking = res.data;

                        if (foundBooking && foundBooking.paymentStatus === "Success") {
                            clearInterval(pollInterval);

                            const paidBooking = {
                                ...pending,
                                bookingCode: foundBooking.ticketCode,
                                status: "Paid",
                                dateBooked: new Date(foundBooking.createdAt).toLocaleDateString("vi-VN")
                            };

                            const updatedHistory = [paidBooking, ...history];
                            localStorage.setItem("mievoh_booking_history", JSON.stringify(updatedHistory));

                            // Clean up pending
                            delete pendingBookings[txnRef];
                            localStorage.setItem("mievoh_pending_bookings", JSON.stringify(pendingBookings));

                            setBookingData(paidBooking);
                            setStatus("success");
                            setLoading(false);
                        } else if (foundBooking && foundBooking.paymentStatus === "Failed") {
                            clearInterval(pollInterval);
                            setStatus("failed");
                            setErrorMessage(
                                language === "vi" ? "Giao dịch thanh toán thất bại." : "Payment transaction failed."
                            );
                            setLoading(false);
                        } else if (attempts >= maxAttempts) {
                            clearInterval(pollInterval);
                            setStatus("error");
                            setErrorMessage(
                                language === "vi"
                                    ? "Giao dịch của bạn đang được xử lý, vui lòng kiểm tra Lịch sử vé sau ít phút."
                                    : "Your transaction is being processed, please check your Ticket History in a few minutes."
                            );
                            setLoading(false);
                        }
                    } catch (err) {
                        console.error("Error checking booking details:", err);
                        if (attempts >= maxAttempts) {
                            clearInterval(pollInterval);
                            setStatus("error");
                            setErrorMessage(
                                language === "vi"
                                    ? "Giao dịch của bạn đang được xử lý, vui lòng kiểm tra Lịch sử vé sau ít phút."
                                    : "Your transaction is being processed, please check your Ticket History in a few minutes."
                            );
                            setLoading(false);
                        }
                    }
                }, 2000);
            } else {
                // Payment was canceled or failed
                setStatus("failed");
                setErrorMessage("Giao dịch thất bại hoặc đã bị hủy.");
                setLoading(false);
            }
        };

        verifyPayment();

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [location.search, responseCode, txnRef, queryParams, language]);

    if (loading) {
        return (
            <div className="w-full min-h-[70vh] bg-[#EFEBF4] dark:bg-zinc-955 flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-[#8E7EFE] animate-spin" />
                <p className="text-[#8E7EFE] dark:text-[#a599ff] font-black mt-4 text-base tracking-wide animate-pulse">
                    Đang xác thực kết quả thanh toán từ VNPay...
                </p>
            </div>
        );
    }

    if (status === "success" && bookingData) {
        return (
            <div className="w-full bg-[#EFEBF4] dark:bg-zinc-955 min-h-[85vh] py-12 font-sans px-4 flex items-center justify-center">
                <div className="max-w-4xl w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate__animated animate__fadeIn">
                    
                    {/* Left Section: Ticket Info */}
                    <div className="flex-1 p-6 sm:p-8 md:p-10 space-y-6">
                        {/* Success Header Banner */}
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center shrink-0 shadow-inner">
                                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                    Đặt Vé Thành Công!
                                </h2>
                                <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
                                    Cảm ơn bạn đã lựa chọn Mievoh. Suất chiếu đang chờ đón bạn.
                                </p>
                            </div>
                        </div>

                        {/* Movie Block */}
                        <div className="flex gap-4 items-start text-left pt-2">
                            <img 
                                src={bookingData.movie?.image || "🍿"} 
                                alt="Movie Poster" 
                                className="w-20 h-28 sm:w-24 sm:h-36 object-cover rounded-2xl shadow-md border border-slate-100 dark:border-zinc-800 shrink-0"
                            />
                            <div className="space-y-1.5">
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                                    {bookingData.movie?.title}
                                </h3>
                                <p className="text-xs sm:text-sm font-bold text-[#8E7EFE] dark:text-[#a599ff]">
                                    {bookingData.movie?.genres?.join(" / ") || "Hành động / Viễn tưởng"} • {bookingData.movie?.duration || "120 phút"}
                                </p>
                                <span className="inline-block px-2.5 py-0.5 bg-rose-500 text-white rounded-lg text-[10px] font-black">
                                    {bookingData.movie?.ageRating || "T13"}
                                </span>
                            </div>
                        </div>

                        <hr className="border-slate-100 dark:border-zinc-800/80 my-2" />

                        {/* Info details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-left">
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Rạp Chiếu</span>
                                <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-zinc-250 mt-1 leading-snug">
                                    {bookingData.branchName}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Phòng Chiếu & Ghế</span>
                                <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-zinc-250 mt-1 leading-snug flex flex-wrap items-center gap-2">
                                    <span>{bookingData.roomName}</span>
                                    <span className="px-2.5 py-0.5 bg-violet-50 dark:bg-violet-950/40 text-[#8E7EFE] dark:text-[#a599ff] rounded-lg font-black text-xs sm:text-sm">
                                        {bookingData.seats?.join(", ")}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Thời Gian Suất Chiếu</span>
                                <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-zinc-250 mt-1 leading-snug">
                                    {bookingData.time} • {bookingData.dayOfWeek}, {bookingData.dateLabel}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Định Dạng</span>
                                <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-zinc-250 mt-1 leading-snug">
                                    {bookingData.format} Phụ Đề Việt
                                </p>
                            </div>
                        </div>

                        <hr className="border-slate-100 dark:border-zinc-800/80 my-2" />

                        {/* Amount */}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
                                Tổng số tiền đã thanh toán:
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-[#8E7EFE] dark:text-[#a599ff]">
                                {formatPrice(bookingData.totalPrice)}
                            </span>
                        </div>
                    </div>

                    {/* Right Section: Barcode and Actions */}
                    <div className="w-full md:w-[320px] bg-slate-50/50 dark:bg-zinc-955 p-6 sm:p-8 md:p-10 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dashed border-slate-200 dark:border-zinc-855 relative">
                        {/* Top half circle notch */}
                        <div className="hidden md:block absolute -top-3.5 -left-3.5 w-7 h-7 rounded-full bg-[#EFEBF4] dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800" />
                        {/* Bottom half circle notch */}
                        <div className="hidden md:block absolute -bottom-3.5 -left-3.5 w-7 h-7 rounded-full bg-[#EFEBF4] dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800" />

                        {/* Barcode Frame */}
                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center w-full max-w-[240px] mx-auto mb-6">
                            <div className="h-16 w-full bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_6px,#000_6px,#000_10px)] dark:bg-[repeating-linear-gradient(90deg,#fff,#fff_2px,transparent_2px,transparent_6px,#fff_6px,#fff_10px)]" />
                            <span className="text-base font-black text-slate-800 dark:text-white tracking-[0.25em] mt-4 uppercase">
                                {bookingData.bookingCode?.split("").join(" ")}
                            </span>
                        </div>

                        <p className="text-[10px] font-black text-slate-450 dark:text-zinc-400 tracking-wider text-center max-w-[180px] leading-relaxed uppercase mb-8">
                            Quét mã vạch tại rạp để in vé vào phòng
                        </p>

                        <div className="w-full space-y-3">
                            <Link
                                to="/"
                                className="block w-full py-3.5 px-4 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-white font-extrabold text-sm rounded-2xl transition-all text-center shadow-sm cursor-pointer"
                            >
                                Về Trang Chủ
                            </Link>
                            <Link
                                to="/profile?tab=tickets"
                                className="block w-full py-3.5 px-4 bg-[#8E7EFE] hover:bg-[#7d6dfc] text-white font-extrabold text-sm rounded-2xl transition-all text-center shadow-lg shadow-violet-100 dark:shadow-none cursor-pointer"
                            >
                                {t("ticket_history_title")}
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // Failure / Error view
    return (
        <div className="w-full min-h-[70vh] bg-[#EFEBF4] dark:bg-zinc-955 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-xl text-center space-y-6 animate__animated animate__zoomIn">
                <div className="flex justify-center text-rose-500">
                    <XCircle className="w-16 h-16" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                        Thanh toán không thành công
                    </h2>
                    <p className="text-slate-500 dark:text-zinc-400 font-bold text-sm">
                        {errorMessage || "Đã xảy ra lỗi trong quá trình giao dịch qua cổng thanh toán VNPay."}
                    </p>
                </div>

                <div className="border-t border-slate-100 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row gap-3">
                    <Link
                        to="/"
                        className="flex-1 py-3 px-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-white font-extrabold text-sm rounded-xl transition-all text-center cursor-pointer"
                    >
                        Quay lại trang chủ
                    </Link>
                    {bookingData?.movieId && (
                        <Link
                            to={`/movies/${bookingData.movieId}/book/seats`}
                            className="flex-1 py-3 px-4 bg-[#8E7EFE] hover:bg-[#7d6dfc] text-white font-extrabold text-sm rounded-xl transition-all text-center cursor-pointer shadow-lg shadow-violet-100 dark:shadow-none"
                        >
                            Thử lại
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
