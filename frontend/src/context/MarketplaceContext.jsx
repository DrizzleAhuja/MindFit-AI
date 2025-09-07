import { createContext, useContext, useState, useMemo } from "react";
import PropTypes from "prop-types";

const MarketplaceContext = createContext();

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error("useMarketplace must be used within a MarketplaceProvider");
  }
  return context;
};

export const MarketplaceProvider = ({ children }) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");

  // Sample fitness equipment data with more products and better images
  const allProducts = [
    {
      id: 1,
      name: "Professional Treadmill",
      category: "Cardio Equipment",
      brand: "FitPro",
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
      brand: "StrengthMax",
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
      brand: "FlexFit",
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
      brand: "PowerGym",
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
      brand: "FlexFit",
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
      brand: "CardioElite",
      price: 749.99,
      originalPrice: 999.99,
      rating: 4.6,
      reviews: 167,
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=400&fit=crop&auto=format&q=80",
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
      brand: "StrengthMax",
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
      brand: "FlexFit",
      price: 29.99,
      originalPrice: 39.99,
      rating: 4.7,
      reviews: 445,
      image:
        "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=500&h=400&fit=crop",
      description: "High-density foam roller for muscle recovery and massage",
      features: ["High-density foam", "Textured surface", "Lightweight"],
      inStock: true,
      discount: 25,
    },
    {
      id: 9,
      name: "Olympic Barbell",
      category: "Strength Training",
      brand: "PowerGym",
      price: 199.99,
      originalPrice: 249.99,
      rating: 4.9,
      reviews: 156,
      image:
        "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&h=400&fit=crop&auto=format&q=80",
      description: "Professional Olympic barbell for serious weight training",
      features: ["45 lb standard weight", "Knurled grip", "Chrome finish"],
      inStock: true,
      discount: 20,
    },
    {
      id: 10,
      name: "Rowing Machine",
      category: "Cardio Equipment",
      brand: "CardioElite",
      price: 599.99,
      originalPrice: 799.99,
      rating: 4.4,
      reviews: 89,
      image:
        "https://images.unsplash.com/photo-1506629905607-ded61a79fe19?w=500&h=400&fit=crop&auto=format&q=80",
      description: "Full-body workout rowing machine with air resistance",
      features: ["Air resistance", "Performance monitor", "Foldable design"],
      inStock: true,
      discount: 25,
    },
  ];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = allProducts.filter((product) => {
      // Search filter
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      // Price filter
      const matchesPrice =
        product.price >= priceRange[0] && product.price <= priceRange[1];

      // Brand filter
      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(product.brand);

      // Rating filter
      const matchesRating =
        selectedRating === 0 || product.rating >= selectedRating;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesBrand &&
        matchesRating
      );
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "popular":
          return b.reviews - a.reviews;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    searchTerm,
    selectedCategory,
    priceRange,
    selectedBrands,
    selectedRating,
    sortBy,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setPriceRange([0, 2000]);
    setSelectedBrands([]);
    setSelectedRating(0);
  };

  const value = {
    // Data
    allProducts,
    filteredProducts,

    // Filter states
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    selectedBrands,
    setSelectedBrands,
    selectedRating,
    setSelectedRating,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,

    // Actions
    clearFilters,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
};

MarketplaceProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
