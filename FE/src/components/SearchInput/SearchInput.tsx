import React from "react";
import { Search } from "lucide-react";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    size?: "sm" | "md" | "lg";
    containerClassName?: string;
}

export default function SearchInput({
    size = "md",
    containerClassName = "",
    className = "",
    placeholder = "Search...",
    ...props
}: SearchInputProps) {
    const isMd = size === "md";
    const isLg = size === "lg";

    const containerBase = "relative flex items-center";
    const iconBase = "absolute text-violet-500 pointer-events-none";
    
    let iconSizeClasses = "left-3";
    if (isMd) {
        iconSizeClasses = "left-4";
    } else if (isLg) {
        iconSizeClasses = "left-3.5";
    }

    const hasCustomRounding = className.includes("rounded-");
    const inputBase = `${
        hasCustomRounding ? "" : "rounded-full"
    } border outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-violet-500 focus:bg-white dark:focus:bg-zinc-800`;
    
    let sizeClasses = "py-2 pl-9 pr-3 text-xs text-gray-700 dark:!text-white dark:placeholder:!text-zinc-400";
    if (isMd) {
        sizeClasses = "py-2.5 pl-11 pr-4 text-sm text-gray-700 dark:!text-white dark:placeholder:!text-zinc-400";
    } else if (isLg) {
        sizeClasses = "py-2.5 pl-12 pr-4 text-sm text-gray-755 dark:!text-white dark:placeholder:!text-zinc-400";
    }

    let iconClass = "h-3.5 w-3.5";
    if (isMd) {
        iconClass = "h-4 w-4";
    } else if (isLg) {
        iconClass = "h-6 w-6";
    }

    return (
        <div className={`${containerBase} ${containerClassName}`}>
            <span className={`${iconBase} ${iconSizeClasses}`}>
                <Search className={iconClass} />
            </span>
            <input
                type="text"
                placeholder={placeholder}
                className={`${inputBase} ${sizeClasses} ${className}`}
                {...props}
            />
        </div>
    );
}
