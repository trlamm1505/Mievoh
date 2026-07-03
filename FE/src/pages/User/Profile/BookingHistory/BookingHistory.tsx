import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Ticket, Calendar, Clock, MapPin, Receipt, CheckCircle, Info, XCircle } from "lucide-react";
import type { RootState } from "../../../../store/index.tsx";
import { resetBooking } from "../../SelectSeat/slice.ts";
import { toast } from "../../../../components/Toast/Toast.tsx";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";

export interface BookingRecord {
    id: string;
    bookingCode: string;
    movieId: number;
    movieTitle: string;
    movieImage: string;
    branchName: string;
    time: string;
    date: string;
    seats: string[];
    combos: string;
    totalPrice: number;
    status: "Paid" | "Pending" | "Cancelled";
    dateBooked: string;
}

import { getBookingHistoryApi } from "../../../../axios/profile";

const mapApiHistoryToRecord = (item: any): BookingRecord => {
    let showtimeDate = "";
    let showtimeTime = "";
    if (item.Showtime?.showDateTime) {
        try {
            const d = new Date(item.Showtime.showDateTime);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            showtimeDate = `${year}-${month}-${day}`;

            const hours = String(d.getHours()).padStart(2, "0");
            const minutes = String(d.getMinutes()).padStart(2, "0");
            showtimeTime = `${hours}:${minutes}`;
        } catch (e) {
            console.error(e);
        }
    }

    let dateBookedStr = "";
    if (item.createdAt) {
        try {
            const d = new Date(item.createdAt);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            dateBookedStr = `${day}/${month}/${year}`;
        } catch (e) {
            console.error(e);
        }
    }

    const seats = item.BookingDetails ? item.BookingDetails.map((d: any) => d.Seat?.name).filter(Boolean) : [];
    const combos = item.BookingFoods && item.BookingFoods.length > 0
        ? item.BookingFoods.map((f: any) => `${f.quantity}x ${f.Food?.name}`).join(", ")
        : "None";

    let statusMapped: "Paid" | "Pending" | "Cancelled" = "Pending";
    if (item.paymentStatus === "Success") {
        statusMapped = "Paid";
    } else if (item.paymentStatus === "Failed") {
        statusMapped = "Cancelled";
    }

    return {
        id: item.bookingId,
        bookingCode: item.ticketCode || "",
        movieId: 0,
        movieTitle: item.Showtime?.Movie?.title_vi || item.Showtime?.Movie?.title_en || "Phim",
        movieImage: item.Showtime?.Movie?.imageUrl || "🍿",
        branchName: item.Showtime?.Cinema?.CinemaComplex?.name || "Rạp chiếu phim",
        time: showtimeTime || "12:00",
        date: showtimeDate || "",
        seats,
        combos,
        totalPrice: item.totalPrice || 0,
        status: statusMapped,
        dateBooked: dateBookedStr || ""
    };
};

