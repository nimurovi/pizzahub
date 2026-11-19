import Link from "next/link";

export default function VendorDashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <p className="font-semibold text-red-700">PizzaHub for restaurants</p>

      <h1 className="mt-3 text-3xl font-bold text-stone-900">
        Vendor Dashboard
      </h1>

      <p className="mt-4 text-stone-600">
        Your workspace for managing your restaurant menu and orders.
      </p>

      <Link
        href="/menu"
        className="mt-6 inline-flex rounded-xl bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-800"
      >
        Browse Menu
      </Link>
    </main>
  );
}