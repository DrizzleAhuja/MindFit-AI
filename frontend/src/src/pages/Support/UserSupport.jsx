import React, { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { API_BASE_URL } from "../../../config/api";
import { toast } from "react-toastify";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from '../../context/ThemeContext';
import { LifeBuoy, Send, Sparkles } from 'lucide-react';
import { validateLength, LIMITS } from '../../utils/formValidation';

export default function UserSupport() {
  const { darkMode } = useTheme();
  const user = useSelector(selectUser);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) return toast.error("Please select a category.");
    const desc = description.trim();
    const descErr = validateLength(desc, LIMITS.SUPPORT_DESC_MIN, LIMITS.SUPPORT_DESC_MAX, "Description");
    if (descErr) return toast.error(descErr);
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/messages`, {
        name: user ? `${user.firstName} ${user.lastName || ''}` : "Anonymous",
        email: user?.email || "anonymous@example.com",
        item: category,
        description: desc,
        type: "support"
      });
      toast.success("Support ticket submitted successfully!");
      setCategory("");

      setDescription("");
    } catch (err) {
      toast.error("Failed to submit support ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-[#05010d] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <NavBar />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-24 right-16 w-72 h-72 bg-[#22D3EE] rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-12 left-12 w-80 h-80 bg-[#8B5CF6] rounded-full blur-3xl opacity-25" />
        </div>

        <div className="relative z-10 w-full max-w-xl bg-[#0c0520]/40 backdrop-blur-md rounded-2xl p-8 border border-purple-500/20 shadow-2xl">
          <header className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#22D3EE]/20 to-[#8B5CF6]/20 border border-[#22D3EE]/30 mb-3">
              <Sparkles className="w-4 h-4 text-[#FACC15]" />
              <span className="text-xs font-semibold text-gray-200">How can we help?</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">Get Support</h1>
            <p className="text-gray-400 text-sm mt-1">Autofilled for: {user ? `${user.firstName} (${user.email})` : "Anonymous"}</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">Category/Issue</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                required
                className="w-full p-3 rounded-xl border border-purple-500/20 bg-[#0c0520]/60 text-white focus:ring-2 focus:ring-[#22D3EE]/40 focus:border-[#22D3EE] transition-all outline-none"
              >
                <option value="" disabled className="bg-[#0c0520]">Select Category</option>
                <option value="Technical Issue" className="bg-[#0c0520]">Technical Issue</option>
                <option value="Billing/Pro Plan" className="bg-[#0c0520]">Billing/Pro Plan</option>
                <option value="Workout/Diet Plan" className="bg-[#0c0520]">Workout/Diet Plan</option>
                <option value="General Question" className="bg-[#0c0520]">General Question</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows="5" 
                maxLength={LIMITS.SUPPORT_DESC_MAX}
                placeholder="Describe your issue in detail..." 
                className="w-full p-3 rounded-xl border border-purple-500/20 bg-[#0c0520]/60 text-white focus:ring-2 focus:ring-[#22D3EE]/40 focus:border-[#22D3EE] transition-all outline-none resize-none" 
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#22D3EE]/20 hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <LifeBuoy className="w-4 h-4" />
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
