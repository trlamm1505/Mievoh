import MovieCard from "../../../../components/MovieCard/MovieCard.tsx";
import type { Movie } from "../../../../components/MovieCard/MovieCard.tsx";
import { Film } from "lucide-react";

interface MovieGridProps {
    movies: Movie[];
}

export default function MovieGrid({ movies }: MovieGridProps) {
    if (movies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-[#EAE6F0] shadow-sm animate__animated animate__fadeIn">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F3E8FF] text-[#6D28D9] mb-4">
                    <Film className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                    No movies found
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                    Sorry, we couldn't find any movies matching your search criteria. Please try changing your filters.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate__animated animate__fadeIn">
            {movies.map((movie) => (
                <div key={movie.id} className="h-full">
                    <MovieCard movie={movie} useCountUp={true} />
                </div>
            ))}
        </div>
    );
}
