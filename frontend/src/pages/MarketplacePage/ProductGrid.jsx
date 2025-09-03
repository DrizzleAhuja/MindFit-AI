import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const { darkMode } = useTheme();

  // Sample fitness equipment data
  const [products] = useState([
    {
      id: 1,
      name: "Professional Treadmill",
      category: "Cardio Equipment",
      price: 1299.99,
      originalPrice: 1599.99,
      rating: 4.8,
      reviews: 245,
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=400&fit=crop",
      description:
        "High-performance treadmill with advanced features for home use",
      features: ["Touch Display", "Heart Rate Monitor", "Multiple Programs"],
      inStock: true,
      discount: 19,
    },
    {
      id: 2,
      name: "Adjustable Dumbbells Set",
      category: "Free Weights",
      price: 299.99,
      originalPrice: 399.99,
      rating: 4.6,
      reviews: 189,
      image:
        "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&h=400&fit=crop",
      description:
        "Space-saving adjustable dumbbells for complete strength training",
      features: [
        "5-50 lbs per dumbbell",
        "Quick-change system",
        "Compact design",
      ],
      inStock: true,
      discount: 25,
    },
    {
      id: 3,
      name: "Yoga Mat Premium",
      category: "Yoga & Flexibility",
      price: 49.99,
      originalPrice: 69.99,
      rating: 4.9,
      reviews: 567,
      image:
        "https://images.unsplash.com/photo-1506629905607-ded61a79fe19?w=500&h=400&fit=crop",
      description: "Extra thick, non-slip yoga mat for ultimate comfort",
      features: ["6mm thickness", "Non-slip surface", "Eco-friendly material"],
      inStock: true,
      discount: 29,
    },
    {
      id: 4,
      name: "Power Rack System",
      category: "Strength Training",
      price: 899.99,
      originalPrice: 1199.99,
      rating: 4.7,
      reviews: 124,
      image:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=400&fit=crop",
      description:
        "Multi-station power rack for comprehensive strength training",
      features: ["Pull-up bar", "Safety bars", "Multiple attachment points"],
      inStock: true,
      discount: 25,
    },
    {
      id: 5,
      name: "Resistance Bands Set",
      category: "Resistance Training",
      price: 39.99,
      originalPrice: 59.99,
      rating: 4.5,
      reviews: 892,
      image:
        "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&h=400&fit=crop",
      description:
        "Complete resistance band set with multiple resistance levels",
      features: [
        "5 resistance levels",
        "Door anchor included",
        "Exercise guide",
      ],
      inStock: true,
      discount: 33,
    },
    {
      id: 6,
      name: "Exercise Bike Pro",
      category: "Cardio Equipment",
      price: 749.99,
      originalPrice: 999.99,
      rating: 4.6,
      reviews: 167,
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=400&fit=crop",
      description:
        "Indoor cycling bike with magnetic resistance and digital display",
      features: [
        "Magnetic resistance",
        "Heart rate monitor",
        "Bluetooth connectivity",
      ],
      inStock: true,
      discount: 25,
    },
    {
      id: 7,
      name: "Kettlebell Set",
      category: "Free Weights",
      price: 179.99,
      originalPrice: 229.99,
      rating: 4.8,
      reviews: 234,
      image:
        "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=500&h=400&fit=crop",
      description: "Professional-grade kettlebell set for functional training",
      features: ["Cast iron construction", "Wide handle", "Multiple weights"],
      inStock: false,
      discount: 22,
    },
    {
      id: 8,
      name: "Foam Roller Premium",
      category: "Accessories",
      price: 29.99,
      originalPrice: 39.99,
      rating: 4.7,
      reviews: 445,
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=400&fit=crop",
      description: "High-density foam roller for muscle recovery and massage",
      features: ["High-density foam", "Textured surface", "Lightweight"],
      inStock: true,
      discount: 25,
    },
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-2xl font-bold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Products ({products.length})
        </h2>
        <div
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          Showing all products
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Load More Button */}
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
    </div>
  );
}
