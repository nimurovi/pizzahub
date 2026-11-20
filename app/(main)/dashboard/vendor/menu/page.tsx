"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

type MenuStatus = "pending" | "approved" | "rejected";

type VendorMenuItem = {
  _id: string;
  itemName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: MenuStatus;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

type MenuData = {
  items: VendorMenuItem[];
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
  | { status: "success"; data: MenuData };

const categories = [
  { value: "classic-pizzas", label: "Classic Pizzas" },
  { value: "vegetarian-pizzas", label: "Vegetarian Pizzas" },
  { value: "meat-lovers", label: "Meat Lovers" },
  {
    value: "specialty-gourmet-pizzas",
    label: "Specialty / Gourmet Pizzas",
  },
  { value: "sides-appetizers", label: "Sides / Appetizers" },
  { value: "beverages-desserts", label: "Beverages / Desserts" },
];

const fieldClass =
  "mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3";

const buttonClass =
  "rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL;

  if (!base) {
    throw new Error("The API URL is not configured.");
  }

  return `${base.replace(/\/$/, "")}${path}`;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
  }).format(price);
}

function formatDate(value: string) {
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

function ItemImage({ item }: { item: VendorMenuItem }) {
  const [failed, setFailed] = useState(false);
  const src = item.images?.[0];

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-orange-100">
      {src && !failed ? (
        <Image
          src={src}
          alt={item.itemName}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-orange-800">
          No image available
        </div>
      )}
    </div>
  );
}

function EditItemForm({
  item,
  busy,
  onCancel,
  onSave,
}: {
  item: VendorMenuItem;
  busy: boolean;
  onCancel: () => void;
  onSave: (data: FormData) => Promise<void>;
}) {
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    setError("");

    const data = new FormData(event.currentTarget);

    for (const key of [
      "itemName",
      "category",
      "description",
      "price",
      "location",
    ]) {
      const value = data.get(key);

      if (typeof value === "string") {
        data.set(key, value.trim());
      }
    }

    const itemName = String(data.get("itemName") ?? "");
    const category = String(data.get("category") ?? "");
    const description = String(data.get("description") ?? "");
    const location = String(data.get("location") ?? "");
    const priceText = String(data.get("price") ?? "");
    const price = Number(priceText);

    if (itemName.length < 2 || itemName.length > 100) {
      setError("Item name must contain 2–100 characters.");
      return;
    }

    if (!categories.some((entry) => entry.value === category)) {
      setError("Choose a valid category.");
      return;
    }

    if (description.length < 10 || description.length > 2000) {
      setError("Description must contain 10–2000 characters.");
      return;
    }

    if (location.length < 2 || location.length > 150) {
      setError("Location must contain 2–150 characters.");
      return;
    }

    if (
      !/^\d+(?:\.\d{1,2})?$/.test(priceText) ||
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 1_000_000
    ) {
      setError(
        "Enter a price between 0.01 and 1,000,000 with up to two decimal places."
      );
      return;
    }

    const image = data.get("image");

    if (image instanceof File && image.size > 0) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(image.type)
      ) {
        setError("Choose a JPEG, PNG, or WebP image.");
        return;
      }

      if (image.size > 2 * 1024 * 1024) {
        setError("The image must be 2 MB or smaller.");
        return;
      }
    } else {
      data.delete("image");
    }

    await onSave(data);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 border-t pt-6">
      <h3 className="text-lg font-bold text-stone-900">
        Edit item
      </h3>

      <p className="mt-2 text-sm text-amber-800">
        Saving submits this item for admin approval again. It will be
        hidden from customers until approved.
      </p>

      <fieldset disabled={busy} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor={`name-${item._id}`}
            className="font-medium"
          >
            Item name
          </label>

          <input
            id={`name-${item._id}`}
            name="itemName"
            defaultValue={item.itemName}
            minLength={2}
            maxLength={100}
            required
            className={fieldClass}
          />
        </div>

        <div>
          <label
            htmlFor={`category-${item._id}`}
            className="font-medium"
          >
            Category
          </label>

          <select
            id={`category-${item._id}`}
            name="category"
            defaultValue={item.category}
            required
            className={fieldClass}
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`description-${item._id}`}
            className="font-medium"
          >
            Description
          </label>

          <textarea
            id={`description-${item._id}`}
            name="description"
            defaultValue={item.description}
            minLength={10}
            maxLength={2000}
            rows={4}
            required
            className={fieldClass}
          />
        </div>

        <div>
          <label
            htmlFor={`price-${item._id}`}
            className="font-medium"
          >
            Price (BDT)
          </label>

          <input
            id={`price-${item._id}`}
            name="price"
            type="number"
            defaultValue={item.price}
            min="0.01"
            max="1000000"
            step="0.01"
            required
            className={fieldClass}
          />
        </div>

        <div>
          <label
            htmlFor={`location-${item._id}`}
            className="font-medium"
          >
            Location
          </label>

          <input
            id={`location-${item._id}`}
            name="location"
            defaultValue={item.location}
            minLength={2}
            maxLength={150}
            required
            className={fieldClass}
          />
        </div>

        <div>
          <label
            htmlFor={`image-${item._id}`}
            className="font-medium"
          >
            Replacement image (optional)
          </label>

          <input
            id={`image-${item._id}`}
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={fieldClass}
          />

          <p className="mt-2 text-sm text-stone-500">
            JPEG, PNG, or WebP. Maximum 2 MB. Leave empty to keep the
            current image.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy && <Spinner />}

            {busy ? "Saving..." : "Save and Submit for Approval"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className={buttonClass}
          >
            Cancel editing
          </button>
        </div>
      </fieldset>
    </form>
  );
}

