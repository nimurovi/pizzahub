"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

type OrderStatus = "pending" | "accepted" | "rejected" | "cancelled";

type VendorOrder = {
  _id: string;
  customerName?: string;
  itemId: string;
  itemName: string;
  itemImage?: string | null;
  orderDate: string;
  deliveryAddress?: string;
  message?: string;
  quantity: number;
  currency: string;
  unitPriceMinor: number;
  totalPriceMinor: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

type OrdersData = {
  orders: VendorOrder[];
  summary: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    cancelled: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: OrdersData };

const buttonClass =
  "rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

const statusClasses: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-stone-100 text-stone-700",
};

function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL;

  if (!base) {
    throw new Error("The API URL is not configured.");
  }

  return `${base.replace(/\/$/, "")}${path}`;
}

function money(minor: number) {
  if (!Number.isFinite(minor)) return "Unavailable";

  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
  }).format(minor / 100);
}

function deliveryDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "Unavailable";
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

function requestDate(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

function OrderImage({
  src,
  name,
}: {
  src?: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-orange-100">
      {src && !failed ? (
        <Image
          src={src}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 240px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-orange-800">
          No image available
        </div>
      )}
    </div>
  );
}

function CustomerOrders() {
  const [state, setState] = useState<LoadState>({
    status: "loading",
  });

  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  const [busy, setBusy] = useState<{
    id: string;
    status: "accepted" | "rejected";
  } | null>(null);

  const [actionError, setActionError] = useState("");
  const actionLock = useRef(false);

  function refreshOrders() {
    setActionError("");
    setState({ status: "loading" });
    setReload((value) => value + 1);
  }

  function changePage(nextPage: number) {
    if (nextPage === page) return;

    setActionError("");
    setState({ status: "loading" });
    setPage(nextPage);
  }

  useEffect(() => {
    const controller = new AbortController();

    let active = true;
    let timedOut = false;

    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 20_000);

    async function loadOrders() {
      try {
        const response = await fetch(
          apiUrl(`/api/vendor/orders?page=${page}`),
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok || result.success !== true) {
          throw new Error(
            result.message || "Could not load customer orders."
          );
        }

        const data = result.data;

        if (
          !Array.isArray(data?.orders) ||
          !data?.summary ||
          !Number.isInteger(data?.pagination?.totalPages) ||
          data.pagination.totalPages < 1 ||
          ![
            data.summary.total,
            data.summary.pending,
            data.summary.accepted,
            data.summary.rejected,
            data.summary.cancelled,
          ].every(
            (value) => Number.isInteger(value) && value >= 0
          )
        ) {
          throw new Error("The server returned invalid order data.");
        }

        if (!active) return;

        if (page > data.pagination.totalPages) {
          setPage(data.pagination.totalPages);
          return;
        }

        setState({
          status: "success",
          data,
        });
      } catch (error) {
        if (!active) return;

        setState({
          status: "error",
          message: timedOut
            ? "Loading took too long. Please try again."
            : error instanceof Error
              ? error.message
              : "Could not load customer orders.",
        });
      } finally {
        window.clearTimeout(timer);
      }
    }

    void loadOrders();

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, reload]);

  async function respondToOrder(
    order: VendorOrder,
    nextStatus: "accepted" | "rejected"
  ) {
    if (actionLock.current || order.status !== "pending") {
      return;
    }

    const action = nextStatus === "accepted" ? "Accept" : "Reject";

    if (
      !window.confirm(
        `${action} the order for "${order.itemName}" from ${
          order.customerName || "this customer"
        }? This decision cannot be changed here.`
      )
    ) {
      return;
    }

    actionLock.current = true;
    setBusy({ id: order._id, status: nextStatus });
    setActionError("");

    const toastId = toast.loading(
      nextStatus === "accepted"
        ? "Accepting order..."
        : "Rejecting order..."
    );

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(
        apiUrl(
          `/api/vendor/orders/${encodeURIComponent(order._id)}/status`
        ),
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
          signal: controller.signal,
        }
      );

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        // Another tab, vendor request, or customer cancellation
        // may have already changed this order.
        if (response.status === 409 || response.status === 404) {
          refreshOrders();
        }

        throw new Error(
          result.message || "Could not update this order."
        );
      }

      toast.success(result.message || "Order updated.", {
        id: toastId,
      });

      refreshOrders();
    } catch (error) {
      const uncertain =
        controller.signal.aborted || error instanceof TypeError;

      const message = uncertain
        ? "The result could not be confirmed. Refresh orders before trying again."
        : error instanceof Error
          ? error.message
          : "Could not update this order.";

      setActionError(message);

      toast.error(message, {
        id: toastId,
      });
    } finally {
      window.clearTimeout(timer);
      actionLock.current = false;
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <nav
        aria-label="Vendor order navigation"
        className="flex flex-wrap gap-4 text-sm font-semibold text-red-700"
      >
        <Link href="/dashboard/vendor">← Vendor Dashboard</Link>
        <Link href="/dashboard/vendor/menu">My Menu Items</Link>
      </nav>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">
            Customer Orders
          </h1>

          <p className="mt-2 text-stone-600">
            Review customer requests and accept or reject pending orders.
          </p>
        </div>

        <button
          type="button"
          disabled={busy !== null || state.status === "loading"}
          onClick={refreshOrders}
          className={buttonClass}
        >
          Refresh orders
        </button>
      </div>

      {actionError && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-red-700"
        >
          {actionError}
        </p>
      )}

      {state.status === "loading" && (
        <p role="status" className="mt-10 flex items-center gap-2">
          <Spinner />
          Loading customer orders...
        </p>
      )}

      {state.status === "error" && (
        <div className="mt-8 rounded-2xl border border-red-200 p-6">
          <p role="alert" className="text-red-700">
            {state.message}
          </p>

          <button
            type="button"
            onClick={refreshOrders}
            className={`${buttonClass} mt-4`}
          >
            Try again
          </button>
        </div>
      )}

      {state.status === "success" && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              { label: "Total", value: state.data.summary.total },
              { label: "Pending", value: state.data.summary.pending },
              { label: "Accepted", value: state.data.summary.accepted },
              { label: "Rejected", value: state.data.summary.rejected },
              { label: "Cancelled", value: state.data.summary.cancelled },
            ].map((entry) => (
              <div
                key={entry.label}
                className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-stone-600">
                  {entry.label}
                </p>

                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {entry.value}
                </p>
              </div>
            ))}
          </div>

          {state.data.orders.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed p-10 text-center">
              <h2 className="text-xl font-bold">
                No customer orders yet
              </h2>

              <p className="mt-2 text-stone-600">
                Orders for your menu items will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {state.data.orders.map((order) => {
                const updating = busy?.id === order._id;

                return (
                  <article
                    key={order._id}
                    className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                      <OrderImage
                        key={`${order._id}-${order.itemImage ?? ""}`}
                        src={order.itemImage}
                        name={order.itemName}
                      />

                      <div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            statusClasses[order.status] ??
                            "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {order.status}
                        </span>

                        <h2 className="mt-3 text-xl font-bold text-stone-900">
                          {order.itemName}
                        </h2>

                        <p className="mt-2 text-stone-700">
                          Customer:{" "}
                          <span className="font-semibold">
                            {order.customerName || "Name unavailable"}
                          </span>
                        </p>

                        <p className="mt-2 text-sm text-stone-600">
                          Quantity: {order.quantity} · Unit price:{" "}
                          {money(order.unitPriceMinor)}
                        </p>

                        <p className="mt-2 text-lg font-bold text-red-700">
                          Total: {money(order.totalPriceMinor)}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-6 grid gap-5 border-t border-stone-100 pt-6 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm text-stone-500">
                          Delivery date
                        </dt>

                        <dd className="mt-1 font-semibold text-stone-900">
                          {deliveryDate(order.orderDate)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm text-stone-500">
                          Request date — Bangladesh time
                        </dt>

                        <dd className="mt-1 text-stone-900">
                          {requestDate(order.createdAt)}
                        </dd>
                      </div>

                      <div className="sm:col-span-2">
                        <dt className="text-sm text-stone-500">
                          Delivery address
                        </dt>

                        <dd className="mt-1 whitespace-pre-line break-words text-stone-900">
                          {order.deliveryAddress ||
                            "Not provided with this order."}
                        </dd>
                      </div>

                      <div className="sm:col-span-2">
                        <dt className="text-sm text-stone-500">
                          Customer message / special instructions
                        </dt>

                        <dd className="mt-1 whitespace-pre-line break-words text-stone-900">
                          {order.message || "No special instructions."}
                        </dd>
                      </div>

                      <div className="sm:col-span-2">
                        <dt className="text-sm text-stone-500">
                          Order ID
                        </dt>

                        <dd className="mt-1 break-all font-mono text-xs text-stone-600">
                          {order._id}
                        </dd>
                      </div>
                    </dl>

                    {order.status === "pending" ? (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() =>
                            void respondToOrder(order, "accepted")
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updating && busy?.status === "accepted" && (
                            <Spinner />
                          )}

                          {updating && busy?.status === "accepted"
                            ? "Accepting..."
                            : "Accept order"}
                        </button>

                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() =>
                            void respondToOrder(order, "rejected")
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-5 py-3 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updating && busy?.status === "rejected" && (
                            <Spinner />
                          )}

                          {updating && busy?.status === "rejected"
                            ? "Rejecting..."
                            : "Reject order"}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-6 text-sm text-stone-500">
                        This order is {order.status}. No further actions
                        are available.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {state.data.pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={busy !== null || page <= 1}
                onClick={() => changePage(page - 1)}
                className={buttonClass}
              >
                Previous
              </button>

              <span className="text-sm">
                Page {page} of {state.data.pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={
                  busy !== null ||
                  page >= state.data.pagination.totalPages
                }
                onClick={() => changePage(page + 1)}
                className={buttonClass}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function VendorCustomerOrdersPage() {
  const {
    data: session,
    isPending,
    error,
    refetch,
  } = authClient.useSession();

  if (isPending) {
    return (
      <p
        role="status"
        className="flex items-center justify-center gap-2 p-10"
      >
        <Spinner />
        Checking your account...
      </p>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <p role="alert">Unable to check your account.</p>

        <button
          type="button"
          onClick={() => void refetch()}
          className={`${buttonClass} mt-4`}
        >
          Try again
        </button>
      </div>
    );
  }

  const user = session?.user;

  if (!user) {
    return (
      <div className="p-10 text-center">
        <p>Please sign in to manage customer orders.</p>

        <Link
          href="/sign-in"
          className="mt-4 inline-block font-semibold text-red-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (
    user.role !== "vendor" ||
    user.isBlocked ||
    user.roleSelectionPending
  ) {
    return (
      <p role="alert" className="p-10 text-center text-red-700">
        A completed, active vendor account is required to manage
        customer orders.
      </p>
    );
  }

  return <CustomerOrders key={user.id} />;
}