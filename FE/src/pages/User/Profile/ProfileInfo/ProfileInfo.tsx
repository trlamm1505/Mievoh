import React, { useState, useEffect } from "react";
import { Save, Check, Edit2, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { updateUser } from "../../Login/slice.ts";
import { toast } from "../../../../components/Toast/Toast.tsx";
import Button from "../../../../components/Button/Button.tsx";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import { validateEmail, validatePhone, validateName, validateDateOfBirth, validateCccd } from "../../../../validation/validation";
import { getProfileApi, updateProfileApi } from "../../../../axios/profile";

// Helper to convert date from backend (ISO string) to DD-MM-YYYY
const formatDobFromBackend = (dobStr: string | null): string => {
    if (!dobStr) return "";
    try {
        const date = new Date(dobStr);
        if (isNaN(date.getTime())) return "";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } catch {
        return "";
    }
};

// Helper to convert date from DD-MM-YYYY to YYYY-MM-DD for backend
const formatDobForBackend = (dobString: string): string | undefined => {
    if (!dobString) return undefined;
    const parts = dobString.split(/[-/.]/);
    if (parts.length === 3) {
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }
    return dobString;
};


interface ProfileInfoProps {
    user: any;
}

// Function to calculate age from Date of Birth string (DD-MM-YYYY, DD/MM/YYYY)
const calculateAge = (dobString: string): string => {
    if (!dobString) return "";
    const parts = dobString.split(/[-/.]/);
    if (parts.length !== 3) return "";
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-based month in JS Date
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return "";
    if (year < 1900 || year > new Date().getFullYear()) return "";
    
    const dob = new Date(year, month, day);
    // Validate date correctness (e.g. avoid 31-02-2020)
    if (dob.getFullYear() !== year || dob.getMonth() !== month || dob.getDate() !== day) return "";
    
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age >= 0 ? age.toString() : "";
};

interface CustomSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder: string;
    className?: string;
}

