"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";

type Overview = { totalUsers: number; totalVendors: number; totalCustomers: number; totalMenuItems: number; pendingMenuItems: number; totalTransactions: number };
type User = { id: string; name: string; email: string; role: string; isBlocked: boolean; createdAt?: string };
type MenuItem = { id: string; name: string; vendorName: string; vendorId: string; category: string; price: number | null; status: string; isAvailable: boolean; createdAt?: string };
type Transaction = { _id: string; vendorName: string; vendorEmail: string; subscriptionPlan: string; amountMinor: number; currency: string; status: string; paidAt?: string; createdAt?: string };
type Tab = "overview" | "users" | "menu" | "transactions";

const button = "rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold hover:bg-stone-100 disabled:opacity-50";
const primary = "rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) throw new Error(payload?.message || `Request failed (${response.status})`);
  return payload?.data as T;
}

function date(value?: string) { return value ? new Date(value).toLocaleString() : "—"; }
function money(amount: number, currency: string) { return `${(amount / 100).toFixed(2)} ${(currency || "USD").toUpperCase()}`; }

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      if (tab === "overview") setOverview(await request<Overview>("/api/admin/overview"));
      if (tab === "users") {
        const q = new URLSearchParams({ search, role });
        setUsers(await request<User[]>(`/api/admin/users?${q}`));
      }
      if (tab === "menu") {
        const q = new URLSearchParams({ search, status });
        setItems(await request<MenuItem[]>(`/api/admin/menu?${q}`));
      }
      if (tab === "transactions") setTransactions(await request<Transaction[]>("/api/admin/transactions"));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load admin data."); }
    finally { setLoading(false); }
  }, [tab, search, role, status]);

  useEffect(() => {
    // Defer the initial fetch to a task so loading/error state updates do not
    // run synchronously inside the React effect.
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function mutate(key: string, path: string, method: string, body?: object) {
    setBusy(key); setError("");
    try {
      await request(path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Action failed."); }
    finally { setBusy(null); }
  }

  const tabs: [Tab, string][] = [["overview", "Overview"], ["users", "Manage Users"], ["menu", "Manage Menu Items"], ["transactions", "Transactions"]];
  return <main className="mx-auto max-w-7xl px-4 py-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-semibold text-red-700">PizzaHub administration</p><h1 className="mt-2 text-3xl font-bold text-stone-900">Admin Dashboard</h1></div><button className={button} onClick={() => void load()} disabled={loading}>Refresh</button></div>
    <nav className="mt-7 flex flex-wrap gap-2" aria-label="Admin sections">{tabs.map(([key, label]) => <button key={key} className={tab === key ? primary : button} onClick={() => setTab(key)}>{label}</button>)}</nav>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {loading && <p role="status" className="mt-6 text-stone-600">Loading...</p>}
    {tab === "overview" && overview && <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{([["Total registered users", overview.totalUsers], ["Total vendors", overview.totalVendors], ["Total customers", overview.totalCustomers], ["Total menu items", overview.totalMenuItems], ["Pending menu items", overview.pendingMenuItems], ["Total transactions", overview.totalTransactions]] as [string, number][]).map(([label, value]) => <section key={label} className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"><p className="text-sm text-stone-600">{label}</p><p className="mt-2 text-3xl font-bold text-stone-900">{value.toLocaleString()}</p></section>)}</div>}
    {tab === "users" && <section className="mt-7"><div className="flex flex-wrap gap-3"><input aria-label="Search users" className="min-w-56 rounded-lg border p-2" placeholder="Search name or email" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Filter users by role" className="rounded-lg border p-2" value={role} onChange={e => setRole(e.target.value)}><option value="all">All roles</option><option value="admin">Admin</option><option value="vendor">Vendor</option><option value="customer">Customer</option></select></div><div className="mt-4 overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-orange-50"><tr>{["Name", "Email", "Role", "Joined", "Status", "Action"].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{users.map(u => <tr key={u.id} className="border-t"><td className="p-3 font-medium">{u.name}</td><td className="p-3">{u.email}</td><td className="p-3 capitalize">{u.role}</td><td className="p-3">{date(u.createdAt)}</td><td className="p-3">{u.isBlocked ? "Blocked" : "Active"}</td><td className="p-3"><button className={button} disabled={busy === u.id || u.role === "admin"} onClick={() => void mutate(u.id, `/api/admin/users/${encodeURIComponent(u.id)}/block`, "PATCH", { action: u.isBlocked ? "unblock" : "block" })}>{u.isBlocked ? "Unblock" : "Block"}</button></td></tr>)}</tbody></table>{!users.length && !loading && <p className="p-5 text-stone-500">No users found.</p>}</div></section>}
    {tab === "menu" && <section className="mt-7"><div className="flex flex-wrap gap-3"><input aria-label="Search menu items" className="min-w-56 rounded-lg border p-2" placeholder="Search item or vendor" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Filter menu status" className="rounded-lg border p-2" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div><div className="mt-4 overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-orange-50"><tr>{["Item", "Vendor", "Category", "Price", "Status", "Availability", "Actions"].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{items.map(item => <tr key={item.id} className="border-t"><td className="p-3 font-medium">{item.name}</td><td className="p-3">{item.vendorName}</td><td className="p-3">{item.category}</td><td className="p-3">{item.price ?? "—"}</td><td className="p-3 capitalize">{item.status}</td><td className="p-3">{item.isAvailable ? "Active" : "Inactive"}</td><td className="p-3"><div className="flex flex-wrap gap-2">{item.status !== "approved" && <button className={button} disabled={busy === item.id} onClick={() => void mutate(item.id, `/api/admin/menu/${item.id}`, "PATCH", { status: "approved", isAvailable: true })}>Approve</button>}{item.status !== "rejected" && <button className={button} disabled={busy === item.id} onClick={() => void mutate(item.id, `/api/admin/menu/${item.id}`, "PATCH", { status: "rejected", isAvailable: false })}>Reject</button>}<button className={button} disabled={busy === item.id} onClick={() => void mutate(item.id, `/api/admin/menu/${item.id}`, "PATCH", { isAvailable: !item.isAvailable })}>{item.isAvailable ? "Deactivate" : "Activate"}</button><button className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700" disabled={busy === item.id} onClick={() => { if (window.confirm(`Delete ${item.name}? This cannot be undone.`)) void mutate(item.id, `/api/admin/menu/${item.id}`, "DELETE"); }}>Delete</button></div></td></tr>)}</tbody></table>{!items.length && !loading && <p className="p-5 text-stone-500">No menu items found.</p>}</div></section>}
    {tab === "transactions" && <section className="mt-7 overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-orange-50"><tr>{["Vendor", "Email", "Subscription plan", "Amount", "Payment status", "Transaction date"].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{transactions.map(t => <tr key={t._id} className="border-t"><td className="p-3 font-medium">{t.vendorName}</td><td className="p-3">{t.vendorEmail}</td><td className="p-3 capitalize">{t.subscriptionPlan}</td><td className="p-3">{money(t.amountMinor, t.currency)}</td><td className="p-3 capitalize">{t.status}</td><td className="p-3">{date(t.paidAt || t.createdAt)}</td></tr>)}</tbody></table>{!transactions.length && !loading && <p className="p-5 text-stone-500">No transactions found.</p>}<p className="border-t bg-stone-50 p-3 text-xs text-stone-500">Payment records are read-only. Admins cannot change payment amounts or statuses.</p></section>}
  </main>;
}
