import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from '../../context/ThemeContext';
import GamifyBadge from "../../Components/GamifyBadge";

export default function Leaderboard() {
  const { darkMode } = useTheme();
  const user = useSelector(selectUser);
  const [weekly, setWeekly] = useState([]);
  const [allTime, setAllTime] = useState([]);
  const [stats, setStats] = useState({ points: 0, weeklyPoints: 0, streakCount: 0 });
  const [activeTab, setActiveTab] = useState('weekly');

  useEffect(() => {
    async function load() {
      try {
        const [w, a] = await Promise.all([
          axios.get(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/leaderboard`, { params: { period: 'week' } }),
          axios.get(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/leaderboard`, { params: { period: 'all' } }),
        ]);
        setWeekly(w.data.users || []);
        setAllTime(a.data.users || []);
      } catch {}
      try {
        if (user?.email) {
          const s = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.GAMIFY}/stats`, { params: { email: user.email } });
          setStats(s.data || {});
        }
      } catch {}
    }
    load();
  }, [user]);

  const Row = ({ u, i, weeklyMode }) => {
    const points = weeklyMode ? (u.weeklyPoints || 0) : (u.points || 0);
    const safeUserEmail = user?.email?.toLowerCase() || '';
    const isCurrentUser = Boolean(u.email && u.email.toLowerCase() === safeUserEmail);
    
    // Streak logic - we check if user has streak count. If current user, we fallback to stats.
    const userStreak = isCurrentUser ? (stats.streakCount || 0) : (u.streakCount || 0);

    return (
      <div 
        className={`leaderboard-row group relative overflow-hidden ${
          isCurrentUser ? 'current-user-row' : ''
        }`}
      >
        {/* Rank Badge */}
        <div className="flex items-center gap-4">
          <div className={`rank-badge ${
            i === 0 ? 'rank-1' :
            i === 1 ? 'rank-2' :
            i === 2 ? 'rank-3' :
            isCurrentUser ? 'rank-current' :
            'rank-normal'
          }`}>
            {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
          </div>

          {/* Avatar */}
          <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full overflow-hidden border border-[#22D3EE]/30 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.1)] ${darkMode ? 'bg-[#0f172a]' : 'bg-gray-100'}`}>
            {u.avatar ? (
              <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-gray-400">
                {u.firstName?.[0]}{u.lastName?.[0]}
              </span>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <div className={`font-bold truncate max-w-[150px] sm:max-w-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {u.firstName || 'User'} {u.lastName || ''}
              </div>
              {isCurrentUser && (
                <span className="you-badge shrink-0">
                  <span className="relative z-10">You</span>
                </span>
              )}

              {/* Badges Section */}
              <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:ml-4">
                {i === 0 && <GamifyBadge type="top1" />}
                {i > 0 && i < 10 && <GamifyBadge type="top10" />}
                {i >= 10 && i < 50 && <GamifyBadge type="top50" />}
                {userStreak >= 7 && <GamifyBadge type="beast" />}
              </div>
            </div>
            <div className="text-xs text-gray-400 truncate">{u.email}</div>
          </div>

          {/* Points */}
          <div className="points-display">
            <div className="text-2xl font-black bg-gradient-to-r from-[#22D3EE] via-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent">
              {points}
            </div>
            <div className="text-xs text-gray-400 font-medium">points</div>
          </div>
        </div>

        {/* Animated Background for Current User */}
        {isCurrentUser && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/10 via-[#A855F7]/10 to-[#22D3EE]/10 -z-10"></div>
        )}
        
        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 -z-10"></div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-[#05010d] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <style>{`
        .dynamic-feedback-banner {
          background: ${darkMode ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)' : 'linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)'};
          border: 1px solid ${darkMode ? 'rgba(34, 211, 238, 0.4)' : 'rgba(139, 92, 246, 0.3)'};
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: ${darkMode ? '0 4px 20px rgba(34, 211, 238, 0.1)' : '0 4px 20px rgba(0,0,0,0.06)'};
          animation: pulse-border 2.5s infinite;
        }
        
        @keyframes pulse-border {
          0% { border-color: rgba(34, 211, 238, 0.2); box-shadow: 0 4px 20px rgba(34, 211, 238, 0.1); }
          50% { border-color: rgba(139, 92, 246, 0.8); box-shadow: 0 4px 30px rgba(139, 92, 246, 0.3); }
          100% { border-color: rgba(34, 211, 238, 0.2); box-shadow: 0 4px 20px rgba(34, 211, 238, 0.1); }
        }

        .dynamic-feedback-banner.top-performer {
          background: linear-gradient(135deg, rgba(250, 204, 21, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%);
          animation: pulse-gold 2.5s infinite;
        }

        @keyframes pulse-gold {
          0% { border-color: rgba(250, 204, 21, 0.2); box-shadow: 0 4px 20px rgba(250, 204, 21, 0.1); }
          50% { border-color: rgba(250, 204, 21, 0.8); box-shadow: 0 4px 30px rgba(250, 204, 21, 0.3); }
          100% { border-color: rgba(250, 204, 21, 0.2); box-shadow: 0 4px 20px rgba(250, 204, 21, 0.1); }
        }

        .leaderboard-row {
          position: relative;
          padding: 1.25rem;
          margin-bottom: 0.75rem;
          border-radius: 1rem;
          background: ${darkMode ? 'rgba(2, 6, 23, 0.8)' : 'white'};
          backdrop-filter: blur(12px);
          border: 1px solid ${darkMode ? '#1F2937' : '#e5e7eb'};
          box-shadow: ${darkMode ? '0 18px 45px rgba(15, 23, 42, 0.8)' : '0 2px 8px rgba(0,0,0,0.06)'};
        }

        .leaderboard-row:hover {
          border-color: rgba(34, 211, 238, 0.5);
        }

        .current-user-row {
          background: ${darkMode ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)' : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(34, 211, 238, 0.06) 100%)'};
          border: 2px solid rgba(34, 211, 238, 0.5);
          box-shadow: ${darkMode ? '0 0 30px rgba(139, 92, 246, 0.25)' : '0 0 15px rgba(139, 92, 246, 0.1)'};
        }

        .rank-badge {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.125rem;
          position: relative;
          z-index: 10;
        }

        .rank-1 {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #7C2D12;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        }

        .rank-2 {
          background: linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%);
          color: #1F2937;
          box-shadow: 0 0 15px rgba(192, 192, 192, 0.4);
        }

        .rank-3 {
          background: linear-gradient(135deg, #CD7F32 0%, #B87333 100%);
          color: #7C2D12;
          box-shadow: 0 0 15px rgba(205, 127, 50, 0.4);
        }

        .rank-current {
          background: linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%);
          color: white;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
        }

        .rank-normal {
          background: ${darkMode ? 'rgba(2, 6, 23, 0.9)' : '#f3f4f6'};
          border: 1px solid ${darkMode ? '#1F2937' : '#e5e7eb'};
          color: ${darkMode ? '#D1D5DB' : '#6b7280'};
        }

        .you-badge {
          position: relative;
          padding: 0.25rem 0.75rem;
          background: linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%);
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
        }

        .points-display {
          text-align: right;
          min-width: 80px;
        }

        .stat-card {
          position: relative;
          background: ${darkMode ? 'rgba(2, 6, 23, 0.8)' : 'white'};
          backdrop-filter: blur(20px);
          border-radius: 1.5rem;
          padding: 2rem;
          border: 1px solid ${darkMode ? '#1F2937' : '#e5e7eb'};
          overflow: hidden;
          box-shadow: ${darkMode ? '0 18px 45px rgba(15, 23, 42, 0.8)' : '0 4px 12px rgba(0,0,0,0.06)'};
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          border-radius: 1.5rem 1.5rem 0 0;
          background: linear-gradient(90deg, #8B5CF6, #A855F7, #22D3EE);
          z-index: 1;
        }

        .info-card {
          position: relative;
          background: ${darkMode ? 'rgba(2, 6, 23, 0.8)' : 'white'};
          backdrop-filter: blur(20px);
          border-radius: 1.5rem;
          padding: 2rem;
          border: 1px solid ${darkMode ? '#1F2937' : '#e5e7eb'};
          box-shadow: ${darkMode ? '0 18px 45px rgba(15, 23, 42, 0.8)' : '0 4px 12px rgba(0,0,0,0.06)'};
        }

        .info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          border-radius: 1.5rem 1.5rem 0 0;
          background: linear-gradient(90deg, #8B5CF6, #A855F7, #22D3EE);
          z-index: 1;
        }

        .info-item {
          background: ${darkMode ? 'rgba(2, 6, 23, 0.6)' : '#f9fafb'};
          backdrop-filter: blur(10px);
          border-radius: 0.75rem;
          padding: 1rem;
          border: 1px solid ${darkMode ? '#1F2937' : '#e5e7eb'};
        }

        .leaderboard-section {
          position: relative;
          background: ${darkMode ? 'rgba(2, 6, 23, 0.8)' : 'white'};
          backdrop-filter: blur(20px);
          border-radius: 1.5rem;
          padding: 2rem;
          border: 1px solid ${darkMode ? '#1F2937' : '#e5e7eb'};
          box-shadow: ${darkMode ? '0 18px 45px rgba(15, 23, 42, 0.8)' : '0 4px 12px rgba(0,0,0,0.06)'};
        }

        .leaderboard-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          border-radius: 1.5rem 1.5rem 0 0;
          background: linear-gradient(90deg, #8B5CF6, #A855F7, #22D3EE);
          z-index: 1;
        }

        .tab-button {
          position: relative;
          padding: 0.75rem 2rem;
          font-weight: 600;
          border-radius: 0.75rem;
          background: transparent;
          border: 1px solid ${darkMode ? '#1F2937' : '#e5e7eb'};
          color: ${darkMode ? '#9CA3AF' : '#6b7280'};
          cursor: pointer;
        }

        .tab-button:hover {
          border-color: rgba(34, 211, 238, 0.5);
          color: ${darkMode ? 'white' : '#111827'};
        }

        .tab-button.active {
          color: white;
          background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #22D3EE 100%);
          border-color: rgba(34, 211, 238, 0.5);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.35);
        }

        .leaderboard-split-scroll {
          max-height: 600px;
          display: flex;
          flex-direction: column;
        }

        .scroll-container {
          overflow-y: auto;
          padding-right: 0.5rem;
          min-height: 0;
          flex: 1 1 auto;
        }

        .scroll-container.scroll-only {
          max-height: 600px;
        }

        .sticky-me-panel {
          flex-shrink: 0;
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          border-top: 2px solid rgba(34, 211, 238, 0.45);
          background: ${darkMode ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)' : 'linear-gradient(180deg, rgba(249,250,251,0.98) 0%, white 100%)'};
          border-radius: 0 0 1rem 1rem;
          box-shadow: ${darkMode ? '0 -8px 32px rgba(15, 23, 42, 0.9)' : '0 -4px 16px rgba(0,0,0,0.05)'};
        }

        .sticky-me-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(34, 211, 238, 0.9);
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .sticky-me-panel .leaderboard-row {
          margin-bottom: 0;
        }

        .quick-log-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2.5rem;
          min-height: 2.5rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(34, 211, 238, 0.35);
          background: rgba(34, 211, 238, 0.08);
          font-size: 1.125rem;
          line-height: 1;
          transition: background 0.15s, border-color 0.15s, transform 0.15s;
        }

        .quick-log-link:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.55);
          transform: scale(1.05);
        }

        .scroll-container::-webkit-scrollbar {
          width: 8px;
        }

        .scroll-container::-webkit-scrollbar-track {
          background: ${darkMode ? 'rgba(2, 6, 23, 0.5)' : '#f3f4f6'};
          border-radius: 10px;
        }

        .scroll-container::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%);
          border-radius: 10px;
        }
      `}</style>

      <NavBar />
      
      {/* Weekly Challenge Banner */}
      {stats?.weeklyChallenge?.title && (
        <div className="bg-gradient-to-r from-[#22D3EE] via-[#8B5CF6] to-[#A855F7] text-white p-3 font-bold text-center text-sm z-40 shadow-lg border-b border-[#22D3EE]/30 relative overflow-hidden group">
          <div className="flex items-center justify-center gap-3">
            <span className="flex items-center justify-center bg-white/20 p-1.5 rounded-lg animate-pulse">🏆</span>
            <span className="truncate">
              <span className="text-[#FACC15]">Active Weekly Challenge:</span> {stats.weeklyChallenge.title} — {stats.weeklyChallenge.progress || 0}/{stats.weeklyChallenge.target || 3} workouts!
            </span>
            {stats.weeklyChallenge.weekEndAt && (
              <span className="text-xs bg-black/30 border border-white/20 px-3 py-1 rounded-full shrink-0">
                Ends: {new Date(stats.weeklyChallenge.weekEndAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      <main className="flex-grow">
        <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10">
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl ${darkMode ? 'opacity-30' : 'opacity-10'}`} />
            <div className={`absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl ${darkMode ? 'opacity-25' : 'opacity-10'}`} />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Header */}
            <header className="text-center mb-10 sm:mb-14 lg:mb-16">
              <div className="flex flex-col items-center justify-center mb-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                    Leaderboard
                  </span>
                </h1>
              </div>

              <p className={`max-w-3xl mx-auto text-sm sm:text-base lg:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Compete, track, and dominate your fitness journey. See where you rank among users.
              </p>
            </header>

            {/* Dynamic Feedback Banner */}
            {user?.email && (
              <div className="mb-8">
                {(() => {
                  const list = activeTab === 'weekly' ? weekly : allTime;
                  const safeUserEmail = user?.email?.toLowerCase() || '';
                  const userIndex = list.findIndex(u => u.email && u.email.toLowerCase() === safeUserEmail);
                  
                  if (userIndex === -1) return (
                    <div className="dynamic-feedback-banner text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4">
                        <span className="text-4xl sm:text-3xl">🚀</span>
                        <div>
                          <div className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Join the Ranks!</div>
                          <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Complete workouts and log your BMI to get on the leaderboard!</div>
                        </div>
                      </div>
                    </div>
                  );

                  if (userIndex === 0) return (
                    <div className="dynamic-feedback-banner top-performer text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4">
                        <span className="text-4xl sm:text-3xl drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">👑</span>
                        <div>
                          <div className="font-bold text-xl text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">Top Performer</div>
                          <div className="text-yellow-100">You are Rank #1! Keep up the great work to defend your title!</div>
                        </div>
                      </div>
                    </div>
                  );

                  const currentUserScore = activeTab === 'weekly' ? (list[userIndex].weeklyPoints || 0) : (list[userIndex].points || 0);
                  const userAbove = list[userIndex - 1];
                  const userAboveScore = activeTab === 'weekly' ? (userAbove.weeklyPoints || 0) : (userAbove.points || 0);
                  const pointsNeeded = userAboveScore - currentUserScore + 1;
                  
                  // Check close to top 10 or top 50
                  let milestoneMsg = "";
                  if (userIndex > 0 && userIndex <= 9) {
                     // Inside top 10
                     milestoneMsg = `You are #${userIndex + 1}! Just ONE spot away from top ${userIndex}.`;
                  } else if (userIndex > 9 && list[9]) {
                     const top10User = list[9];
                     const top10Score = activeTab === 'weekly' ? (top10User.weeklyPoints || 0) : (top10User.points || 0);
                     const pointsToTop10 = top10Score - currentUserScore + 1;
                     if (pointsToTop10 > 0 && pointsToTop10 <= 100) {
                        milestoneMsg = `You are #${userIndex + 1}, just ${pointsToTop10} points away from the Elite Squad (Top 10)!`;
                     }
                  } else if (userIndex >= 50 && list[49]) {
                     const top50User = list[49];
                     const top50Score = activeTab === 'weekly' ? (top50User.weeklyPoints || 0) : (top50User.points || 0);
                     const pointsToTop50 = top50Score - currentUserScore + 1;
                     if (pointsToTop50 > 0 && pointsToTop50 <= 100) {
                        milestoneMsg = `You are #${userIndex + 1}, just ${pointsToTop50} points away from the Rising Star (Top 50) badge!`;
                     }
                  }
                  
                  const workoutsNeeded = Math.ceil(pointsNeeded / 20);
                  const nameAbove = userAbove.firstName || 'the next user';

                  return (
                    <div className="dynamic-feedback-banner text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4">
                        <span className="text-4xl sm:text-3xl drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">🔥</span>
                        <div>
                          <div className={`font-bold text-xl mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Target Acquired!</div>
                          <div className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                            {milestoneMsg ? (
                              <span className="font-medium text-cyan-300">{milestoneMsg} </span>
                            ) : null}
                            Overtake <span className="font-bold text-purple-400">{nameAbove}</span> by earning{" "}
                            {pointsNeeded} points{" "}
                            <span className="whitespace-nowrap">
                              (Just{" "}
                              <Link
                                to="/Workout"
                                className="inline-flex items-baseline font-bold text-cyan-300 underline decoration-cyan-400/70 decoration-2 underline-offset-2 hover:text-white hover:decoration-white rounded px-1.5 py-0.5 hover:bg-cyan-500/20 transition-colors"
                              >
                                {workoutsNeeded} workout{workoutsNeeded > 1 ? "s" : ""}
                              </Link>
                              !)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="stat-card stat-card-1">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">This Week</div>
                <div className="text-3xl">📅</div>
              </div>
              <div className="text-5xl font-black bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent mb-2">
                {stats.weeklyPoints || 0}
              </div>
              <div className="text-sm text-gray-400">Points earned this week</div>
              <div className={`mt-4 h-2 rounded-full overflow-hidden border ${darkMode ? 'bg-[#020617]/60 border-[#1F2937]' : 'bg-gray-100 border-gray-200'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] rounded-full"
                  style={{ width: `${Math.min((stats.weeklyPoints || 0) / 100 * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="stat-card stat-card-2">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">All-Time</div>
                <div className="text-3xl">💎</div>
              </div>
              <div className="text-5xl font-black bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] bg-clip-text text-transparent mb-2">
                {stats.points || 0}
              </div>
              <div className="text-sm text-gray-400">Total lifetime points</div>
              <div className={`mt-4 h-2 rounded-full overflow-hidden border ${darkMode ? 'bg-[#020617]/60 border-[#1F2937]' : 'bg-gray-100 border-gray-200'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] rounded-full"
                  style={{ width: `${Math.min((stats.points || 0) / 500 * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="stat-card stat-card-3">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Streak</div>
                <div className="text-3xl">🔥</div>
              </div>
              <div className="text-5xl font-black bg-gradient-to-r from-[#FACC15] to-[#F97316] bg-clip-text text-transparent mb-2">
                {stats.streakCount || 0}
              </div>
              <div className="text-sm text-gray-400">Consecutive days active</div>
              <div className={`mt-4 h-2 rounded-full overflow-hidden border ${darkMode ? 'bg-[#020617]/60 border-[#1F2937]' : 'bg-gray-100 border-gray-200'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-[#FACC15] to-[#F97316] rounded-full"
                  style={{ width: `${Math.min((stats.streakCount || 0) / 30 * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Points Info Card */}
          <div className="info-card mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">💡</div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE] bg-clip-text text-transparent">
                How to Earn Points
              </h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Tap a quick-log icon to jump straight to the screen where you can earn that reward.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="info-item">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-2xl shrink-0">📊</div>
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>BMI Save/Update</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-2xl font-black bg-gradient-to-r from-[#22D3EE] to-[#8B5CF6] bg-clip-text text-transparent">
                      +10
                    </span>
                    <Link
                      to="/CurrentBMI"
                      className="quick-log-link"
                      title="Open BMI calculator"
                      aria-label="Quick log: BMI (plus 10 points)"
                    >
                      📝
                    </Link>
                  </div>
                </div>
              </div>
              <div className="info-item">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-2xl shrink-0">💪</div>
                    <span className="text-gray-200 font-medium">Workout Plan Generated</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-2xl font-black bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] bg-clip-text text-transparent">
                      +20
                    </span>
                    <Link
                      to="/my-workout-plan"
                      className="quick-log-link"
                      title="Open my workout plan"
                      aria-label="Quick log: workout plan (plus 20 points)"
                    >
                      📋
                    </Link>
                  </div>
                </div>
              </div>
              <div className="info-item">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-2xl shrink-0">✅</div>
                    <span className="text-gray-200 font-medium">Workout Day Completed</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-2xl font-black bg-gradient-to-r from-[#FACC15] to-[#F97316] bg-clip-text text-transparent">
                      +20
                    </span>
                    <Link
                      to="/Workout"
                      className="quick-log-link"
                      title="Open workouts"
                      aria-label="Quick log: complete a workout day (plus 20 points)"
                    >
                      🏋️
                    </Link>
                  </div>
                </div>
              </div>
              <div className="info-item">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-2xl shrink-0">🥗</div>
                    <span className="text-gray-200 font-medium">Diet Chart Generated</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-2xl font-black bg-gradient-to-r from-[#A855F7] to-[#22D3EE] bg-clip-text text-transparent">
                      +20
                    </span>
                    <Link
                      to="/diet-chart"
                      className="quick-log-link"
                      title="Open diet chart"
                      aria-label="Quick log: diet chart (plus 20 points)"
                    >
                      🥗
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rewards & Badges Info */}
          <div className="info-card mb-12 border-t border-t-purple-500/30">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE] p-[1px]">
                <div className={`w-full h-full rounded-xl flex items-center justify-center text-2xl ${darkMode ? 'bg-[#020617]' : 'bg-white'}`}>
                  🏅
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  Awards & Badges
                </h2>
                <p className="text-sm text-gray-400">Unlock these prestigious badges by dominating the leaderboards.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Badge 1 */}
              <div className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 flex flex-col items-center text-center ${darkMode ? 'bg-gradient-to-b from-[#020617] to-yellow-900/10 border-yellow-500/20 hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]' : 'bg-gradient-to-b from-white to-yellow-50 border-yellow-200 hover:border-yellow-400 hover:shadow-lg'}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                
                <div className="w-full py-6 mb-2 relative z-10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="scale-125 transform transition-transform group-hover:scale-150 duration-500">
                    <GamifyBadge type="top1" />
                  </div>
                </div>
                
                <div className="relative z-10 space-y-2 mt-2 w-full">
                  <h3 className="text-white font-bold text-lg">Top Performer</h3>
                  <p className="text-xs text-gray-400/90 font-medium pb-2 border-b border-gray-800">Rank #1 Overall</p>
                  <p className="text-[10px] text-yellow-400 font-bold bg-yellow-400/10 px-3 py-1.5 rounded-full w-max mx-auto border border-yellow-500/20 uppercase tracking-wider">+ Bonus Points</p>
                </div>
              </div>
              
              {/* Badge 2 */}
              <div className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 flex flex-col items-center text-center ${darkMode ? 'bg-gradient-to-b from-[#020617] to-gray-500/10 border-gray-400/20 hover:border-gray-400/50 hover:shadow-[0_0_30px_rgba(156,163,175,0.15)]' : 'bg-gradient-to-b from-white to-gray-100 border-gray-200 hover:border-gray-300 hover:shadow-lg'}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-gray-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                
                <div className="w-full py-6 mb-2 relative z-10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gray-400/20 rounded-full blur-2xl"></div>
                  <div className="scale-125 transform transition-transform group-hover:scale-150 duration-500">
                    <GamifyBadge type="top10" />
                  </div>
                </div>
                
                <div className="relative z-10 space-y-2 mt-2 w-full">
                  <h3 className="text-white font-bold text-lg">Elite Squad</h3>
                  <p className="text-xs text-gray-400/90 font-medium pb-2 border-b border-gray-800">Rank #2 to #10</p>
                  <p className="text-[10px] text-gray-300 font-bold bg-gray-500/20 px-3 py-1.5 rounded-full w-max mx-auto border border-gray-400/20 uppercase tracking-wider">Highly Exclusive</p>
                </div>
              </div>
              
              {/* Badge 3 */}
              <div className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 flex flex-col items-center text-center ${darkMode ? 'bg-gradient-to-b from-[#020617] to-amber-700/10 border-amber-600/20 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(217,119,6,0.15)]' : 'bg-gradient-to-b from-white to-amber-50 border-amber-200 hover:border-amber-400 hover:shadow-lg'}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                
                <div className="w-full py-6 mb-2 relative z-10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-amber-600/20 rounded-full blur-2xl"></div>
                  <div className="scale-125 transform transition-transform group-hover:scale-150 duration-500">
                    <GamifyBadge type="top50" />
                  </div>
                </div>
                
                <div className="relative z-10 space-y-2 mt-2 w-full">
                  <h3 className="text-white font-bold text-lg">Rising Star</h3>
                  <p className="text-xs text-gray-400/90 font-medium pb-2 border-b border-gray-800">Rank #11 to #50</p>
                  <p className="text-[10px] text-amber-500 font-bold bg-amber-600/10 px-3 py-1.5 rounded-full w-max mx-auto border border-amber-600/20 uppercase tracking-wider">Top Tier Dedication</p>
                </div>
              </div>
              
              {/* Badge 4 */}
              <div className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 flex flex-col items-center text-center ${darkMode ? 'bg-gradient-to-b from-[#020617] to-red-600/10 border-orange-500/20 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 'bg-gradient-to-b from-white to-red-50 border-red-200 hover:border-red-400 hover:shadow-lg'}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
                
                <div className="w-full py-6 mb-2 relative z-10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="scale-125 transform transition-transform group-hover:scale-150 duration-500">
                    <GamifyBadge type="beast" />
                  </div>
                </div>
                
                <div className="relative z-10 space-y-2 mt-2 w-full">
                  <h3 className="text-white font-bold text-lg">Consistent Beast</h3>
                  <p className="text-xs text-gray-400/90 font-medium pb-2 border-b border-gray-800">7-Day Active Streak</p>
                  <p className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-3 py-1.5 rounded-full w-max mx-auto border border-orange-500/20 uppercase tracking-wider">Never Give Up</p>
                </div>
              </div>

            </div>
          </div>

          {/* Leaderboard Tables */}
          <div className="leaderboard-section">
            {/* Tabs */}
            <div className="flex gap-4 mb-8 justify-center">
              <button 
                className={`tab-button ${activeTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setActiveTab('weekly')}
              >
                📅 Weekly Leaders
              </button>
              <button 
                className={`tab-button ${activeTab === 'alltime' ? 'active' : ''}`}
                onClick={() => setActiveTab('alltime')}
              >
                👑 All-Time Champions
              </button>
            </div>

            {/* Leaderboard Content — scroll others; pin signed-in user to bottom when ranked */}
            {activeTab === "weekly" ? (
              weekly.length > 0 ? (
                (() => {
                  const list = weekly;
                  const safeUserEmail = user?.email?.toLowerCase() || '';
                  const myIdx = safeUserEmail === ''
                    ? -1
                    : list.findIndex((u) => u.email && u.email.toLowerCase() === safeUserEmail);
                  const me = myIdx >= 0 ? list[myIdx] : null;
                  const others = me ? list.filter((u) => !u.email || u.email.toLowerCase() !== safeUserEmail) : list;
                  return (
                    <div className="leaderboard-split-scroll">
                      <div className="scroll-container">
                        {others.map((u) => {
                          const i = list.findIndex((x) => x.email === u.email);
                          return (
                            <Row key={u._id || u.email || i} u={u} i={i} weeklyMode />
                          );
                        })}
                      </div>
                      {me && (
                        <div className="sticky-me-panel">
                          <div className="sticky-me-label">Your rank</div>
                          <Row u={me} i={myIdx} weeklyMode />
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="scroll-container scroll-only text-center text-gray-400 py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-xl">No weekly data available yet</p>
                  <p className="text-sm mt-2">Start earning points to appear on the leaderboard!</p>
                </div>
              )
            ) : allTime.length > 0 ? (
              (() => {
                const list = allTime;
                const safeUserEmail = user?.email?.toLowerCase() || '';
                const myIdx = safeUserEmail === ''
                  ? -1
                  : list.findIndex((u) => u.email && u.email.toLowerCase() === safeUserEmail);
                const me = myIdx >= 0 ? list[myIdx] : null;
                const others = me ? list.filter((u) => !u.email || u.email.toLowerCase() !== safeUserEmail) : list;
                return (
                  <div className="leaderboard-split-scroll">
                    <div className="scroll-container">
                      {others.map((u) => {
                        const i = list.findIndex((x) => x.email === u.email);
                        return <Row key={u._id || u.email || i} u={u} i={i} />;
                      })}
                    </div>
                    {me && (
                      <div className="sticky-me-panel">
                        <div className="sticky-me-label">Your rank</div>
                        <Row u={me} i={myIdx} />
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="scroll-container scroll-only text-center text-gray-400 py-12">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-xl">No all-time data available yet</p>
                <p className="text-sm mt-2">Be the first to earn points!</p>
              </div>
            )}
          </div>
        </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}