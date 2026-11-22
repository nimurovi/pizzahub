"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";

type Review = { _id: string; authorName: string; targetType: "item" | "restaurant"; targetId: string; targetName?: string; rating: number; text: string; status: string; createdAt: string; updatedAt: string; moderationReason?: string; revision?: number };
type ReviewList = { reviews: Review[]; totalPages: number; total?: number };
type TargetData = ReviewList & { averageRating: number; reviewCount: number; eligible: boolean; mine: Review | null };
type Target = { targetType: "item" | "restaurant"; targetId: string; targetName?: string };
const button = "rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800 disabled:opacity-50";
const primary = "rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50";
const panel = "my-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 text-stone-900";

async function request<T>(path: string, method = "GET", body?: object, signal?: AbortSignal): Promise<T> {
  const response = await apiFetch(path, { method, signal, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Could not complete the review request.");
  return result.data;
}
function useRemote<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError("");
      void request<T>(path, "GET", undefined, controller.signal).then(value => {
        if (!controller.signal.aborted) setData(value);
      }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Unable to load reviews."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [path, version]);
  return { data, error, loading, refresh: () => setVersion(v => v + 1) };
}
export function RatingSummary({ average = 0, count = 0 }: { average?: number; count?: number }) {
  return <span className="text-sm text-stone-700">{count ? `★ ${average.toFixed(1)} / 5 · ${count} review${count === 1 ? "" : "s"}` : "No reviews yet"}</span>;
}
function Pager({ page, pages, setPage }: { page: number; pages: number; setPage: (value: number) => void }) {
  return <div className="flex items-center gap-3"><button className={button} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button className={button} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div>;
}
function ReviewText({ review }: { review: Review }) {
  return <><p className="font-semibold">{review.authorName} <span className="text-sm font-normal text-stone-600">· Verified order</span></p><p aria-label={`${review.rating} out of 5 stars`} className="text-amber-600">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p><p className="whitespace-pre-wrap break-words">{review.text}</p><p className="text-xs text-stone-600">{new Date(review.createdAt).toLocaleDateString()}</p></>;
}
function Editor({ selection, review, onSaved }: { selection: Target; review?: Review | null; onSaved: () => void }) {
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [text, setText] = useState(review?.text ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setBusy(true); setError("");
    try {
      await request(review ? `/api/reviews/${review._id}` : "/api/reviews", review ? "PATCH" : "POST", review ? { rating, text } : { rating, text, targetType: selection.targetType, targetId: selection.targetId });
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save review."); }
    finally { setBusy(false); }
  }
  return <form className="space-y-3" onSubmit={e => { e.preventDefault(); void save(); }}>
    <fieldset disabled={busy} className="space-y-3"><legend className="font-semibold">{review ? "Edit your review" : "Write a review"}</legend>
      <label className="block">Rating <select className="ml-3 rounded border border-stone-300 p-2" value={rating} onChange={e => setRating(Number(e.target.value))}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{"★".repeat(n)} — {n} / 5</option>)}</select></label>
      <label className="block">Your experience<textarea required minLength={10} maxLength={2000} rows={4} className="mt-2 block w-full rounded-lg border border-stone-300 p-3" value={text} onChange={e => setText(e.target.value)} /></label>
      <p className="text-sm text-stone-600">{text.length}/2000 characters. New and edited reviews require Admin approval.</p>
      <button className={primary} disabled={busy || text.trim().length < 10}>{busy ? "Saving…" : "Submit for approval"}</button>
    </fieldset>{error && <p role="alert" className="text-red-700">{error}</p>}
  </form>;
}
function ManagedReview({ review, refresh, admin = false }: { review: Review; refresh: () => void; admin?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reason, setReason] = useState(review.moderationReason ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function mutate(method: string, status?: string) {
    setBusy(true); setError("");
    try {
      await request(`/api/${admin ? "admin/" : ""}reviews/${review._id}`, method, status ? { status, reason, revision: review.revision } : undefined);
      refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Action failed."); }
    finally { setBusy(false); }
  }
  return <article className={panel}>
    <h3 className="font-bold">{review.targetName || review.targetId} · {review.targetType === "item" ? "Menu item" : "Restaurant"}</h3>
    <ReviewText review={review} /><p className="font-semibold">Status: {review.status}</p>
    {review.moderationReason && <p>Admin feedback: {review.moderationReason}</p>}
    {editing ? <Editor selection={review} review={review} onSaved={() => { setEditing(false); refresh(); }} /> : null}
    <div className="flex flex-wrap gap-2">
      {!admin && <button className={button} disabled={busy} onClick={() => setEditing(!editing)}>{editing ? "Close editor" : "Edit"}</button>}
      <button className={button} disabled={busy} onClick={() => setConfirmDelete(true)}>Delete</button>
    </div>
    {admin && <fieldset disabled={busy} className="space-y-3"><label className="block">Moderation reason (required to reject)<textarea maxLength={500} value={reason} onChange={e => setReason(e.target.value)} className="mt-2 block w-full rounded border border-stone-300 p-2" /></label><div className="flex flex-wrap gap-2">{["approved", "rejected", "pending"].map(status => <button key={status} className={button} disabled={status === "rejected" && !reason.trim()} onClick={() => void mutate("PATCH", status)}>{status === "approved" ? "Approve" : status === "rejected" ? "Reject / hide" : "Return to pending"}</button>)}</div></fieldset>}
    {confirmDelete && <div role="alert" className="space-x-3"><span>Delete this review permanently?</span><button className={button} disabled={busy} onClick={() => void mutate("DELETE")}>Confirm delete</button><button className={button} onClick={() => setConfirmDelete(false)}>Cancel</button></div>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </article>;
}
export function TargetReviews({ type, targetId, name, onChanged }: { type: "item" | "restaurant"; targetId: string; name: string; onChanged?: () => void }) {
  const [page, setPage] = useState(1);
  const state = useRemote<TargetData>(`/api/reviews/target/${type}/${encodeURIComponent(targetId)}?page=${page}`);
  function changed() { state.refresh(); onChanged?.(); }
  return <section className={panel} aria-label={`${name} reviews`}><h2 className="text-xl font-bold">{name} — {type === "item" ? "menu item" : "restaurant"} reviews</h2>
    <button className={button} onClick={state.refresh}>Refresh reviews</button>
    {state.error && <p role="alert">{state.error}</p>}
    {state.loading ? <p role="status">Loading reviews…</p> : state.data && <>
      <RatingSummary average={state.data.averageRating} count={state.data.reviewCount} />
      {state.data.mine ? <ManagedReview key={`${state.data.mine._id}-${state.data.mine.updatedAt}-${state.data.mine.status}`} review={state.data.mine} refresh={changed} /> : state.data.eligible ? <Editor selection={{ targetType: type, targetId }} onSaved={changed} /> : <p className="text-sm text-stone-600">You can review after an accepted order’s scheduled date has passed. Orders are checked by the server.</p>}
      <h3 className="font-semibold">Approved reviews</h3>
      {state.data.reviews.map(review => <article key={review._id} className="space-y-2 border-t border-stone-200 pt-4"><ReviewText review={review} /></article>)}
      {!state.data.reviewCount && <p>Be the first eligible customer to share your experience.</p>}
      <Pager page={page} pages={state.data.totalPages} setPage={setPage} />
    </>}
  </section>;
}
function EligibleReviews({ onChanged }: { onChanged: () => void }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Target | null>(null);
  const state = useRemote<{ targets: Target[]; totalPages: number }>(`/api/reviews/eligible?page=${page}`);
  return <section className={panel}><h2 className="text-xl font-bold">Review an order</h2><p>Accepted orders become eligible the day after their scheduled date (UTC). One review per menu item and one per restaurant.</p>
    {state.error && <p role="alert">{state.error} <button className={button} onClick={state.refresh}>Retry</button></p>}
    {state.loading ? <p>Loading eligible orders…</p> : state.data && <><div className="flex flex-wrap gap-2">{state.data.targets.map(t => <button className={button} key={`${t.targetType}-${t.targetId}`} onClick={() => setSelected(t)}>{t.targetName || t.targetId} · {t.targetType === "item" ? "Menu item" : "Restaurant"}</button>)}</div>{!state.data.targets.length && <p>No eligible orders on this page yet.</p>}<Pager page={page} pages={state.data.totalPages} setPage={setPage} /></>}
    {selected && <TargetReviews key={`${selected.targetType}-${selected.targetId}`} type={selected.targetType} targetId={selected.targetId} name={selected.targetName || "Your order"} onChanged={onChanged} />}
  </section>;
}
export function ReviewManager({ admin = false }: { admin?: boolean }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const state = useRemote<ReviewList>(admin ? `/api/admin/reviews?status=${status}&page=${page}` : `/api/reviews/mine?page=${page}`);
  return <section className="text-stone-900"><div className="my-5 flex flex-wrap items-center gap-4"><h2 className="text-2xl font-bold">{admin ? "Moderate reviews" : "My Reviews"}</h2><button className={button} onClick={state.refresh}>Refresh</button>{admin && <label>Status <select className="rounded border border-stone-300 p-2" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>{["pending", "approved", "rejected", "all"].map(s => <option key={s}>{s}</option>)}</select></label>}</div>
    {!admin && <EligibleReviews onChanged={state.refresh} />}
    {state.error && <p role="alert">{state.error}</p>}
    {state.loading ? <p role="status">Loading reviews…</p> : state.data && <><p>{state.data.total} review(s)</p>{state.data.reviews.map(review => <ManagedReview key={`${review._id}-${review.updatedAt}-${review.status}-${review.revision}`} review={review} refresh={state.refresh} admin={admin} />)}{!state.data.reviews.length && <p>No reviews on this page.</p>}<Pager page={page} pages={state.data.totalPages} setPage={setPage} /></>}
  </section>;
}
