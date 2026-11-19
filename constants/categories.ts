export const categories = [
  {
    id: "classic-pizzas",
    name: "Classic Pizzas",
    description: "The timeless flavors you always come back to.",
    icon: "🍕",
    color: "bg-orange-100",
  },
  {
    id: "vegetarian-pizzas",
    name: "Vegetarian Pizzas",
    description: "Colorful vegetables and plenty of cheesy goodness.",
    icon: "🥬",
    color: "bg-green-100",
  },
  {
    id: "meat-lovers",
    name: "Meat Lovers",
    description: "Hearty toppings for a seriously satisfying slice.",
    icon: "🥩",
    color: "bg-red-100",
  },
  {
    id: "specialty-gourmet-pizzas",
    name: "Specialty / Gourmet Pizzas",
    description: "Creative combinations for your next favorite.",
    icon: "🧀",
    color: "bg-amber-100",
  },
  {
    id: "sides-appetizers",
    name: "Sides & Appetizers",
    description: "A little something extra to complete your meal.",
    icon: "🍟",
    color: "bg-yellow-100",
  },
  {
    id: "beverages-desserts",
    name: "Beverages & Desserts",
    description: "Refreshing sips and sweet finishing touches.",
    icon: "🍨",
    color: "bg-pink-100",
  },
] as const;

export type CategoryId = (typeof categories)[number]["id"];