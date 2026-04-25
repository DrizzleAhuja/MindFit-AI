import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Bot, User, CheckCircle2, Languages, Sparkles } from 'lucide-react';

const AgentChatDemo = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(0);

  const demoSequence = [
    { role: 'user', text: 'Update my BMI to 60', type: 'voice' },
    { role: 'bot', text: 'Analyzing request... Adjusting your biometrics profile.', type: 'action' },
    { role: 'bot', text: 'BMI manually updated to 60. Tracking started for your new metabolic goal. ✅', type: 'text' },
    { role: 'user', text: 'Is my today\'s diet plan ready? हिंदी में बताओ।', type: 'text' },
    { role: 'bot', text: 'हाँ, आपका आज का डाइट प्लान तैयार है! इसमें उच्च प्रोटीन और मध्यम कार्ब्स शामिल हैं। (Yes, your plan is ready with high protein and moderate carbs.)', type: 'text' },
  ];

  useEffect(() => {
    if (step < demoSequence.length) {
      const timeout = setTimeout(() => {
        if (demoSequence[step].role === 'bot' && !isTyping && messages.length > 0) {
          setIsTyping(true);
          setTimeout(() => {
            setMessages(prev => [...prev, demoSequence[step]]);
            setIsTyping(false);
            setStep(prev => prev + 1);
          }, 1500);
        } else {
          setMessages(prev => [...prev, demoSequence[step]]);
          setStep(prev => prev + 1);
        }
      }, 2000);
      return () => clearTimeout(timeout);
    } else {
      // Loop the demo after a pause
      const resetTimeout = setTimeout(() => {
        setMessages([]);
        setStep(0);
      }, 5000);
      return () => clearTimeout(resetTimeout);
    }
  }, [step, isTyping]);

  return (
    <div className="relative w-full max-w-[500px] h-[550px] mx-auto perspective-1000">
      {/* Decorative Background Glows */}
      <div className="absolute -inset-10 bg-cyan-500/10 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute -inset-10 top-1/2 bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />

      {/* Main Chat Window */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-full flex flex-col bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-cyan-500/30 rounded-xl flex items-center justify-center bg-cyan-500/10">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-tight uppercase tracking-widest">FitSync Agent</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">AI Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 border border-white/10 rounded-full bg-white/5">
              <Languages className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-none">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={`${step}-${i}`}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-cyan-600 text-white rounded-tr-none' 
                    : 'bg-white/10 text-slate-200 border border-white/5 rounded-tl-none'
                }`}>
                  {msg.type === 'voice' && (
                    <div className="flex items-center gap-2 mb-1 border-b border-white/10 pb-1">
                      <Mic className="w-3 h-3 opacity-60" />
                      <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">Voice Command</span>
                    </div>
                  )}
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1">
                {[0, 1, 2].map(dot => (
                  <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-cyan-500/60 rounded-full"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: dot * 0.1 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer / Input Mimic */}
        <div className="p-6 pt-0 mt-auto">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group transition-all hover:border-cyan-500/30">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]"
              >
                <Mic className="w-5 h-5 text-white" />
              </motion.div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Listening Mode</p>
                <p className="text-[11px] font-bold text-slate-300">Hindi | English | ES Supported</p>
              </div>
            </div>
            <div className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center bg-white/5">
              <Send className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Overlay HUD bits */}
        <div className="absolute bottom-24 right-8 pointer-events-none opacity-40">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.3em]">Agentic Sync</span>
            </div>
            <div className="w-16 h-0.5 bg-cyan-500/30 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-cyan-400"
                 animate={{ x: [-64, 64] }}
                 transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
               />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AgentChatDemo;
