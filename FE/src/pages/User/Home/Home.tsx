import { useEffect } from "react";
import Hero from "./Hero/Hero.tsx";
import RecommendedMovies from "./RecommendedMovies/RecommendedMovies.tsx";
import HotMovies from "./HotMovies/HotMovies.tsx";
import Promotions from "./Promotions/Promotions.tsx";
import Cinemas from "./Cinemas/Cinemas.tsx";
import News from "./News/News.tsx";
import ScrollReveal from "../../../components/ScrollReveal/ScrollReveal.tsx";

export default function HomePage() {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" as any });
    }, []);

    return (
        <div className="w-full bg-[#EFEBF4] pb-16">
            <Hero />
            <RecommendedMovies />
            <ScrollReveal animationClass="animate__fadeInUp">
                <HotMovies />
            </ScrollReveal>
            <ScrollReveal animationClass="animate__fadeInUp">
                <Promotions />
            </ScrollReveal>
            <ScrollReveal animationClass="animate__fadeInRightBig">
                <Cinemas />
            </ScrollReveal>
            <ScrollReveal animationClass="animate__fadeInLeftBig">
                <News />
            </ScrollReveal>
        </div>
    );
}
