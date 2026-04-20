import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser, setUser } from "../../redux/userSlice";
import { FiUser, FiMail, FiSave, FiArrowLeft, FiUpload, FiBarChart2 } from "react-icons/fi";
import { Activity, Heart, Zap, Moon, RefreshCw, Watch, Plus } from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
import GamifyBadge from "../../Components/GamifyBadge";
import { validateLength, LIMITS } from "../../utils/formValidation";
import { useTheme } from "../../context/ThemeContext";

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aria",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mason"
];

export default function EditProfile() {
  const { darkMode } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    diseasesAndAllergies: "", 
    avatar: "",
  });

  const [stats, setStats] = useState({ points: 0, weeklyPoints: 0, streakCount: 0 });
  const [rank, setRank] = useState(null);
  const [fitStatus, setFitStatus] = useState({ linked: false, metrics: {} });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      const diseases = user.diseases ? user.diseases.join(', ') : '';
      const allergies = user.allergies ? user.allergies.join(', ') : '';
      const combined = [diseases, allergies].filter(item => item !== '').join(', ');
      
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        diseasesAndAllergies: combined,
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  useEffect(() => {
    async function fetchStats() {
      if (user?._id) {
        try {
           // 1. Fetch latest user doc for up-to-date limits
           const uRes = await axios.get(`${API_BASE_URL}/api/users/${user._id}`);
           if (uRes.data) {
             // Avoid infinite loop by updating ONLY if data has changed slightly or just set once
             dispatch(setUser(uRes.data));
             localStorage.setItem("user", JSON.stringify(uRes.data));
           }

           const s = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/stats`, { params: { email: user.email } });
           setStats(s.data || {});
           
           const l = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/leaderboard`, { params: { period: 'all' } });
           const allusers = l.data.users || [];
           const r = allusers.findIndex(u => u.email === user.email);
           if (r !== -1) setRank(r + 1);
        } catch (e) {
           console.error("Failed to fetch gamify stats or user limits", e);
        }
      }
    }
    async function fetchFitStatus() {
      if (user?._id) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/auth/google-fit/status`, { params: { userId: user._id } });
          setFitStatus({
            linked: res.data.linked,
            metrics: {
              steps: res.data.lastSyncedSteps || 0,
              hr: res.data.lastSyncedHeartRate || 0,
              calories: res.data.lastSyncedCalories || 0,
              sleep: res.data.lastSyncedSleep || 0,
            },
            lastSyncAt: res.data.lastSyncAt
          });
        } catch (e) {
          console.error("Fit status error", e);
        }
      }
    }

    fetchStats();
    fetchFitStatus();
  }, [user?._id]);

  const handleFitSync = async () => {
    if (!user?._id) return;
    setIsSyncing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/google-fit/sync`, { params: { userId: user._id } });
      if (res.data.success) {
        setFitStatus({
          linked: true,
          metrics: {
            steps: res.data.metrics.steps,
            hr: res.data.metrics.heartRate,
            calories: res.data.metrics.calories,
            sleep: res.data.metrics.sleepMinutes,
          },
          lastSyncAt: res.data.lastSyncAt
        });
        toast.success("Health data synchronized!");
      }
    } catch (e) {
      console.error("Sync error", e);
      toast.error("Failed to sync wearable data");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFitLink = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google-fit/link?userId=${user._id}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const fnErr = validateLength(firstName, LIMITS.PROFILE_NAME_MIN, LIMITS.PROFILE_NAME_MAX, "First name");
    if (fnErr) {
      toast.error(fnErr);
      return;
    }
    const lnErr = validateLength(lastName, LIMITS.PROFILE_NAME_MIN, LIMITS.PROFILE_NAME_MAX, "Last name");
    if (lnErr) {
      toast.error(lnErr);
      return;
    }
    const healthErr = validateLength(formData.diseasesAndAllergies, 0, LIMITS.PROFILE_HEALTH_TEXT_MAX, "Health notes");
    if (healthErr) {
      toast.error(healthErr);
      return;
    }

    try {
      const items = formData.diseasesAndAllergies.split(',').map(item => item.trim()).filter(item => item !== '');
      
      const res = await axios.put(
        `${API_BASE_URL}${API_ENDPOINTS.USERS}/${user._id}`,
        { 
          firstName,
          lastName,
          diseases: items, 
          allergies: items, 
          avatar: formData.avatar,
        }
      );

      dispatch(setUser(res.data));
      localStorage.setItem("user", JSON.stringify(res.data));

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
      <div className={`flex justify-center items-center min-h-[60vh] transition-colors duration-300 ${darkMode ? 'bg-[#020617] text-gray-100' : 'bg-gray-50 text-gray-600'}`}>
        <div className="animate-pulse text-lg text-gray-300">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${darkMode ? 'bg-[#020617]' : 'bg-gray-50'}`}>
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl ${darkMode ? 'opacity-30' : 'opacity-10'}`} />
        <div className={`absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl ${darkMode ? 'opacity-25' : 'opacity-10'}`} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        <div className={`relative rounded-xl border backdrop-blur-xl overflow-hidden ${darkMode ? 'border-[#1F2937] bg-[#020617]/80 shadow-[0_18px_45px_rgba(15,23,42,0.8)]' : 'border-gray-200 bg-white shadow-lg'}`}>
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />

          {/* Header */}
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-[#1F2937]' : 'border-gray-200'}`}>
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full mr-4 text-gray-300 hover:bg-[#020617]/80 hover:text-[#22D3EE] transition-colors"
              >
                <FiArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                My Profile
              </h2>
            </div>
          </div>

          {/* New Profile & Gamification Section */}
          <div className={`px-6 py-8 border-b flex flex-col items-center relative overflow-hidden ${darkMode ? 'border-[#1F2937]' : 'border-gray-200'}`}>
             
             {/* Gamification Background Effects */}
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
               <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${darkMode ? 'to-[#020617]' : 'to-gray-50'}`}></div>
             </div>

             <div className="relative mb-4">
               {formData.avatar ? (
                 <img src={formData.avatar} alt="Avatar" className={`w-24 h-24 rounded-full border-4 border-[#8B5CF6] object-cover shadow-[0_0_20px_rgba(139,92,246,0.3)] ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-100'}`} />
               ) : (
                 <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold bg-[#8B5CF6] text-white border-4 border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                   {user.firstName?.[0]}{user.lastName?.[0]}
                 </div>
               )}
             </div>
             
             <h3 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.firstName} {user.lastName}</h3>
             <p className={`text-sm mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</p>

             {/* Badges Display */}
             <div className="flex flex-wrap items-center justify-center gap-3 mb-8 min-h-[40px]">
                {rank === 1 && <GamifyBadge type="top1" />}
                {rank > 1 && rank <= 10 && <GamifyBadge type="top10" />}
                {rank > 10 && rank <= 50 && <GamifyBadge type="top50" />}
                {stats.streakCount >= 7 && <GamifyBadge type="beast" />}
                {/* Fallback badge if no accomplishments */}
                {(!rank || rank > 50) && stats.streakCount < 7 && (
                  <span className="text-xs text-gray-500 italic mt-2">Complete workouts to earn badges!</span>
                )}
             </div>

             {/* Stats Display */}
             <div className={`flex gap-8 text-center px-8 py-4 rounded-xl border ${darkMode ? 'bg-[#020617]/50 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
               <div>
                 <span className="block text-2xl font-black bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">{stats.points || 0}</span>
                 <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Points</span>
               </div>
               <div className={`w-px ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
               <div>
                 <span className="block text-2xl font-black bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent">{rank ? `#${rank}` : '-'}</span>
                 <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Rank</span>
               </div>
               <div className={`w-px ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
               <div>
                 <span className="block text-2xl font-black bg-gradient-to-r from-[#FACC15] to-[#F97316] bg-clip-text text-transparent">{stats.streakCount || 0}</span>
                 <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Day Streak</span>
               </div>
             </div>
          </div>

          {/* Form */}
          <div className="px-6 py-8">
            {/* Subscription Section */}
            <div className={`mb-6 p-4 rounded-xl flex flex-col gap-4 border ${darkMode ? 'bg-[#020617]/40 border-[#1F2937]' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Current Plan: <span className={`uppercase ${user?.plan === 'pro' ? 'text-yellow-400' : 'text-gray-400'}`}>{user?.plan === 'pro' ? 'Pro' : 'Free'}</span>
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {user?.plan === 'pro' ? 'Unlimited access to all features' : 'Usage limits apply'}
                  </p>
                </div>
                {(!user?.plan || user?.plan === 'free') && (
                  <button 
                    type="button"
                    onClick={() => navigate('/')} 
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-md hover:opacity-90 transition-transform hover:scale-105"
                  >
                    Upgrade
                  </button>
                )}
              </div>
              
              {(!user?.plan || user?.plan === 'free') && (
                <div className="mt-2 pt-3 border-t border-white/5 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Virtual Training Assistant</span>
                      <span className={`font-semibold flex items-center gap-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <span>{(user?.limits?.vtaUsage || 0)}</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-500">5</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-[#22D3EE] h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(((user?.limits?.vtaUsage || 0) / 5) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Photo Calorie Scanner</span>
                      <span className={`font-semibold flex items-center gap-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <span>{(user?.limits?.photoUsage || 0)}</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-500">5</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-[#8B5CF6] h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(((user?.limits?.photoUsage || 0) / 5) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-gray-500">Limits reset monthly.</p>
                </div>
              )}
            </div>

            {/* Wearables Section */}
            <div className={`mb-8 p-6 rounded-xl border relative overflow-hidden group hover:border-[#22D3EE]/40 transition-all duration-300 ${darkMode ? 'bg-[#020617]/40 border-[#1F2937]' : 'bg-gray-50 border-gray-200'}`}>
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Watch size={80} className={darkMode ? 'text-white' : 'text-gray-900'} />
               </div>
               
               <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className={`font-black text-lg flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Wearables & Devices
                    </h4>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Connect your smart watch to auto-sync health data.</p>
                  </div>
                  {!fitStatus.linked ? (
                    <button 
                      type="button"
                      onClick={handleFitLink}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#0f172a] border border-[#1F2937] text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]/50 transition-all"
                    >
                      <Plus size={14} /> Link Google Fit
                    </button>
                  ) : (
                    <button 
                      type="button"
                      disabled={isSyncing}
                      onClick={handleFitSync}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] hover:bg-[#22D3EE]/20 transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? "Syncing..." : "Sync Now"}
                    </button>
                  )}
               </div>

               {fitStatus.linked && (
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-[#0f172a]/50 border border-white/5 flex flex-col items-center">
                       <Activity size={18} className="text-[#22D3EE] mb-2" />
                       <span className="text-sm font-bold text-white">{fitStatus.metrics.steps}</span>
                       <span className="text-[10px] text-gray-500 uppercase font-black">Steps</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0f172a]/50 border border-white/5 flex flex-col items-center">
                       <Heart size={18} className="text-[#F87171] mb-2" />
                       <span className="text-sm font-bold text-white">{fitStatus.metrics.hr || '--'}</span>
                       <span className="text-[10px] text-gray-500 uppercase font-black">BPM</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0f172a]/50 border border-white/5 flex flex-col items-center">
                       <Zap size={18} className="text-[#FACC15] mb-2" />
                       <span className="text-sm font-bold text-white">{fitStatus.metrics.calories}</span>
                       <span className="text-[10px] text-gray-500 uppercase font-black">Kcal</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0f172a]/50 border border-white/5 flex flex-col items-center">
                       <Moon size={18} className="text-[#8B5CF6] mb-2" />
                       <span className="text-sm font-bold text-white">{Math.floor(fitStatus.metrics.sleep / 60)}h {fitStatus.metrics.sleep % 60}m</span>
                       <span className="text-[10px] text-gray-500 uppercase font-black">Sleep</span>
                    </div>
                 </div>
               )}

               {fitStatus.linked && fitStatus.lastSyncAt && (
                 <p className="text-[10px] text-gray-500 mt-4 text-center">
                    Last synchronised: {new Date(fitStatus.lastSyncAt).toLocaleString()}
                 </p>
               )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-300">
                  Select an Avatar
                </label>
                <div className="flex flex-wrap gap-4 mb-2">
                  {AVATARS.map((src, idx) => (
                    <img 
                      key={idx} 
                      src={src} 
                      alt={`Avatar ${idx+1}`} 
                      onClick={() => setFormData({...formData, avatar: src})}
                      className={`w-14 h-14 rounded-full cursor-pointer transition-all duration-200 border-2 ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-100'} 
                        ${formData.avatar === src 
                          ? 'border-[#22D3EE] scale-110 shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                          : `border-transparent ${darkMode ? 'hover:border-gray-500' : 'hover:border-gray-300'} hover:scale-105`
                        }`}
                    />
                  ))}
                  <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center cursor-pointer hover:border-[#22D3EE] hover:text-[#22D3EE] text-gray-400 transition-all">
                    <FiUpload size={20} />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Upload custom avatar" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Choose a preset avatar or click the plus button to upload your own profile picture.</p>
              </div>

              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium mb-2 text-gray-300"
                >
                  First Name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FiUser size={18} className="text-[#22D3EE]" />
                  </div>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    maxLength={LIMITS.PROFILE_NAME_MAX}
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent ${darkMode ? 'bg-[#020617]/60 border-[#1F2937] text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
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
                    <FiUser size={18} className="text-[#22D3EE]" />
                  </div>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    maxLength={LIMITS.PROFILE_NAME_MAX}
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent ${darkMode ? 'bg-[#020617]/60 border-[#1F2937] text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="diseasesAndAllergies"
                  className="block text-sm font-medium mb-2 text-gray-300"
                >
                  Diseases & Allergies (comma-separated)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <textarea
                    id="diseasesAndAllergies"
                    name="diseasesAndAllergies"
                    maxLength={LIMITS.PROFILE_HEALTH_TEXT_MAX}
                    value={formData.diseasesAndAllergies}
                    onChange={handleChange}
                    rows="4"
                    className={`block w-full pl-3 pr-3 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent ${darkMode ? 'bg-[#020617]/60 border-[#1F2937] text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                    placeholder="Diabetes, Hypertension, Pollen, Peanuts, etc."
                  ></textarea>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Enter any diseases, allergies, or health conditions separated by commas
                </p>
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
                    <FiMail size={18} className="text-[#8B5CF6]" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={user?.email || ""}
                    className={`block w-full pl-10 pr-3 py-3 rounded-md border focus:outline-none cursor-not-allowed ${darkMode ? 'bg-[#020617]/40 border-[#1F2937] text-gray-400 placeholder-gray-500' : 'bg-gray-100 border-gray-200 text-gray-500 placeholder-gray-400'}`}
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
                  className="w-full flex justify-center items-center py-3 px-4 rounded-md text-sm font-medium text-white bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#020617] focus:ring-[#8B5CF6] shadow-lg hover:shadow-[#8B5CF6]/30 transition-all font-bold"
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
