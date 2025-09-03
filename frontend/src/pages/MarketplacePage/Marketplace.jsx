import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import MarketplaceHero from "./MarketplaceHero";
import ProductGrid from "./ProductGrid";
import CategoryFilter from "./CategoryFilter";
import SearchAndFilter from "./SearchAndFilter";
import { useTheme } from "../../context/ThemeContext";

export default function Marketplace() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <NavBar />
      <div className="pt-8">
        <MarketplaceHero />
        <div className="container mx-auto px-4 py-8">
          <SearchAndFilter />
          <CategoryFilter />
          <ProductGrid />
        </div>
      </div>
      <Footer />
    </div>
  );
}
