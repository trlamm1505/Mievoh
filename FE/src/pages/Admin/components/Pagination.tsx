import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    // Build a compact page list: 1 ... (p-1) p (p+1) ... last
    const pages: (number | "...")[] = [];
    const push = (v: number | "...") => pages.push(v);

    const window = 1;
    const start = Math.max(2, page - window);
    const end = Math.min(totalPages - 1, page + window);

    push(1);
    if (start > 2) push("...");
    for (let i = start; i <= end; i++) push(i);
    if (end < totalPages - 1) push("...");
    if (totalPages > 1) push(totalPages);

    return (
        <div className="flex items-center justify-center gap-1.5 py-4">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {pages.map((p, idx) =>
                p === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-gray-400">
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${p === page
                                ? "border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-300"
                                : "border-gray-200 text-gray-600 hover:bg-violet-50 hover:text-violet-600"
                            }`}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}
