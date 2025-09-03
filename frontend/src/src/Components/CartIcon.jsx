import { useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";

export default function CartIcon({ className = "" }) {
  const { darkMode } = useTheme();
  const {
    cartItems,
    getTotalItems,
    getTotalPrice,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = getTotalItems();

  return (
    <div className="relative">
      {/* Cart Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${
          darkMode
            ? "text-gray-300 hover:text-white hover:bg-gray-700"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        } ${className}`}
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      {/* Cart Dropdown */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl z-50 ${
            darkMode
              ? "bg-gray-800 border border-gray-700"
              : "bg-white border border-gray-200"
          }`}
        >
          <div
            className={`p-4 border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Shopping Cart ({totalItems})
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-full ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div
                className={`p-6 text-center ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Your cart is empty
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border-b ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4
                        className={`font-medium text-sm ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {item.name}
                      </h4>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        ${item.price}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className={`p-1 rounded ${
                          darkMode
                            ? "hover:bg-gray-700 text-gray-400"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span
                        className={`text-sm font-medium ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className={`p-1 rounded ${
                          darkMode
                            ? "hover:bg-gray-700 text-gray-400"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className={`p-1 rounded ml-2 ${
                          darkMode
                            ? "hover:bg-red-700 text-red-400"
                            : "hover:bg-red-100 text-red-600"
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div
              className={`p-4 border-t ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span
                  className={`font-semibold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Total: ${getTotalPrice().toFixed(2)}
                </span>
              </div>
              <button
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Checkout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

CartIcon.propTypes = {
  className: PropTypes.string,
};
