"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type View = "overview" | "subscription";

type VendorData = {
  overview: {
    totalMenuItems: number;
    activeMenuItems: number;
    pendingCustomerOrders: number;
    acceptedOrders: number;
  };
  subscription: {
    plan: "free" | "premium";
    activeItemLimit: number | null;
    checkoutEnabled: boolean;
  };
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: VendorData };

const navigation: {
  label: string;
  href: string;
  view?: View;
  ready: boolean;
}[] = [
  {
    label: "Overview",
    href: "/dashboard/vendor",
    view: "overview",
    ready: true,
  },
  {
    label: "Add Menu Item",
    href: "/dashboard/vendor/menu/new",
    ready: true,
  },
  {
    label: "My Menu Items",
    href: "/dashboard/vendor/menu",
    ready: false,
  },
  {
    label: "Customer Orders",
    href: "/dashboard/vendor/orders",
    ready: false,
  },
  {
    label: "Subscription",
    href: "/dashboard/vendor/subscription",
    view: "subscription",
    ready: true,
  },
];

function Loading({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 px-4 py-16 text-stone-600"
    >
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-orange-200 border-t-red-700"
      />
      {message}
    </div>
  );
}

function VendorContent({ view }: { view: View }) {
  const [state, setState] = useState<LoadState>({
    status: "loading",
  });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    let active = true;
    let timedOut = false;

    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 20_000);

    async function loadOverview() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error("The API URL is not configured.");
        }

        const response = await fetch(
          `${apiUrl.replace(/\/$/, "")}/api/vendor/overview`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok || result?.success !== true) {
          throw new Error(
            result?.message || "Unable to load your vendor dashboard."
          );
        }

        const data = result.data;

        const counts = [
          data?.overview?.totalMenuItems,
          data?.overview?.activeMenuItems,
          data?.overview?.pendingCustomerOrders,
          data?.overview?.acceptedOrders,
        ];

        const plan = data?.subscription?.plan;
        const limit = data?.subscription?.activeItemLimit;

        if (
          !counts.every(
            (value) => Number.isSafeInteger(value) && value >= 0
          ) ||
          !["free", "premium"].includes(plan) ||
          !(
            limit === null ||
            (Number.isSafeInteger(limit) && limit >= 0)
          ) ||
          typeof data?.subscription?.checkoutEnabled !== "boolean"
        ) {
          throw new Error("The server returned invalid dashboard data.");
        }

        if (active) {
          setState({
            status: "success",
            data,
          });
        }
      } catch (error) {
        if (!active) return;

        setState({
          status: "error",
          message: timedOut
            ? "Loading took too long. Please try again."
            : error instanceof Error
              ? error.message
              : "Unable to load your vendor dashboard.",
        });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void loadOverview();

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  function refresh() {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }

  const data = state.status === "success" ? state.data : null;

  const cards = data
    ? [
        {
          label: "Total menu items",
          value: data.overview.totalMenuItems,
        },
        {
          label: "Active menu items",
          value: data.overview.activeMenuItems,
        },
        {
          label: "Pending customer orders",
          value: data.overview.pendingCustomerOrders,
        },
        {
          label: "Accepted orders",
          value: data.overview.acceptedOrders,
        },
      ]
    : [];

  const limit = data?.subscription.activeItemLimit;

  const remainingSlots =
    data && typeof limit === "number"
      ? Math.max(0, limit - data.overview.activeMenuItems)
      : null;

  return (
    <main className="min-h-screen bg-orange-50/40 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-red-700">
              PizzaHub for restaurants
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
              {view === "overview"
                ? "Vendor Dashboard"
                : "Subscription"}
            </h1>

            <p className="mt-3 text-stone-600">
              {view === "overview"
                ? "Your workspace for managing your restaurant menu and orders."
                : "View your current plan and compare its benefits."}
            </p>
          </div>

          <Link
            href="/menu"
            className="rounded-xl border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-orange-50"
          >
            Browse Menu
          </Link>
        </div>

        <nav
          aria-label="Vendor dashboard navigation"
          className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-orange-100 bg-white p-3"
        >
          {navigation.map((item) =>
            item.ready ? (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.view === view ? "page" : undefined}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  item.view === view
                    ? "bg-red-700 text-white"
                    : "text-stone-600 hover:bg-orange-50"
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.href}
                type="button"
                disabled
                className="cursor-not-allowed rounded-xl px-4 py-3 text-sm text-stone-400"
              >
                {item.label}
                <span className="ml-1 text-xs">(Coming soon)</span>
              </button>
            )
          )}
        </nav>

        {state.status === "loading" && (
          <Loading message="Loading your vendor dashboard..." />
        )}

        {state.status === "error" && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6">
            <p role="alert" className="text-red-700">
              {state.message}
            </p>

            <button
              type="button"
              onClick={refresh}
              className="mt-4 font-semibold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {data && (
          <>
            <div className="mt-8 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-stone-900">
                {view === "overview" ? "Overview" : "Current plan"}
              </h2>

              <button
                type="button"
                onClick={refresh}
                className="text-sm font-semibold text-red-700 underline"
              >
                Refresh
              </button>
            </div>

            {view === "overview" && (
              <section
                aria-label="Vendor statistics"
                className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {cards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                  >
                    <p className="text-sm text-stone-500">
                      {card.label}
                    </p>

                    <p className="mt-3 text-3xl font-bold text-stone-900">
                      {card.value}
                    </p>
                  </div>
                ))}
              </section>
            )}

            <section className="mt-5 rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-sm text-stone-500">
                    Current subscription plan
                  </p>

                  <h3 className="mt-2 text-2xl font-bold capitalize text-stone-900">
                    {data.subscription.plan}
                  </h3>

                  <p className="mt-3 text-sm text-stone-600">
                    {limit === null
                      ? `${data.overview.activeMenuItems} active items · Unlimited allowance`
                      : `${data.overview.activeMenuItems} of ${limit} active item slots used`}
                  </p>

                  {remainingSlots !== null && (
                    <p className="mt-1 text-sm text-stone-600">
                      {remainingSlots} active item slots remaining.
                    </p>
                  )}
                </div>

                {view === "overview" &&
                  data.subscription.plan === "free" && (
                    <Link
                      href="/dashboard/vendor/subscription"
                      className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800"
                    >
                      Upgrade to Premium
                    </Link>
                  )}
              </div>

              <p className="mt-5 text-sm leading-6 text-stone-500">
                Available items awaiting approval and approved available
                items count toward your active-item allowance. Only
                approved available items can appear to customers.
              </p>

              {typeof limit === "number" &&
                data.overview.activeMenuItems > limit && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
                  >
                    Your active item count exceeds your plan allowance.
                    Review item availability when menu management is available.
                  </p>
                )}
            </section>

            {view === "subscription" && (
              <section className="mt-8">
                <h2 className="text-xl font-bold text-stone-900">
                  Compare plans
                </h2>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-orange-100 bg-white">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <caption className="sr-only">
                      Free and Premium subscription benefits
                    </caption>

                    <thead className="bg-orange-50">
                      <tr>
                        <th scope="col" className="px-5 py-4">
                          Feature
                        </th>
                        <th scope="col" className="px-5 py-4">
                          Free
                        </th>
                        <th scope="col" className="px-5 py-4">
                          Premium
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-orange-100">
                      {[
                        ["Active menu items", "Up to 3", "Unlimited"],
                        ["Vendor dashboard", "Included", "Included"],
                        ["Order management", "Included", "Included"],
                        ["Premium vendor badge", "—", "Included"],
                        ["Featured menu placement", "—", "Included"],
                      ].map(([feature, free, premium]) => (
                        <tr key={feature}>
                          <th
                            scope="row"
                            className="px-5 py-4 font-medium text-stone-700"
                          >
                            {feature}
                          </th>
                          <td className="px-5 py-4 text-stone-600">
                            {free}
                          </td>
                          <td className="px-5 py-4 text-stone-600">
                            {premium}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-6">
                  <h3 className="font-bold text-stone-900">
                    Premium upgrades are not available yet
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Premium benefits shown above will become available
                    when subscription payments launch. Your account
                    remains on the Free plan.
                  </p>

                  <button
                    type="button"
                    disabled
                    className="mt-4 cursor-not-allowed rounded-xl bg-red-700 px-5 py-3 font-semibold text-white opacity-50"
                  >
                    Upgrade to Premium — Coming soon
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function VendorWorkspace({ view }: { view: View }) {
  const {
    data: session,
    isPending,
    error,
    refetch,
  } = authClient.useSession();

  if (isPending) {
    return <Loading message="Checking your account..." />;
  }

  if (error) {
    return (
      <div className="px-4 py-16 text-center">
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
      <div className="px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-stone-900">
          Sign in to your vendor account
        </h1>

        <Link
          href="/sign-in"
          className="mt-5 inline-block rounded-xl bg-red-700 px-5 py-3 font-semibold text-white"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (
    session.user.role !== "vendor" ||
    session.user.isBlocked === true ||
    session.user.roleSelectionPending === true
  ) {
    return (
      <div className="px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-stone-900">
          Vendor access required
        </h1>

        <p role="alert" className="mt-3 text-stone-600">
          This dashboard requires an active vendor account with
          completed role selection.
        </p>

        <Link
          href="/"
          className="mt-5 inline-block font-semibold text-red-700 underline"
        >
          Return home
        </Link>
      </div>
    );
  }

  return (
    <VendorContent
      key={`${session.user.id}:${view}`}
      view={view}
    />
  );
}