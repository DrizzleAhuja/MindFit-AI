import { useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../context/CartContext";
import { Star, Heart, ShoppingCart, Eye, Badge } from "lucide-react";
import ProductModal from "../../Components/ProductModal";

export default function ProductCard({ product }) {
  const { darkMode } = useTheme();
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    console.log("Added to cart:", product.name);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const handleQuickView = () => {
    setShowModal(true);
  };

  return (
    <div
      className={`relative group rounded-lg overflow-hidden shadow-md transition-all duration-300 ${
        darkMode ? "bg-gray-800 hover:shadow-xl" : "bg-white hover:shadow-xl"
      } ${isHovered ? "transform scale-105" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

      {/* Product Image */}
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Quick View Overlay */}
        <div
          className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={handleQuickView}
            className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Quick View
          </button>
        </div>
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

        {/* Description */}
        <p
          className={`text-sm mb-3 line-clamp-2 ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {product.description}
        </p>

        {/* Features */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {product.features.slice(0, 2).map((feature, index) => (
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
            {product.features.length > 2 && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  darkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                +{product.features.length - 2} more
              </span>
            )}
          </div>
        </div>

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
            {product.rating} ({product.reviews} reviews)
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

        {/* Add to Cart Button */}
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
      </div>

      {/* Product Modal */}
      <ProductModal
        product={product}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
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
};
