import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CinemaBranch } from "../../../../axios/cinemas.tsx";
import { useLanguage } from "../../../../contextAPI/LanguageContext.tsx";
import CinemaCard from "../../../../components/CinemaCard/CinemaCard.tsx";

export interface DisplayBranch extends CinemaBranch {
    chainName: string;
    chainLogo: string;
}

interface CinemaBranchesProps {
    branches: DisplayBranch[];
    onResetFilters: () => void;
}

export default function CinemaBranches({ branches, onResetFilters }: CinemaBranchesProps) {
    const navigate = useNavigate();
    const { t } = useLanguage();

    if (branches.length === 0) {
        return (
            <div className="bg-white border border-gray-100 p-12 rounded-3xl text-center shadow-sm animate__animated animate__fadeIn">
                <div className="h-16 w-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4 text-violet-500">
                    <Search className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t("no_cinemas_found")}</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                    {t("no_cinemas_found_desc")}
                </p>
                <button
                    onClick={onResetFilters}
                    className="mt-5 text-sm font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-5 py-2.5 rounded-2xl transition-all duration-200 cursor-pointer"
                >
                    {t("clear_filters")}
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate__animated animate__fadeIn">
            {branches.map(branch => (
                <div key={branch.id} className="h-full">
                    <CinemaCard
                        cinema={branch}
                        layout="branch"
                        onClick={() => navigate(`/cinemas/${branch.id}`)}
                    />
                </div>
            ))}
        </div>
    );
}
