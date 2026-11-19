const benefits = [
  {
    number: "01",
    title: "Local flavors, more choice",
    description:
      "Explore menus from different restaurants and discover a new favorite close to home.",
  },
  {
    number: "02",
    title: "Find your kind of pizza",
    description:
      "Browse classic favorites, veggie combinations, hearty toppings, sides, and desserts.",
  },
  {
    number: "03",
    title: "Plan your next meal",
    description:
      "Choose a delivery date, enter your address, and share special instructions with the restaurant.",
  },
  {
    number: "04",
    title: "Keep orders in one place",
    description:
      "Check your order status from your dashboard and cancel an order while it is still pending.",
  },
];

export default function WhyChooseUs() {
  return (
    <section
      aria-labelledby="why-choose-heading"
      className="bg-[#fffaf3] py-16 text-stone-900 sm:py-20"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-3 lg:gap-14 lg:px-8">
        {/* Section introduction */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-700">
            More than a menu
          </p>

          <h2
            id="why-choose-heading"
            className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            Why choose
            <br />
            <span className="text-red-700">PizzaHub?</span>
          </h2>

          <p className="mt-5 text-base leading-8 text-stone-600">
            Your next pizza night should start with good choices.
            We bring restaurant menus and order management together
            in one convenient place.
          </p>

          <div className="mt-7 rounded-2xl border border-orange-200 bg-orange-100/50 p-5">
            <p className="text-sm font-semibold text-red-900">
              Your cravings. Your choice.
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              A familiar favorite or something new—make it your
              kind of meal.
            </p>
          </div>
        </div>

        {/* Benefit cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
          {benefits.map((benefit) => (
            <article
              key={benefit.number}
              className="rounded-2xl border border-orange-100 bg-white p-6 sm:p-7"
            >
              <span
                aria-hidden="true"
                className="inline-flex size-11 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-red-800"
              >
                {benefit.number}
              </span>

              <h3 className="mt-5 text-lg font-bold">
                {benefit.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-stone-600">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}