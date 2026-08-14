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
  HeartPulse,
  FileSpreadsheet,
  CalendarCheck,
  BarChart3,
  Award,
  Clock
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Hero Section with Vibrant Background Gradients */}
      <section className="relative pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-slate-50 via-emerald-50/25 to-slate-50">
        {/* Radiant Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-emerald-400/20 via-teal-400/20 to-sky-400/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-gradient-to-bl from-violet-400/20 via-purple-400/15 to-indigo-400/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-gradient-to-tr from-amber-400/15 to-rose-400/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-300 mb-8 shadow-soft-sm"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-xs font-extrabold tracking-wide text-slate-800">
              Powered by <span className="text-emerald-700 font-black">Google Gemini AI</span> & <span className="text-teal-700 font-black">MongoDB Atlas</span>
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-tight font-sans"
          >
            Don’t Just Get Marks.<br />
            Understand <span className="gradient-text">WHY You Lost Them.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            EduBridge AI replaces generic scorecards with deep Gemini-powered diagnostics and OCR Marksheet Analysis, 
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
              to="/marksheet-analyzer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 shadow-glow-emerald hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2.5 group"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>AI Marksheet Analyzer</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-slate-800 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-slate-50 transition-all flex items-center justify-center shadow-soft-sm"
            >
              Student Portal Login
            </Link>
          </motion.div>

          {/* Highlights Mini Grid */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-2xl stat-card-emerald shadow-soft-sm">
              <div className="flex items-center space-x-2 text-emerald-700 font-extrabold text-xs uppercase mb-1">
                <BrainCircuit className="w-4 h-4" />
                <span>AI Diagnostics</span>
              </div>
              <p className="text-xl font-black text-slate-900">0-100 Gap Index</p>
              <p className="text-xs text-slate-600 mt-0.5">Prioritizes Critical Areas</p>
            </div>

            <div className="p-4 rounded-2xl stat-card-violet shadow-soft-sm">
              <div className="flex items-center space-x-2 text-violet-700 font-extrabold text-xs uppercase mb-1">
                <FileSpreadsheet className="w-4 h-4" />
                <span>OCR Marksheet</span>
              </div>
              <p className="text-xl font-black text-slate-900">Instant PDF Scan</p>
              <p className="text-xs text-slate-600 mt-0.5">Deep Subject Breakdown</p>
            </div>

            <div className="p-4 rounded-2xl stat-card-amber shadow-soft-sm">
              <div className="flex items-center space-x-2 text-amber-700 font-extrabold text-xs uppercase mb-1">
                <CalendarCheck className="w-4 h-4" />
                <span>Recovery Plan</span>
              </div>
              <p className="text-xl font-black text-slate-900">7/14/30 Days</p>
              <p className="text-xs text-slate-600 mt-0.5">Daily Topic & Study Slots</p>
            </div>

            <div className="p-4 rounded-2xl stat-card-teal shadow-soft-sm">
              <div className="flex items-center space-x-2 text-teal-700 font-extrabold text-xs uppercase mb-1">
                <HeartPulse className="w-4 h-4" />
                <span>Wellness Routine</span>
              </div>
              <p className="text-xl font-black text-slate-900">Hydration & Rest</p>
              <p className="text-xs text-slate-600 mt-0.5">Prevents Study Burnout</p>
            </div>
          </div>

        </div>
      </section>

      {/* Core Feature Value Matrix */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Engineered for Student Success
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">Why EduBridge AI is Different</h2>
            <p className="text-slate-600 mt-2 font-medium max-w-xl mx-auto">Traditional exams show raw numbers. EduBridge AI decodes your exact learning roadblocks and builds a personalized cure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Emerald */}
            <div className="glass-card p-8 rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/30 hover:shadow-glow-emerald transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-glow-emerald">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Adaptive Gemini Questions</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Generates fresh topic & chapter tests dynamically. Adaptive difficulty shifts based on your MongoDB attempt history.
              </p>
            </div>

            {/* Card 2: Violet */}
            <div className="glass-card p-8 rounded-3xl border border-violet-200/80 bg-gradient-to-b from-white to-violet-50/30 hover:shadow-glow-violet transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center mb-6 shadow-glow-violet">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">AI Learning Gap Score</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Calculates a 0-100 gap index based on accuracy, wrong answers, time inefficiency, and repeated errors, flagging Critical/High priority topics.
              </p>
            </div>

            {/* Card 3: Teal */}
            <div className="glass-card p-8 rounded-3xl border border-teal-200/80 bg-gradient-to-b from-white to-teal-50/30 hover:shadow-glow-teal transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 shadow-glow-teal">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Healthy Study Routine</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
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
