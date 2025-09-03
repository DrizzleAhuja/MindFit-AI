import { useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { X, Star, ShoppingCart, Heart, Plus, Minus } from "lucide-react";

export default function ProductModal({ product, isOpen, onClose }) {
  const { darkMode } = useTheme();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!isOpen) return null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    onClose();
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  // Sample additional images (in real app, these would come from product data)
  const productImages = [
    product.image,
    product.image, // Placeholder - would be different angles
    product.image, // Placeholder - would be different angles
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`relative max-w-4xl w-full max-h-[90vh] rounded-lg overflow-hidden ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full ${
            darkMode
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-white hover:bg-gray-100 text-gray-900"
          } shadow-lg`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Product Images */}
            <div>
              <div className="mb-4">
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index
                        ? "border-blue-500"
                        : darkMode
                        ? "border-gray-600"
                        : "border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div>
              <div
                className={`text-sm font-medium mb-2 ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                {product.category}
              </div>

              <h1
                className={`text-3xl font-bold mb-4 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
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
                  className={`text-lg ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <span
                  className={`text-3xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  ${product.price}
                </span>
                {product.originalPrice && (
                  <>
                    <span
                      className={`text-xl line-through ${
                        darkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      ${product.originalPrice}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                      Save ${(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              <p
                className={`text-lg mb-6 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {product.description}
              </p>

              {/* Features */}
              <div className="mb-6">
                <h3
                  className={`text-lg font-semibold mb-3 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Key Features
                </h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li
                      key={index}
                      className={`flex items-center gap-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.inStock ? (
                  <span className="inline-flex items-center gap-2 text-green-600 font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    In Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-red-600 font-medium">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Quantity and Actions */}
              {product.inStock && (
                <div className="space-y-4">
                  {/* Quantity Selector */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className={`p-2 rounded-lg ${
                          darkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span
                        className={`text-xl font-medium px-4 ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className={`p-2 rounded-lg ${
                          darkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                    <button
                      onClick={handleWishlist}
                      className={`p-3 rounded-lg transition-colors ${
                        isWishlisted
                          ? "bg-red-500 text-white"
                          : darkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isWishlisted ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ProductModal.propTypes = {
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
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
