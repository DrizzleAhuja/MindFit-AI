import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser, setUser } from "../../redux/userSlice";
import { FiUser, FiMail, FiSave, FiArrowLeft } from "react-icons/fi";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";

export default function EditProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    diseases: "", // New field for diseases
    allergies: "", // New field for allergies
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        diseases: user.diseases ? user.diseases.join(', ') : '', // Initialize diseases
        allergies: user.allergies ? user.allergies.join(', ') : '', // Initialize allergies
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `${API_BASE_URL}${API_ENDPOINTS.USERS}/${user._id}`,
        { 
          ...formData,
          diseases: formData.diseases.split(',').map(item => item.trim()).filter(item => item !== ''),
          allergies: formData.allergies.split(',').map(item => item.trim()).filter(item => item !== ''),
        }
      );

      // Update Redux store
      dispatch(setUser(res.data));

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(res.data));

      console.log("Profile updated successfully:", res.data);
      toast.success("Profile updated successfully", {
        autoClose: 1000,
      });
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Error updating profile", error);
      toast.error("Profile update failed", {
        autoClose: 2000,
      });
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <div className="animate-pulse text-lg">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <ToastContainer position="top-center" autoClose={2000} theme="dark" />
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl shadow-xl overflow-hidden bg-gray-800">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-700 bg-gray-900">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full mr-4 text-gray-300 hover:bg-gray-700"
              >
                <FiArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium mb-2 text-gray-300"
                >
                  First Name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiUser size={18} />
                  </div>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium mb-2 text-gray-300"
                >
                  Last Name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiUser size={18} />
                  </div>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="diseases"
                  className="block text-sm font-medium mb-2 text-gray-300"
                >
                  Diseases (comma-separated)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <textarea
                    id="diseases"
                    name="diseases"
                    value={formData.diseases}
                    onChange={handleChange}
                    rows="3"
                    className="block w-full pl-3 pr-3 py-3 rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Diabetes, Hypertension, etc."
                  ></textarea>
                </div>
              </div>

              <div>
                <label
                  htmlFor="allergies"
                  className="block text-sm font-medium mb-2 text-gray-300"
                >
                  Allergies (comma-separated)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <textarea
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    rows="3"
                    className="block w-full pl-3 pr-3 py-3 rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Pollen, Peanuts, etc."
                  ></textarea>
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 text-gray-300"
                >
                  Email 
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiMail size={18} />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={user?.email || ""}
                    className="block w-full pl-10 pr-3 py-3 rounded-md bg-gray-600 border-gray-500 text-gray-300 placeholder-gray-400 border focus:outline-none cursor-not-allowed"
                    disabled
                    readOnly
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Email cannot be changed for security reasons
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiSave className="mr-2" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
