import Link from "next/link";
export default function PaymentCancelPage() {
  return <main className="mx-auto max-w-2xl px-4 py-16">
    <h1 className="text-3xl font-bold text-stone-900">Checkout cancelled</h1>
    <p className="mt-5 text-stone-600">You returned without completing this checkout. This page does not change your subscription.</p>
    <p className="mt-3 text-stone-600">If you completed payment in another tab, check your subscription status before paying again.</p>
    <Link href="/dashboard/vendor/subscription" className="mt-6 inline-flex rounded-xl bg-red-700 px-5 py-3 font-semibold text-white">Return to subscription</Link>
  </main>;
}
