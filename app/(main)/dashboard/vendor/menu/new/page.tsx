"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

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

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 " +
  "outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100";

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

function AddMenuForm() {
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdItem, setCreatedItem] = useState<{
    _id: string;
    itemName: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current || createdItem) return;

    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("image");

    function fail(message: string) {
      setError(message);
      toast.error(message);
    }

    for (const name of [
      "itemName",
      "category",
      "description",
      "price",
      "location",
    ]) {
      const value = formData.get(name);

      if (typeof value === "string") {
        formData.set(name, value.trim());
      }
    }

    const itemName = String(formData.get("itemName") ?? "");
    const description = String(formData.get("description") ?? "");
    const location = String(formData.get("location") ?? "");
    const category = String(formData.get("category") ?? "");
    const priceText = String(formData.get("price") ?? "");

    if (itemName.length < 2 || itemName.length > 100) {
      fail("Item name must contain 2–100 characters.");
      return;
    }

    if (!categories.some((entry) => entry.value === category)) {
      fail("Choose a valid category.");
      return;
    }

    if (description.length < 10 || description.length > 2000) {
      fail("Description must contain 10–2000 characters.");
      return;
    }

    if (location.length < 2 || location.length > 150) {
      fail("Location must contain 2–150 characters.");
      return;
    }

    const price = Number(priceText);

    if (
      !/^\d+(?:\.\d{1,2})?$/.test(priceText) ||
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 1_000_000
    ) {
      fail("Enter a price from ৳0.01 to ৳1,000,000.");
      return;
    }

    if (!(file instanceof File) || file.size === 0) {
      fail("Please select a menu item image.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      fail("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      fail("The image must be 2 MB or smaller.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      fail("The API URL is not configured.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    const toastId = toast.loading("Uploading and submitting your item...");

    try {
      const response = await fetch(
        `${apiUrl.replace(/\/$/, "")}/api/vendor/menu`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
          signal: AbortSignal.timeout(60_000),
        }
      );

      // Do not set Content-Type manually for FormData.
      // The browser supplies its multipart boundary.
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success !== true) {
        throw new Error(
          result?.message || "Unable to confirm item submission."
        );
      }

      if (
        typeof result.data?._id !== "string" ||
        typeof result.data?.itemName !== "string"
      ) {
        throw new Error(
          "The response could not be read. Your item may have been saved. Check your dashboard before submitting again."
        );
      }

      setCreatedItem({
        _id: result.data._id,
        itemName: result.data.itemName,
      });

      toast.success("Item submitted for admin approval.", {
        id: toastId,
      });
    } catch (error) {
      const uncertain =
        error instanceof Error &&
        ["TimeoutError", "AbortError", "TypeError"].includes(error.name);

      const message = uncertain
        ? "Submission could not be confirmed. Your item may have been saved. Check your dashboard before submitting again."
        : error instanceof Error
          ? error.message
          : "Unable to submit your item.";

      setError(message);
      toast.error(message, { id: toastId, duration: 8000 });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (createdItem) {
    return (
      <section
        role="status"
        className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6"
      >
        <h2 className="text-xl font-bold text-green-900">
          Item submitted successfully
        </h2>

        <p className="mt-3 text-green-800">
          {createdItem.itemName} is pending admin approval.
          It will not appear to customers until approved.
        </p>

        <p className="mt-3 break-all text-sm text-green-800">
          Item ID: {createdItem._id}
        </p>

        <Link
          href="/dashboard/vendor"
          className="mt-5 inline-block rounded-xl bg-green-800 px-5 py-3 font-semibold text-white"
        >
          Back to dashboard
        </Link>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <fieldset disabled={submitting} className="space-y-5">
        <div>
          <label
            htmlFor="itemName"
            className="mb-2 block text-sm font-semibold text-stone-700"
          >
            Item Name
          </label>

          <input
            id="itemName"
            name="itemName"
            required
            minLength={2}
            maxLength={100}
            placeholder="Example: BBQ Chicken Pizza"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-semibold text-stone-700"
          >
            Category
          </label>

          <select
            id="category"
            name="category"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Select a category
            </option>

            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-stone-700"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            required
            rows={5}
            minLength={10}
            maxLength={2000}
            placeholder="Describe the item, ingredients, and serving size."
            className={inputClass}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="price"
              className="mb-2 block text-sm font-semibold text-stone-700"
            >
              Price (BDT)
            </label>

            <input
              id="price"
              name="price"
              type="number"
              inputMode="decimal"
              required
              min="0.01"
              max="1000000"
              step="0.01"
              placeholder="599.00"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-semibold text-stone-700"
            >
              Location / Area / City
            </label>

            <input
              id="location"
              name="location"
              required
              minLength={2}
              maxLength={150}
              placeholder="Dhanmondi, Dhaka"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="image"
            className="mb-2 block text-sm font-semibold text-stone-700"
          >
            Item Image
          </label>

          <input
            id="image"
            name="image"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp"
            aria-describedby="image-help"
            className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-orange-100 file:px-4 file:py-2 file:font-semibold file:text-red-800`}
          />

          <p id="image-help" className="mt-2 text-xs text-stone-500">
            Select one JPG, PNG, or WebP file, up to 2 MB.
          </p>
        </div>

        <div className="rounded-xl bg-orange-50 p-4 text-sm leading-6 text-stone-700">
          New items require admin approval. The Free plan allows up to
          3 active items, including available items awaiting approval.
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Spinner />}

          {submitting
            ? "Submitting..."
            : "Submit for Approval"}
        </button>
      </fieldset>
    </form>
  );
}

export default function AddMenuItemPage() {
  const {
    data: session,
    isPending,
    error,
    refetch,
  } = authClient.useSession();

  if (isPending) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-3 py-16 text-stone-600"
      >
        <Spinner />
        Checking your account...
      </div>
    );
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

  const user = session?.user;

  if (!user) {
    return (
      <div className="px-4 py-16 text-center">
        <Link
          href="/sign-in"
          className="font-semibold text-red-700 underline"
        >
          Sign in to add a menu item
        </Link>
      </div>
    );
  }

  if (
    user.role !== "vendor" ||
    user.isBlocked === true ||
    user.roleSelectionPending === true
  ) {
    return (
      <div className="px-4 py-16 text-center">
        <p role="alert" className="text-red-700">
          An active vendor account with completed role selection is required.
        </p>

        <Link
          href="/"
          className="mt-4 inline-block font-semibold text-red-700 underline"
        >
          Return home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-orange-50/40 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/vendor"
          className="font-semibold text-red-700 hover:underline"
        >
          ← Vendor Dashboard
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-stone-900">
          Add Menu Item
        </h1>

        <p className="mt-3 text-stone-600">
          Add your item details and upload a photo for admin review.
        </p>

        <AddMenuForm key={user.id} />
      </div>
    </main>
  );
}