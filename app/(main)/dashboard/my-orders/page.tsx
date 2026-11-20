"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import RequireAuth from "@/components/auth/RequirAuth";
import { authClient } from "@/lib/auth-client";

type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

type Order = {
  _id: string;
  itemName: string;
  itemImage?: string | null;
  vendorName?: string | null;
  location?: string | null;
  orderDate: string;
  deliveryAddress?: string | null;
  message?: string | null;
  status: OrderStatus;
  quantity: number;
  unitPriceMinor: number;
  totalPriceMinor: number;
  createdAt: string;
};

type DashboardData = {
  summary: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    cancelled: number;
  };
  orders: Order[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: DashboardData };

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  accepted: "bg-green-100 text-green-900",
  rejected: "bg-red-100 text-red-900",
  cancelled: "bg-gray-100 text-gray-700",
};

function getApiUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL;

  if (!url) {
    throw new Error("The API URL is not configured.");
  }

  return url.replace(/\/$/, "");
}

function formatMoney(minor: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
  }).format(minor / 100);
}

function formatRequestDate(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

function LoadingMessage({
  message = "Loading your orders...",
}: {
  message?: string;
}) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 px-4 py-16 text-gray-600"
    >
      <Spinner />
      <span>{message}</span>
    </div>
  );
}

function OrderPhoto({
  src,
  name,
}: {
  src?: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-orange-100">
      {src && !failed ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="112px"
          unoptimized
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label="No item image available"
          className="flex h-full items-center justify-center text-4xl"
        >
          🍕
        </div>
      )}
    </div>
  );
}

