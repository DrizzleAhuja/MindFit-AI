import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import NavBar from '../../pages/HomePage/NavBar';
import Footer from '../../pages/HomePage/Footer';
import { useTheme } from '../../context/ThemeContext';
import './CalorieTracker.css';

const CalorieTracker = () => {
  const [foodData, setFoodData] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [numDishes, setNumDishes] = useState(1);
  const [nutritionSummary, setNutritionSummary] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sugar: 0,
    calcium: 0,
  });

  useEffect(() => {
    Papa.parse('/food1.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setFoodData(results.data);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
      }
    });
  }, []);

  useEffect(() => {
    calculateNutritionSummary();
  }, [selectedFoods, quantities]);

  const handleFoodSelection = (index, foodName) => {
    const updatedSelectedFoods = [...selectedFoods];
    updatedSelectedFoods[index] = foodName;
    setSelectedFoods(updatedSelectedFoods);
  };

  const handleQuantityChange = (index, quantity) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [index]: parseInt(quantity, 10),
    }));
  };

  const calculateNutritionSummary = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalSugar = 0;
    let totalCalcium = 0;

    selectedFoods.forEach((foodName, index) => {
      const foodItem = foodData.find((food) => food.Shrt_Desc === foodName);
      const quantity = quantities[index] || 1;

      if (foodItem) {
        totalCalories += parseFloat(foodItem.Energ_Kcal || 0) * quantity;
        totalProtein += parseFloat(foodItem['Protein_(g)'] || 0) * quantity;
        totalCarbs += parseFloat(foodItem['Carbohydrt_(g)'] || 0) * quantity;
        totalFat += parseFloat(foodItem['Lipid_Tot_(g)'] || 0) * quantity;
        totalSugar += parseFloat(foodItem['Sugar_Tot_(g)'] || 0) * quantity;
        totalCalcium += parseFloat(foodItem['Calcium_(mg)'] || 0) * quantity;
      }
    });

    setNutritionSummary({
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      sugar: totalSugar,
      calcium: totalCalcium,
    });
  };

  const getChartData = (nutrientKey) => {
    return selectedFoods.map((foodName, index) => {
      const foodItem = foodData.find((food) => food.Shrt_Desc === foodName);
      const quantity = quantities[index] || 1;
      const value = foodItem ? parseFloat(foodItem[nutrientKey] || 0) * quantity : 0;
      return { name: foodName, value: value };
    }).filter(item => item.value > 0);
  };

  const COLORS = ['#60A5FA', '#34D399', '#FCD34D', '#FB923C', '#C4B5FD', '#FDBA74']; // Adjusted colors for dark mode

  const { darkMode } = useTheme();
  // const darkMode=1;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <NavBar />
      <div className="calorie-tracker-container mx-auto p-4 max-w-4xl">
        <h2 className="tracker-title text-3xl font-bold mb-6 text-center text-white">Nutrition Calorie Tracker</h2>

        <div className={`input-section p-6 rounded-lg shadow-md mb-8 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
          <label className={`block text-lg font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Number of dishes:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={numDishes}
            onChange={(e) => setNumDishes(parseInt(e.target.value, 10))}
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>

        {[...Array(numDishes)].map((_, index) => (
          <div key={index} className={`dish-selection p-6 rounded-lg shadow-md mb-4 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
            <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Dish {index + 1}</h3>
            <select
              onChange={(e) => handleFoodSelection(index, e.target.value)}
              value={selectedFoods[index] || ''}
              className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">Select a food</option>
              {foodData.map((food) => (
                <option key={food.NDB_No} value={food.Shrt_Desc}>
                  {food.Shrt_Desc}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="10"
              value={quantities[index] || 1}
              onChange={(e) => handleQuantityChange(index, e.target.value)}
              className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            {selectedFoods[index] && (
              <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Calories per serving: {foodData.find(food => food.Shrt_Desc === selectedFoods[index])?.Energ_Kcal || 0}</p>
            )}
          </div>
        ))}

        <div className={`summary-section p-6 rounded-lg shadow-md mb-8 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
          <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Total Nutrition</h3>
          <p className={`text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total Calories: <span className="font-bold text-blue-400">{nutritionSummary.calories.toFixed(2)} Kcal</span></p>
          <p className={`text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total Protein: <span className="font-bold text-green-400">{nutritionSummary.protein.toFixed(2)} g</span></p>
          <p className={`text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total Carbs: <span className="font-bold text-yellow-400">{nutritionSummary.carbs.toFixed(2)} g</span></p>
          <p className={`text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total Fat: <span className="font-bold text-orange-400">{nutritionSummary.fat.toFixed(2)} g</span></p>
          <p className={`text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total Sugar: <span className="font-bold text-purple-400">{nutritionSummary.sugar.toFixed(2)} g</span></p>
          <p className={`text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total Calcium: <span className="font-bold text-pink-400">{nutritionSummary.calcium.toFixed(2)} mg</span></p>
        </div>

        <div className="charts-section grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {getChartData('Energ_Kcal').length > 0 && (
            <div className={`chart-item p-6 rounded-lg shadow-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
              <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Calorie Breakdown</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getChartData('Energ_Kcal')}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={{ fill: darkMode ? '#E5E7EB' : '#374151', fontSize: 12 }} // Dynamic label color
                  >
                    {getChartData('Energ_Kcal').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#F9FAFB', borderColor: darkMode ? '#4B5563' : '#D1D5DB', color: darkMode ? '#E5E7EB' : '#1F2937' }} itemStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }} />
                  <Legend wrapperStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {getChartData('Protein_(g)').length > 0 && (
            <div className={`chart-item p-6 rounded-lg shadow-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
              <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Protein Breakdown</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getChartData('Protein_(g)')}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={{ fill: darkMode ? '#E5E7EB' : '#374151', fontSize: 12 }}
                  >
                    {getChartData('Protein_(g)').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#F9FAFB', borderColor: darkMode ? '#4B5563' : '#D1D5DB', color: darkMode ? '#E5E7EB' : '#1F2937' }} itemStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }} />
                  <Legend wrapperStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {getChartData('Carbohydrt_(g)').length > 0 && (
            <div className={`chart-item p-6 rounded-lg shadow-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
              <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Carbs Breakdown</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getChartData('Carbohydrt_(g)')}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={{ fill: darkMode ? '#E5E7EB' : '#374151', fontSize: 12 }}
                  >
                    {getChartData('Carbohydrt_(g)').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#F9FAFB', borderColor: darkMode ? '#4B5563' : '#D1D5DB', color: darkMode ? '#E5E7EB' : '#1F2937' }} itemStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }} />
                  <Legend wrapperStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {getChartData('Lipid_Tot_(g)').length > 0 && (
            <div className={`chart-item p-6 rounded-lg shadow-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
              <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Fat Breakdown</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getChartData('Lipid_Tot_(g)')}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={{ fill: darkMode ? '#E5E7EB' : '#374151', fontSize: 12 }}
                  >
                    {getChartData('Lipid_Tot_(g)').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#F9FAFB', borderColor: darkMode ? '#4B5563' : '#D1D5DB', color: darkMode ? '#E5E7EB' : '#1F2937' }} itemStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }} />
                  <Legend wrapperStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {getChartData('Sugar_Tot_(g)').length > 0 && (
            <div className={`chart-item p-6 rounded-lg shadow-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
              <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Sugar Breakdown</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getChartData('Sugar_Tot_(g)')}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={{ fill: darkMode ? '#E5E7EB' : '#374151', fontSize: 12 }}
                  >
                    {getChartData('Sugar_Tot_(g)').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#F9FAFB', borderColor: darkMode ? '#4B5563' : '#D1D5DB', color: darkMode ? '#E5E7EB' : '#1F2937' }} itemStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }} />
                  <Legend wrapperStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CalorieTracker;
