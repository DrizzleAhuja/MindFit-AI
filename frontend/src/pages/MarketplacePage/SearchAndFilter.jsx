import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function SearchAndFilter() {
  const { darkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);

  const brands = [
    "FitPro",
    "StrengthMax",
    "CardioElite",
    "FlexFit",
    "PowerGym",
  ];
  const ratings = [4, 3, 2, 1];

  const handleBrandToggle = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPriceRange([0, 2000]);
    setSelectedBrands([]);
    setSelectedRating(0);
  };

  return (
    <div
      className={`${
        darkMode ? "bg-gray-800" : "bg-white"
      } rounded-lg shadow-md p-6 mb-6`}
    >
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search
            className={`w-5 h-5 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        </div>
        <input
          type="text"
          placeholder="Search fitness equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
            darkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        />
      </div>

      {/* Filters Toggle */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            darkMode
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>

        {(searchTerm ||
          selectedBrands.length > 0 ||
          selectedRating > 0 ||
          priceRange[0] > 0 ||
          priceRange[1] < 2000) && (
          <button
            onClick={clearFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              darkMode
                ? "text-red-400 hover:bg-red-900 hover:bg-opacity-20"
                : "text-red-600 hover:bg-red-50"
            }`}
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div
          className={`grid md:grid-cols-3 gap-6 pt-4 border-t ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          {/* Price Range */}
          <div>
            <h4
              className={`font-medium mb-3 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Price Range
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  $
                </span>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([
                      parseInt(e.target.value) || 0,
                      priceRange[1],
                    ])
                  }
                  className={`flex-1 px-3 py-2 rounded border text-sm ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                <span
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  to
                </span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([
                      priceRange[0],
                      parseInt(e.target.value) || 2000,
                    ])
                  }
                  className={`flex-1 px-3 py-2 rounded border text-sm ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              <div
                className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                ${priceRange[0]} - ${priceRange[1]}
              </div>
            </div>
          </div>

          {/* Brands */}
          <div>
            <h4
              className={`font-medium mb-3 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Brands
            </h4>
            <div className="space-y-2">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleBrandToggle(brand)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={`ml-2 text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h4
              className={`font-medium mb-3 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Minimum Rating
            </h4>
            <div className="space-y-2">
              {ratings.map((rating) => (
                <label key={rating} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    checked={selectedRating === rating}
                    onChange={() => setSelectedRating(rating)}
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={`ml-2 text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {rating}+ Stars
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {(searchTerm || selectedBrands.length > 0 || selectedRating > 0) && (
        <div
          className={`mt-4 pt-4 border-t ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  darkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                "{searchTerm}"
              </span>
            )}
            {selectedBrands.map((brand) => (
              <span
                key={brand}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  darkMode
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {brand}
              </span>
            ))}
            {selectedRating > 0 && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  darkMode
                    ? "bg-yellow-600 text-white"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {selectedRating}+ Stars
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
