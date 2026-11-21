"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "../../constants/categories";

import MenuCard from "./MenuCard";
import LoadingSpinner from "../shared/LoadingSpinner";
import { MenuItem } from "@/types";
import { apiFetch } from "@/lib/api-fetch";

type MenuResponse = {
    success: boolean;
    data: MenuItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

const inputStyles =
    "mt-2 w-full rounded-xl border border-stone-300 bg-white " +
    "px-4 py-3 text-sm text-stone-900 outline-none " +
    "focus:border-red-700 focus:ring-2 focus:ring-red-100";

const buttonStyles =
    "rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold " +
    "text-white hover:bg-red-800 focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-red-700 " +
    "focus-visible:ring-offset-4";

export default function BrowseMenu() {
    const searchParams = useSearchParams();
    const query = searchParams.toString();

    // Changing the query resets loading state and form defaults.
    return <MenuContent key={query} query={query} />;
}

function MenuContent({ query }: { query: string }) {
    const router = useRouter();
    const params = new URLSearchParams(query);

    const [result, setResult] = useState<MenuResponse | null>(null);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        const timeout = window.setTimeout(() => {
            controller.abort();
        }, 15000);

        async function loadMenu() {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;

                if (!apiUrl) {
                    throw new Error("Menu service is not configured.");
                }

                const response = await apiFetch(
                    `${apiUrl.replace(/\/+$/, "")}/api/menu?${query}`,
                    {
                        signal: controller.signal,
                        cache: "no-store",
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        response.status === 400
                            ? "These filters are invalid. Clear the filters and try again."
                            : "Could not load the menu. Please try again."
                    );
                }

                const data: MenuResponse = await response.json();

                if (
                    data.success !== true ||
                    !Array.isArray(data.data) ||
                    !data.pagination ||
                    typeof data.pagination.total !== "number"
                ) {
                    throw new Error("The menu response could not be read.");
                }

                if (active) setResult(data);
            } catch (error) {
                if (!active) return;

                setError(
                    controller.signal.aborted
                        ? "The request timed out. Please try again."
                        : error instanceof Error
                            ? error.message
                            : "Could not load the menu."
                );
            } finally {
                window.clearTimeout(timeout);
            }
        }

        void loadMenu();

        return () => {
            active = false;
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [query, attempt]);

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);
        const next = new URLSearchParams();

        for (const field of ["search", "category", "location", "sort"]) {
            const value = String(form.get(field) || "").trim();
            if (value) next.set(field, value);
        }

        // New filters always start on page one.
        router.push(`/menu?${next.toString()}`, { scroll: false });
    }

    function pageHref(page: number) {
        const next = new URLSearchParams(query);
        next.set("page", String(page));
        return `/menu?${next.toString()}`;
    }

    return (
        <>
            <form
                onSubmit={applyFilters}
                className="mb-10 rounded-2xl border border-orange-100 bg-white p-5 sm:p-6"
            >
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-sm font-semibold">
                        Search menu
                        <input
                            type="search"
                            name="search"
                            maxLength={100}
                            defaultValue={params.get("search") || ""}
                            placeholder="Try Margherita..."
                            className={inputStyles}
                        />
                    </label>

                    <label className="text-sm font-semibold">
                        Category
                        <select
                            name="category"
                            defaultValue={params.get("category") || ""}
                            className={inputStyles}
                        >
                            <option value="">All categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-sm font-semibold">
                        Location
                        <input
                            type="text"
                            name="location"
                            maxLength={100}
                            defaultValue={params.get("location") || ""}
                            placeholder="Area or city"
                            className={inputStyles}
                        />
                    </label>

                    <label className="text-sm font-semibold">
                        Sort by
                        <select
                            name="sort"
                            defaultValue={params.get("sort") || "newest"}
                            className={inputStyles}
                        >
                            <option value="newest">Newest first</option>
                            <option value="price-asc">Price: low to high</option>
                            <option value="price-desc">Price: high to low</option>
                        </select>
                    </label>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                    <button type="submit" className={buttonStyles}>
                        Apply filters
                    </button>

                    <Link
                        href="/menu"
                        className="rounded-lg px-3 py-3 text-sm font-semibold text-stone-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                    >
                        Clear filters
                    </Link>
                </div>
            </form>

            {error ? (
                <div className="rounded-2xl border border-red-100 bg-white p-10 text-center">
                    <p role="alert" className="text-stone-600">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setResult(null);
                            setAttempt((previous) => previous + 1);
                        }}
                        className={`mt-5 ${buttonStyles}`}
                    >
                        Try again
                    </button>
                </div>
            ) : !result ? (
                <LoadingSpinner message="Loading delicious menu items..." />
            ) : (
                <>
                    <p role="status" className="mb-5 text-sm text-stone-600">
                        {result.pagination.total} menu item
                        {result.pagination.total === 1 ? "" : "s"} found
                    </p>

                    {result.data.length === 0 ? (
                        <div className="rounded-2xl border border-orange-100 bg-white p-12 text-center">
                            <h2 className="text-xl font-bold">No items to show</h2>
                            <p className="mt-3 text-sm text-stone-600">
                                Try another search, clear your filters, or return to
                                the first page.
                            </p>
                            <Link
                                href="/menu"
                                className="mt-5 inline-block font-semibold text-red-700 underline"
                            >
                                Browse all items
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {result.data.map((item) => (
                                <MenuCard key={item._id} item={item} />
                            ))}
                        </div>
                    )}

                    {result.pagination.totalPages > 1 &&
                        result.pagination.page <= result.pagination.totalPages && (
                            <nav
                                aria-label="Menu pagination"
                                className="mt-10 flex flex-wrap items-center justify-center gap-5"
                            >
                                {result.pagination.page > 1 && (
                                    <Link
                                        href={pageHref(result.pagination.page - 1)}
                                        className={buttonStyles}
                                    >
                                        Previous
                                    </Link>
                                )}

                                <span className="text-sm text-stone-600">
                                    Page {result.pagination.page} of{" "}
                                    {result.pagination.totalPages}
                                </span>

                                {result.pagination.page <
                                    result.pagination.totalPages && (
                                        <Link
                                            href={pageHref(result.pagination.page + 1)}
                                            className={buttonStyles}
                                        >
                                            Next
                                        </Link>
                                    )}
                            </nav>
                        )}
                </>
            )}
        </>
    );
}