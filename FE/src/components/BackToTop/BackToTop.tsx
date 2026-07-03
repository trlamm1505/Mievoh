import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,_#9370DB_0%,_#7B68EE_100%)] text-white shadow-2xl border border-purple-400/20 ${
        showButton ? "block" : "hidden"
      }`}
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5 stroke-[2.5]" />
    </button>
  );
}
