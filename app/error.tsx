
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PizzaHub application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[75vh] flex-col items-center justify-center bg-white px-6 py-16 text-center dark:bg-gray-950">
      <div className="max-w-lg">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl dark:bg-red-950">
          ⚠️
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Something Went Wrong!
        </h1>

        <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">
          We are having trouble loading this page.
          Please try again. If the problem continues,
          return to the homepage.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-red-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-800"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="rounded-xl border border-orange-300 px-6 py-3 font-semibold text-red-700 transition-colors hover:bg-orange-50 dark:border-gray-600 dark:text-orange-300 dark:hover:bg-gray-800"
          >
            Go Home
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-gray-500 dark:text-gray-400">
            Error reference: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
