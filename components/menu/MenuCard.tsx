"use client";

import { RatingSummary } from "@/components/reviews/Reviews";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { categories } from "../../constants/categories";
import { MenuItem } from "@/types";
 

type MenuCardProps = {
  item: MenuItem;
};

const priceFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 2,
});

export default function MenuCard({ item }: MenuCardProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);

  const category = categories.find(
    (category) => category.id === item.category
  );

  const imageUrl = item.images[0];

  const hasImage =
    Boolean(imageUrl) &&
    imageUrl !== failedImage &&
    imageUrl.startsWith("https://");

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition-shadow hover:shadow-lg motion-reduce:transition-none">
      {/* Image or placeholder */}
      <div className="relative aspect-[4/3] bg-orange-50">
        {hasImage ? (
          <Image
            src={imageUrl}
            alt={item.itemName}
            fill
            unoptimized
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover"
            onError={() => setFailedImage(imageUrl)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <span aria-hidden="true" className="text-6xl">
              {category?.icon || "🍽️"}
            </span>
            <span className="text-xs font-medium text-stone-500">
              Image coming soon
            </span>
          </div>
        )}

        <span className="absolute bottom-3 left-3 right-3 w-fit max-w-[calc(100%-1.5rem)] rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-red-800 shadow-sm">
          {category?.name || item.category}
        </span>
      </div>

      {/* Item information */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-6 text-stone-900">
            {item.itemName}
          </h3>

          <span className="shrink-0 text-base font-bold text-red-700">
            {priceFormatter.format(item.price)}
          </span>
        </div>

        <RatingSummary average={item.averageRating} count={item.reviewCount} />

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">
          {item.description}
        </p>

        <div className="mt-5 space-y-2 border-t border-orange-100 pt-4">
          <p className="text-sm font-semibold text-stone-800">
            {item.vendorName || "Restaurant information pending"}
          </p>

          <RatingSummary average={item.restaurantAverageRating} count={item.restaurantReviewCount} />
          <p className="flex items-start gap-2 text-sm text-stone-500">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            >
              <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>

            {item.location}
          </p>
        </div>

        <div className="mt-auto pt-6">
          <Link
            href={`/menu/${encodeURIComponent(item._id)}`}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-4 motion-reduce:transition-none"
          >
            View Details
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}