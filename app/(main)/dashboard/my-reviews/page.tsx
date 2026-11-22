import { Suspense } from "react";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequirAuth";
import { ReviewManager } from "@/components/reviews/Reviews";

export default function MyReviewsPage() {
  return <Suspense fallback={<p>Loading reviews…</p>}><RequireAuth><main className="mx-auto max-w-5xl px-4 py-10"><Link className="text-red-700 underline" href="/dashboard/my-orders">Back to My Orders</Link><ReviewManager /></main></RequireAuth></Suspense>;
}
