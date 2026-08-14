import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Flame, 
  Target, 
  Clock, 
  BrainCircuit, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  ArrowUpRight, 
  TrendingUp, 
  Calendar,
  Bell,
  RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/progress/me');
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Fetching your personalized MongoDB learning data..." />
        </div>
      </div>
    );
  }

  const { progress, recentAttempts, studyPlan, progressTrend } = dashboardData;

  // Calculate Priority Badge style
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'High': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Medium': return 'bg-violet-100 text-violet-800 border-violet-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-8">
          
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-widest mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Personalized AI Diagnostic Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, <span className="gradient-text">{user?.name}</span>!
              </h1>
              <p className="text-slate-600 text-sm mt-1 font-medium">
                Targeting <span className="text-emerald-700 font-bold">{user?.examTarget || 'JEE Main'}</span> • {user?.gradeClass || 'Class 12'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
              <Link
                to="/marksheet-analyzer"
                className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 shadow-glow-emerald hover:opacity-95 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Marksheet Analyzer</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-slate-950 font-black uppercase">New</span>
              </Link>
              <Link
                to="/generate-test"
                className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all flex items-center justify-center space-x-2"
              >
                <span>Take AI Mock Test</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Accuracy */}
            <div className="stat-card-emerald p-5 rounded-2xl shadow-soft-sm hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
                <span>Overall Accuracy</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-glow-emerald">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-emerald-950">{progress?.overallAccuracy || 0}%</p>
              <span className="text-[11px] text-emerald-700 mt-1 block font-bold">From {progress?.totalTestsTaken || 0} MongoDB tests</span>
            </div>

            {/* AI Learning Gap Score */}
            <div className="stat-card-violet p-5 rounded-2xl shadow-soft-sm hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between text-violet-800 text-xs font-black uppercase tracking-wider mb-2">
                <span>Learning Gap Score</span>
                <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-glow-violet">
                  <BrainCircuit className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-black text-violet-950">{progress?.overallLearningGapScore || 0}</span>
                <span className="text-xs text-violet-600 font-bold">/ 100</span>
              </div>
              <div className="mt-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${getPriorityColor(progress?.gapPriority)}`}>
                  {progress?.gapPriority || 'Low'} Priority Gap
                </span>
              </div>
            </div>

            {/* Exam Readiness & Improvement */}
            <div className="stat-card-teal p-5 rounded-2xl shadow-soft-sm hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between text-teal-800 text-xs font-black uppercase tracking-wider mb-2">
                <span>Exam Readiness</span>
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-glow-teal">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-teal-950">{progress?.examReadiness || 50}%</p>
              <span className="text-[11px] text-teal-800 mt-1 block font-bold">Improvement: <strong className="text-teal-900 font-black">+{progress?.improvementPercentage || 0}%</strong></span>
            </div>

            {/* Study Streak & Recovery */}
            <div className="stat-card-amber p-5 rounded-2xl shadow-soft-sm hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between text-amber-800 text-xs font-black uppercase tracking-wider mb-2">
                <span>Study Streak</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-glow-amber">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-amber-950">{progress?.currentStreak || 1} Days</p>
              <span className="text-[11px] text-amber-800 mt-1 block font-bold">Recovery Rate: <strong className="text-amber-950 font-black">{progress?.recoveryProgress || 50}%</strong></span>
            </div>

          </div>

          {/* AI Performance Breakdown Cards (Best/Weakest Subject & Chapter) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-soft-sm">
              <span className="text-[11px] text-emerald-800 font-extrabold uppercase tracking-wider block mb-1">Best Subject</span>
              <p className="text-lg font-black text-emerald-950 truncate">{progress?.bestSubject || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-2xl border border-rose-300 bg-gradient-to-br from-rose-50 to-pink-50 shadow-soft-sm">
              <span className="text-[11px] text-rose-800 font-extrabold uppercase tracking-wider block mb-1">Weakest Subject</span>
              <p className="text-lg font-black text-rose-950 truncate">{progress?.weakestSubject || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-2xl border border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50 shadow-soft-sm">
              <span className="text-[11px] text-violet-800 font-extrabold uppercase tracking-wider block mb-1">Strongest Chapter</span>
              <p className="text-lg font-black text-violet-950 truncate">{progress?.strongestChapter || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-soft-sm">
              <span className="text-[11px] text-amber-800 font-extrabold uppercase tracking-wider block mb-1">Weakest Chapter</span>
              <p className="text-lg font-black text-amber-950 truncate">{progress?.weakestChapter || 'N/A'}</p>
            </div>
          </div>

          {/* Progress Chart & Today's Study Plan Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chart */}
            <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Accuracy & Performance Trend</h3>
                  <p className="text-xs text-slate-500 font-medium">Real database metrics recorded over your test history</p>
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>

              {progressTrend && progressTrend.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressTrend}>
                      <defs>
                        <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }} />
                      <Area type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#accuracyGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-2xl">
                  <BookOpen className="w-8 h-8 mb-2 text-slate-400 opacity-60" />
                  <p className="text-sm font-semibold">No test attempts recorded yet.</p>
                  <Link to="/generate-test" className="text-xs text-emerald-600 font-bold mt-2 hover:underline">
                    Take your first AI mock test →
                  </Link>
                </div>
              )}
            </div>

            {/* Today's AI Study Plan Preview */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                    Today’s Study Schedule
                  </h3>
                  <Link to="/study-planner" className="text-xs text-emerald-600 font-bold hover:underline flex items-center">
                    Full Plan <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>

                {studyPlan && studyPlan.dailyPlan && studyPlan.dailyPlan.length > 0 ? (
                  <div className="space-y-3">
                    {studyPlan.dailyPlan.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${item.completed ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.activity}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{item.timeSlot} • <span className="text-emerald-700 font-semibold">{item.topicOrChapter}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 space-y-3 font-medium">
                    <p className="text-xs">No active study plan generated yet.</p>
                    <Link
                      to="/study-planner"
                      className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-glow-emerald"
                    >
                      Generate AI Study Plan
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Weak Topics & Strong Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Weak Topics */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-600" />
                Weak Topics Requiring Attention
              </h3>
              {progress?.weakTopics && progress.weakTopics.length > 0 ? (
                <div className="space-y-3">
                  {progress.weakTopics.map((wt, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{wt.topicName}</span>
                      <span className="text-xs font-extrabold text-rose-700">{wt.accuracy}% Accuracy</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-4 font-medium">No weak topics flagged yet. Take more tests to generate diagnostic data.</p>
              )}
            </div>

            {/* Strong Topics */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center mb-4">
                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
                Strong Topics Mastered
              </h3>
              {progress?.strongTopics && progress.strongTopics.length > 0 ? (
                <div className="space-y-3">
                  {progress.strongTopics.map((st, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{st.topicName}</span>
                      <span className="text-xs font-extrabold text-emerald-700">{st.accuracy}% Accuracy</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-4 font-medium">No strong topics recorded yet. Practice tests to build your mastery portfolio.</p>
              )}
            </div>

          </div>

          {/* Recent Test Attempts Table */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Recent Test Diagnostic Results</h3>
                <p className="text-xs text-slate-500 font-medium">Review your past test attempts and AI feedback</p>
              </div>
            </div>

            {recentAttempts && recentAttempts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <th className="pb-3 px-3">Test Title</th>
                      <th className="pb-3 px-3">Score</th>
                      <th className="pb-3 px-3">Accuracy</th>
                      <th className="pb-3 px-3">Gap Score</th>
                      <th className="pb-3 px-3">Date</th>
                      <th className="pb-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recentAttempts.map((attempt) => (
                      <tr key={attempt._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-3 font-bold text-slate-900">
                          {attempt.mockTest?.title || 'Mock Test'}
                        </td>
                        <td className="py-4 px-3 text-slate-700 font-medium">
                          {attempt.score} / {attempt.totalMarks}
                        </td>
                        <td className="py-4 px-3 font-black text-emerald-700">
                          {attempt.accuracy}%
                        </td>
                        <td className="py-4 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getPriorityColor(attempt.gapPriority)}`}>
                            {attempt.learningGapScore} ({attempt.gapPriority})
                          </span>
                        </td>
                        <td className="py-4 px-3 text-slate-500 text-xs font-medium">
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-3 text-right">
                          <Link
                            to={`/results/${attempt._id}`}
                            className="inline-flex items-center text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            View AI Feedback →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-6 text-center font-medium">No tests completed yet. Click "Take AI Mock Test" above to begin!</p>
            )}
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
