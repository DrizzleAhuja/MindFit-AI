import { useTheme } from "../../context/ThemeContext";
import { useMarketplace } from "../../context/MarketplaceContext";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const { darkMode } = useTheme();
  const { filteredProducts, viewMode, selectedCategory, searchTerm, sortBy } =
    useMarketplace();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-2xl font-bold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Products ({filteredProducts.length})
        </h2>
        <div
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          {selectedCategory !== "All"
            ? `Showing ${selectedCategory.toLowerCase()} products`
            : searchTerm
            ? `Search results for "${searchTerm}"`
            : `Sorted by ${
                sortBy === "name"
                  ? "name"
                  : sortBy.includes("price")
                  ? "price"
                  : "rating"
              }`}
        </div>
      </div>

      {/* Products Grid or List View */}
      <div
        className={`${
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }`}
      >
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
            />
          ))
        ) : (
          <div
            className={`col-span-full text-center py-12 ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      {/* Load More Button - only show if there are products */}
      {filteredProducts.length > 0 && filteredProducts.length >= 8 && (
        <div className="mt-12 text-center">
          <button
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              darkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
}
