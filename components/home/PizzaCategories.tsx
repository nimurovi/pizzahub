"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { categories } from "@/constants/categories";
 

export default function PizzaCategories() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="categories"
      aria-labelledby="categories-heading"
      className="bg-white py-16 text-stone-900 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section heading */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-red-700">
              Follow your cravings
            </p>

            <h2
              id="categories-heading"
              className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              What are you in the mood for?
            </h2>

            <p className="mt-4 text-base leading-7 text-stone-600">
              From classic slices to sweet endings, find something
              that hits the spot.
            </p>
          </div>

          <Link
            href="/menu"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-4 motion-reduce:transition-none"
          >
            Browse full menu
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Category cards */}
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <motion.li
              key={category.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: reduceMotion ? 0 : 0.35,
                delay: reduceMotion ? 0 : index * 0.05,
              }}
              className="h-full"
            >
              <Link
                href={{
                  pathname: "/menu",
                  query: { category: category.id },
                }}
                className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-[#fffdf9] p-6 transition-colors hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-4 motion-reduce:transition-none"
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    aria-hidden="true"
                    className={`flex size-16 items-center justify-center rounded-2xl text-3xl ${category.color}`}
                  >
                    {category.icon}
                  </span>

                  <span
                    aria-hidden="true"
                    className="flex size-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition-colors group-hover:border-red-700 group-hover:bg-red-700 group-hover:text-white motion-reduce:transition-none"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 17 17 7M7 7h10v10" />
                    </svg>
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-bold tracking-tight">
                  {category.name}
                </h3>

                <p className="mt-2 flex-1 text-sm leading-6 text-stone-600">
                  {category.description}
                </p>

                <span className="mt-6 text-xs font-semibold text-red-700">
                  Explore category
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}