// Enhanced Food Database for AI Recognition
export const foodCategories = {
  healthy: {
    keywords: [
      'salad', 'vegetable', 'fruit', 'apple', 'banana', 'orange', 'grape', 'berry',
      'broccoli', 'spinach', 'carrot', 'tomato', 'cucumber', 'lettuce', 'kale',
      'chicken breast', 'fish', 'salmon', 'tuna', 'cod', 'yogurt', 'oatmeal',
      'quinoa', 'brown rice', 'sweet potato', 'avocado', 'nuts', 'seeds', 'almond',
      'walnut', 'chia', 'flax', 'green tea', 'water', 'coconut water'
    ],
    healthScore: 80,
    color: '#10b981'
  },
  junk: {
    keywords: [
      'burger', 'pizza', 'fries', 'chips', 'candy', 'chocolate', 'soda', 'donut',
      'cake', 'cookie', 'ice cream', 'fried', 'bacon', 'sausage', 'hot dog',
      'nuggets', 'wings', 'taco', 'burrito', 'sandwich', 'wrap', 'bagel',
      'muffin', 'croissant', 'pastry', 'pie', 'brownie', 'cheesecake', 'pancake',
      'waffle', 'syrup', 'sugar', 'sweet', 'candy', 'gummy', 'lollipop'
    ],
    healthScore: 20,
    color: '#ef4444'
  },
  moderate: {
    keywords: [
      'pasta', 'bread', 'rice', 'potato', 'cheese', 'milk', 'butter', 'oil',
      'meat', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'eggs', 'cereal',
      'granola', 'crackers', 'pretzel', 'popcorn', 'soup', 'stew', 'curry'
    ],
    healthScore: 50,
    color: '#f59e0b'
  }
};

export const nutritionalThresholds = {
  calories: {
    low: 100,
    medium: 300,
    high: 500
  },
  sugar: {
    low: 5,
    medium: 15,
    high: 25
  },
  fat: {
    low: 5,
    medium: 15,
    high: 25
  },
  protein: {
    low: 5,
    medium: 15,
    high: 25
  },
  sodium: {
    low: 200,
    medium: 500,
    high: 800
  },
  fiber: {
    low: 2,
    medium: 5,
    high: 8
  }
};

export const healthRecommendations = {
  highCalories: "High calorie content - consider portion control",
  highSugar: "High sugar content - limit consumption",
  highFat: "High fat content - choose leaner options",
  highSodium: "High sodium content - watch your salt intake",
  lowProtein: "Low protein content - add protein sources",
  lowFiber: "Low fiber content - add more vegetables",
  goodProtein: "Good protein source - great for muscle health",
  goodFiber: "High fiber content - excellent for digestion",
  lowSugar: "Low sugar content - healthy choice",
  lowFat: "Low fat content - good for heart health"
};

