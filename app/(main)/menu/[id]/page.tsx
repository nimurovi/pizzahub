"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

 
import LoadingSpinner from "../../../../components/shared/LoadingSpinner";
import { MenuItem } from "@/types";
import RequireAuth from "@/components/auth/RequirAuth";
import OrderForm from "@/components/orders/OrderForm";
import { apiFetch } from "@/lib/api-fetch";
 

type DetailsState =
  | { status: "loading" }
  | { status: "success"; item: MenuItem }
  | { status: "error"; message: string };

function ItemPhoto({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative aspect-square overflow-hidden rounded-3xl bg-orange-100">
      {src && !failed ? (
        <Image
          src={src}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 50vw"
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-orange-800">
          <span aria-hidden="true" className="text-7xl">
            🍕
          </span>
          <p className="text-sm font-medium">No image available</p>
        </div>
      )}
    </div>
  );
}

function ItemDetails({ id }: { id: string }) {
  const router = useRouter();

  const [state, setState] = useState<DetailsState>({
    status: "loading",
  });
  const [attempt, setAttempt] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timedOut = false;

    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15_000);

    async function loadItem() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error("The API URL is not configured.");
        }

        const response = await apiFetch(
          `${apiUrl}/api/menu/${encodeURIComponent(id)}`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!active) return;

        if (response.status === 401) {
          toast.error("Please sign in to view this item.", {
            id: "item-details-auth",
          });

          router.replace("/sign-in");
          return;
        }

        const result = await response.json();

        if (!active) return;

        if (!response.ok || result.success !== true) {
          throw new Error(
            result.message || "Could not load this menu item."
          );
        }

        if (
          !result.data ||
          typeof result.data.itemName !== "string" ||
          typeof result.data.price !== "number" ||
          !Number.isFinite(result.data.price)
        ) {
          throw new Error("The server returned invalid item details.");
        }

        setState({
          status: "success",
          item: result.data,
        });
      } catch (error) {
        if (!active) return;

        const message = timedOut
          ? "Loading took too long. Please try again."
          : error instanceof Error
            ? error.message
            : "Could not load this menu item.";

        setState({ status: "error", message });

        toast.error(message, {
          id: "item-details-error",
        });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void loadItem();

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [id, attempt, router]);

  if (state.status === "loading") {
    return <LoadingSpinner message="Loading item details..." />;
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Unable to load this item
        </h1>

        <p role="alert" className="mt-3 text-gray-600">
          {state.message}
        </p>

        <div className="mt-6 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((previous) => previous + 1);
            }}
            className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>

          <Link
            href="/menu"
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  const { item } = state;

  const images = Array.isArray(item.images)
    ? item.images.filter(
        (image): image is string =>
          typeof image === "string" && image.length > 0
      )
    : [];

  const currentImage = images[selectedImage] ?? images[0];

  const formattedPrice = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(item.price);

  return (
    <main className="bg-orange-50/40 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/menu"
          className="inline-flex text-sm font-semibold text-red-700 hover:underline"
        >
          ← Back to menu
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <ItemPhoto
              key={currentImage ?? "placeholder"}
              src={currentImage}
              name={item.itemName}
            />

            {images.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    aria-pressed={selectedImage === index}
                    aria-label={`View photo ${index + 1}`}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                      selectedImage === index
                        ? "border-red-700 bg-red-700 text-white"
                        : "border-orange-200 bg-white text-gray-700"
                    }`}
                  >
                    Photo {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
            <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold capitalize text-orange-800">
              {item.category?.replaceAll("-", " ") || "Menu item"}
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {item.itemName}
            </h1>

            <p className="mt-4 text-3xl font-bold text-red-700">
              {formattedPrice}
            </p>

            <p className="mt-6 whitespace-pre-line leading-7 text-gray-600">
              {item.description || "No description provided."}
            </p>

            <dl className="mt-8 space-y-4 border-t border-gray-100 pt-6">
              <div>
                <dt className="text-sm text-gray-500">Vendor</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {item.vendorName || "Restaurant information unavailable"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Location</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {item.location || "Location not provided"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Availability</dt>
                <dd className="mt-1 font-semibold text-green-700">
                  Available
                </dd>
              </div>
                        </dl>

            <OrderForm
              key={item._id}
              itemId={item._id}
              vendorId={item.vendorId}
              price={item.price}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

function ProtectedDetails() {
  const { id } = useParams<{ id: string }>();

  return (
    <RequireAuth>
      <ItemDetails key={id} id={id} />
    </RequireAuth>
  );
}

export default function ItemDetailsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading item..." />}>
      <ProtectedDetails />
    </Suspense>
  );
}