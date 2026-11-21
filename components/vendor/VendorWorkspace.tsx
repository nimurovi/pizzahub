"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { billingRequest, button, primary, dateTime, openStripe, PremiumBadge, Spinner, VendorGate, type Subscription } from "./BillingClient";

type View = "overview" | "subscription";
type Overview = { totalMenuItems: number; activeMenuItems: number; pendingCustomerOrders: number; acceptedOrders: number };
type Payment = { _id: string; amountMinor: number; currency: string; paidAt: string; periodEnd: string; status: string };
type Data = { overview: Overview; subscription: Subscription; transactions: Payment[] };
type State = { status: "loading" } | { status: "error"; message: string } | { status: "success"; data: Data };
const nav = [
  ["Overview", "/dashboard/vendor"], ["Add Menu Item", "/dashboard/vendor/menu/new"],
  ["My Menu Items", "/dashboard/vendor/menu"], ["Customer Orders", "/dashboard/vendor/orders"],
  ["Subscription", "/dashboard/vendor/subscription"],
];

function Workspace({ view }: { view: View }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const lock = useRef(false);
  function refresh() { setState({ status: "loading" }); setAttempt((value) => value + 1); }
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 20000);
    async function load() {
      try {
        const [overview, billing] = await Promise.all([
          billingRequest<{ overview: Overview }>("/api/vendor/overview", { signal: controller.signal }),
          billingRequest<{ subscription: Subscription; transactions: Payment[] }>("/api/vendor/subscription", { signal: controller.signal }),
        ]);
        if (!["free", "premium"].includes(billing.subscription?.plan) || !Array.isArray(billing.transactions) ||
          !overview.overview || !Object.values(overview.overview).every((value) => Number.isInteger(value) && value >= 0)) throw new Error("Invalid dashboard response.");
        if (active) setState({ status: "success", data: { ...billing, overview: overview.overview } });
      } catch (error) {
        if (active) setState({ status: "error", message: controller.signal.aborted ? "Loading timed out. Try again." : error instanceof Error ? error.message : "Could not load dashboard." });
      } finally { clearTimeout(timer); }
    }
    void load();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [attempt]);

  async function act(action: "checkout" | "portal" | "cancel") {
    if (lock.current) return;
    if (action === "cancel" && !window.confirm("Cancel renewal? Premium access will remain until the end of your paid period.")) return;
    lock.current = true; setBusy(action); setActionError("");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const result = await billingRequest<{ url: string } | undefined>(`/api/vendor/subscription/${action}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal: controller.signal,
      });
      if (action === "cancel") {
        toast.success("Cancellation requested. Refresh shortly to see confirmation."); refresh();
      } else {
        if (!result?.url) throw new Error("No payment URL was returned.");
        openStripe(result.url);
      }
    } catch (error) {
      const message = controller.signal.aborted ? "The request timed out. Refresh your plan before trying again." : error instanceof Error ? error.message : "Could not update billing.";
      setActionError(message); toast.error(message);
    } finally { clearTimeout(timer); lock.current = false; setBusy(null); }
  }

  return <main className="mx-auto max-w-6xl px-4 py-12">
    <p className="font-semibold text-red-700">PizzaHub for restaurants</p>
    <h1 className="mt-3 text-3xl font-bold text-stone-900">{view === "overview" ? "Vendor Dashboard" : "Subscription"}</h1>
    <nav aria-label="Vendor dashboard" className="mt-6 flex flex-wrap gap-3">
      {nav.map(([label, href]) => <Link key={href} href={href} className={button}>{label}</Link>)}
    </nav>
    <button className={`${button} mt-5`} disabled={busy !== null || state.status === "loading"} onClick={refresh}>Refresh dashboard</button>
    {actionError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{actionError}</p>}
    {state.status === "loading" && <p role="status" className="mt-8 flex items-center gap-2"><Spinner />Loading dashboard...</p>}
    {state.status === "error" && <div className="mt-8"><p role="alert" className="text-red-700">{state.message}</p><button onClick={refresh} className={`${button} mt-4`}>Try again</button></div>}
    {state.status === "success" && <>
      {view === "overview" && <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total menu items", state.data.overview.totalMenuItems], ["Active menu items", state.data.overview.activeMenuItems],
          ["Pending customer orders", state.data.overview.pendingCustomerOrders], ["Accepted orders", state.data.overview.acceptedOrders],
        ].map(([label, count]) => <div key={label} className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"><p className="text-sm text-stone-600">{label}</p><p className="mt-2 text-3xl font-bold">{count}</p></div>)}
      </div>}
      <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold capitalize">Current plan: {state.data.subscription.plan}</h2><PremiumBadge premium={state.data.subscription.plan === "premium"} /></div>
        <p className="mt-3 text-stone-600">{state.data.subscription.activeItemLimit === null ? "Unlimited active menu items." : "Up to 3 active menu items. Available pending and approved items use a slot."}</p>
        {state.data.subscription.plan === "premium" && <p className="mt-3">{state.data.subscription.cancelAtPeriodEnd ? "Renewal cancelled. Paid access ends: " : "Paid access through: "}{dateTime(state.data.subscription.paidUntil)} (Bangladesh time)</p>}
        {state.data.subscription.status === "past_due" && <p role="alert" className="mt-3 text-red-700">Your renewal payment failed. Update your payment method in Manage billing. Premium requires a paid, unexpired billing period.</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          {view === "overview" ? <Link href="/dashboard/vendor/subscription" className={primary}>{state.data.subscription.plan === "premium" ? "Manage subscription" : "Upgrade to Premium"}</Link> : <>
            {!state.data.subscription.canManage && state.data.subscription.plan === "free" && <button disabled={busy !== null || !state.data.subscription.checkoutEnabled} onClick={() => void act("checkout")} className={primary}>{busy === "checkout" && <Spinner />}Upgrade to Premium — $10/month</button>}
            {state.data.subscription.canManage && <button disabled={busy !== null} className={primary} onClick={() => void act("portal")}>{busy === "portal" && <Spinner />}Manage billing</button>}
            {state.data.subscription.canManage && !state.data.subscription.cancelAtPeriodEnd && <button disabled={busy !== null} className={button} onClick={() => void act("cancel")}>{busy === "cancel" && <Spinner />}Cancel renewal</button>}
          </>}
        </div>
        {!state.data.subscription.checkoutEnabled && <p className="mt-4 text-sm text-stone-500">Checkout is not available yet.</p>}
      </section>
      {view === "subscription" && <>
        <section className="mt-8 overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-left text-sm"><caption className="p-5 text-left text-lg font-bold">Choose your plan</caption>
            <thead className="bg-orange-50"><tr><th className="p-4">Feature</th><th className="p-4">Free</th><th className="p-4">Premium</th></tr></thead>
            <tbody>{[["Price", "$0", "$10 USD per month"], ["Active menu items", "3", "Unlimited"], ["Vendor dashboard", "Included", "Included"], ["Order management", "Included", "Included"], ["Premium vendor badge", "No", "Yes"], ["Featured menu placement", "Standard", "Priority"]].map(([feature, free, premium]) => <tr key={feature} className="border-t"><th className="p-4 font-medium">{feature}</th><td className="p-4">{free}</td><td className="p-4">{premium}</td></tr>)}</tbody>
          </table>
        </section>
        <p className="mt-4 text-sm leading-6 text-stone-600">Premium renews automatically at $10 USD each month until cancelled. Only approved, available items qualify for customer visibility and featured placement. When paid access ends, the oldest three available pending/approved items retain their slots; additional items become unavailable. Your menu records and existing orders are preserved.</p>
        <section className="mt-8"><h2 className="text-xl font-bold">Recent payments</h2>
          {state.data.transactions.length === 0 ? <p className="mt-3 text-stone-600">No verified payments yet.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Date</th><th className="p-3">Amount</th><th className="p-3">Paid through</th><th className="p-3">Status</th></tr></thead><tbody>{state.data.transactions.map((payment) => <tr key={payment._id} className="border-t"><td className="p-3">{dateTime(payment.paidAt)}</td><td className="p-3">${(payment.amountMinor / 100).toFixed(2)} USD</td><td className="p-3">{dateTime(payment.periodEnd)}</td><td className="p-3 capitalize">{payment.status}</td></tr>)}</tbody></table></div>}
          <p className="mt-3 text-xs text-stone-500">Showing the latest 20 verified payments. Times are shown in Bangladesh time.</p>
        </section>
      </>}
    </>}
  </main>;
}
export default function VendorWorkspace({ view }: { view: View }) {
  return <VendorGate><Workspace key={view} view={view} /></VendorGate>;
}
