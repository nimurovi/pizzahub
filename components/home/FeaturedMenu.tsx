"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MenuCard from "../menu/MenuCard";
import { MenuItem } from "@/types";
import LoadingSpinner from "../shared/LoadingSpinner";
 

type MenuState =
  | { status: "loading" }
  | { status: "success"; items: MenuItem[] }
  | { status: "error"; message: string };

// Check API data before rendering it.
function isMenuItem(value: unknown): value is MenuItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item._id === "string" &&
    typeof item.itemName === "string" &&
    typeof item.category === "string" &&
    typeof item.description === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    typeof item.location === "string" &&
    typeof item.vendorId === "string" &&
    Array.isArray(item.images) &&
    item.images.every((image) => typeof image === "string") &&
    (item.vendorName === undefined ||
      typeof item.vendorName === "string")
  );
}

export default function FeaturedMenu() {
  const [state, setState] = useState<MenuState>({
    status: "loading",
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timedOut = false;

    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    async function loadFeaturedMenu() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error("API URL is not configured.");
        }

        const response = await fetch(
          `${apiUrl.replace(/\/+$/, "")}/api/menu/featured`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Menu request failed.");
        }

        const result: unknown = await response.json();

        if (typeof result !== "object" || result === null) {
          throw new Error("Invalid API response.");
        }

        const payload = result as Record<string, unknown>;

        if (
          payload.success !== true ||
          !Array.isArray(payload.data) ||
          !payload.data.every(isMenuItem)
        ) {
          throw new Error("Invalid menu data.");
        }

        if (active) {
          setState({
            status: "success",
            items: payload.data,
          });
        }
      } catch {
        if (!active) return;

        setState({
          status: "error",
          message: timedOut
            ? "The menu is taking too long to load. Please try again."
            : "We couldn’t load the menu. Please try again.",
        });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void loadFeaturedMenu();

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((previous) => previous + 1);
  }

  return (
    <section
      aria-labelledby="featured-heading"
      className="bg-[#fffaf3] py-16 text-stone-900 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Heading */}
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-red-700">
              Find your next favorite
            </p>

            <h2
              id="featured-heading"
              className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              Featured menu items
            </h2>

            <p className="mt-4 text-base leading-7 text-stone-600">
              Explore pizzas, tasty sides, and sweet treats for your
              next meal.
            </p>
          </div>

          <Link
            href="/menu"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-700 hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-4"
          >
            View full menu
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Loading */}
        {/* Loading */}
{state.status === "loading" && (
  <LoadingSpinner message="Loading featured menu..." />
)}

        {/* Error */}
        {state.status === "error" && (
          <div className="rounded-2xl border border-red-100 bg-white px-6 py-12 text-center">
            <p role="alert" className="text-stone-600">
              {state.message}
            </p>

            <button
              type="button"
              onClick={retry}
              className="mt-5 rounded-xl bg-red-700 px-6 py-3 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty result */}
        {state.status === "success" && state.items.length === 0 && (
          <div className="rounded-2xl border border-orange-100 bg-white px-6 py-12 text-center">
            <p className="text-lg font-semibold">
              Fresh choices are on the way
            </p>
            <p className="mt-2 text-sm text-stone-500">
              No menu items are available right now. Check back soon.
            </p>
          </div>
        )}

        {/* Menu cards */}
        {state.status === "success" && state.items.length > 0 && (
          <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {state.items.map((item) => (
              <MenuCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}