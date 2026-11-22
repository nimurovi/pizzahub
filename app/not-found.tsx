
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[75vh] flex-col items-center justify-center bg-white px-6 py-16 text-center dark:bg-gray-950">
      <div className="max-w-lg">
        <p className="text-8xl font-extrabold text-red-700 sm:text-9xl">
          404
        </p>

        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Oops! Page Not Found
        </h1>

        <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">
          Looks like this page is missing from our menu.
          The link might be broken, or the page may have been moved.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-xl bg-red-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-800"
          >
            Back to Home
          </Link>

          <Link
            href="/menu"
            className="rounded-xl border border-orange-300 px-6 py-3 font-semibold text-red-700 transition-colors hover:bg-orange-50 dark:border-gray-600 dark:text-orange-300 dark:hover:bg-gray-800"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    </main>
  );
}
