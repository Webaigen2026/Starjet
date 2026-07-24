import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import HeroSearch from "./components/home/HeroSearch";
import PopularDestinations from "./components/home/PopularDestinations";
import Features from "./components/Features";
export default function HomePage() {
  return (
    <>
      <Navbar />

      <HeroSearch />

      <PopularDestinations />

      <Features />

      <Footer />
    </>
  );
}