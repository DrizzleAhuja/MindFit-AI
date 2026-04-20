import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/userSlice";
import { API_BASE_URL } from "../../../config/api";
import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import PostCard from "./Components/PostCard";
import CommunitySidebar from "./Components/CommunitySidebar";
import SkeletonPost from "./Components/SkeletonPost";
import { useTheme } from "../../context/ThemeContext";
import { Users, Send, Sparkles, Search, LayoutGrid, User as UserIcon, Image as ImageIcon, X } from "lucide-react";
import { toast } from "react-toastify";
import { validateLength, LIMITS } from "../../utils/formValidation";

export default function Community() {
  const { darkMode } = useTheme();
  const user = useSelector(selectUser);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("global"); // 'global' or 'me'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    async function fetchFeed() {
      if (!user?.email) return;
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/community/feed`, {
          headers: { email: user.email },
        });
        if (response.data.success) {
          setPosts(response.data.posts);
        }
      } catch (err) {
        console.error("Feed error:", err);
        setError("Failed to load community feed.");
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, [user]);

  // Derive top contributors based on total points of users in the system/posts
  const getTopContributors = () => {
    const userMap = new Map();
    posts.forEach((p) => {
      if (p.userId && !userMap.has(p.userId._id)) {
        userMap.set(p.userId._id, p.userId);
      }
    });
    return Array.from(userMap.values()).sort((a, b) => (b.points || 0) - (a.points || 0));
  };

  // Derive user stats
  const getUserStats = () => {
    if (!user) return {};
    const myPosts = posts.filter((p) => p.userId?._id === user._id);
    const likesReceived = myPosts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);
    return {
      postsCount: myPosts.length,
      likesReceived,
    };
  };

  const filteredPosts = posts.filter((post) => {
    const matchesTab = activeTab === "global" ? true : post.userId?._id === user?._id;
    const matchesSearch =
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${post.userId?.firstName} ${post.userId?.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const content = newPostContent.trim();
    if (!content) return;
    const err = validateLength(content, 1, LIMITS.COMMUNITY_POST_MAX, "Post");
    if (err) {
      toast.error(err);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/community/posts`,
        { content, mediaUrl: selectedImage },
        { headers: { email: user.email } }
      );
      if (response.data.success) {
        setPosts([response.data.post, ...posts]);
        setNewPostContent("");
        setSelectedImage(null);
        setImagePreview(null);
      }
    } catch (err) {
      console.error("Create post error:", err);
      toast.error(err.response?.data?.message || "Could not publish your post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleLikeToggle = (postId, isLiked, likesCount) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              isLiked,
              likes: isLiked
                ? [...(p.likes || []), user._id] // This is a simplification, but enough for the count check
                : (p.likes || []).filter((id) => id !== user._id),
            }
          : p
      )
    );
  };

  const cardShell = darkMode
    ? "relative rounded-2xl sm:rounded-3xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.8)] hover:border-[#22D3EE]/60 transition-all duration-300 overflow-hidden"
    : "relative rounded-2xl sm:rounded-3xl border border-gray-200 bg-white shadow-lg hover:shadow-xl hover:border-[#8B5CF6]/40 transition-all duration-300 overflow-hidden";

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        darkMode ? "bg-[#05010d] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <NavBar />

      <main className="flex-grow">
        <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl opacity-30" />
            <div className="absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl opacity-25" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <header className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#22D3EE]/20 border border-[#8B5CF6]/40 backdrop-blur-xl mb-4">
                <Sparkles className="w-5 h-5 text-[#FACC15]" />
                <span className={`text-sm font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                  Connect &amp; Inspire
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-4 tracking-tighter">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                  GenFit Community
                </span>
              </h1>
              <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your journey isn't solo—share progress, celebrate wins, and fuel the fire with fellow fitness seekers.
              </p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Main Content Area */}
              <div className="flex-1 w-full order-2 lg:order-1">
                {/* Search & Tabs Row */}
                <div className={`flex flex-col md:flex-row gap-4 mb-8 justify-between items-center backdrop-blur-lg p-2 rounded-2xl border ${darkMode ? 'bg-[#020617]/50 border-[#1F2937]' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <div className={`flex p-1 rounded-xl border w-full md:w-auto ${darkMode ? 'bg-[#0f172a] border-[#1F2937]' : 'bg-gray-100 border-gray-200'}`}>
                    <button
                      onClick={() => setActiveTab("global")}
                      className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === "global"
                          ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-lg shadow-[#8B5CF6]/30"
                          : darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Global Feed
                    </button>
                    <button
                      onClick={() => setActiveTab("me")}
                      className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === "me"
                          ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-lg shadow-[#8B5CF6]/30"
                          : darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <UserIcon className="w-4 h-4" />
                      My Posts
                    </button>
                  </div>

                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search posts or members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none transition-colors ${darkMode ? 'bg-[#0f172a] border border-[#1F2937] text-white focus:border-[#22D3EE]/50' : 'bg-gray-50 border border-gray-300 text-gray-900 focus:border-[#8B5CF6]/50'}`}
                    />
                  </div>
                </div>

                {/* Create Post */}
                {user && activeTab === "global" && (
                  <div className={`${cardShell} mb-10 ring-1 ring-[#8B5CF6]/20 ${darkMode ? 'bg-gradient-to-b from-[#020617] to-[#0f172a]' : ''}`}>
                    <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]" />
                    <form onSubmit={handlePostSubmit} className="p-6 pt-8">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE] p-[2px]">
                          <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-[#22D3EE] overflow-hidden ${darkMode ? 'bg-[#020617]' : 'bg-gray-100'}`}>
                            {user.avatar ? (
                              <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <span className="text-lg">{user.firstName?.[0] || "U"}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 relative">
                          <textarea
                            rows={3}
                            maxLength={LIMITS.COMMUNITY_POST_MAX}
                            className={`w-full bg-transparent border-none text-lg placeholder:text-gray-600 focus:outline-none focus:ring-0 resize-none min-h-[100px] ${darkMode ? 'text-white' : 'text-gray-900'}`}
                            placeholder={`What's your progress today, ${user.firstName || "warrior"}?`}
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            disabled={isSubmitting}
                          />
                          <div className="absolute bottom-0 right-0 text-[10px] text-gray-500 font-mono">
                            {newPostContent.length}/{LIMITS.COMMUNITY_POST_MAX}
                          </div>
                        </div>
                      </div>

                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="mt-4 relative inline-block group">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-h-64 rounded-xl border border-[#1F2937] shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className={`flex justify-between items-center mt-6 pt-4 border-t ${darkMode ? 'border-[#1F2937]' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                          <label className="cursor-pointer group flex items-center gap-2 text-gray-400 hover:text-[#22D3EE] transition-colors">
                            <div className={`p-2 rounded-lg border group-hover:border-[#22D3EE]/50 transition-all ${darkMode ? 'bg-[#0f172a] border-[#1F2937]' : 'bg-gray-100 border-gray-200'}`}>
                              <ImageIcon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Photo</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageChange}
                              disabled={isSubmitting}
                            />
                          </label>
                          <p className="text-xs text-gray-500 hidden sm:block">Max size: 5MB</p>
                        </div>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-black shadow-xl shadow-[#8B5CF6]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wide"
                          disabled={(!newPostContent.trim() && !selectedImage) || isSubmitting}
                        >
                          <Send className="w-4 h-4" />
                          {isSubmitting ? "Sharing..." : "Share Now"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Feed */}
                {loading ? (
                  <div className="space-y-6">
                    <SkeletonPost />
                    <SkeletonPost />
                    <SkeletonPost />
                  </div>
                ) : error ? (
                  <div className={`${cardShell} p-8 text-center border-red-500/30 bg-red-950/20`}>
                    <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-red-500 to-orange-500" />
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  <div className="space-y-6">
                    {filteredPosts.map((post) => (
                      <PostCard key={post._id} post={post} currentUser={user} onLikeToggle={handleLikeToggle} />
                    ))}
                  </div>
                ) : (
                  <div className={`${cardShell} p-16 text-center border-dashed`}>
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-700 opacity-20" />
                    <p className="text-gray-400 font-bold text-xl">No matching posts found</p>
                    <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto">
                      {searchQuery ? "Try a different search term or explore the global feed." : "Join the conversion and be the first to post!"}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar Area */}
              <div className="w-full lg:w-auto order-1 lg:order-2">
                <CommunitySidebar 
                  topContributors={getTopContributors()} 
                  currentUserStats={getUserStats()} 
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
