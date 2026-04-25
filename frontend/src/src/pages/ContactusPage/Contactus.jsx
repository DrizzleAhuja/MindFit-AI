import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../config/api";
import { toast } from "react-toastify";

import NavBar from "../HomePage/NavBar";
import Footer from "../HomePage/Footer";
import { useTheme } from '../../context/ThemeContext';
import { Mail, Phone, MapPin, Send, Sparkles } from 'lucide-react';
import { isValidEmail, validateLength, LIMITS } from '../../utils/formValidation';

export default function Contactus() {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    if (!name || !email || !message) {
      return toast.error("Please fill all required fields.");
    }
    if (!isValidEmail(email)) {
      return toast.error("Please enter a valid email address.");
    }
    const nameErr = validateLength(name, 1, LIMITS.CONTACT_NAME_MAX, "Name");
    if (nameErr) return toast.error(nameErr);
    const subjErr = validateLength(subject, 0, LIMITS.CONTACT_SUBJECT_MAX, "Subject");
    if (subjErr) return toast.error(subjErr);
    const msgErr = validateLength(message, LIMITS.CONTACT_MESSAGE_MIN, LIMITS.CONTACT_MESSAGE_MAX, "Message");
    if (msgErr) return toast.error(msgErr);

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/messages`, {
        name,
        email,
        item: subject || "No Subject",
        description: message
      });
      toast.success("Feedback sent successfully!");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error("Failed to send feedback");
    } finally {
      setLoading(false);
    }
  };

  // Theme-aware classes
  const cardClass = darkMode
    ? "relative h-full rounded-2xl border border-[#1F2937] bg-[#020617]/80 backdrop-blur-xl p-6 sm:p-8 flex flex-col shadow-[0_18px_45px_rgba(15,23,42,0.8)]"
    : "relative h-full rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 flex flex-col shadow-lg";
  const inputClass = darkMode
    ? "w-full p-3 rounded-xl border border-[#1F2937] bg-[#020617] text-white focus:ring-2 focus:ring-[#22D3EE]/50 focus:border-[#22D3EE] transition-all placeholder-gray-500"
    : "w-full p-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-[#8B5CF6]/50 focus:border-[#8B5CF6] transition-all placeholder-gray-400";
  const labelClass = darkMode ? "block text-sm font-medium mb-2 text-gray-300" : "block text-sm font-medium mb-2 text-gray-700";
  const headingClass = darkMode ? "text-xl sm:text-2xl font-semibold mb-6 text-white" : "text-xl sm:text-2xl font-semibold mb-6 text-gray-900";
  const subLabelClass = darkMode ? "text-sm font-semibold text-gray-400 mb-1" : "text-sm font-semibold text-gray-500 mb-1";
  const valueClass = darkMode ? "text-white" : "text-gray-900";
  const iconBoxClass = darkMode
    ? "flex items-center justify-center w-12 h-12 rounded-xl bg-[#020617] border border-[#1F2937] flex-shrink-0"
    : "flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0";
  const descClass = darkMode ? "text-gray-300" : "text-gray-600";
  const badgeTextClass = darkMode ? "text-gray-100" : "text-gray-700";
  const blobOpacity = darkMode ? "opacity-30" : "opacity-10";

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      darkMode ? 'bg-[#05010d] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <NavBar />
      
      <main className="flex-grow">
        <section className="relative overflow-hidden py-6 sm:py-8 lg:py-10">
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute -top-24 -left-16 w-72 h-72 bg-[#8B5CF6] rounded-full blur-3xl ${blobOpacity}`} />
            <div className={`absolute -bottom-28 right-0 w-80 h-80 bg-[#22D3EE] rounded-full blur-3xl ${blobOpacity}`} />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            {/* Header */}
            <header className="text-center mb-6 sm:mb-8 lg:mb-10">
              <div className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#22D3EE]/20 border border-[#8B5CF6]/40 backdrop-blur-xl mb-4`}>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FACC15]" />
                <span className={`text-xs sm:text-sm font-semibold ${badgeTextClass}`}>
                  Get in touch
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
                Contact{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]">
                  GenFit AI
                </span>
              </h1>

              <p className={`max-w-3xl mx-auto text-sm sm:text-base lg:text-lg ${descClass}`}>
                Have questions or feedback? We're here to help. Reach out and we'll get back to you as soon as possible.
              </p>
            </header>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-12">
              {/* Contact Information */}
              <div className={cardClass}>
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                <h2 className={headingClass}>Contact Information</h2>
                <div className="space-y-6 flex-1">
                  <div className="flex items-start gap-4">
                    <div className={iconBoxClass}>
                      <Mail className="w-6 h-6 text-[#22D3EE]" />
                    </div>
                    <div>
                      <h3 className={subLabelClass}>Email</h3>
                      <p className={valueClass}>info@genfitai.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={iconBoxClass}>
                      <Phone className="w-6 h-6 text-[#8B5CF6]" />
                    </div>
                    <div>
                      <h3 className={subLabelClass}>Phone</h3>
                      <p className={valueClass}>+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={iconBoxClass}>
                      <MapPin className="w-6 h-6 text-[#22D3EE]" />
                    </div>
                    <div>
                      <h3 className={subLabelClass}>Address</h3>
                      <p className={valueClass}>123 AI Wellness St, Future City, FW 98765</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Form */}
              <div className={cardClass}>
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#22D3EE]" />
                <h2 className={headingClass}>Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <label htmlFor="name" className={labelClass}>Name</label>
                    <input
                      type="text"
                      id="name"
                      required
                      maxLength={LIMITS.CONTACT_NAME_MAX}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={inputClass}
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={inputClass}
                      placeholder="your@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className={labelClass}>Subject (Optional)</label>
                    <input
                      type="text"
                      id="subject"
                      maxLength={LIMITS.CONTACT_SUBJECT_MAX}
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className={inputClass}
                      placeholder="Subject of your message"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="message" className={labelClass}>Message</label>
                    <textarea
                      id="message"
                      rows="5"
                      required
                      maxLength={LIMITS.CONTACT_MESSAGE_MAX}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className={`${inputClass} resize-none`}
                      placeholder="Your message..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-full text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-[#22D3EE] via-[#0EA5E9] to-[#8B5CF6] hover:opacity-95 transition-all duration-300 shadow-lg hover:shadow-[#22D3EE]/40 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Message"}
                    {!loading && <Send className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>

              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
