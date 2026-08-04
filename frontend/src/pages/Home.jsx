import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BrainCircuit, 
  Target, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  HeartPulse
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-panel border border-indigo-500/30 mb-8"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold tracking-wide text-indigo-300">
              Powered by Google Gemini 1.5 & MongoDB
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight font-sans"
          >
            Don’t Just Get Marks.<br />
            Understand <span className="gradient-text">WHY You Lost Them.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed"
          >
            EduBridge AI replaces generic scorecards with deep Gemini-powered diagnostics, 
            identifying your exact learning gaps, estimating study hours required per chapter, 
            and crafting a personalized daily study & wellness roadmap.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-white gradient-bg shadow-glow-indigo hover:opacity-95 transition-all flex items-center justify-center space-x-2 group"
            >
              <span>Generate AI Test Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-slate-300 glass-panel border border-slate-700/80 hover:bg-slate-800/60 hover:text-white transition-all flex items-center justify-center"
            >
              Student Portal Login
            </Link>
          </motion.div>

        </div>
      </section>

      {/* Core Feature Value Matrix */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Why EduBridge AI is Different</h2>
            <p className="text-slate-400 mt-2">Traditional tests give numbers. EduBridge AI gives complete understanding.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="glass-card p-8 rounded-3xl border border-slate-800 hover:border-indigo-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Adaptive Gemini Questions</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Generates fresh 5-question topic tests & 15-question chapter tests dynamically. Adaptive difficulty shifts based on your MongoDB attempt history.
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Learning Gap Score</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Calculates a 0-100 gap index based on accuracy, wrong answers, time inefficiency, and repeated errors, flagging Critical/High priority topics.
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Healthy Study Routine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Builds daily study slots alongside hydration reminders, sleep schedules, meditation breaks, and screen-break habits for peak retention.
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
