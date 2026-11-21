"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { billingRequest, button, primary, Spinner, VendorGate, type Subscription } from "@/components/vendor/BillingClient";
type State = { status: "waiting" } | { status: "error"; message: string } | { status: "confirmed"; premium: boolean } | { status: "delayed" };
function Confirmation({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<State>({ status: "waiting" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let count = 0;
    let timer: ReturnType<typeof setTimeout>;
    const deadline = setTimeout(() => controller.abort(), 90000);
    async function check() {
      try {
        const data = await billingRequest<{ paymentConfirmed: boolean; subscription: Subscription }>(
          `/api/vendor/subscription/checkout-status?session_id=${encodeURIComponent(sessionId)}`,
          { signal: controller.signal }
        );
        if (!active) return;
        if (data.paymentConfirmed) { setState({ status: "confirmed", premium: data.subscription.plan === "premium" }); clearTimeout(deadline); return; }
        count++;
        if (count >= 20) { setState({ status: "delayed" }); clearTimeout(deadline); return; }
        timer = setTimeout(() => void check(), 3000);
      } catch (error) {
        clearTimeout(deadline);
        if (active) setState({ status: "error", message: controller.signal.aborted ? "Confirmation took too long. Check again shortly." : error instanceof Error ? error.message : "Could not confirm payment." });
      }
    }
    void check();
    return () => { active = false; clearTimeout(timer); clearTimeout(deadline); controller.abort(); };
  }, [sessionId, retry]);
  return <main className="mx-auto max-w-2xl px-4 py-16">
    <h1 className="text-3xl font-bold">{state.status === "confirmed" ? "Payment confirmed" : "Payment confirmation"}</h1>
    {state.status === "waiting" && <p role="status" className="mt-5 flex items-center gap-2"><Spinner />Waiting for verified payment confirmation...</p>}
    {state.status === "confirmed" && <p role="status" className="mt-5 text-green-800">{state.premium ? "Your payment was verified. Premium is active." : "This payment was verified. Check your subscription page for your current access status."}</p>}
    {state.status === "delayed" && <p role="status" className="mt-5">Confirmation is still processing. You do not need to pay again. Check again shortly.</p>}
    {state.status === "error" && <p role="alert" className="mt-5 text-red-700">{state.message}</p>}
    <div className="mt-6 flex flex-wrap gap-3"><Link href="/dashboard/vendor/subscription" className={primary}>View subscription</Link>
      {(state.status === "error" || state.status === "delayed") && <button className={button} onClick={() => { setState({ status: "waiting" }); setRetry((value) => value + 1); }}>Check again</button>}
    </div>
  </main>;
}
function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") ?? "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId) || sessionId.length > 255) return <main className="p-12 text-center"><p role="alert">No valid checkout session was provided.</p><Link className={button} href="/dashboard/vendor/subscription">View subscription</Link></main>;
  return <VendorGate><Confirmation key={sessionId} sessionId={sessionId} /></VendorGate>;
}
export default function PaymentSuccessPage() {
  return <Suspense fallback={<p className="p-12" role="status">Loading payment confirmation...</p>}><SuccessContent /></Suspense>;
}
