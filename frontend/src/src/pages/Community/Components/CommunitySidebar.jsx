import React from "react";
import { Trophy, TrendingUp, BarChart, Quote } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

const CommunitySidebar = ({ topContributors, currentUserStats }) => {
  const { darkMode } = useTheme();

  const MOTIVATIONAL_QUOTES = [
    "The only bad workout is the one that didn't happen.",
    "Fitness is not about being better than someone else. It's about being better than you were yesterday.",
    "Motivation is what gets you started. Habit is what keeps you going.",
    "Your body can stand almost anything. It's your mind that you have to convince.",
    "Don't stop when you're tired. Stop when you're done."
  ];

  const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

  // Theme-aware classes
  const cardClass = darkMode
    ? "relative rounded-2xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl p-5 overflow-hidden"
    : "relative rounded-2xl border border-gray-200 bg-white shadow-lg p-5 overflow-hidden";
  const titleClass = darkMode ? "font-bold text-white uppercase text-xs tracking-wider" : "font-bold text-gray-900 uppercase text-xs tracking-wider";
  const statBoxClass = darkMode
    ? "text-center p-3 rounded-xl bg-[#0f172a]/50 border border-[#1F2937]"
    : "text-center p-3 rounded-xl bg-gray-50 border border-gray-200";
  const statValueClass = darkMode ? "text-2xl font-black text-white" : "text-2xl font-black text-gray-900";
  const nameClass = darkMode
    ? "text-sm font-semibold text-gray-100 group-hover:text-[#22D3EE] transition-colors line-clamp-1"
    : "text-sm font-semibold text-gray-800 group-hover:text-[#8B5CF6] transition-colors line-clamp-1";
  const avatarClass = darkMode
    ? "w-9 h-9 rounded-full bg-[#0f172a] border border-[#1F2937] flex items-center justify-center font-bold text-[#22D3EE] text-xs overflow-hidden"
    : "w-9 h-9 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center font-bold text-[#8B5CF6] text-xs overflow-hidden";
  const quoteCardClass = darkMode
    ? "relative rounded-2xl border border-[#1F2937] bg-gradient-to-br from-[#020617] to-[#1e1b4b] p-6 overflow-hidden"
    : "relative rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-purple-50 p-6 overflow-hidden shadow-lg";
  const quoteTextClass = darkMode ? "text-sm text-gray-200 font-medium leading-relaxed relative z-10 italic" : "text-sm text-gray-700 font-medium leading-relaxed relative z-10 italic";

  return (
    <div className="space-y-6 shrink-0 w-full lg:w-80">
      {/* User Stats Card */}
      <div className={cardClass}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7]" />
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="w-5 h-5 text-[#8B5CF6]" />
          <h3 className={titleClass}>Your Impact</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={statBoxClass}>
            <p className={statValueClass}>{currentUserStats.postsCount || 0}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Posts</p>
          </div>
          <div className={statBoxClass}>
            <p className="text-2xl font-black text-[#22D3EE]">{currentUserStats.likesReceived || 0}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Likes Received</p>
          </div>
        </div>
      </div>

      {/* Top Contributors Card */}
      <div className={cardClass}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#22D3EE] to-[#0EA5E9]" />
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-[#FACC15]" />
          <h3 className={titleClass}>Top Contributors</h3>
        </div>
        <div className="space-y-4">
          {topContributors && topContributors.length > 0 ? (
            topContributors.slice(0, 5).map((contributor, idx) => (
              <div key={contributor._id || idx} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={avatarClass}>
                      {contributor.avatar ? (
                        <img src={contributor.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{contributor.firstName?.[0] || "U"}</span>
                      )}
                    </div>
                    {idx === 0 && <div className={`absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 ${darkMode ? 'border-[#020617]' : 'border-white'} ring-1 ring-yellow-400/50`} />}
                  </div>
                  <div>
                    <p className={nameClass}>
                      {contributor.firstName} {contributor.lastName}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase">{contributor.points || 0} Points</p>
                  </div>
                </div>
                {idx < 3 && (
                  <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                    idx === 0 ? 'bg-yellow-400/10 text-yellow-400' : 
                    idx === 1 ? 'bg-gray-400/10 text-gray-400' : 
                    'bg-orange-400/10 text-orange-400'
                  }`}>
                    #{idx + 1}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-gray-500 py-4 italic">Watching for legends...</p>
          )}
        </div>
      </div>

      {/* Daily Motivation Card */}
      <div className={quoteCardClass}>
         <div className="absolute -right-4 -top-4 opacity-10">
            <TrendingUp className="w-24 h-24" />
         </div>
         <Quote className="w-8 h-8 text-[#8B5CF6] mb-3 opacity-50" />
         <p className={quoteTextClass}>
           "{randomQuote}"
         </p>
      </div>
    </div>
  );
};

export default CommunitySidebar;
