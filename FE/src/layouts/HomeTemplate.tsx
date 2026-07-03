import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/header_user/Header.tsx";
import Footer from "../components/footer.user/Footer.tsx";
import BackToTop from "../components/BackToTop/BackToTop.tsx";
import ScrollReveal from "../components/ScrollReveal/ScrollReveal.tsx";
import { toast } from "../components/Toast/Toast.tsx";
import { verifyVNPayReturnApi } from "../axios/booking.tsx";

export default function HomeTemplate() {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const responseCode = query.get("vnp_ResponseCode");
    const txnRef = query.get("vnp_TxnRef"); // bookingId

    if (responseCode && txnRef) {
      if (
        window.location.pathname.includes("/book/seats") ||
        window.location.pathname.includes("vnpay-return") ||
        window.location.pathname.includes("ReturnUrl")
      ) {
        return;
      }
      const pendingBookings = JSON.parse(localStorage.getItem("mievoh_pending_bookings") || "{}");
      const pending = pendingBookings[txnRef];

      if (pending) {
        // Collect all query parameters into an object for verification
        const paramsObj: Record<string, string> = {};
        query.forEach((val, key) => {
          paramsObj[key] = val;
        });

        const verifyPayment = async () => {
          try {
            const res = await verifyVNPayReturnApi(paramsObj);
            
            // Code "00" indicates successful signature match & transaction approval from NestJS
            if (res.data?.code === "00") {
              const ticketCode = Math.random().toString(36).substring(2, 8).toUpperCase();
              const paidBooking = {
                ...pending,
                bookingCode: ticketCode,
                status: "Paid",
                dateBooked: new Date().toLocaleDateString("vi-VN")
              };

              // Load current history
              const stored = localStorage.getItem("mievoh_booking_history");
              const history = stored ? JSON.parse(stored) : [];
              
              // Check if already exists in history
              const exists = history.some((h: any) => h.bookingCode === ticketCode || h.id === txnRef);
              if (!exists) {
                const updatedHistory = [paidBooking, ...history];
                localStorage.setItem("mievoh_booking_history", JSON.stringify(updatedHistory));
              }
              toast.success("Payment successful! Your ticket has been booked.");
            } else {
              toast.error(res.data?.message || "Payment verification failed.");
            }
          } catch (err) {
            console.error("Payment verification failed:", err);
            toast.error("An error occurred while verifying your payment.");
          } finally {
            // Clean up pending
            delete pendingBookings[txnRef];
            localStorage.setItem("mievoh_pending_bookings", JSON.stringify(pendingBookings));

            // Clean up query params from URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        };

        verifyPayment();
      }
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <ScrollReveal animationClass="animate__fadeInUp">
        <Footer />
      </ScrollReveal>
      <BackToTop />
    </div>
  );
}
