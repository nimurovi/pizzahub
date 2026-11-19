import { Suspense } from "react";
import BrowseMenu from "../../../components/menu/BrowseMenu";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
 
export default function MenuPage() {
    return (
        <main className="min-h-screen bg-[#fffaf3] py-12 text-stone-900 sm:py-16">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
                <div className="mb-10 max-w-2xl">
                    <p className="text-xs font-bold uppercase tracking-widest text-red-700">
                        Something for every craving
                    </p>

                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
                        Explore the menu
                    </h1>

                    <p className="mt-5 text-base leading-7 text-stone-600">
                        Discover pizza, sides, and sweet treats. Find your
                        favorites by category, location, or price.
                    </p>
                </div>

                <Suspense fallback={<LoadingSpinner message="Loading menu..." />}>
                    <BrowseMenu />
                </Suspense>
                 

            </div>
        </main >
    );
}