// Custom Select Dropdown that ALWAYS opens downwards
function CustomSelect({ value, onChange, options, placeholder, className = "" }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={`relative flex-1 ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-transparent py-1 text-base text-gray-700 outline-none cursor-pointer text-left select-none"
            >
                <span className={value ? "text-gray-750 font-semibold" : "text-gray-400 font-normal italic"}>
                    {value || placeholder}
                </span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#7B68EE"
                    strokeWidth="2.5"
                    className={`h-3.5 w-3.5 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-[110%] left-0 right-0 max-h-48 overflow-y-auto bg-white border border-violet-100 rounded-xl shadow-lg z-50 py-1 custom-select-dropdown animate__animated animate__fadeIn animate__faster">
                    <button
                        type="button"
                        onClick={() => {
                            onChange("");
                            setIsOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-gray-400 hover:bg-violet-50 text-left font-medium select-none"
                    >
                        {placeholder}
                    </button>
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 text-sm text-left transition-colors duration-150 font-semibold select-none ${
                                value === opt 
                                    ? "bg-violet-500 text-white font-bold" 
                                    : "text-gray-750 hover:bg-violet-50"
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
    const { t } = useLanguage();
    const dispatch = useDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || user?.hoTen || "",
        email: user?.email || "",
        phone: user?.phone || user?.soDT || "",
        gender: user?.gender !== undefined ? (typeof user.gender === "boolean" ? (user.gender ? "Male" : "Female") : user.gender) : "",
        age: user?.age || "",
        dateOfBirth: user?.dateOfBirth || "",
        address: user?.address || "",
        cccd: user?.cccd || "",
        avatar: user?.avatar || "/images/avatar.jpg"
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch user profile from backend API on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await getProfileApi();
                if (response && response.data) {
                    const data = response.data;
                    const formattedDob = formatDobFromBackend(data.dateOfBirth);
                    const age = formattedDob ? calculateAge(formattedDob) : "";
                    
                    const profileData = {
                        name: data.fullName || "",
                        email: data.email || "",
                        phone: data.phoneNumber || "",
                        gender: data.gender || "",
                        age: age,
                        dateOfBirth: formattedDob,
                        address: data.address || "",
                        cccd: data.cccd || "",
                        avatar: data.avatar || "/images/avatar.jpg"
                    };
                    
                    setFormData(profileData);
                    
                    dispatch(updateUser({
                        name: data.fullName || "",
                        hoTen: data.fullName || "",
                        fullName: data.fullName || "",
                        email: data.email || "",
                        phone: data.phoneNumber || "",
                        soDT: data.phoneNumber || "",
                        gender: data.gender || "",
                        age: age,
                        dateOfBirth: formattedDob,
                        address: data.address || "",
                        cccd: data.cccd || "",
                        avatar: data.avatar || "/images/avatar.jpg"
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            }
        };

        fetchProfile();
    }, [dispatch]);

    // Sync state with user prop changes
    useEffect(() => {
        if (user && !isEditing) {
            setFormData({
                name: user.name || user.hoTen || "",
                email: user.email || "",
                phone: user.phone || user.soDT || "",
                gender: user.gender !== undefined ? (typeof user.gender === "boolean" ? (user.gender ? "Male" : "Female") : user.gender) : "",
                age: user.age || "",
                dateOfBirth: user.dateOfBirth || "",
                address: user.address || "",
                cccd: user.cccd || "",
                avatar: user.avatar || "/images/avatar.jpg"
            });
        }
    }, [user, isEditing]);

    // Parse dateOfBirth helper into separate parts
    const parseDob = (dobString: string) => {
        if (!dobString) return { day: "", month: "", year: "" };
        const parts = dobString.split(/[-/.]/);
        return {
            day: parts[0] || "",
            month: parts[1] || "",
            year: parts[2] || ""
        };
    };

    const validateField = (name: string, value: string) => {
        let errorMsg: string | null = null;
        if (name === "name") {
            errorMsg = validateName(value);
        } else if (name === "email") {
            errorMsg = validateEmail(value);
        } else if (name === "phone") {
            errorMsg = validatePhone(value);
        } else if (name === "cccd") {
            errorMsg = validateCccd(value);
        } else if (name === "dateOfBirth") {
            errorMsg = validateDateOfBirth(value);
        }

        setErrors(prev => {
            if (errorMsg) {
                return { ...prev, [name]: errorMsg };
            } else {
                const copy = { ...prev };
                delete copy[name];
                return copy;
            }
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        let filteredValue = value;
        if (name === "cccd" || name === "phone") {
            // Strip out non-digit characters
            filteredValue = value.replace(/[^0-9]/g, "");
        }

        setFormData(prev => ({
            ...prev,
            [name]: filteredValue
        }));

        validateField(name, filteredValue);
    };

    const handleDobSelectChange = (part: "day" | "month" | "year", val: string) => {
        const { day, month, year } = parseDob(formData.dateOfBirth);
        
        let newDay = day;
        let newMonth = month;
        let newYear = year;
        
        if (part === "day") newDay = val;
        if (part === "month") newMonth = val;
        if (part === "year") newYear = val;
        
        const combined = (newDay && newMonth && newYear) 
            ? `${newDay.padStart(2, "0")}-${newMonth.padStart(2, "0")}-${newYear}` 
            : `${newDay || ""}-${newMonth || ""}-${newYear || ""}`.replace(/^-+|-+$/g, "");
            
        setFormData(prev => {
            const next = { ...prev, dateOfBirth: combined };
            const computedAge = calculateAge(combined);
            if (computedAge) {
                next.age = computedAge;
            }
            return next;
        });
        
        validateField("dateOfBirth", combined);
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || user?.hoTen || "",
            email: user?.email || "",
            phone: user?.phone || user?.soDT || "",
            gender: user?.gender !== undefined ? (typeof user.gender === "boolean" ? (user.gender ? "Male" : "Female") : user.gender) : "",
            age: user?.age || "",
            dateOfBirth: user?.dateOfBirth || "",
            address: user?.address || "",
            cccd: user?.cccd || "",
            avatar: user?.avatar || "/images/avatar.jpg"
        });
        setErrors({});
        setIsEditing(false);
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        
        const nameError = validateName(formData.name);
        if (nameError) errs.name = nameError;
        
        const emailError = validateEmail(formData.email);
        if (emailError) errs.email = emailError;
        
        const phoneError = validatePhone(formData.phone);
        if (phoneError) errs.phone = phoneError;
        
        const dobError = validateDateOfBirth(formData.dateOfBirth);
        if (dobError) errs.dateOfBirth = dobError;

        const cccdError = validateCccd(formData.cccd);
        if (cccdError) errs.cccd = cccdError;

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSaving(true);
        setIsSaved(false);

        try {
            const updateData = {
                fullName: formData.name,
                phoneNumber: formData.phone,
                gender: formData.gender,
                dateOfBirth: formatDobForBackend(formData.dateOfBirth),
                address: formData.address,
                cccd: formData.cccd
            };

            const response = await updateProfileApi(updateData);
            
            if (response && response.data) {
                const data = response.data;
                const formattedDob = formatDobFromBackend(data.dateOfBirth);
                const age = formattedDob ? calculateAge(formattedDob) : "";

                dispatch(updateUser({
                    name: data.fullName || "",
                    hoTen: data.fullName || "",
                    fullName: data.fullName || "",
                    email: data.email || "",
                    phone: data.phoneNumber || "",
                    soDT: data.phoneNumber || "",
                    gender: data.gender || "",
                    age: age,
                    dateOfBirth: formattedDob,
                    address: data.address || "",
                    cccd: data.cccd || "",
                    avatar: data.avatar || "/images/avatar.jpg"
                }));
                
                toast.success(t("profile_updated_success"));
                setIsSaved(true);
                setIsEditing(false);
            } else {
                throw new Error("Invalid response");
            }
        } catch (error: any) {
            console.error("Failed to update profile:", error);
            const errMsg = error?.response?.data?.message || t("failed_to_update_profile") || "Cập nhật thất bại";
            toast.error(errMsg);
        } finally {
            setIsSaving(false);
        }

        setTimeout(() => {
            setIsSaved(false);
        }, 3000);
    };

    const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

    return (
        <div className="animate__animated animate__fadeIn">
            {/* Custom select dropdown scrollbar styling */}
            <style>{`
                .custom-select-dropdown::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-select-dropdown::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-select-dropdown::-webkit-scrollbar-thumb {
                    background: #E9D5FF;
                    border-radius: 9999px;
                }
                .custom-select-dropdown::-webkit-scrollbar-thumb:hover {
                    background: #D8B4FE;
                }
            `}</style>

            {!isEditing ? (
                /* Static Read-only Mode */
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {/* Full Name */}
                            <div className="bg-white/95 px-5 py-4 rounded-2xl border border-violet-100 hover:border-violet-250 hover:shadow-md transition-all duration-300 flex flex-col gap-1.5 justify-center min-h-[88px]">
                                <span className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest">{t("full_name")}</span>
                                <span className={`text-base font-semibold select-all ${formData.name ? "text-gray-700" : "text-gray-400 font-normal italic"}`}>
                                    {formData.name || t("no_name_registered")}
                                </span>
                            </div>

                            {/* Email */}
                            <div className="bg-white/95 px-5 py-4 rounded-2xl border border-violet-100 hover:border-violet-250 hover:shadow-md transition-all duration-300 flex flex-col gap-1.5 justify-center min-h-[88px]">
                                <span className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest">{t("email_address")}</span>
                                <span className={`text-base font-semibold select-all truncate ${formData.email ? "text-gray-700" : "text-gray-400 font-normal italic"}`}>
                                    {formData.email || t("no_email_registered")}
                                </span>
                            </div>

                            {/* Phone Number */}
                            <div className="bg-white/95 px-5 py-4 rounded-2xl border border-violet-100 hover:border-violet-250 hover:shadow-md transition-all duration-300 flex flex-col gap-1.5 justify-center min-h-[88px]">
                                <span className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest">{t("phone_number")}</span>
                                <span className={`text-base font-semibold select-all ${formData.phone ? "text-gray-700" : "text-gray-400 font-normal italic"}`}>
                                    {formData.phone || t("no_phone_number_registered")}
                                </span>
                            </div>

                            {/* Gender */}
                            <div className="bg-white/95 px-5 py-4 rounded-2xl border border-violet-100 hover:border-violet-250 hover:shadow-md transition-all duration-300 flex flex-col gap-1.5 justify-center min-h-[88px]">
                                <span className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest">{t("gender")}</span>
                                <span className={`text-base font-semibold select-all ${formData.gender ? "text-gray-700" : "text-gray-400 font-normal italic"}`}>
                                    {formData.gender || t("gender_not_selected")}
                                </span>
                            </div>

                            {/* Age */}
                            <div className="bg-white/95 px-5 py-4 rounded-2xl border border-violet-100 hover:border-violet-250 hover:shadow-md transition-all duration-300 flex flex-col gap-1.5 justify-center min-h-[88px]">
                                <span className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest">{t("age")}</span>
                                <span className={`text-base font-semibold select-all ${formData.age ? "text-gray-700" : "text-gray-400 font-normal italic"}`}>
                                    {formData.age || t("age_not_provided")}
                                </span>
                            </div>

                            {/* Date of Birth */}
                            <div className="bg-white/95 px-5 py-4 rounded-2xl border border-violet-100 hover:border-violet-250 hover:shadow-md transition-all duration-300 flex flex-col gap-1.5 justify-center min-h-[88px]">
                                <span className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest">{t("date_of_birth")}</span>
                                <span className={`text-base font-semibold select-all ${formData.dateOfBirth ? "text-gray-700" : "text-gray-400 font-normal italic"}`}>
                                    {formData.dateOfBirth || t("dob_not_set")}
                                </span>
                            </div>

                            {/* Address */}
                            <div className="bg-white/95 px-5 py-4 rounded-2xl border border-violet-100 hover:border-violet-250 hover:shadow-md transition-all duration-300 flex flex-col gap-1.5 justify-center min-h-[88px]">
                                <span className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest">{t("address")}</span>
                                <span className={`text-base font-semibold select-all leading-relaxed truncate-2-lines ${formData.address ? "text-gray-700" : "text-gray-400 font-normal italic"}`}>
                                    {formData.address || t("address_not_set")}
                                </span>
                            </div>

                            {/* CCCD */}
                            <div className="bg-white/95 px-5 py-4 rounded-2xl border border-violet-100 hover:border-violet-250 hover:shadow-md transition-all duration-300 flex flex-col gap-1.5 justify-center min-h-[88px]">
                                <span className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest">{t("cccd")}</span>
                                <span className={`text-base font-semibold select-all ${formData.cccd ? "text-gray-700" : "text-gray-400 font-normal italic"}`}>
                                    {formData.cccd || t("cccd_not_linked")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* {t("edit_profile_btn")} Action Button */}
                    <div className="flex justify-end pt-4 border-t border-[#DCD7F5]/50">
                        <Button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            variant="primary"
                            size="md"
                            className="flex items-center gap-2"
                        >
                            <Edit2 className="h-4 w-4" />
                            {t("edit_profile_btn")}
                        </Button>
                    </div>
                </div>
            ) : (
                /* Editable Form Mode */
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {/* Full Name */}
                            <div className={`p-4 px-5 rounded-2xl border transition-all duration-300 flex flex-col gap-1.5 min-h-[88px] justify-center ${
                                errors.name 
                                    ? "border-red-300 bg-red-50/10 focus-within:border-red-500" 
                                    : "border-violet-100 bg-white/95 focus-within:border-violet-500 focus-within:shadow-md"
                            }`}>
                                <label className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest select-none">{t("full_name")}</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder={t("no_name_registered")}
                                    className="w-full bg-transparent py-1 text-base text-gray-700 outline-none"
                                />
                                {errors.name && <span className="text-xs font-bold text-red-500 mt-1">{errors.name}</span>}
                            </div>

                            {/* Email (Read-only on profile update) */}
                            <div className="p-4 px-5 rounded-2xl border border-gray-200 bg-gray-50 transition-all duration-300 flex flex-col gap-1.5 min-h-[88px] justify-center select-none opacity-60">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest select-none">{t("email_address")}</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    readOnly
                                    disabled
                                    placeholder={t("no_email_registered")}
                                    className="w-full bg-transparent py-1 text-base text-gray-500 outline-none cursor-not-allowed"
                                />
                            </div>

                            {/* Phone Number */}
                            <div className={`p-4 px-5 rounded-2xl border transition-all duration-300 flex flex-col gap-1.5 min-h-[88px] justify-center ${
                                errors.phone 
                                    ? "border-red-300 bg-red-50/10 focus-within:border-red-500" 
                                    : "border-violet-100 bg-white/95 focus-within:border-violet-500 focus-within:shadow-md"
                            }`}>
                                <label className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest select-none">{t("phone_number")}</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder={t("no_phone_number_registered")}
                                    className="w-full bg-transparent py-1 text-base text-gray-700 outline-none"
                                />
                                {errors.phone && <span className="text-xs font-bold text-red-500 mt-1">{errors.phone}</span>}
                            </div>

                            {/* Gender */}
                            <div className="p-4 px-5 rounded-2xl border border-violet-100 bg-white/95 focus-within:border-violet-500 focus-within:shadow-md transition-all duration-300 flex flex-col gap-1.5 min-h-[88px] justify-center">
                                <label className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest select-none">{t("gender")}</label>
                                <CustomSelect
                                    value={formData.gender}
                                    onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                                    options={[t("gender_male"), t("gender_female")]}
                                    placeholder={t("select_gender")}
                                />
                            </div>

                            {/* Age (Read-only, calculated from DOB) */}
                            <div className="p-4 px-5 rounded-2xl border border-violet-100 bg-violet-50/20 transition-all duration-300 flex flex-col gap-1.5 min-h-[88px] justify-center select-none opacity-70">
                                <label className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest select-none">{t("age_auto_calculated")}</label>
                                <input
                                    type="text"
                                    name="age"
                                    value={formData.age}
                                    readOnly
                                    placeholder={t("calculated_from_dob")}
                                    className="w-full bg-transparent py-1 text-base text-gray-500 outline-none cursor-not-allowed"
                                />
                            </div>

                            {/* Date of Birth (Day, Month, Year dropdowns) */}
                            <div className={`p-4 px-5 rounded-2xl border transition-all duration-300 flex flex-col gap-1.5 min-h-[88px] justify-center ${
                                errors.dateOfBirth 
                                    ? "border-red-300 bg-red-50/10 focus-within:border-red-500" 
                                    : "border-violet-100 bg-white/95 focus-within:border-violet-500 focus-within:shadow-md"
                            }`}>
                                <label className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest select-none">{t("date_of_birth")}</label>
                                <div className="flex items-center gap-2 py-1">
                                    <CustomSelect
                                        value={parseDob(formData.dateOfBirth).day}
                                        onChange={(val) => handleDobSelectChange("day", val)}
                                        options={days}
                                        placeholder={t("dob_day")}
                                    />
                                    <span className="text-gray-300 font-light select-none">/</span>
                                    
                                    <CustomSelect
                                        value={parseDob(formData.dateOfBirth).month}
                                        onChange={(val) => handleDobSelectChange("month", val)}
                                        options={months}
                                        placeholder={t("dob_month")}
                                    />
                                    <span className="text-gray-300 font-light select-none">/</span>
                                    
                                    <CustomSelect
                                        value={parseDob(formData.dateOfBirth).year}
                                        onChange={(val) => handleDobSelectChange("year", val)}
                                        options={years}
                                        placeholder={t("dob_year")}
                                    />
                                </div>
                                {errors.dateOfBirth && <span className="text-xs font-bold text-red-500 mt-1">{errors.dateOfBirth}</span>}
                            </div>

                            {/* Address */}
                            <div className="p-4 px-5 rounded-2xl border border-violet-100 bg-white/95 focus-within:border-violet-500 focus-within:shadow-md transition-all duration-300 flex flex-col gap-1.5 min-h-[88px] justify-center">
                                <label className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest select-none">{t("address")}</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows={1}
                                    placeholder={t("address_not_set")}
                                    className="w-full bg-transparent py-1 text-base text-gray-700 outline-none resize-none"
                                />
                            </div>

                            {/* CCCD */}
                            <div className={`p-4 px-5 rounded-2xl border transition-all duration-300 flex flex-col gap-1.5 min-h-[88px] justify-center ${
                                errors.cccd 
                                    ? "border-red-300 bg-red-50/10 focus-within:border-red-500" 
                                    : "border-violet-100 bg-white/95 focus-within:border-violet-500 focus-within:shadow-md"
                            }`}>
                                <label className="text-[11px] font-black text-violet-400 dark:text-[#a599ff] uppercase tracking-widest select-none">{t("cccd")}</label>
                                <input
                                    type="text"
                                    name="cccd"
                                    value={formData.cccd}
                                    onChange={handleInputChange}
                                    placeholder={t("cccd_not_linked")}
                                    className="w-full bg-transparent py-1 text-base text-gray-700 outline-none"
                                />
                                {errors.cccd && <span className="text-xs font-bold text-red-500 mt-1">{errors.cccd}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-[#DCD7F5]/50">
                        <Button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSaving}
                            variant="outline"
                            size="md"
                            className="flex items-center gap-1.5"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </Button>
                        
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
                                    {t("saving_btn")}
                                </>
                            ) : isSaved ? (
                                <>
                                    <Check className="h-4 w-4" />
                                    {t("saved_btn")}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {t("save_changes_btn")}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
