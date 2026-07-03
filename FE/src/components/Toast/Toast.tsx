import React from 'react';
import { toast as hotToast, Toaster, ToastIcon } from 'react-hot-toast';

// Re-export the main toast trigger function for convenience
export const toast = hotToast;

// Export a custom-styled ToastContainer wrapping the library's Toaster
export const ToastContainer: React.FC = () => {
    return (
        <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
                success: {
                    iconTheme: {
                        primary: '#ffffff', // White icon background
                        secondary: '#8E7EFE', // Purple icon foreground
                    }
                },
                error: {
                    iconTheme: {
                        primary: '#ffffff', // White icon background
                        secondary: '#E13D53', // Red icon foreground
                    }
                }
            }}
        >
            {(t) => (
                <div
                    className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 w-full max-w-sm pointer-events-auto ${
                        t.visible ? 'toast-enter' : 'toast-exit'
                    } ${
                        t.type === 'success'
                            ? 'bg-[#8E7EFE] border-[#8E7EFE]/30 !text-white shadow-lg shadow-[#8E7EFE]/20'
                            : t.type === 'error'
                            ? 'bg-[#E13D53] border-[#E13D53]/30 !text-white shadow-lg shadow-[#E13D53]/20'
                            : 'bg-violet-50/98 dark:bg-zinc-900/98 border-violet-300/50 dark:border-zinc-800/80 text-violet-950 dark:!text-zinc-100 shadow-violet-500/10'
                    }`}
                >
                    <span className="flex-shrink-0 flex items-center justify-center">
                        <ToastIcon toast={t} />
                    </span>
                    
                    <p className="text-base font-semibold flex-1 leading-snug">
                        {typeof t.message === 'function' ? t.message(t) : t.message}
                    </p>
                    
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className={`transition-colors ml-1 p-0.5 rounded-lg ${
                            t.type === 'success' || t.type === 'error'
                                ? '!text-white/70 hover:!text-white hover:bg-white/10'
                                : 'text-violet-950/40 dark:text-zinc-400 hover:text-violet-950 dark:hover:text-white hover:bg-violet-500/10 dark:hover:bg-zinc-800'
                        }`}
                    >
                        ✕
                    </button>
                </div>
            )}
        </Toaster>
    );
};
