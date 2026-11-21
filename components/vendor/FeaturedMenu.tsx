"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { billingRequest, button, PremiumBadge, Spinner } from "./BillingClient";
type Item = { _id: string; itemName: string; images: string[]; price: number; vendorName: string; vendorIsPremium: boolean };
function Photo({ item }: { item: Item }) {
  const [failed, setFailed] = useState(false);
  return <div className="relative aspect-video bg-orange-100">{item.images[0] && !failed ? <Image src={item.images[0]} alt={item.itemName} fill unoptimized sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" onError={() => setFailed(true)} /> : <div className="flex h-full items-center justify-center">No image available</div>}</div>;
}
export default function FeaturedMenu() {
  const [state, setState] = useState<{ items?: Item[]; error?: string }>({});
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    const timer = setTimeout(() => controller.abort(), 20000);
    billingRequest<Item[]>("/api/menu/featured", { signal: controller.signal }).then((items) => {
      if (!Array.isArray(items)) throw new Error("Invalid menu response.");
      if (active) setState({ items });
    }).catch(() => { if (active) setState({ error: "Could not load featured menu items." }); }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [retry]);
  return <section className="mx-auto max-w-6xl px-4 py-12"><h2 className="text-3xl font-bold">Featured menu</h2>
    {!state.items && !state.error && <p role="status" className="mt-6 flex items-center gap-2"><Spinner />Loading featured items...</p>}
    {state.error && <div className="mt-6"><p role="alert">{state.error}</p><button className={button} onClick={() => { setState({}); setRetry((value) => value + 1); }}>Try again</button></div>}
    {state.items?.length === 0 && <p className="mt-6">Menu items will appear here once available.</p>}
    <div className="mt-6 grid gap-6 md:grid-cols-3">{state.items?.map((item) => <article key={item._id} className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"><Photo item={item} /><div className="space-y-3 p-5"><PremiumBadge premium={item.vendorIsPremium} /><h3 className="text-xl font-bold"><Link href={`/menu/${item._id}`}>{item.itemName}</Link></h3><p className="text-sm text-stone-600">{item.vendorName}</p><p className="font-bold text-red-700">{new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT" }).format(item.price)}</p></div></article>)}</div>
  </section>;
}
