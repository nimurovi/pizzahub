"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

const highlights = [
  {
    number: "01",
    title: "Discover",
    description: "Explore menus from local restaurants.",
  },
  {
    number: "02",
    title: "Choose",
    description: "Find a pizza for every craving.",
  },
  {
    number: "03",
    title: "Order",
    description: "Choose your delivery date and address.",
  },
];

export default function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-[#fffaf3] text-stone-900"
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-0 -z-10 size-[600px] rounded-full bg-orange-100/60 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-5 pb-12 pt-10 sm:pt-16 lg:px-8 lg:pb-16 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Heading and call to action */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-800">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-orange-500"
              />
              Your next pizza night starts here
            </span>

            <h1
              id="hero-heading"
              className="mt-6 max-w-xl text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl xl:text-7xl"
            >
              Big cravings.
              <br />
              <span className="text-red-700">Better pizza.</span>
              <br />
              At your door.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-stone-600 sm:text-lg">
              Discover your next favorite slice from local pizza shops.
              Explore the menu, pick what you love, and make your next
              meal something to look forward to.
            </p>

            <Link
              href="/menu"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-red-700 px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-4 motion-reduce:transition-none"
            >
              Explore Pizza Menu

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>

            <p className="mt-4 text-sm text-stone-500">
              Browse freely. Sign in when you find your favorite.
            </p>
          </motion.div>

          {/* Pizza image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 0.6,
              delay: reduceMotion ? 0 : 0.1,
            }}
            className="relative mx-auto w-full max-w-xl"
          >
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-orange-100 bg-orange-50 shadow-xl shadow-orange-950/10">
              <Image
                src="/images/hero-pizza.png"
                alt="Golden-crust pizza topped with mozzarella, tomatoes, and fresh basil"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="absolute -bottom-5 left-4 right-4 flex items-center gap-4 rounded-2xl border border-orange-100 bg-white p-4 shadow-lg sm:left-6 sm:right-auto sm:max-w-xs sm:p-5">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-2xl"
              >
                🍕
              </span>

              <div>
                <p className="text-sm font-bold text-stone-900">
                  A slice for every craving
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  Classic favorites to something a little different.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Introductory highlights */}
        <div className="mt-20 grid gap-6 border-t border-orange-200/70 pt-8 sm:grid-cols-3 lg:mt-24">
          {highlights.map((item) => (
            <div key={item.number} className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-red-800"
              >
                {item.number}
              </span>

              <div>
                <h2 className="text-sm font-bold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}