function OrdersDashboard() {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [state, setState] = useState<LoadState>({
    status: "loading",
  });

  const [cancellingId, setCancellingId] =
    useState<string | null>(null);

  const cancellationInProgress = useRef(false);
  const mounted = useRef(false);
  const cancelController = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      cancelController.current?.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    let active = true;
    let timedOut = false;

    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 20_000);

    async function loadOrders() {
      try {
        const response = await fetch(
          `${getApiUrl()}/api/orders/mine?page=${page}`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok || result?.success !== true) {
          throw new Error(
            response.status === 401
              ? "Your session expired. Please sign in again."
              : result?.message || "Unable to load your orders."
          );
        }

        if (
          !result.data?.summary ||
          !Array.isArray(result.data?.orders) ||
          !Number.isInteger(result.data?.pagination?.totalPages) ||
          result.data.pagination.totalPages < 1
        ) {
          throw new Error("The server returned invalid order data.");
        }

        if (!active) return;

        // Recover if the current page no longer exists.
        if (page > result.data.pagination.totalPages) {
          setPage(result.data.pagination.totalPages);
          return;
        }

        setState({
          status: "success",
          data: result.data,
        });
      } catch (error) {
        if (!active) return;

        setState({
          status: "error",
          message: timedOut
            ? "Loading took too long. Please try again."
            : error instanceof Error
              ? error.message
              : "Unable to load your orders.",
        });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void loadOrders();

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page, revision]);

  function refreshOrders() {
    setState({ status: "loading" });
    setRevision((value) => value + 1);
  }

  function changePage(nextPage: number) {
    setState({ status: "loading" });
    setPage(nextPage);
  }

  async function cancelOrder(order: Order) {
    if (
      cancellationInProgress.current ||
      order.status !== "pending"
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Cancel your order for "${order.itemName}"? This cannot be undone.`
    );

    if (!confirmed) return;

    cancellationInProgress.current = true;
    setCancellingId(order._id);

    const controller = new AbortController();
    cancelController.current = controller;

    let timedOut = false;

    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 20_000);

    try {
      const response = await fetch(
        `${getApiUrl()}/api/orders/${encodeURIComponent(
          order._id
        )}/cancel`,
        {
          method: "PATCH",
          credentials: "include",
          signal: controller.signal,
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success !== true) {
        throw new Error(
          result?.message || "Unable to confirm cancellation."
        );
      }

      if (mounted.current) {
        toast.success("Order cancelled successfully.");
      }
    } catch (error) {
      if (!mounted.current) return;

      const connectionFailure =
        timedOut ||
        (error instanceof Error &&
          ["TypeError", "AbortError", "TimeoutError"].includes(
            error.name
          ));

      toast.error(
        connectionFailure
          ? "Cancellation could not be confirmed. Check the refreshed order status before trying again."
          : error instanceof Error
            ? error.message
            : "Unable to cancel your order."
      );
    } finally {
      window.clearTimeout(timeout);
      cancelController.current = null;
      cancellationInProgress.current = false;

      if (mounted.current) {
        setCancellingId(null);

        // Refresh after success, conflicts, and uncertain responses.
        refreshOrders();
      }
    }
  }

  const data = state.status === "success" ? state.data : null;

  const overviewCards = data
    ? [
        {
          label: "Total orders",
          value: data.summary.total,
          color: "text-gray-900",
        },
        {
          label: "Pending",
          value: data.summary.pending,
          color: "text-amber-700",
        },
        {
          label: "Accepted",
          value: data.summary.accepted,
          color: "text-green-700",
        },
        {
          label: "Rejected",
          value: data.summary.rejected,
          color: "text-red-700",
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-orange-50/40 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              My Orders
            </h1>

            <p className="mt-2 text-gray-600">
              Track your orders and manage pending requests.
            </p>
          </div>

          <Link
            href="/menu"
            className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800"
          >
            Browse menu
          </Link>
        </div>

        {state.status === "loading" && <LoadingMessage />}

        {state.status === "error" && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6">
            <p role="alert" className="text-red-700">
              {state.message}
            </p>

            <div className="mt-4 flex flex-wrap gap-5">
              <button
                type="button"
                onClick={refreshOrders}
                className="font-semibold text-red-700 underline"
              >
                Try again
              </button>

              <Link
                href="/sign-in"
                className="font-semibold text-gray-700 underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}

        {data && (
          <>
            <section
              aria-label="Order overview"
              className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
            >
              {overviewCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-medium text-gray-500">
                    {card.label}
                  </p>

                  <p
                    className={`mt-2 text-3xl font-bold ${card.color}`}
                  >
                    {card.value}
                  </p>
                </div>
              ))}
            </section>

            <p className="mt-3 text-sm text-gray-500">
              Total includes cancelled orders. Cancelled:{" "}
              {data.summary.cancelled}.
            </p>

            <section className="mt-10">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Order history
                </h2>

                <button
                  type="button"
                  disabled={cancellingId !== null}
                  onClick={refreshOrders}
                  className="text-sm font-semibold text-red-700 underline disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {data.orders.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-orange-100 bg-white px-6 py-12 text-center">
                  <p aria-hidden="true" className="text-5xl">
                    🍕
                  </p>

                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    No orders yet
                  </h3>

                  <p className="mt-2 text-gray-600">
                    Your orders will appear here after you place one.
                  </p>

                  <Link
                    href="/menu"
                    className="mt-5 inline-block font-semibold text-red-700 underline"
                  >
                    Explore the menu
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  {data.orders.map((order) => (
                    <article
                      key={order._id}
                      className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row">
                        <OrderPhoto
                          key={order.itemImage ?? "placeholder"}
                          src={order.itemImage}
                          name={order.itemName}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <h3 className="text-xl font-bold text-gray-900">
                              {order.itemName}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                statusStyles[order.status] ??
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-gray-600">
                            Vendor:{" "}
                            <span className="font-medium text-gray-900">
                              {order.vendorName || "Not available"}
                            </span>
                          </p>

                          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                            <div>
                              <dt className="text-gray-500">
                                Delivery date
                              </dt>

                              <dd className="mt-1 font-medium text-gray-900">
                                {order.orderDate}
                              </dd>
                            </div>

                            <div>
                              <dt className="text-gray-500">
                                Request date · Bangladesh time
                              </dt>

                              <dd className="mt-1 font-medium text-gray-900">
                                {formatRequestDate(order.createdAt)}
                              </dd>
                            </div>

                            <div className="sm:col-span-2">
                              <dt className="text-gray-500">
                                Delivery address
                              </dt>

                              <dd className="mt-1 whitespace-pre-wrap break-words font-medium text-gray-900">
                                {order.deliveryAddress ||
                                  "Not provided"}
                              </dd>
                            </div>
                          </dl>

                          <p className="mt-4 font-bold text-red-700">
                            {order.quantity} ×{" "}
                            {formatMoney(order.unitPriceMinor)}
                            {" = "}
                            {formatMoney(order.totalPriceMinor)}
                          </p>
                        </div>
                      </div>

                      <details className="mt-5 border-t border-gray-100 pt-4">
                        <summary className="cursor-pointer font-semibold text-red-700">
                          View order details
                        </summary>

                        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <dt className="text-gray-500">
                              Order ID
                            </dt>

                            <dd className="mt-1 break-all text-gray-900">
                              {order._id}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-gray-500">
                              Quantity
                            </dt>

                            <dd className="mt-1 text-gray-900">
                              {order.quantity}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-gray-500">
                              Unit price
                            </dt>

                            <dd className="mt-1 text-gray-900">
                              {formatMoney(order.unitPriceMinor)}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-gray-500">
                              Total
                            </dt>

                            <dd className="mt-1 font-bold text-red-700">
                              {formatMoney(order.totalPriceMinor)}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-gray-500">
                              Vendor location
                            </dt>

                            <dd className="mt-1 text-gray-900">
                              {order.location || "Not provided"}
                            </dd>
                          </div>

                          <div className="sm:col-span-2">
                            <dt className="text-gray-500">
                              Message to restaurant
                            </dt>

                            <dd className="mt-1 whitespace-pre-wrap break-words text-gray-900">
                              {order.message || "No message"}
                            </dd>
                          </div>
                        </dl>
                      </details>

                      {order.status === "pending" ? (
                        <div className="mt-5 flex flex-wrap items-center gap-4">
                          <button
                            type="button"
                            disabled={cancellingId !== null}
                            aria-busy={cancellingId === order._id}
                            onClick={() => void cancelOrder(order)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {cancellingId === order._id && (
                              <Spinner />
                            )}

                            {cancellingId === order._id
                              ? "Cancelling..."
                              : "Cancel order"}
                          </button>

                          <p className="text-xs text-gray-500">
                            Cancellation is available while pending.
                          </p>
                        </div>
                      ) : (
                        <p className="mt-5 text-xs text-gray-500">
                          This order can no longer be cancelled.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}

              {data.pagination.totalPages > 1 && (
                <nav
                  aria-label="Order pagination"
                  className="mt-6 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    disabled={page <= 1 || cancellingId !== null}
                    onClick={() => changePage(page - 1)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                    Page {page} of {data.pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      page >= data.pagination.totalPages ||
                      cancellingId !== null
                    }
                    onClick={() => changePage(page + 1)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function AccountOrders() {
  const {
    data: session,
    isPending,
    error,
    refetch,
  } = authClient.useSession();

  if (isPending) {
    return <LoadingMessage message="Checking your account..." />;
  }

  if (error) {
    return (
      <div className="px-4 py-12 text-center">
        <p role="alert" className="text-red-700">
          Unable to verify your account.
        </p>

        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 font-semibold text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="px-4 py-12 text-center">
        <Link
          href="/sign-in"
          className="font-semibold text-red-700 underline"
        >
          Sign in to view your orders
        </Link>
      </div>
    );
  }

  // Reset orders and pagination when the account changes.
  return <OrdersDashboard key={session.user.id} />;
}

export default function MyOrdersPage() {
  return (
    <Suspense fallback={<LoadingMessage />}>
      <RequireAuth>
        <AccountOrders />
      </RequireAuth>
    </Suspense>
  );
}