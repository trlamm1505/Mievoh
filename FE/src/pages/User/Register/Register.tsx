import useLogin from '../../../hooks/useLogin.ts';
import useRegister from '../../../hooks/useRegister.ts';
import '../../../CSS/Register.css';
import DesktopSignupPanel from './DesktopSignupPanel/DesktopSignupPanel.tsx';
import DesktopSigninPanel from './DesktopSigninPanel/DesktopSigninPanel.tsx';
import DesktopOverlay from './DesktopOverlay/DesktopOverlay.tsx';
import MobileSigninPanel from './MobileSigninPanel/MobileSigninPanel.tsx';
import MobileSignupPanel from './MobileSignupPanel/MobileSignupPanel.tsx';
import OtpModal from './OtpModal/OtpModal.tsx';

export default function Register() {
    const loginProps = useLogin(true);
    const registerProps = useRegister(loginProps.handleSwitchToLogin);

    return (
        <div
            className="relative min-h-screen w-full overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/movie_theater_bg.png')" }}
        >
            {/* Soft, fully transparent overlay tint to ensure forms are legible without blurring the background cinema seats */}
            <div className="absolute inset-0 bg-[#f3f0ff]/30 pointer-events-none" />

            {/* Animated Glowing Orbs Background */}
            <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-violet-400/20 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[8000ms]" />
            <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-pink-400/15 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6000ms]" />

            {/* Desktop Double-Sliding Layout container */}
            <div className={`relative hidden md:block auth-container ${loginProps.isSliding ? 'right-panel-active' : ''}`}>
                <DesktopSignupPanel registerProps={registerProps} />
                <DesktopSigninPanel loginProps={loginProps} />
                <DesktopOverlay 
                    handleSwitchToLogin={loginProps.handleSwitchToLogin} 
                    handleSwitchToRegister={loginProps.handleSwitchToRegister} 
                />
            </div>

            {/* MOBILE & TABLET RESPONSIVE FALLBACK LAYOUT */}
            <div className="relative md:hidden w-full max-w-sm">
                {!loginProps.isSliding ? (
                    <MobileSigninPanel 
                        loginProps={loginProps} 
                        handleSwitchToRegister={loginProps.handleSwitchToRegister} 
                    />
                ) : (
                    <MobileSignupPanel 
                        registerProps={registerProps} 
                        handleSwitchToLogin={loginProps.handleSwitchToLogin} 
                    />
                )}
            </div>

            {/* OTP Modal */}
            <OtpModal
                isOpen={registerProps.showOtpModal}
                onClose={() => registerProps.setShowOtpModal(false)}
                email={registerProps.registerForm.email}
                otpCode={registerProps.otpCode}
                setOtpCode={registerProps.setOtpCode}
                otpLoading={registerProps.otpLoading}
                otpError={registerProps.otpError}
                otpResendLoading={registerProps.otpResendLoading}
                onSubmit={registerProps.handleVerifyOtpSubmit}
                onResend={registerProps.handleResendOtp}
            />

            {/* Forgot Password OTP Modal */}
            <OtpModal
                isOpen={loginProps.showForgotOtpModal}
                onClose={() => loginProps.setShowForgotOtpModal(false)}
                email={loginProps.forgotEmail}
                otpCode={loginProps.forgotOtpCode}
                setOtpCode={loginProps.setForgotOtpCode}
                otpLoading={loginProps.forgotOtpLoading}
                otpError={loginProps.forgotOtpError}
                otpResendLoading={loginProps.forgotOtpResendLoading}
                onSubmit={loginProps.handleVerifyForgotOtp}
                onResend={loginProps.handleResendForgotOtp}
            />
        </div>
    );
}