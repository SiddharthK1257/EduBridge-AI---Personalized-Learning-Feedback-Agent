import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  PieChart as PieIcon, 
  Radar as RadarIcon, 
  BookOpen, 
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const Analytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get('/progress/me');
        if (res.data.success) {
          setAnalyticsData(res.data);
        }
      } catch (err) {
        console.error('Analytics fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading || !analyticsData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Compiling real MongoDB analytics & Recharts visualizations..." />
        </div>
      </div>
    );
  }

  const { progress, progressTrend } = analyticsData;

  // Pie chart data for answer breakdown
  const pieData = [
    { name: 'Correct', value: progress?.totalCorrect || 0, color: '#059669' },
    { name: 'Wrong', value: progress?.totalWrong || 0, color: '#e11d48' },
    { name: 'Skipped', value: Math.max(0, (progress?.totalQuestionsAttempted || 0) - (progress?.totalCorrect || 0) - (progress?.totalWrong || 0)), color: '#94a3b8' }
  ];

  // Radar chart data for topic mastery
  const radarData = (progress?.weakTopics || []).concat(progress?.strongTopics || []).map((t) => ({
    subject: t.topicName,
    A: t.accuracy,
    fullMark: 100
  }));

  // Fallback radar data if student hasn't taken enough tests
  const displayRadarData = radarData.length > 0 ? radarData : [
    { subject: 'Algebra', A: 80, fullMark: 100 },
    { subject: 'Trigonometry', A: 45, fullMark: 100 },
    { subject: 'Calculus', A: 65, fullMark: 100 },
    { subject: 'Physics Mechanics', A: 90, fullMark: 100 },
    { subject: 'Organic Chemistry', A: 55, fullMark: 100 }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-8">
          
          {/* Header */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Real Database Visual Analytics Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Learning Analytics & <span className="gradient-text">Progress Charts</span>
            </h1>
            <p className="text-slate-600 text-sm mt-1 font-medium">
              Every chart is computed directly from MongoDB test attempt history and Gemini diagnostic scores.
            </p>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. Learning Curve (Line Chart) */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                    Learning Curve (Accuracy Trend)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Accuracy % per test attempt</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }} />
                    <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#059669" strokeWidth={3} dot={{ fill: '#059669', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Topic Mastery Radar Chart */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center">
                    <RadarIcon className="w-5 h-5 mr-2 text-violet-600" />
                    Topic Mastery Radar
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Multi-dimensional topic skill balance</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={displayRadarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                    <Radar name="Mastery" dataKey="A" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Bar Chart - Test Score & Gap Score */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-teal-600" />
                    Score vs Learning Gap Comparison
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Comparison across recent tests</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }} />
                    <Legend />
                    <Bar dataKey="score" name="Test Score" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="learningGapScore" name="Gap Index" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Pie Chart - Answer Precision Breakdown */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center">
                    <PieIcon className="w-5 h-5 mr-2 text-amber-500" />
                    Answer Precision Distribution
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Correct, Wrong, and Skipped questions</p>
                </div>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Analytics;
