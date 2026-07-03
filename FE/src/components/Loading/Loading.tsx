

interface LoadingProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export default function Loading({ className = "", size = "md" }: LoadingProps) {
    const sizeClasses = {
        sm: "w-6 h-6 border-2",
        md: "w-10 h-10 border-4",
        lg: "w-14 h-14 border-4"
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            {/* Custom high-performance spinning circle loader in brand purple */}
            <div className={`mievoh-spinner ${sizeClasses[size]}`} />
        </div>
    );
}
