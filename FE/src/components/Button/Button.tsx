import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "link" | "danger" | "outline-purple";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    href?: string;
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;
    className?: string;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
};

export default function Button({
    children,
    variant = "primary",
    size = "md",
    href,
    onClick,
    className = "",
    type = "button",
    disabled = false,
    ...props
}: ButtonProps) {
    // Base styles with focus and transition effects
    const baseStyle = "inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none select-none cursor-pointer ease-out whitespace-nowrap";
    
    // Increased horizontal padding to make buttons longer/wider
    const sizeStyles = {
        sm: "px-6 py-2.5 text-sm rounded-full",
        md: "px-10 py-2.5 text-sm rounded-full",
        lg: "px-12 py-3.5 text-base rounded-full",
    };
    // Variant styles matching Mievoh design aesthetic with a rich radial gradient (circle at center) using user's custom purples
    const variantStyles = {
        primary: "bg-[radial-gradient(circle_at_center,_#9370DB_0%,_#7B68EE_100%)] text-white hover:bg-[radial-gradient(circle_at_center,_#7B68EE_0%,_#5B21B6_100%)] hover:shadow-[0_8px_20px_-6px_rgba(109,40,217,0.5)] hover:scale-[1.04] active:scale-[0.96] disabled:opacity-55 disabled:pointer-events-none",
        secondary: "bg-[#F3E8FF] text-[#6D28D9] hover:bg-[#E9D5FF] hover:text-[#5B21B6] hover:scale-[1.04] active:scale-[0.96] disabled:opacity-55",
        outline: "border border-gray-200 text-gray-700 hover:border-[#6D28D9] hover:text-[#6D28D9] hover:bg-[#F3E8FF]/20 hover:scale-[1.04] active:scale-[0.96] disabled:opacity-55 rounded-full",
        "outline-purple": "bg-transparent text-[#6D28D9] dark:text-violet-300 border border-transparent hover:bg-[radial-gradient(circle_at_center,_#9370DB_0%,_#7B68EE_100%)] hover:text-white dark:hover:text-white hover:shadow-[0_8px_20px_-6px_rgba(109,40,217,0.4)] hover:scale-[1.04] active:scale-[0.96] disabled:opacity-55 rounded-full",
        link: "text-[#6D28D9] hover:text-[#5B21B6] bg-transparent px-0 py-0 rounded-none border-none hover:scale-[1.06] active:scale-[0.96]",
        danger: "text-red-600 hover:text-red-800 bg-transparent px-0 py-0 rounded-none border-none hover:scale-[1.06] active:scale-[0.96]",
    };    // Override sizing if it's a link or danger text action
    const isTextAction = variant === "link" || variant === "danger";
    const sizeClass = isTextAction ? "" : sizeStyles[size];

    const appliedClasses = `${baseStyle} ${sizeClass} ${variantStyles[variant]} ${className}`;

    if (href) {
        return (
            <a href={href} onClick={onClick as any} className={appliedClasses} {...props}>
                {children}
            </a>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={appliedClasses}
            {...props}
        >
            {children}
        </button>
    );
}
