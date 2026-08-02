import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import HeroSearch from "./components/home/HeroSearch";
import PopularDestinations from "./components/home/PopularDestinations";
import Features from "./components/Features";
import TravelDealsCarousel from "./components/raveldealscarousel";
import TravelToolsSection from "./components/TravelToolsSection";
import FAQSection from "./components/FAQSection";
import TravelPromoSection from "./components/TravelPromoSection";
import RouteMap from "./components/RouteMap";
export default function HomePage() {
  return (
    <>
      <Navbar />

      <HeroSearch />

      <TravelDealsCarousel />
      <TravelToolsSection />
      {/* <PopularDestinations /> */}

      {/* <Features /> */}

      <TravelPromoSection/>
      <RouteMap />
<FAQSection/>
      <Footer />
    </>
  );
}