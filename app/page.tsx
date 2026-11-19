import FeaturedMenu from "@/components/home/FeaturedMenu";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import PizzaCategories from "@/components/home/PizzaCategories";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import Image from "next/image";

export default function Home() {
  return (
    <main >
      <Hero />
      <FeaturedMenu />
      <PizzaCategories />
      <WhyChooseUs />
      <HowItWorks />
    </main>
  );
}
