import React, { useEffect, useRef, useState } from "react";

type ScrollRevealProps = {
    children: React.ReactNode;
    animationClass: string; // e.g. "animate__fadeInUp", "animate__fadeInRight"
    duration?: string;      // e.g. "animate__fast", "animate__slow"
    delay?: string;         // e.g. "animate__delay-1s"
    className?: string;     // custom container classes
    threshold?: number;     // visibility trigger threshold
};

export default function ScrollReveal({
    children,
    animationClass,
    duration = "",
    delay = "",
    className = "",
    threshold = 0.1,
}: ScrollRevealProps) {
    const [hasIntersected, setHasIntersected] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasIntersected(true);
                    if (ref.current) {
                        observer.unobserve(ref.current);
                    }
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.disconnect();
            }
        };
    }, [threshold, isMobile]);

    if (isMobile) {
        return (
            <div className={className}>
                {children}
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className={`${className} ${
                hasIntersected
                    ? `animate__animated ${animationClass} ${duration} ${delay}`
                    : "opacity-0"
            }`}
        >
            {children}
        </div>
    );
}
