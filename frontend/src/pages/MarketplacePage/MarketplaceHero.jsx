import { useTheme } from "../../context/ThemeContext";
import { ShoppingBag, Zap, Shield, Truck } from "lucide-react";

export default function MarketplaceHero() {
  const { darkMode } = useTheme();

  return (
    <div
      className={`relative ${
        darkMode
          ? "bg-gradient-to-br from-gray-800 to-gray-900"
          : "bg-gradient-to-br from-blue-50 to-indigo-100"
      } py-16`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1
            className={`text-4xl md:text-6xl font-bold mb-4 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Fitness{" "}
            <span className={`${darkMode ? "text-blue-400" : "text-blue-600"}`}>
              Marketplace
            </span>
          </h1>
          <p
            className={`text-xl md:text-2xl mb-8 ${
              darkMode ? "text-gray-300" : "text-gray-600"
            } max-w-3xl mx-auto`}
          >
            Discover premium fitness equipment to enhance your workout
            experience. Quality gear for every fitness journey.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Zap
                className={`w-5 h-5 ${
                  darkMode ? "text-green-400" : "text-green-600"
                }`}
              />
              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                Fast Delivery
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield
                className={`w-5 h-5 ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              />
              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                Quality Guaranteed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Truck
                className={`w-5 h-5 ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`}
              />
              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                Free Shipping
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${
              darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"
            } shadow-lg`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-medium">
              Browse our collection of premium fitness equipment
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
