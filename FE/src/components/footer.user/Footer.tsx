import { Smartphone } from "lucide-react";
import { useLanguage } from "../../contextAPI/LanguageContext.tsx";

export default function Footer() {
    const { t } = useLanguage();
    const isAnimatedPath = true;

    return (
        <footer className="w-full bg-[#F6F3F9] border-t border-[#EAE6F0] text-gray-600 font-sans">
            <div className="mx-auto max-w-[85%] px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    {/* Column 1: Brand Info */}
                    <div className="flex flex-col items-start">
                        <a href="/" className={`flex items-center gap-0 ${isAnimatedPath ? "group" : ""}`} aria-label="Mievoh Homepage">
                            <img 
                                src="/images/mievoh_logo.png" 
                                alt="Mievoh Logo" 
                                className={`h-10 w-10 rounded-full object-cover ${isAnimatedPath ? "group-hover:scale-105 transition-transform duration-200" : ""}`} 
                            />
                            <span 
                                className={`logo-text-gradient h-32 w-auto my-[-3.0rem] ml-[-1.0rem] ${isAnimatedPath ? "transition-transform duration-200 group-hover:scale-[1.02]" : ""}`} 
                                aria-label="mievoh"
                            />
                        </a>
                        <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-xs">
                            {t("footer_desc")}
                        </p>
                        <p className="mt-6 text-xs text-gray-400">
                            {t("footer_rights")}
                        </p>
                    </div>

                    {/* Column 2: Explore */}
                    <div>
                        <h3 className="text-base font-bold review-header-gradient mb-4">{t("footer_explore")}</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="#" className={`text-sm text-gray-500 ${isAnimatedPath ? "hover:text-[#7B68EE] hover:underline transition-colors" : ""}`}>
                                    {t("footer_about")}
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`text-sm text-gray-500 ${isAnimatedPath ? "hover:text-[#7B68EE] hover:underline transition-colors" : ""}`}>
                                    {t("footer_terms")}
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`text-sm text-gray-500 ${isAnimatedPath ? "hover:text-[#7B68EE] hover:underline transition-colors" : ""}`}>
                                    {t("footer_privacy")}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Support */}
                    <div>
                        <h3 className="text-base font-bold review-header-gradient mb-4">{t("footer_support")}</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="#" className={`text-sm text-gray-500 ${isAnimatedPath ? "hover:text-[#7B68EE] hover:underline transition-colors" : ""}`}>
                                    {t("footer_help")}
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`text-sm text-gray-500 ${isAnimatedPath ? "hover:text-[#7B68EE] hover:underline transition-colors" : ""}`}>
                                    {t("footer_contact")}
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`text-sm text-gray-500 ${isAnimatedPath ? "hover:text-[#7B68EE] hover:underline transition-colors" : ""}`}>
                                    {t("footer_faq")}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Download App */}
                    <div>
                        <h3 className="text-base font-bold review-header-gradient mb-4">{t("footer_download")}</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="#" className={`flex items-center gap-2 text-sm text-gray-500 ${isAnimatedPath ? "hover:text-[#7B68EE] transition-colors" : ""}`}>
                                    <Smartphone className="h-5 w-5" />
                                    <span>App Store</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`flex items-center gap-2 text-sm text-gray-500 ${isAnimatedPath ? "hover:text-[#7B68EE] transition-colors" : ""}`}>
                                    <svg className="h-5 w-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                                        <rect x="3" y="5" width="18" height="14" rx="3" />
                                        <circle cx="8" cy="12" r="2" />
                                        <circle cx="16" cy="12" r="2" />
                                        <line x1="11" y1="10" x2="13" y2="10" />
                                        <line x1="11" y1="14" x2="13" y2="14" />
                                    </svg>
                                    <span>Google Play</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
}
