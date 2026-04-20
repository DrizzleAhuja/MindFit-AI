import React, { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { toast } from "react-toastify";
import { FiBarChart2, FiArrowLeft, FiAward, FiTarget, FiZap, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";

export default function WeeklyReport() {
  const { darkMode } = useTheme();
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchLatestReport() {
      if (!user?._id) return;
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/weekly-report/latest`, {
          params: { userId: user._id }
        });
        setReport(res.data.report);
      } catch (e) {
        console.error("Failed to fetch report", e);
        toast.error("Could not load your latest report.");
      } finally {
        setLoading(false);
      }
    }
    fetchLatestReport();
  }, [user?._id]);

  const generateReport = async () => {
    if (!user?._id) return;
    setIsGenerating(true);
    try {
      const res = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/weekly-report/generate`, {
        userId: user._id
      });
      setReport(res.data.report);
      toast.success("AI has successfully analyzed your week!");
    } catch (e) {
      console.error("Generation failed", e);
      toast.error("Failed to generate report. Try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatMarkdown = (text) => {
    if (!text) return null;
    return text
      .replace(/### (.*)/g, '<h4 class="text-lg font-bold text-[#22D3EE] mt-4 mb-2">$1</h4>')
      .replace(/## (.*)/g, '<h3 class="text-xl font-black text-white mt-6 mb-3 border-b border-white/10 pb-1">$1</h3>')
      .replace(/# (.*)/g, '<h2 class="text-2xl font-black text-white mt-8 mb-4">$1</h2>')
      // Remove any literal hashtags that might have slipped through
      .replace(/#/g, '')
      .replace(/\*\*(.*)\*\*/g, '<strong class="text-white font-black bg-white/5 px-1 rounded">$1</strong>')
      .replace(/\* (.*)/g, '<li class="ml-4 mb-2 text-gray-300 list-disc">$1</li>')
      .replace(/- (.*)/g, '<li class="ml-4 mb-2 text-gray-300 list-disc font-medium">$1</li>')
      .replace(/\n\n/g, '<div class="mb-4"></div>')
      .split('\n').join('<br/>');
  };

  // Activity Graph Logic
  const activityData = report?.metrics?.dailyActivity || [0,0,0,0,0,0,0];
  const maxVal = Math.max(...activityData, 1);
  const normalizedData = activityData.map(v => (v / maxVal) * 100);

  // Handle loading / non-logged in state
  if (!user) {
    // If we're missing a user in Redux, check if we're expect one from storage
    const hasSession = localStorage.getItem("isLoggedIn") === "true";
    
    if (hasSession) {
      return (
        <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-[#020617] text-white' : 'bg-gray-50 text-gray-900'}`}>
          <NavBar />
          <div className="flex-grow flex flex-col items-center justify-center grayscale opacity-50">
             <div className="w-16 h-16 border-4 border-t-[#22D3EE] border-white/10 rounded-full animate-spin mb-4"></div>
             <p className="font-bold tracking-widest text-xs uppercase">Restoring Session...</p>
          </div>
          <Footer />
        </div>
      );
    }

    return (
       <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-[#020617] text-white' : 'bg-gray-50 text-gray-900'}`}>
          <NavBar />
          <div className="flex-grow flex items-center justify-center">
             <div className="text-center p-12 rounded-3xl bg-white/[0.02] border border-white/5 max-w-md">
                <FiUser className="text-5xl text-gray-700 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-4">Account Required</h2>
                <p className="text-gray-400 mb-8 text-sm">Please sign in to your MindFit-AI account to access your personalized weekly reports and health analytic insights.</p>
                <button onClick={() => navigate("/signin")} className="px-8 py-3 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-black font-black text-sm hover:scale-105 transition-all">Sign In Now</button>
             </div>
          </div>
          <Footer />
       </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-[#020617] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <NavBar />
      
      <main className="flex-grow container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => navigate(-1)}
               className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-[#22D3EE]/20 hover:border-[#22D3EE]/50 transition-all group"
             >
                <FiArrowLeft className="text-gray-400 group-hover:text-[#22D3EE]" />
             </button>
             <div>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#22D3EE] via-[#A855F7] to-[#8B5CF6]">
                  Weekly AI Progress
                </h1>
                <p className="text-gray-400 mt-1 uppercase tracking-widest text-[10px] font-bold">Autonomous Health Analysis</p>
             </div>
          </div>

          <button 
            onClick={generateReport}
            disabled={isGenerating}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] text-black font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,211,238,0.4)] disabled:opacity-50"
          >
            {isGenerating ? "AI Processing..." : "Sync & Regenerate"}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
             <div className="w-16 h-16 border-4 border-t-[#22D3EE] border-white/10 rounded-full animate-spin mb-4"></div>
             <p className="font-bold tracking-widest text-xs uppercase">Computing Insights...</p>
          </div>
        ) : !report ? (
          <div className={`text-center py-24 rounded-3xl border border-dashed ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-gray-300 bg-black/[0.02]'}`}>
             <FiAward className="text-6xl text-gray-700 mx-auto mb-6" />
             <h2 className="text-2xl font-bold mb-2">No Report Found</h2>
             <p className="text-gray-400 max-w-md mx-auto mb-8">Click the button above to have our AI analyze your workouts, nutrition, and streaks for the past 7 days.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Stat Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: "Workouts", value: report.metrics.totalWorkouts, icon: <FiZap />, color: "text-[#22D3EE]" },
                 { label: "Total Reps", value: report.metrics.totalReps, icon: <FiTarget />, color: "text-[#8B5CF6]" },
                 { label: "Avg Kcal", value: report.metrics.avgCalories, icon: <FiAward />, color: "text-[#FACC15]" },
                 { label: "Streak", value: user.streakCount, icon: <FiAward />, color: "text-[#F97316]" }
               ].map((stat, i) => (
                 <div key={i} className={`p-6 rounded-2xl flex flex-col items-center text-center border ${darkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <span className={`${stat.color} text-xl mb-3`}>{stat.icon}</span>
                    <span className="text-3xl font-black tracking-tighter">{stat.value}</span>
                    <span className="text-[10px] text-gray-500 font-black uppercase mt-1">{stat.label}</span>
                 </div>
               ))}
            </div>

            {/* Content & Chart Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Consistency Chart */}
               <div className={`lg:col-span-1 p-8 rounded-3xl relative overflow-hidden h-fit border ${darkMode ? 'bg-[#0a0f1d] border-white/5' : 'bg-white border-gray-200 shadow-md'}`}>
                  <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                    <FiBarChart2 className="text-[#22D3EE]" /> Consistency
                  </h3>
                  <div className="flex items-end justify-between h-40 gap-3">
                     {normalizedData.map((h, i) => (
                       <div key={i} className="flex-1 group relative">
                          <div 
                             className={`w-full rounded-t-lg transition-all duration-1000 ${i === 6 ? 'bg-gradient-to-t from-[#22D3EE] to-[#8B5CF6]' : 'bg-white/10'}`} 
                             style={{ height: `${Math.max(h, 4)}%` }}
                             title={`${activityData[i]} Workouts`}
                          ></div>
                          <div className="mt-4 text-[10px] text-center text-gray-500 font-black uppercase">
                             {['S','M','T','W','T','F','S'][i]}
                          </div>
                          {/* Tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                             {activityData[i]} Logged
                          </div>
                       </div>
                     ))}
                  </div>
                  <div className="mt-12 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-gray-400 leading-relaxed italic">
                    "Success is the sum of small efforts repeated day in and day out."
                  </div>
               </div>

               {/* AI Markdown Report Card */}
               <div className={`lg:col-span-2 p-10 rounded-3xl relative group shadow-2xl border ${darkMode ? 'bg-[#0a0f1d] border-white/5' : 'bg-white border-gray-200 shadow-md'}`}>
                  {/* Glass decorative elements */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#22D3EE]/10 rounded-full blur-3xl group-hover:bg-[#22D3EE]/15 transition-all"></div>
                  
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                     <h3 className="text-2xl font-black italic tracking-tight">COACH'S INSIGHTS</h3>
                     <span className="text-[10px] font-black uppercase text-[#22D3EE] bg-[#22D3EE]/10 px-3 py-1 rounded-full border border-[#22D3EE]/20">
                       Analysis Complete
                     </span>
                  </div>

                  <div 
                    className={`report-content leading-[1.8] text-sm ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(report.markdownContent) }}
                  />
               </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
