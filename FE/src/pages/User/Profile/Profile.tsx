import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { LogIn } from "lucide-react";
import type { RootState } from "../../../store/index.tsx";
import { updateUser } from "../Login/slice.ts";
import { toast } from "../../../components/Toast/Toast.tsx";
import ProfileInfo from "./ProfileInfo/ProfileInfo.tsx";
import BookingHistory from "./BookingHistory/BookingHistory.tsx";
import ChangePassword from "./ChangePassword/ChangePassword.tsx";
import Button from "../../../components/Button/Button.tsx";
import { useLanguage } from "../../../contextAPI/LanguageContext.tsx";
import { updateProfileApi } from "../../../axios/profile";

const compressImageToBlob = (file: File, maxWidth = 200, maxHeight = 200): Promise<Blob> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                resolve(file);
                            }
                        },
                        "image/jpeg",
                        0.8
                    );
                } else {
                    resolve(file);
                }
            };
            img.onerror = () => {
                resolve(file);
            };
        };
        reader.onerror = () => {
            resolve(file);
        };
    });
};

export default function Profile() {
    const { t } = useLanguage();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.login);
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Get default tab from query parameter '?tab=...'
    const queryTab = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState<"info" | "tickets" | "password">(
        queryTab === "tickets" ? "tickets" : queryTab === "password" ? "password" : "info"
    );

    // Sync tab state with query parameter changes
    useEffect(() => {
        if (queryTab === "tickets") {
            setActiveTab("tickets");
        } else if (queryTab === "password") {
            setActiveTab("password");
        } else {
            setActiveTab("info");
        }
    }, [queryTab]);

    // Scroll to top when tab changes or page mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" as any });
    }, [activeTab]);

    const handleTabChange = (tab: "info" | "tickets" | "password") => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBlob = await compressImageToBlob(file, 200, 200);
                updateProfileApi({ avatar: compressedBlob })
                    .then((res) => {
                        if (res && res.data) {
                            dispatch(updateUser({
                                ...user,
                                avatar: res.data.avatar || URL.createObjectURL(compressedBlob)
                            }));
                            toast.success(t("avatar_updated_success"));
                        }
                    })
                    .catch((err) => {
                        console.error("Failed to update avatar:", err);
                        toast.error("Không thể cập nhật ảnh đại diện");
                    });
            } catch (err) {
                console.error("Failed to compress avatar image:", err);
                toast.error("Không thể xử lý ảnh đại diện");
            }
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-[#F6F3F9]/30 px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-md w-full text-center bg-white rounded-3xl border border-[#EAE6F0] p-8 shadow-lg flex flex-col items-center gap-6 animate__animated animate__fadeIn">
                    <div className="h-16 w-16 rounded-full bg-violet-50 text-violet-650 flex items-center justify-center">
                        <LogIn className="h-8 w-8" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-black text-gray-900">{t("access_denied")}</h2>
                        <p className="text-sm text-gray-550 font-medium leading-relaxed">
                            {t("profile_access_denied_desc")}
                        </p>
                    </div>
                    <Button 
                        variant="primary" 
                        href={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                        className="w-full py-3"
                    >
                        {t("login_now_btn")}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] bg-gradient-to-br from-[#FDFCFE] via-[#F8F7FA] to-[#F5F2F9] py-8 sm:py-12 animate__animated animate__fadeIn">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
                
                {/* Centered Avatar and User Info Header */}
                <div className="flex flex-col items-center text-center gap-4 py-2 mt-2">
                    <div className="relative">
                        <img
                            src={user?.avatar || "/images/avatar.jpg"}
                            alt={user?.name || "Profile avatar"}
                            className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md"
                        />
                        {/* Orange Star Badge - Clickable file upload trigger */}
                        <label className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-md cursor-pointer hover:bg-amber-600 transition-colors duration-200">
                            <span className="text-white text-base leading-none select-none">★</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                        <h2 className="text-2xl font-black text-gray-900">{user?.name || user?.hoTen || "User Name"}</h2>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t("click_star_avatar")}</p>
                    </div>
                </div>

                {/* Profile Container Card (Floating elements on backdrop) */}
                <div className="flex flex-col gap-6 w-full">
                    
                    {/* Horizontal Selection Tabs */}
                    <div className="border-b border-[#DCD7F5]/50 flex justify-start overflow-x-auto w-full">
                        <div className="flex gap-6 sm:gap-10 pb-px">
                            <button
                                onClick={() => handleTabChange("info")}
                                className={`px-1 py-3.5 text-sm sm:text-base font-bold border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                    activeTab === "info"
                                        ? "border-violet-500 dark:border-[#a599ff] text-violet-600 dark:text-[#a599ff] font-black"
                                        : "border-transparent text-gray-550 hover:text-violet-500 dark:text-gray-400 dark:hover:text-violet-300"
                                }`}
                            >
                                <span>{t("personal_info")}</span>
                            </button>
                            <button
                                onClick={() => handleTabChange("password")}
                                className={`px-1 py-3.5 text-sm sm:text-base font-bold border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                    activeTab === "password"
                                        ? "border-violet-500 dark:border-[#a599ff] text-violet-600 dark:text-[#a599ff] font-black"
                                        : "border-transparent text-gray-555 hover:text-violet-500 dark:text-gray-400 dark:hover:text-violet-300"
                                }`}
                            >
                                <span>{t("change_password_title")}</span>
                            </button>
                            <button
                                onClick={() => handleTabChange("tickets")}
                                className={`px-1 py-3.5 text-sm sm:text-base font-bold border-b-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
                                    activeTab === "tickets"
                                        ? "border-violet-500 dark:border-[#a599ff] text-violet-600 dark:text-[#a599ff] font-black"
                                        : "border-transparent text-gray-555 hover:text-violet-500 dark:text-gray-400 dark:hover:text-violet-300"
                                }`}
                            >
                                <span>{t("ticket_history_title")}</span>
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Tab Content Area */}
                    <div className="pt-2 animate__animated animate__fadeIn">
                        {activeTab === "info" ? (
                            <ProfileInfo user={user} />
                        ) : activeTab === "tickets" ? (
                            <BookingHistory />
                        ) : (
                            <ChangePassword />
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
