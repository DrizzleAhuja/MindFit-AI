// BMICalculator.js - Updated with professional styling
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaWeight, FaRulerVertical, FaBirthdayCake, FaVenusMars, FaHistory } from "react-icons/fa";
import { GiBodyHeight } from "react-icons/gi";

export default function BMICalculator() {
  const user = useSelector(selectUser);
  const [weight, setWeight] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [bmi, setBmi] = useState(null);
  const [category, setCategory] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user?.email) fetchBMIHistory();
  }, [user]);

  const fetchBMIHistory = async () => {
    try {
      const res = await axios.get("https://mindfitaibackend.vercel.app/api/bmi/history", {
        params: { email: user.email }
      });
      setHistory(res.data);
    } catch (error) {
      console.error("Error fetching BMI history", error);
    }
  };

  const calculateBMI = () => {
    if (!weight || !heightFeet || !heightInches || !age) {
      toast.error("Please enter all details");
      return;
    }

    const heightInMeters = (parseInt(heightFeet) * 0.3048) + (parseInt(heightInches) * 0.0254);
    const calculatedBMI = (weight / (heightInMeters * heightInMeters)).toFixed(2);

    let bmiCategory = "";
    if (calculatedBMI < 18.5) bmiCategory = "Underweight";
    else if (calculatedBMI < 24.9) bmiCategory = "Normal weight";
    else if (calculatedBMI < 29.9) bmiCategory = "Overweight";
    else if (calculatedBMI < 35) bmiCategory = "Obese";
    else bmiCategory = "Morbid obesity";

    setBmi(calculatedBMI);
    setCategory(bmiCategory);
    saveBMI(calculatedBMI, bmiCategory);
  };

  const saveBMI = async (calculatedBMI, bmiCategory) => {
    try {
      await axios.post("https://mindfitaibackend.vercel.app/api/bmi/save", {
        email: user.email,
        bmi: calculatedBMI,
        category: bmiCategory
      });
      toast.success("BMI saved successfully");
      fetchBMIHistory();
    } catch (error) {
      console.error("Error saving BMI", error);
      toast.error("Failed to save BMI");
    }
  };

  const getBMIColor = (bmiValue) => {
    if (!bmiValue) return "text-gray-500";
    if (bmiValue < 18.5) return "text-blue-500";
    if (bmiValue < 24.9) return "text-green-500";
    if (bmiValue < 29.9) return "text-yellow-500";
    if (bmiValue < 35) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 text-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
            BMI Calculator
          </h1>
          <p className="text-xl text-gray-300">
            Track your Body Mass Index and monitor your health progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 p-6">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
              <FaWeight className="mr-3 text-green-400" /> Calculate Your BMI
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <FaBirthdayCake className="mr-2 text-gray-400" /> Age
                </label>
                <input 
                  type="number" 
                  placeholder="Enter your age" 
                  value={age} 
                  onChange={(e) => setAge(e.target.value)} 
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <FaVenusMars className="mr-2 text-gray-400" /> Gender
                </label>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)} 
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <FaWeight className="mr-2 text-gray-400" /> Weight (kg)
                </label>
                <input 
                  type="number" 
                  placeholder="Enter weight in kg" 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)} 
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <GiBodyHeight className="mr-2 text-gray-400" /> Height
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="Feet" 
                      value={heightFeet} 
                      onChange={(e) => setHeightFeet(e.target.value)} 
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                    />
                    <span className="absolute right-3 top-3 text-gray-400">ft</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="Inches" 
                      value={heightInches} 
                      onChange={(e) => setHeightInches(e.target.value)} 
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                    />
                    <span className="absolute right-3 top-3 text-gray-400">in</span>
                  </div>
                </div>
              </div>

              <button
                onClick={calculateBMI}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all"
              >
                Calculate BMI
              </button>
            </div>

            {bmi && (
              <div className="mt-8 p-4 bg-gray-700 rounded-lg border border-gray-600">
                <h3 className="text-lg font-semibold mb-2 text-white">Your Results</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300">Your BMI:</p>
                    <p className={`text-3xl font-bold ${getBMIColor(bmi)}`}>{bmi}</p>
                  </div>
                  <div>
                    <p className="text-gray-300">Category:</p>
                    <p className={`text-xl font-semibold ${getBMIColor(bmi)}`}>{category}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History Section */}
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 p-6">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
              <FaHistory className="mr-3 text-green-400" /> BMI History
            </h2>
            
            {history.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {history.map((entry, index) => (
                  <div 
                    key={index} 
                    className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-green-300 transition"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className={`text-lg font-semibold ${getBMIColor(entry.bmi)}`}>
                          {entry.bmi}
                        </span>
                        <span className="text-sm text-gray-400 ml-2">
                          ({entry.category})
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          entry.category === "Underweight" ? "bg-blue-400" :
                          entry.category === "Normal weight" ? "bg-green-400" :
                          entry.category === "Overweight" ? "bg-yellow-400" :
                          entry.category === "Obese" ? "bg-orange-400" : "bg-red-400"
                        }`}
                        style={{
                          width: `${Math.min(100, (parseFloat(entry.bmi) / 40) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaHistory className="text-5xl text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-400">No BMI History</h3>
                <p className="text-gray-500 mt-2">Calculate your BMI to start tracking your progress.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} theme="dark"/>
    </div>
  );
}