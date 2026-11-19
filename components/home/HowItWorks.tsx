import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Explore the menu",
    description:
      "Browse the available items. Search by name and narrow your choices by category or location.",
  },
  {
    number: "02",
    title: "Place your order",
    description:
      "Sign in as a customer, choose an item, and enter your delivery date, address, and special instructions.",
  },
  {
    number: "03",
    title: "Check the response",
    description:
      "Visit My Orders to see whether the restaurant has accepted or rejected your request.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="bg-white py-16 text-stone-900 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-red-700">
            From browsing to ordering
          </p>

          <h2
            id="how-it-works-heading"
            className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            How PizzaHub works
          </h2>

          <p className="mt-4 text-base leading-7 text-stone-600">
            Find something delicious and send your order to the
            restaurant in a few simple steps.
          </p>
        </div>

        {/* Steps */}
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.number}
              className="relative rounded-2xl border border-stone-200 bg-[#fffdf9] p-7"
            >
              <span
                aria-hidden="true"
                className="text-5xl font-extrabold tracking-tight text-orange-200"
              >
                {step.number}
              </span>

              <h3 className="mt-6 text-xl font-bold">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-stone-600">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        {/* Call to action */}
        <div className="mt-10 text-center">
          <Link
            href="/menu"
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-red-700 px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-4 motion-reduce:transition-none"
          >
            Explore Pizza Menu
            <span aria-hidden="true">→</span>
          </Link>

          <p className="mt-4 text-xs leading-6 text-stone-500">
            Orders are subject to restaurant acceptance.
          </p>
        </div>
      </div>
    </section>
  );
}