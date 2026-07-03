import {
    ArrowRight,
    ArrowLeft,
    Clapperboard,
    Film,
    Ticket,
    Sparkles
} from 'lucide-react';
import { useLanguage } from '../../../../contextAPI/LanguageContext.tsx';

interface DesktopOverlayProps {
    handleSwitchToLogin: () => void;
    handleSwitchToRegister: () => void;
}

export default function DesktopOverlay({ handleSwitchToLogin, handleSwitchToRegister }: DesktopOverlayProps) {
    const { t } = useLanguage();

    return (
        <div className="overlay-container">
            <div className="overlay">
                {/* Overlay Panel Left */}
                <div className="overlay-panel overlay-left">
                    <div className="absolute top-12 left-10 text-white/20 animate-bounce duration-[3000ms]"><Ticket className="h-8 w-8" /></div>
                    <div className="absolute bottom-16 right-12 text-white/20 animate-spin duration-[10000ms]"><Film className="h-10 w-10" /></div>

                    <img src="/images/mievoh_logo.png" alt="Mievoh" className="h-24 w-24 object-cover rounded-full mb-6 border border-white/20 shadow-md" />

                    <h2 className="text-3xl md:text-4xl font-black mb-4 flex items-center gap-1.5 text-white text-center">
                        {t("already_have_account")} <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
                    </h2>
                    <p className="text-base md:text-lg text-violet-100 max-w-[360px] mb-10 leading-relaxed text-center">
                        {t("already_have_account_desc")}
                    </p>

                    <button
                        type="button"
                        onClick={handleSwitchToLogin}
                        className="px-12 py-3.5 border border-white/40 rounded-full font-bold hover:bg-white/10 hover:border-white transition-all flex items-center gap-2.5 text-lg cursor-pointer animate-pulse"
                    >
                        <ArrowLeft className="h-5 w-5" /> {t("sign_in_title").toUpperCase()}
                    </button>
                </div>

                {/* Overlay Panel Right */}
                <div className="overlay-panel overlay-right">
                    <div className="absolute top-14 right-14 text-white/20 animate-bounce duration-[4000ms]"><Clapperboard className="h-8 w-8" /></div>
                    <div className="absolute bottom-14 left-12 text-white/20 animate-pulse"><Film className="h-10 w-10" /></div>

                    <img src="/images/mievoh_logo.png" alt="Mievoh" className="h-24 w-24 object-cover rounded-full mb-6 border border-white/20 shadow-md" />

                    <h2 className="text-3xl md:text-4xl font-black mb-4 flex items-center gap-1.5 text-white text-center">
                        {t("hello_friend_overlay")} <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
                    </h2>
                    <p className="text-base md:text-lg text-violet-100 max-w-[360px] mb-10 leading-relaxed text-center">
                        {t("hello_friend_desc")}
                    </p>

                    <button
                        type="button"
                        onClick={handleSwitchToRegister}
                        className="px-12 py-3.5 border border-white/40 rounded-full font-bold hover:bg-white/10 hover:border-white transition-all flex items-center gap-2.5 text-lg cursor-pointer animate-pulse"
                    >
                        {t("sign_up_now")} <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
