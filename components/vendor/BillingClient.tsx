"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api-fetch";


export type Subscription = {
  plan: "free" | "premium";
  activeItemLimit: number | null;
  checkoutEnabled: boolean;
  status: string;
  priceMinor: number;
  currency: string;
  interval: "month";
  paidUntil: string | null;
  cancelAtPeriodEnd: boolean;
  canManage: boolean;
};
export const button = "inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";
export const primary = `${button} border-red-700 bg-red-700 text-white hover:bg-red-800`;
export function Spinner() {
  return <span aria-hidden="true" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}
export function dateTime(value: string | null) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(value));
}
export async function billingRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(path, options);
  const result = await response.json().catch(() => null);

  if (!response.ok || result?.success !== true) {
    throw new Error(
      result?.message || "The request failed. Please try again."
    );
  }

  return result.data as T;
}
export function openStripe(url: string) {
  const target = new URL(url);
  if (target.protocol !== "https:" || !["checkout.stripe.com", "billing.stripe.com"].includes(target.hostname)) {
    throw new Error("The server returned an invalid payment URL.");
  }
  window.location.assign(target.href);
}
export function VendorGate({ children }: { children: ReactNode }) {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  if (isPending) return <p role="status" className="flex justify-center gap-2 p-12"><Spinner />Checking account...</p>;
  if (error) return <div className="p-12 text-center"><p role="alert">Could not check your account.</p><button className={button} onClick={() => void refetch()}>Try again</button></div>;
  const user = session?.user;
  if (!user) return <div className="p-12 text-center"><p>Please sign in.</p><Link className={primary} href="/sign-in">Sign in</Link></div>;
  if (user.role !== "vendor" || user.isBlocked || user.roleSelectionPending) return <p role="alert" className="p-12 text-center">An active vendor account with completed role selection is required.</p>;
  return <div key={user.id}>{children}</div>;
}
export function PremiumBadge({ premium }: { premium: boolean }) {
  return premium ? <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Premium vendor</span> : null;
}

// Mount this in the existing Add Menu Item/My Menu Items pages to replace
// the old hardcoded Free-plan text. It reads the server's verified entitlement.
export function VendorPlanNotice() {
  const [plan, setPlan] = useState<Subscription | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    let active = true;
    billingRequest<{ subscription: Subscription }>("/api/vendor/subscription", { signal: controller.signal })
      .then((data) => { if (active) setPlan(data.subscription); })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, []);
  return <p className="mt-5 rounded-xl bg-orange-50 p-4 text-sm text-orange-900">
    {failed ? "Could not load your plan. Check the Subscription page." : !plan ? "Loading plan..." :
      plan.plan === "premium" ? "Premium plan: unlimited active items. Admin approval is still required." :
      "Free plan: 3 active items. Available pending and approved items use a slot."}
    {" "}<Link href="/dashboard/vendor/subscription" className="font-semibold underline">View subscription</Link>
  </p>;
}
