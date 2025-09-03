import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Filter, Grid, List } from "lucide-react";

export default function CategoryFilter() {
  const { darkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");

  const categories = [
    "All",
    "Cardio Equipment",
    "Strength Training",
    "Free Weights",
    "Yoga & Flexibility",
    "Accessories",
    "Home Gym Sets",
    "Resistance Training",
  ];

  const sortOptions = [
    { value: "name", label: "Name (A-Z)" },
    { value: "price-low", label: "Price (Low to High)" },
    { value: "price-high", label: "Price (High to Low)" },
    { value: "rating", label: "Customer Rating" },
    { value: "popular", label: "Most Popular" },
  ];

  return (
    <div
      className={`${
        darkMode ? "bg-gray-800" : "bg-white"
      } rounded-lg shadow-md p-6 mb-8`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Categories */}
        <div className="flex-1">
          <h3
            className={`text-lg font-semibold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            } flex items-center gap-2`}
          >
            <Filter className="w-5 h-5" />
            Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? darkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-600 text-white"
                    : darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Sort and View Options */}
        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <div className="flex flex-col">
            <label
              className={`text-sm font-medium mb-1 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 rounded-md border text-sm ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex flex-col">
            <label
              className={`text-sm font-medium mb-1 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              View
            </label>
            <div
              className={`flex rounded-md border ${
                darkMode ? "border-gray-600" : "border-gray-300"
              }`}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-l-md transition-colors ${
                  viewMode === "grid"
                    ? darkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-600 text-white"
                    : darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-r-md transition-colors ${
                  viewMode === "list"
                    ? darkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-600 text-white"
                    : darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } border-l ${darkMode ? "border-gray-600" : "border-gray-300"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {selectedCategory !== "All" && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Active filter:
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                darkMode
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {selectedCategory}
            </span>
            <button
              onClick={() => setSelectedCategory("All")}
              className={`text-sm ${
                darkMode
                  ? "text-red-400 hover:text-red-300"
                  : "text-red-600 hover:text-red-700"
              } ml-2`}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
