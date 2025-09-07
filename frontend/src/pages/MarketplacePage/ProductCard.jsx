import { useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../context/CartContext";
import { Star, Heart, ShoppingCart, Badge, Plus, Minus } from "lucide-react";

export default function ProductCard({ product, viewMode = "grid" }) {
  const { darkMode } = useTheme();
  const { addToCart, removeOneFromCart, getItemQuantity } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const quantity = getItemQuantity(product.id);

  const handleAddToCart = () => {
    addToCart(product);
  };

  const handleRemoveFromCart = () => {
    removeOneFromCart(product.id);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  // Grid view component
  if (viewMode === "grid") {
    return (
      <div
        className={`relative group rounded-lg overflow-hidden shadow-md transition-all duration-300 ${
          darkMode ? "bg-gray-800 hover:shadow-xl" : "bg-white hover:shadow-xl"
        } hover:transform hover:scale-105`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ minHeight: "400px" }} // Ensure consistent card height
      >
        {/* Discount Badge */}
        {product.discount && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Badge className="w-3 h-3" />-{product.discount}%
            </div>
          </div>
        )}

        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Out of Stock
            </div>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-colors ${
            product.inStock ? "" : "right-24"
          } ${
            isWishlisted
              ? "bg-red-500 text-white"
              : darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Hover Tooltip - Positioned above cart buttons */}
        {showTooltip && (
          <div
            className={`absolute bottom-16 left-0 right-0 z-30 p-4 rounded-lg shadow-xl backdrop-blur-sm transition-all duration-300 transform ${
              showTooltip
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            } ${
              darkMode
                ? "bg-gray-900/95 text-white"
                : "bg-white/95 text-gray-900"
            } border ${darkMode ? "border-gray-700" : "border-gray-200"} mx-2`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-sm flex-1 pr-2">
                {product.name}
              </h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(product.rating)
                        ? "text-yellow-400 fill-current"
                        : darkMode
                        ? "text-gray-600"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span
                  className={`text-xs ml-1 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {product.rating}
                </span>
              </div>
            </div>

            <p
              className={`text-xs mb-3 leading-relaxed ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {product.description}
            </p>

            <div className="flex justify-between items-center">
              <div className="flex flex-wrap gap-1 flex-1">
                {product.features.slice(0, 2).map((feature, index) => (
                  <span
                    key={index}
                    className={`text-xs px-2 py-1 rounded-full ${
                      darkMode
                        ? "bg-gray-800 text-gray-300"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {feature}
                  </span>
                ))}
                {product.features.length > 2 && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      darkMode
                        ? "bg-gray-700 text-gray-400"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    +{product.features.length - 2}
                  </span>
                )}
              </div>

              <div className={`text-right flex-shrink-0 ml-2`}>
                <div
                  className={`text-lg font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  ${product.price}
                </div>
                {product.originalPrice && (
                  <div
                    className={`text-xs line-through ${
                      darkMode ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    ${product.originalPrice}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product Image */}
        <div className="relative overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.target.src = `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=400&fit=crop&auto=format&q=80`;
            }}
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          <div
            className={`text-xs font-medium mb-2 ${
              darkMode ? "text-blue-400" : "text-blue-600"
            }`}
          >
            {product.category}
          </div>

          {/* Product Name */}
          <h3
            className={`font-semibold text-lg mb-2 line-clamp-2 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating)
                      ? "text-yellow-400 fill-current"
                      : darkMode
                      ? "text-gray-600"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {product.rating} ({product.reviews})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`text-xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              ${product.price}
            </span>
            {product.originalPrice && (
              <span
                className={`text-sm line-through ${
                  darkMode ? "text-gray-500" : "text-gray-500"
                }`}
              >
                ${product.originalPrice}
              </span>
            )}
          </div>

          {/* Cart Buttons */}
          {quantity > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRemoveFromCart}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span
                  className={`font-semibold text-lg ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {quantity}
                </span>
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`p-2 rounded-lg transition-colors ${
                    product.inStock
                      ? darkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                      : darkMode
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                In Cart
              </span>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                product.inStock
                  ? darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                  : darkMode
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // List view component
  return (
    <div
      className={`flex gap-4 p-4 rounded-lg shadow-md transition-all duration-300 ${
        darkMode ? "bg-gray-800 hover:shadow-xl" : "bg-white hover:shadow-xl"
      }`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Product Image */}
      <div className="relative w-32 h-32 flex-shrink-0">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            e.target.src = `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=400&fit=crop&auto=format&q=80`;
          }}
        />
        {product.discount && (
          <div className="absolute top-2 left-2">
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              -{product.discount}%
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div
              className={`text-xs font-medium mb-1 ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              {product.category}
            </div>
            <h3
              className={`font-semibold text-lg ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {product.name}
            </h3>
          </div>
          <button
            onClick={handleWishlist}
            className={`p-2 rounded-full transition-colors ${
              isWishlisted
                ? "bg-red-500 text-white"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`}
            />
          </button>
        </div>

        <p
          className={`text-sm mb-3 ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {product.description}
        </p>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? "text-yellow-400 fill-current"
                    : darkMode
                    ? "text-gray-600"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span
              className={`text-sm ml-1 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {product.rating} ({product.reviews})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              ${product.price}
            </span>
            {product.originalPrice && (
              <span
                className={`text-sm line-through ${
                  darkMode ? "text-gray-500" : "text-gray-500"
                }`}
              >
                ${product.originalPrice}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex flex-wrap gap-1">
            {product.features.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className={`text-xs px-2 py-1 rounded-full ${
                  darkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {feature}
              </span>
            ))}
          </div>

          {quantity > 0 ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleRemoveFromCart}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span
                className={`font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {quantity}
              </span>
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`p-2 rounded-lg transition-colors ${
                  product.inStock
                    ? darkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                    : darkMode
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`py-2 px-4 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                product.inStock
                  ? darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                  : darkMode
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    originalPrice: PropTypes.number,
    rating: PropTypes.number.isRequired,
    reviews: PropTypes.number.isRequired,
    image: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    features: PropTypes.arrayOf(PropTypes.string).isRequired,
    inStock: PropTypes.bool.isRequired,
    discount: PropTypes.number,
  }).isRequired,
  viewMode: PropTypes.oneOf(["grid", "list"]),
};