export default function BookingHistory() {
    const { t, language } = useLanguage();
    const dispatch = useDispatch();
    const [history, setHistory] = useState<BookingRecord[]>([]);
    const [selectedRecordForModal, setSelectedRecordForModal] = useState<BookingRecord | null>(null);

    // Check if there is an active successful booking in the current state
    const booking = useSelector((state: RootState) => state.booking);

    useEffect(() => {
        if (booking.bookingSuccess && booking.bookingCode) {
            dispatch(resetBooking());
        }

        const fetchHistory = async () => {
            try {
                const res = await getBookingHistoryApi();
                if (res && res.data) {
                    const mapped = res.data
                        .map(mapApiHistoryToRecord)
                        .filter((record: BookingRecord) => record.status === "Paid");
                    setHistory(mapped);
                }
            } catch (err) {
                console.error("Failed to load booking history:", err);
                toast.error("Không thể tải lịch sử đặt vé");
            }
        };

        fetchHistory();
    }, [booking, dispatch]);

    const formatPrice = (value: number) => {
        return value.toLocaleString("vi-VN") + " VND";
    };

    return (
        <div className="flex flex-col gap-6 animate__animated animate__fadeIn">
            <style>{`
                .custom-booking-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-booking-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-booking-scrollbar::-webkit-scrollbar-thumb {
                    background: #E9D5FF;
                    border-radius: 9999px;
                }
                .custom-booking-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D8B4FE;
                }
                div.mievoh-barcode-modal {
                    background-color: #ffffff !important;
                }
                .dark div.mievoh-barcode-modal {
                    background-color: var(--color-dark-obsidian) !important;
                    border-color: #223047 !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6) !important;
                }
                div.mievoh-barcode-frame {
                    background-color: #ffffff !important;
                    border-color: #e5e7eb !important;
                }
                .dark div.mievoh-barcode-frame {
                    background-color: #ffffff !important;
                    border-color: #a78bfa !important;
                    box-shadow: 0 0 25px rgba(167, 139, 250, 0.45) !important;
                }
                div.mievoh-barcode-frame .mievoh-barcode-text,
                .dark div.mievoh-barcode-frame .mievoh-barcode-text {
                    color: #5b21b6 !important;
                    letter-spacing: 0.1em !important;
                }
                div.mievoh-barcode-frame .mievoh-barcode-img,
                div.mievoh-barcode-frame svg,
                .dark div.mievoh-barcode-frame .mievoh-barcode-img,
                .dark div.mievoh-barcode-frame svg {
                    filter: none !important;
                }
            `}</style>

            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
                    <Ticket className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-550">{t("no_tickets_booked")}</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-2 custom-booking-scrollbar">
                    {history.map((record) => (
                        <div
                            key={record.id}
                            className="flex flex-col lg:flex-row border border-[#EAE6F0] rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 shrink-0"
                        >
                            {/* Movie Banner - Smaller */}
                            <div className="w-full lg:w-36 h-40 lg:h-auto relative shrink-0">
                                <img
                                    src={record.movieImage}
                                    alt={record.movieTitle}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Ticket Details */}
                            <div className="flex-grow p-5 flex flex-col justify-between gap-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                        <h4 className="text-base font-black text-gray-900">
                                            {record.movieTitle}
                                        </h4>
                                        {record.status === "Paid" ? (
                                            <span className="inline-flex self-start items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                                                {t("paid_status")}
                                            </span>
                                        ) : record.status === "Cancelled" ? (
                                            <span className="inline-flex self-start items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                                                {language === "vi" ? "Đã hủy" : "Cancelled"}
                                            </span>
                                        ) : (
                                            <span className="inline-flex self-start items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                                {language === "vi" ? "Chờ thanh toán" : "Pending"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 font-medium mt-1">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-violet-500 dark:text-[#a599ff] shrink-0" />
                                            <span className="truncate text-xs sm:text-sm">{record.branchName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-violet-500 dark:text-[#a599ff] shrink-0" />
                                            <span className="text-xs sm:text-sm">{record.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-violet-500 dark:text-[#a599ff] shrink-0" />
                                            <span className="text-xs sm:text-sm">{t("booking_showtime")}: {record.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Ticket className="h-4 w-4 text-violet-500 dark:text-[#a599ff] shrink-0" />
                                            <span className="text-xs sm:text-sm">{t("booking_seats")}: <strong className="text-gray-900 dark:text-white">{record.seats.join(", ")}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dash divider */}
                                <div className="border-t border-dashed border-[#EAE6F0] my-1" />

                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                                        <Info className="h-3.5 w-3.5 text-gray-400" />
                                        <span>{t("booking_combo")}: {record.combos} | {t("booked_on")}: {record.dateBooked}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Receipt className="h-4 w-4 text-violet-650 dark:text-[#a599ff]" />
                                        <span className="text-base font-black text-[#6D28D9] dark:text-[#a599ff] whitespace-nowrap">
                                            {formatPrice(record.totalPrice)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Stub Action Column */}
                            <div className="flex flex-col items-center justify-center p-5 border-t lg:border-t-0 lg:border-l border-dashed border-[#EAE6F0] bg-violet-50/10 shrink-0 lg:w-36 gap-3">
                                <div className="h-12 w-12 rounded-full bg-violet-50 dark:bg-[#a599ff]/10 text-violet-600 dark:text-[#a599ff] flex items-center justify-center shadow-inner">
                                    <Ticket className="h-6 w-6" />
                                </div>
                                <button
                                    onClick={() => setSelectedRecordForModal(record)}
                                    className="px-4 py-2 text-xs font-black text-violet-800 dark:text-violet-950 bg-violet-100 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-500 dark:hover:text-white rounded-xl transition-all duration-300 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                                >
                                    {t("view_ticket_code")}
                                </button>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{t("click_to_scan")}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Ticket Modal */}
            {selectedRecordForModal && (
                <div
                    className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn animate__faster"
                    onClick={() => setSelectedRecordForModal(null)}
                >
                    <div
                        className="bg-white mievoh-barcode-modal rounded-3xl max-w-[380px] w-full p-7 shadow-2xl flex flex-col items-center relative border border-violet-100/50 animate__animated animate__zoomIn animate__faster"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full flex flex-col items-center gap-5">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{t("ticket_receipt_code")}</span>

                            {/* Barcode Frame */}
                            <div className="bg-white mievoh-barcode-frame p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col items-center w-full">
                                <img
                                    src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${selectedRecordForModal.bookingCode}&scale=2&rotate=N&includetext=false`}
                                    alt="Barcode"
                                    className="h-24 w-full object-fill mievoh-barcode-img"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        const fallback = e.currentTarget.nextSibling as HTMLElement;
                                        if (fallback) fallback.style.display = "flex";
                                    }}
                                />
                                {/* Offline Barcode Fallback SVG */}
                                <div className="hidden w-full h-24 flex-col justify-between">
                                    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
                                        <rect x="2" width="2" height="30" fill="#111827" />
                                        <rect x="5" width="1" height="30" fill="#111827" />
                                        <rect x="7" width="3" height="30" fill="#111827" />
                                        <rect x="12" width="1" height="30" fill="#111827" />
                                        <rect x="15" width="4" height="30" fill="#111827" />
                                        <rect x="20" width="2" height="30" fill="#111827" />
                                        <rect x="23" width="1" height="30" fill="#111827" />
                                        <rect x="26" width="3" height="30" fill="#111827" />
                                        <rect x="31" width="2" height="30" fill="#111827" />
                                        <rect x="35" width="1" height="30" fill="#111827" />
                                        <rect x="38" width="4" height="30" fill="#111827" />
                                        <rect x="44" width="2" height="30" fill="#111827" />
                                        <rect x="48" width="1" height="30" fill="#111827" />
                                        <rect x="51" width="3" height="30" fill="#111827" />
                                        <rect x="56" width="2" height="30" fill="#111827" />
                                        <rect x="60" width="1" height="30" fill="#111827" />
                                        <rect x="63" width="4" height="30" fill="#111827" />
                                        <rect x="69" width="2" height="30" fill="#111827" />
                                        <rect x="73" width="1" height="30" fill="#111827" />
                                        <rect x="76" width="3" height="30" fill="#111827" />
                                        <rect x="81" width="2" height="30" fill="#111827" />
                                        <rect x="85" width="1" height="30" fill="#111827" />
                                        <rect x="88" width="4" height="30" fill="#111827" />
                                        <rect x="94" width="2" height="30" fill="#111827" />
                                    </svg>
                                </div>
                                {selectedRecordForModal.bookingCode.length <= 10 ? (
                                    <div className="flex justify-between w-full px-2 mt-5 font-mono font-black text-xl sm:text-2xl text-gray-900 mievoh-barcode-text tracking-normal select-all">
                                        {selectedRecordForModal.bookingCode.toUpperCase().split("").map((char, index) => (
                                            <span key={index}>{char}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="w-full mt-5 font-mono font-black text-[10px] sm:text-xs text-gray-900 mievoh-barcode-text tracking-tighter select-all text-center break-all leading-normal">
                                        {selectedRecordForModal.bookingCode.toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <span className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wider">
                                {t("scan_at_counter_desc")}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
