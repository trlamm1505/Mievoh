import { useEffect } from "react";

interface TrailerModalProps {
    isOpen: boolean;
    isClosing: boolean;
    onClose: () => void;
    trailerUrl: string;
    movieTitle: string;
}

export default function TrailerModal({ 
    isOpen, 
    isClosing, 
    onClose, 
    trailerUrl, 
    movieTitle 
}: TrailerModalProps) {
    
    // Parse any YouTube URL format to get the correct embed URL
    const getEmbedUrl = (url: string | null) => {
        if (!url) return "";
        let videoId = "";
        if (url.includes("youtube.com/watch")) {
            try {
                const urlParams = new URLSearchParams(new URL(url).search);
                videoId = urlParams.get("v") || "";
            } catch (e) {
                const match = url.match(/[?&]v=([^&#]*)/);
                videoId = match ? match[1] : "";
            }
        } else if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
        } else if (url.includes("youtube.com/embed/")) {
            const urlWithoutParams = url.split("?")[0];
            return urlWithoutParams.replace("youtube.com/embed/", "youtube-nocookie.com/embed/");
        }
        
        if (videoId) {
            return `https://www.youtube-nocookie.com/embed/${videoId}`;
        }
        return url;
    };

    const finalTrailerUrl = getEmbedUrl(trailerUrl);

    // Prevent background scrolling and handle ESC key
    useEffect(() => {
        if (!isOpen) return;

        document.body.style.overflow = "hidden";

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className={`fixed inset-0 bg-black/55 z-[9999] flex items-start justify-center pt-4 md:pt-8 p-4 animate__animated animate__faster ${
                isClosing ? "animate__fadeOut" : "animate__fadeIn"
            }`}
            onClick={onClose}
        >
            <div 
                className={`relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate__animated animate__faster ${
                    isClosing ? "animate__slideOutUp" : "animate__slideInDown"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Video iframe */}
                <iframe
                    src={`${finalTrailerUrl}?autoplay=1&rel=0`}
                    title={`${movieTitle} - Official Trailer`}
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
}
