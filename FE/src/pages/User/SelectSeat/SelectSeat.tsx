import { useState } from "react";
import { ArrowLeft, ChevronRight, LayoutGrid, ShoppingBag, CreditCard } from "lucide-react";
import SeatSelection from "./SeatSelection/SeatSelection.tsx";
import PopcornSelection from "./PopcornSelection/PopcornSelection.tsx";
import PaymentMethods from "./PaymentMethods/PaymentMethods.tsx";
import QRTransferPage from "./QRTransferPage/QRTransferPage.tsx";
import BookingSidebar from "./BookingSidebar/BookingSidebar.tsx";
import ConfirmationModal from "./ConfirmationModal/ConfirmationModal.tsx";
import VoucherModal from "./VoucherModal/VoucherModal.tsx";
import useSelectSeat from "../../../hooks/useSelectSeat.ts";
import { useLanguage } from "../../../contextAPI/LanguageContext.tsx";

export default function SelectSeat() {
    const { t, language } = useLanguage();
    const {
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
        movie: movieRaw,
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
        combos,
        loading,
        seatsList,
        availableVouchers,
        voucherCodeInput,
        setVoucherCodeInput,
        appliedVoucher,
        voucherError,
        handleApplyVoucher,
        handleRemoveVoucher,
        discountAmount,
        finalPrice
    } = useSelectSeat();

    const movie = movieRaw as any;

    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [isVoucherClosing, setIsVoucherClosing] = useState(false);

    const openVoucherModal = () => {
        setShowVoucherModal(true);
    };

    const closeVoucherModal = () => {
        setIsVoucherClosing(true);
        setTimeout(() => {
            setShowVoucherModal(false);
            setIsVoucherClosing(false);
        }, 250);
    };

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-[#EFEBF4] dark:bg-zinc-950 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#8E7EFE] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#8E7EFE] dark:text-[#a599ff] font-black mt-4 text-base tracking-wide animate-pulse">
                    {language === "vi" ? "Đang tải thông tin đặt vé..." : "Loading booking details..."}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#EFEBF4] dark:bg-zinc-955 min-h-screen pb-16 font-sans">
            {/* Header info banner with movie backdrops */}
            <div className="relative w-full overflow-hidden bg-[#0F0C15] text-white py-8 border-b border-violet-950/20">
                <div 
                    className="absolute inset-0 bg-cover bg-center filter blur-[6px] scale-105 opacity-50 pointer-events-none"
                    style={{ backgroundImage: `url(${movie.backdrop || movie.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/90" />

                <div className="relative max-w-7xl mx-auto px-4 z-10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                                    {movie.title}
                                </h1>
                                <p className="text-violet-300 text-xs font-bold mt-1 uppercase tracking-wider flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span>{branchName}</span>
                                    <span className="text-violet-500">•</span>
                                    <span>{roomName}</span>
                                    <span className="text-violet-500">•</span>
                                    <span>{dayOfWeek}, {dateLabel}</span>
                                    <span className="text-violet-500">•</span>
                                    <span className="text-emerald-400 font-extrabold">{time}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="max-w-7xl mx-auto px-4 mt-6">
                {/* Stepper Header */}
                <div className="bg-white dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-3xl py-4 shadow-sm mb-6 flex items-center justify-center gap-1 sm:gap-6 md:gap-12 animate__animated animate__fadeIn px-2 sm:px-4">
                    <div className={`flex items-center gap-1 sm:gap-2 transition-all duration-300 ${activeStep === 1 ? "text-[#8E7EFE] dark:text-[#a599ff]" : "text-slate-500 dark:text-white font-extrabold"}`}>
                        <div className={`p-1 sm:p-2 rounded-xl flex items-center justify-center ${activeStep === 1 ? "bg-violet-50 dark:bg-[#8E7EFE]/15 text-[#8E7EFE] dark:text-[#a599ff]" : "bg-transparent text-slate-400 dark:text-zinc-300"}`}>
                            <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-extrabold uppercase tracking-wider">{t("select_seat_title")}</span>
                    </div>

                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-300 dark:text-zinc-500" />

                    <div className={`flex items-center gap-1 sm:gap-2 transition-all duration-300 ${activeStep === 2 ? "text-[#8E7EFE] dark:text-[#a599ff]" : "text-slate-500 dark:text-white font-extrabold"}`}>
                        <div className={`p-1 sm:p-2 rounded-xl flex items-center justify-center ${activeStep === 2 ? "bg-violet-50 dark:bg-[#8E7EFE]/15 text-[#8E7EFE] dark:text-[#a599ff]" : "bg-transparent text-slate-400 dark:text-zinc-300"}`}>
                            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-extrabold uppercase tracking-wider">{t("stepper_combos")}</span>
                    </div>

                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-300 dark:text-zinc-500" />

                    <div className={`flex items-center gap-1 sm:gap-2 transition-all duration-300 ${activeStep === 3 ? "text-[#8E7EFE] dark:text-[#a599ff]" : "text-slate-500 dark:text-white font-extrabold"}`}>
                        <div className={`p-1 sm:p-2 rounded-xl flex items-center justify-center ${activeStep === 3 ? "bg-violet-50 dark:bg-[#8E7EFE]/15 text-[#8E7EFE] dark:text-[#a599ff]" : "bg-transparent text-slate-400 dark:text-zinc-300"}`}>
                            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-extrabold uppercase tracking-wider">{t("stepper_payment")}</span>
                    </div>
                </div>

                {showQRTransfer ? (
                    <QRTransferPage
                        isVerifying={isVerifying}
                        paymentTimeLeft={paymentTimeLeft}
                        formatTimeLeft={formatTimeLeft}
                        bookingCode={bookingCode}
                        totalPrice={totalPrice}
                        formatPrice={formatPrice}
                        setShowQRTransfer={setShowQRTransfer}
                        setIsVerifying={setIsVerifying}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full min-w-0">
                        <div className="lg:col-span-2 flex flex-col gap-6 w-full min-w-0">
                            {activeStep === 1 && (
                                <SeatSelection
                                    selectedSeats={selectedSeats}
                                    handleSeatClick={handleSeatClick}
                                    seatsList={seatsList}
                                />
                            )}
                            {activeStep === 2 && (
                                <PopcornSelection
                                    combos={combos}
                                    comboQuantities={comboQuantities}
                                    updateComboQuantity={updateComboQuantity}
                                    setActiveStep={setActiveStep}
                                    formatPrice={formatPrice}
                                />
                            )}
                            {activeStep === 3 && (
                                <PaymentMethods
                                    paymentMethod={paymentMethod}
                                    setPaymentMethod={setPaymentMethod}
                                    isAuthenticated={isAuthenticated}
                                    guestName={guestName}
                                    guestPhone={guestPhone}
                                    guestEmail={guestEmail}
                                    guestErrors={guestErrors}
                                    handleGuestChange={handleGuestChange}
                                    setActiveStep={setActiveStep}
                                />
                            )}
                        </div>

                        <BookingSidebar
                            movie={movie}
                            branchName={branchName}
                            roomName={roomName}
                            time={time}
                            dayOfWeek={dayOfWeek}
                            dateLabel={dateLabel}
                            format={format}
                            selectedSeats={selectedSeats}
                            ticketBreakdown={ticketBreakdown}
                            comboPrice={comboPrice}
                            combos={combos}
                            comboQuantities={comboQuantities}
                            totalPrice={totalPrice}
                            formatPrice={formatPrice}
                            activeStep={activeStep}
                            setActiveStep={setActiveStep}
                            isBooking={isBooking}
                            handleCheckout={handleCheckout}
                            voucherCodeInput={voucherCodeInput}
                            setVoucherCodeInput={setVoucherCodeInput}
                            appliedVoucher={appliedVoucher}
                            voucherError={voucherError}
                            handleApplyVoucher={handleApplyVoucher}
                            handleRemoveVoucher={handleRemoveVoucher}
                            discountAmount={discountAmount}
                            finalPrice={finalPrice}
                            openVoucherModal={openVoucherModal}
                        />
                    </div>
                )}
            </div>

            <ConfirmationModal
                showConfirmModal={showConfirmModal}
                isClosing={isClosing}
                closeModal={closeModal}
                branchName={branchName}
                movie={movie}
                time={time}
                dayOfWeek={dayOfWeek}
                dateLabel={dateLabel}
                selectedSeats={selectedSeats}
                isAuthenticated={isAuthenticated}
                userFullName={userFullName}
                userPhone={userPhone}
                userEmailAddress={userEmailAddress}
                guestName={guestName}
                guestPhone={guestPhone}
                guestEmail={guestEmail}
                paymentMethod={paymentMethod}
                totalPrice={appliedVoucher ? finalPrice : totalPrice}
                formatPrice={formatPrice}
                executeCheckout={executeCheckout}
            />

            <VoucherModal
                showModal={showVoucherModal}
                isClosing={isVoucherClosing}
                closeModal={closeVoucherModal}
                availableVouchers={availableVouchers}
                currentTotalPrice={totalPrice}
                onApplyVoucher={handleApplyVoucher}
                formatPrice={formatPrice}
            />
        </div>
    );
}
