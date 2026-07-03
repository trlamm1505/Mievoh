import React, { useState } from "react";
import Button from "../../../../components/Button/Button.tsx";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";

export default function Newsletter() {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes("@")) {
            setError(t("newsletter_invalid_email"));
            return;
        }

        setLoading(true);
        setError(null);
        
        // Simulate API call delay
        setTimeout(() => {
            setLoading(false);
            setIsSubscribed(true);
            setEmail("");
        }, 1200);
    };

    return (
        <section className="mx-auto max-w-[85%] px-4 py-16 sm:py-20 font-sans">
            <div className="relative text-center">

                <div className="relative mx-auto max-w-2xl">
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                        {t("newsletter_title")}
                    </h2>
                    
                    <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 leading-relaxed">
                        {t("newsletter_desc")}
                    </p>

                    {isSubscribed ? (
                        <div className="mt-8 rounded-2xl bg-green-50 p-4 border border-green-200 animate-scale-up">
                            <p className="text-sm font-semibold text-green-700">
                                {t("newsletter_success")}
                            </p>
                            <button
                                onClick={() => {
                                    setIsSubscribed(false);
                                    setError(null);
                                }}
                                className="mt-2 text-xs font-semibold text-green-600 underline hover:text-green-700"
                            >
                                {t("newsletter_another")}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <div className="w-full sm:max-w-md">
                                <label htmlFor="newsletter-email" className="sr-only">Email Address</label>
                                <input
                                    id="newsletter-email"
                                    type="email"
                                    placeholder={t("newsletter_placeholder")}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError(null);
                                    }}
                                    className="w-full rounded-full border border-gray-200 bg-white px-6 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7B68EE] focus:border-[#7B68EE] shadow-inner transition-all"
                                />
                                {error && (
                                    <p className="mt-2 text-left px-4 text-xs font-semibold text-red-500">
                                        {error}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={loading}
                                className="w-full sm:w-auto px-8"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2 justify-center">
                                        <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        {t("newsletter_subscribing")}
                                    </span>
                                ) : (
                                    t("newsletter_subscribe")
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}
