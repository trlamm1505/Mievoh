import React, { useState } from "react";
import { Eye, EyeOff, Save, Check } from "lucide-react";
import { toast } from "../../../../components/Toast/Toast.tsx";
import Button from "../../../../components/Button/Button.tsx";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import { validatePassword, validateConfirmPassword } from "../../../../validation/validation";
import { changePasswordApi } from "../../../../axios/auth.tsx";

export default function ChangePassword() {
    const { t } = useLanguage();
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const copy = { ...prev };
                delete copy[name];
                return copy;
            });
        }
    };

    const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        
        if (!formData.currentPassword) {
            errs.currentPassword = "Current password is required";
        }
        
        const newPasswordError = validatePassword(formData.newPassword);
        if (newPasswordError) {
            errs.newPassword = newPasswordError.replace("Password", "New password");
        }
        
        const confirmError = validateConfirmPassword(formData.newPassword, formData.confirmPassword);
        if (confirmError) {
            errs.confirmPassword = confirmError.replace("Confirm password", "Confirm new password");
        }
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSaving(true);
        setIsSaved(false);

        try {
            await changePasswordApi({
                oldPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            setIsSaving(false);
            setIsSaved(true);
            toast.success(t("password_changed_success"));
            setFormData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

            setTimeout(() => {
                setIsSaved(false);
            }, 3000);
        } catch (err: any) {
            setIsSaving(false);
            const message = err.response?.data?.message || t("password_changed_failed");
            toast.error(message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate__animated animate__fadeIn">
            {/* Fields */}
            <div className="flex flex-col gap-5 max-w-lg">
                {/* Current password */}
                <div className={`p-4 px-5 rounded-2xl border transition-all duration-300 flex flex-col gap-1.5 min-h-[88px] justify-center ${
                    errors.currentPassword 
                        ? "border-red-300 bg-red-50/10 focus-within:border-red-500" 
                        : "border-violet-100 bg-white/95 focus-within:border-violet-500 focus-within:shadow-md"
                }`}>
                    <label className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest select-none">{t("current_password")} *</label>
                    <div className="relative">
                        <input
                            type={showPasswords.current ? "text" : "password"}
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            placeholder={t("current_password_placeholder")}
                            className="w-full bg-transparent py-2 pr-8 text-base text-gray-700 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility("current")}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 cursor-pointer"
                        >
                            {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.currentPassword && <span className="text-xs font-bold text-red-500 mt-1">{errors.currentPassword}</span>}
                </div>

                {/* New password */}
                <div className={`p-4 px-5 rounded-2xl border transition-all duration-300 flex flex-col gap-1.5 min-h-[88px] justify-center ${
                    errors.newPassword 
                        ? "border-red-300 bg-red-50/10 focus-within:border-red-500" 
                        : "border-violet-100 bg-white/95 focus-within:border-violet-500 focus-within:shadow-md"
                }`}>
                    <label className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest select-none">{t("new_password")} *</label>
                    <div className="relative">
                        <input
                            type={showPasswords.new ? "text" : "password"}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            placeholder={t("new_password_placeholder")}
                            className="w-full bg-transparent py-2 pr-8 text-base text-gray-700 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility("new")}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 cursor-pointer"
                        >
                            {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.newPassword && <span className="text-xs font-bold text-red-500 mt-1">{errors.newPassword}</span>}
                </div>

                {/* Confirm password */}
                <div className={`p-4 px-5 rounded-2xl border transition-all duration-300 flex flex-col gap-1.5 min-h-[88px] justify-center ${
                    errors.confirmPassword 
                        ? "border-red-300 bg-red-50/10 focus-within:border-red-500" 
                        : "border-violet-100 bg-white/95 focus-within:border-violet-500 focus-within:shadow-md"
                }`}>
                    <label className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest select-none">{t("confirm_new_password")} *</label>
                    <div className="relative">
                        <input
                            type={showPasswords.confirm ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder={t("confirm_new_password_placeholder")}
                            className="w-full bg-transparent py-2 pr-8 text-base text-gray-700 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility("confirm")}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 cursor-pointer"
                        >
                            {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.confirmPassword && <span className="text-xs font-bold text-red-500 mt-1">{errors.confirmPassword}</span>}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-start pt-4 border-t border-[#DCD7F5]/50">
                <Button
                    type="submit"
                    disabled={isSaving}
                    variant="primary"
                    size="md"
                    className={`flex items-center gap-2 ${isSaved ? "!bg-emerald-600 !bg-none" : ""}`}
                >
                    {isSaving ? (
                        <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {t("updating_btn")}
                        </>
                    ) : isSaved ? (
                        <>
                            <Check className="h-4 w-4" />
                            {t("updated_success_btn")}
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            {t("update_password_btn")}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