export const analyzeFoodNutrition = (foodData) => {
  const calories = parseFloat(foodData.Energ_Kcal || 0);
  const protein = parseFloat(foodData['Protein_(g)'] || 0);
  const sugar = parseFloat(foodData['Sugar_Tot_(g)'] || 0);
  const fat = parseFloat(foodData['Lipid_Tot_(g)'] || 0);
  const carbs = parseFloat(foodData['Carbohydrt_(g)'] || 0);
  const fiber = parseFloat(foodData['Fiber_TD_(g)'] || 0);
  const sodium = parseFloat(foodData['Sodium_(mg)'] || 0);
  const calcium = parseFloat(foodData['Calcium_(mg)'] || 0);

  let healthScore = 50;
  let category = 'moderate';
  let recommendations = [];
  let warnings = [];

  // Calculate health score based on nutritional content
  if (calories > nutritionalThresholds.calories.high) {
    healthScore -= 20;
    warnings.push('highCalories');
  } else if (calories < nutritionalThresholds.calories.low) {
    healthScore += 10;
  }

  if (sugar > nutritionalThresholds.sugar.high) {
    healthScore -= 15;
    warnings.push('highSugar');
  } else if (sugar < nutritionalThresholds.sugar.low) {
    healthScore += 10;
    recommendations.push('lowSugar');
  }

  if (fat > nutritionalThresholds.fat.high) {
    healthScore -= 10;
    warnings.push('highFat');
  } else if (fat < nutritionalThresholds.fat.low) {
    healthScore += 5;
    recommendations.push('lowFat');
  }

  if (protein > nutritionalThresholds.protein.high) {
    healthScore += 15;
    recommendations.push('goodProtein');
  } else if (protein < nutritionalThresholds.protein.low) {
    healthScore -= 5;
    warnings.push('lowProtein');
  }

  if (sodium > nutritionalThresholds.sodium.high) {
    healthScore -= 10;
    warnings.push('highSodium');
  }

  if (fiber > nutritionalThresholds.fiber.high) {
    healthScore += 10;
    recommendations.push('goodFiber');
  } else if (fiber < nutritionalThresholds.fiber.low) {
    healthScore -= 5;
    warnings.push('lowFiber');
  }

  // Determine category based on health score
  if (healthScore >= 70) {
    category = 'healthy';
  } else if (healthScore <= 30) {
    category = 'junk';
  }

  // Add specific recommendations
  warnings.forEach(warning => {
    if (healthRecommendations[warning]) {
      recommendations.push(healthRecommendations[warning]);
    }
  });

  // Add general health tips based on category
  if (category === 'healthy') {
    recommendations.push('Excellent nutritional choice!', 'Great for maintaining a healthy diet');
  } else if (category === 'junk') {
    recommendations.push('Consider healthier alternatives', 'Enjoy in moderation');
  } else {
    recommendations.push('Balanced nutritional profile', 'Good as part of a varied diet');
  }

  return {
    healthScore: Math.max(0, Math.min(100, healthScore)),
    category,
    recommendations: [...new Set(recommendations)], // Remove duplicates
    warnings,
    nutritionalAnalysis: {
      calories: {
        value: calories,
        level: calories > nutritionalThresholds.calories.high ? 'high' : 
               calories > nutritionalThresholds.calories.medium ? 'medium' : 'low'
      },
      sugar: {
        value: sugar,
        level: sugar > nutritionalThresholds.sugar.high ? 'high' : 
               sugar > nutritionalThresholds.sugar.medium ? 'medium' : 'low'
      },
      fat: {
        value: fat,
        level: fat > nutritionalThresholds.fat.high ? 'high' : 
               fat > nutritionalThresholds.fat.medium ? 'medium' : 'low'
      },
      protein: {
        value: protein,
        level: protein > nutritionalThresholds.protein.high ? 'high' : 
               protein > nutritionalThresholds.protein.medium ? 'medium' : 'low'
      },
      sodium: {
        value: sodium,
        level: sodium > nutritionalThresholds.sodium.high ? 'high' : 
               sodium > nutritionalThresholds.sodium.medium ? 'medium' : 'low'
      },
      fiber: {
        value: fiber,
        level: fiber > nutritionalThresholds.fiber.high ? 'high' : 
               fiber > nutritionalThresholds.fiber.medium ? 'medium' : 'low'
      }
    }
  };
};

export const getFoodCategory = (foodName) => {
  const name = foodName.toLowerCase();
  
  for (const [category, data] of Object.entries(foodCategories)) {
    if (data.keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  
  return 'moderate';
};

export const generateHealthInsights = (analysis) => {
  const insights = [];
  
  if (analysis.healthScore >= 80) {
    insights.push({
      type: 'excellent',
      message: 'This is an excellent nutritional choice!',
      icon: '🌟'
    });
  } else if (analysis.healthScore >= 60) {
    insights.push({
      type: 'good',
      message: 'This is a good nutritional choice.',
      icon: '👍'
    });
  } else if (analysis.healthScore >= 40) {
    insights.push({
      type: 'moderate',
      message: 'This food has moderate nutritional value.',
      icon: '⚖️'
    });
  } else {
    insights.push({
      type: 'poor',
      message: 'Consider healthier alternatives for better nutrition.',
      icon: '⚠️'
    });
  }

  // Add specific insights based on nutritional analysis
  if (analysis.nutritionalAnalysis.protein.level === 'high') {
    insights.push({
      type: 'protein',
      message: 'Great protein source for muscle health!',
      icon: '💪'
    });
  }

  if (analysis.nutritionalAnalysis.fiber.level === 'high') {
    insights.push({
      type: 'fiber',
      message: 'High fiber content - great for digestion!',
      icon: '🌾'
    });
  }

  if (analysis.nutritionalAnalysis.sugar.level === 'high') {
    insights.push({
      type: 'sugar',
      message: 'High sugar content - consume in moderation.',
      icon: '🍭'
    });
  }

  return insights;
};