function VendorMenuList() {
  const [state, setState] = useState<LoadState>({
    status: "loading",
  });

  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const actionLock = useRef(false);

  function refreshItems() {
    setActionError("");
    setState({ status: "loading" });
    setReload((value) => value + 1);
  }

  function changePage(nextPage: number) {
    if (nextPage === page) return;

    setEditingId(null);
    setExpandedId(null);
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

    async function load() {
      try {
        const response = await fetch(
          apiUrl(`/api/vendor/menu?page=${page}`),
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok || result.success !== true) {
          throw new Error(
            result.message || "Could not load menu items."
          );
        }

        if (
          !Array.isArray(result.data?.items) ||
          !Number.isInteger(result.data?.pagination?.totalPages) ||
          result.data.pagination.totalPages < 1 ||
          !Number.isInteger(result.data?.pagination?.total) ||
          result.data.pagination.total < 0
        ) {
          throw new Error("The server returned invalid menu data.");
        }

        if (!active) return;

        // Deleting the last item on a page can reduce the page count.
        // Loading state remains active while the valid page is fetched.
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
              : "Could not load menu items.",
        });
      } finally {
        window.clearTimeout(timer);
      }
    }

    void load();

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, reload]);

  async function mutateItem(
    item: VendorMenuItem,
    action: "edit" | "availability" | "delete",
    data?: FormData
  ) {
    if (actionLock.current) return;

    if (
      action === "delete" &&
      !window.confirm(
        `Delete "${item.itemName}"? This cannot be undone. Existing orders will remain.`
      )
    ) {
      return;
    }

    actionLock.current = true;
    setBusyId(item._id);
    setActionError("");

    const toastId = toast.loading(
      action === "delete"
        ? "Deleting item..."
        : action === "edit"
          ? "Saving item..."
          : "Updating availability..."
    );

    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      controller.abort();
    }, 60_000);

    try {
      const path =
        `/api/vendor/menu/${encodeURIComponent(item._id)}` +
        (action === "availability" ? "/availability" : "");

      const response = await fetch(apiUrl(path), {
        method: action === "delete" ? "DELETE" : "PATCH",
        credentials: "include",
        signal: controller.signal,
        ...(action === "availability"
          ? {
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                isAvailable: !item.isAvailable,
              }),
            }
          : action === "edit"
            ? { body: data }
            : {}),
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || "Could not update this item."
        );
      }

      toast.success(result.message || "Menu updated.", {
        id: toastId,
      });

      setEditingId(null);
      setExpandedId(null);
      refreshItems();
    } catch (error) {
      const uncertain =
        controller.signal.aborted || error instanceof TypeError;

      const message = uncertain
        ? "The result could not be confirmed. Refresh the list before trying again."
        : error instanceof Error
          ? error.message
          : "Could not update this item.";

      setActionError(message);

      toast.error(message, {
        id: toastId,
      });
    } finally {
      window.clearTimeout(timer);
      actionLock.current = false;
      setBusyId(null);
    }
  }

  const busy = busyId !== null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <nav
        aria-label="Vendor menu navigation"
        className="flex flex-wrap gap-4 text-sm font-semibold text-red-700"
      >
        <Link href="/dashboard/vendor">
          ← Vendor Dashboard
        </Link>

        <Link href="/dashboard/vendor/menu/new">
          Add Menu Item
        </Link>

        <Link href="/dashboard/vendor/subscription">
          Subscription
        </Link>
      </nav>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">
            My Menu Items
          </h1>

          <p className="mt-2 text-stone-600">
            Manage your items, approval status, and availability.
          </p>
        </div>

        <button
          type="button"
          disabled={busy || state.status === "loading"}
          onClick={refreshItems}
          className={buttonClass}
        >
          Refresh
        </button>
      </div>

      <p className="mt-5 rounded-xl bg-orange-50 p-4 text-sm text-orange-900">
        Free plan: 3 active items. Available pending and approved items
        use a slot. Only approved, available items appear to customers.
      </p>

      {actionError && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-red-700"
        >
          {actionError}
        </p>
      )}

      {state.status === "loading" && (
        <p
          role="status"
          className="mt-10 flex items-center gap-2"
        >
          <Spinner />
          Loading your menu items...
        </p>
      )}

      {state.status === "error" && (
        <div className="mt-8 rounded-2xl border border-red-200 p-6">
          <p role="alert" className="text-red-700">
            {state.message}
          </p>

          <button
            type="button"
            onClick={refreshItems}
            className={`${buttonClass} mt-4`}
          >
            Try again
          </button>
        </div>
      )}

      {state.status === "success" && (
        <>
          <p className="mt-6 text-sm text-stone-600">
            {state.data.pagination.total} menu item(s)
          </p>

          {state.data.items.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed p-10 text-center">
              <h2 className="text-xl font-bold">
                No menu items yet
              </h2>

              <Link
                href="/dashboard/vendor/menu/new"
                className="mt-5 inline-flex rounded-xl bg-red-700 px-5 py-3 font-semibold text-white"
              >
                Add Your First Item
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {state.data.items.map((item) => (
                <article
                  key={item._id}
                  className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="grid gap-6 md:grid-cols-[240px_1fr]">
                    <ItemImage
                      key={`${item._id}-${item.images?.[0] ?? ""}`}
                      item={item}
                    />

                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            item.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : item.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.status}
                        </span>

                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                          {item.isAvailable
                            ? "Available"
                            : "Unavailable"}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-bold text-stone-900">
                        {item.itemName}
                      </h2>

                      <p className="mt-2 font-bold text-red-700">
                        {formatPrice(item.price)}
                      </p>

                      <p className="mt-2 text-sm text-stone-600">
                        {item.location}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          aria-expanded={expandedId === item._id}
                          onClick={() =>
                            setExpandedId((current) =>
                              current === item._id
                                ? null
                                : item._id
                            )
                          }
                          className={buttonClass}
                        >
                          {expandedId === item._id
                            ? "Hide details"
                            : "View details"}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          aria-expanded={editingId === item._id}
                          onClick={() =>
                            setEditingId((current) =>
                              current === item._id
                                ? null
                                : item._id
                            )
                          }
                          className={buttonClass}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void mutateItem(item, "availability")
                          }
                          className={buttonClass}
                        >
                          {item.isAvailable
                            ? "Make unavailable"
                            : "Make available"}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void mutateItem(item, "delete")
                          }
                          className={`${buttonClass} text-red-700`}
                        >
                          Delete
                        </button>
                      </div>

                      {busyId === item._id && (
                        <p
                          role="status"
                          className="mt-3 flex items-center gap-2 text-sm"
                        >
                          <Spinner />
                          Updating item...
                        </p>
                      )}
                    </div>
                  </div>

                  {expandedId === item._id && (
                    <div className="mt-6 space-y-3 border-t pt-5 text-sm text-stone-700">
                      <p>
                        <strong>Category:</strong>{" "}
                        {categories.find(
                          (category) =>
                            category.value === item.category
                        )?.label ?? item.category}
                      </p>

                      <p className="whitespace-pre-line">
                        <strong>Description:</strong>{" "}
                        {item.description}
                      </p>

                      <p>
                        <strong>Created:</strong>{" "}
                        {formatDate(item.createdAt)}
                      </p>

                      <p>
                        <strong>Last updated:</strong>{" "}
                        {formatDate(item.updatedAt)}
                      </p>

                      {item.status === "rejected" && (
                        <p className="text-red-700">
                          This item is hidden from customers. Edit and
                          save it to submit it for review again.
                        </p>
                      )}

                      {item.status === "pending" && (
                        <p className="text-amber-800">
                          Waiting for admin approval. Customers cannot
                          see this item yet.
                        </p>
                      )}
                    </div>
                  )}

                  {editingId === item._id && (
                    <EditItemForm
                      key={`${item._id}-${item.updatedAt}`}
                      item={item}
                      busy={busy}
                      onCancel={() => setEditingId(null)}
                      onSave={(data) =>
                        mutateItem(item, "edit", data)
                      }
                    />
                  )}
                </article>
              ))}
            </div>
          )}

          {state.data.pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={busy || page <= 1}
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
                  busy ||
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

export default function MyMenuItemsPage() {
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
        <p role="alert">
          Unable to check your account.
        </p>

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
        <p>Please sign in to manage your menu.</p>

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
      <p
        role="alert"
        className="p-10 text-center text-red-700"
      >
        A completed, active vendor account is required to manage menu
        items.
      </p>
    );
  }

  return <VendorMenuList key={user.id} />;
}