import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Sparkles, 
  Clock, 
  Target, 
  CheckSquare, 
  Square, 
  Heart, 
  Moon, 
  Activity, 
  Droplet, 
  Eye, 
  Brain, 
  Loader2, 
  AlertCircle,
  Download,
  BookOpen,
  Layers,
  Flame,
  Award,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const StudyPlanner = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [studyPlan, setStudyPlan] = useState(null);
  const [error, setError] = useState('');

  // Enhanced Form Inputs
  const [subject, setSubject] = useState('Physics, Chemistry, Mathematics');
  const [topics, setTopics] = useState('Electrostatics, Integral Calculus, Organic Mechanisms');
  const [examDate, setExamDate] = useState('2026-11-15');
  const [availableHoursPerDay, setAvailableHoursPerDay] = useState(5);
  const [targetScore, setTargetScore] = useState(90);
  const [weakAreas, setWeakAreas] = useState('Integration Rules, Numerical Accuracy, Optics Formulas');

  const [exportingPDF, setExportingPDF] = useState(false);

  const fetchStudyPlan = async () => {
    setLoading(true);
    try {
      const res = await api.get('/studyplan/me');
      if (res.data.success && res.data.studyPlan) {
        const plan = res.data.studyPlan;
        setStudyPlan(plan);
        if (plan.subject) setSubject(plan.subject);
        if (plan.topics && plan.topics.length > 0) setTopics(plan.topics.join(', '));
        if (plan.weakAreas && plan.weakAreas.length > 0) setWeakAreas(plan.weakAreas.join(', '));
        if (plan.examDate) setExamDate(new Date(plan.examDate).toISOString().split('T')[0]);
        if (plan.availableHoursPerDay) setAvailableHoursPerDay(plan.availableHoursPerDay);
        if (plan.targetScore) setTargetScore(plan.targetScore);
      }
    } catch (err) {
      console.error('Fetch study plan error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyPlan();
  }, []);

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    setError('');
    setGenerating(true);

    try {
      const res = await api.post('/studyplan/generate', {
        subject,
        topics: topics ? topics.split(',').map(t => t.trim()) : [],
        examDate,
        availableHoursPerDay: Number(availableHoursPerDay),
        targetScore: Number(targetScore),
        weakAreas: weakAreas ? weakAreas.split(',').map(w => w.trim()) : []
      });

      if (res.data.success && res.data.studyPlan) {
        setStudyPlan(res.data.studyPlan);
      } else {
        setError('Failed to generate AI study roadmap');
      }
    } catch (err) {
      console.error('Generate Plan Error:', err);
      setError(err.response?.data?.message || 'Server error generating personalized roadmap');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    if (!studyPlan) return;
    try {
      const res = await api.put('/studyplan/toggle-task', { taskId });
      if (res.data.success && res.data.studyPlan) {
        setStudyPlan(res.data.studyPlan);
      }
    } catch (err) {
      console.error('Task toggle error:', err.message);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('study-roadmap-content');
    if (!element) return;
    setExportingPDF(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0b0f19'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Study_Roadmap_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not export PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Loading your personalized AI study roadmap & wellness schedule..." />
        </div>
      </div>
    );
  }

  const overview = studyPlan?.overview || {};
  const healthTips = studyPlan?.healthTips || studyPlan?.healthyRoutine || {};

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-8">
          
          {/* Header */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gemini 2.5 Flash • AI Study Roadmap & Healthy Life Balance Coach</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Personalized <span className="gradient-text">AI Study Roadmap & Healthy Life Balance</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              EduBridge AI uses <strong className="text-indigo-300">Gemini 2.5 Flash</strong> to analyze your mock test results and craft a hyper-personalized study roadmap integrated with sleep, breaks, hydration, and exercise for maximum score growth without burnout.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-xs font-bold underline">Dismiss</button>
            </div>
          )}

          {/* Generator Input Form */}
          <form onSubmit={handleGeneratePlan} className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center">
              <CalendarCheck className="w-5 h-5 mr-2 text-indigo-400" />
              1. Configure Roadmap Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Target Subject(s)
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Physics, Chemistry, Mathematics"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Key Topics / Chapters (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="e.g. Electrostatics, Calculus, Organic Mechanisms"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Target Exam Date
                </label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Available Hours / Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  required
                  value={availableHoursPerDay}
                  onChange={(e) => setAvailableHoursPerDay(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Target Score Goal (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  required
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none"
                />
              </div>

            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Weak Areas & Focus Topics (Optional)
              </label>
              <input
                type="text"
                value={weakAreas}
                onChange={(e) => setWeakAreas(e.target.value)}
                placeholder="e.g. Integration by parts, Optic lens formulas"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-4 px-6 rounded-2xl text-base font-extrabold text-white gradient-bg shadow-glow-indigo hover:opacity-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span>Gemini 2.0 Flash is generating your personalized roadmap...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate / Update AI Study Roadmap</span>
                </>
              )}
            </button>

            {generating && (
              <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-3 animate-pulse">
                <div className="flex items-center justify-center space-x-2 text-indigo-400 font-bold text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing syllabus, calculating days remaining & structuring schedule...</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full w-4/5 animate-pulse" />
                </div>
                <p className="text-xs text-slate-400">
                  Target response time: &lt; 3 seconds using Gemini Flash.
                </p>
              </div>
            )}
          </form>

          {/* Active Study Plan Display */}
          {studyPlan ? (
            <div className="space-y-6">
              
              {/* Header Action Bar */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-indigo-400" /> Active AI Study Roadmap
                </h2>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={exportingPDF}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-bold flex items-center space-x-2 transition-all disabled:opacity-50 shadow-glow-indigo"
                >
                  {exportingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-indigo-400" />
                      <span>Download PDF Roadmap</span>
                    </>
                  )}
                </button>
              </div>

              {/* PDF Container Wrapper */}
              <div id="study-roadmap-content" className="space-y-8 p-1">
                
                {/* Section 1: Overview Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  
                  <div className="glass-card p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20">
                    <span className="text-xs font-semibold text-indigo-400 block uppercase">Days Remaining</span>
                    <p className="text-2xl font-black text-white mt-1">{overview.daysRemaining || 30} Days</p>
                    <p className="text-[11px] text-slate-400 mt-1">Count-down to target exam</p>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
                    <span className="text-xs font-semibold text-emerald-400 block uppercase">Target Score</span>
                    <p className="text-2xl font-black text-white mt-1">{overview.targetScore || studyPlan.targetScore || 90}%</p>
                    <p className="text-[11px] text-slate-400 mt-1">Goal accuracy benchmark</p>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20">
                    <span className="text-xs font-semibold text-purple-400 block uppercase">Daily Hours</span>
                    <p className="text-2xl font-black text-white mt-1">{overview.dailyStudyHours || studyPlan.availableHoursPerDay || 5} hrs/day</p>
                    <p className="text-[11px] text-slate-400 mt-1">Scheduled study time</p>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20">
                    <span className="text-xs font-semibold text-amber-400 block uppercase">Exam Target</span>
                    <p className="text-xl font-black text-white mt-1 truncate">{overview.examTarget || 'Target Exam'}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Primary goal</p>
                  </div>

                </div>

                {/* Section 2: Daily Schedule Checklist */}
                <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-indigo-400" />
                        Daily Study Schedule Checklist
                      </h3>
                      <p className="text-xs text-slate-400">Click tasks to mark them complete in MongoDB</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(studyPlan.dailyPlan || []).map((task, idx) => (
                      <div
                        key={task._id || idx}
                        onClick={() => task._id && handleToggleTask(task._id)}
                        className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                          task.completed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {task.completed ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-600 shrink-0" />
                          )}
                          <div>
                            <p className={`text-sm font-semibold ${task.completed ? 'line-through opacity-70' : ''}`}>
                              {task.activity}
                            </p>
                            <p className="text-xs text-slate-400">
                              <span className="text-indigo-400 font-medium">{task.timeSlot}</span> • {task.topicOrChapter}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Topic Priority & Difficulty Matrix */}
                {studyPlan.priorityTopics && studyPlan.priorityTopics.length > 0 && (
                  <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800">
                    <div className="flex items-center space-x-2 mb-6">
                      <Flame className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-bold text-white">Topic Priority & Difficulty Matrix</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {studyPlan.priorityTopics.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              item.priority === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {item.priority || 'High'} Priority
                            </span>
                            <span className="text-xs text-indigo-400 font-bold">{item.estimatedHours || 10} hrs</span>
                          </div>
                          <h4 className="font-bold text-sm text-white">{item.topicName}</h4>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Subject: {item.subject || studyPlan.subject}</span>
                            <span className="text-slate-300 font-medium">Diff: {item.difficulty || 'Medium'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 4: Weekly Roadmap & Timeline */}
                {studyPlan.weeklyPlan && studyPlan.weeklyPlan.length > 0 && (
                  <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800">
                    <div className="flex items-center space-x-2 mb-6">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-bold text-white">Weekly Progression Roadmap</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {studyPlan.weeklyPlan.map((weekItem, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-purple-400 uppercase">{weekItem.week || `Week ${idx + 1}`}</span>
                            <span className="text-xs text-slate-400 font-semibold">{weekItem.targetHours || 35} hrs target</span>
                          </div>
                          <h4 className="font-bold text-sm text-white">{weekItem.focusArea}</h4>
                          <p className="text-xs text-slate-400">{weekItem.taskCount || 14} scheduled learning modules</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 5: Revision & Mock Test Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Revision Schedule */}
                  {studyPlan.revisionPlan && studyPlan.revisionPlan.length > 0 && (
                    <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
                      <h3 className="text-base font-bold text-white flex items-center">
                        <FileCheck className="w-5 h-5 mr-2 text-sky-400" />
                        Structured Revision Schedule
                      </h3>
                      <div className="space-y-3">
                        {studyPlan.revisionPlan.map((rev, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                            <span className="font-bold text-sky-400 block">{rev.day}</span>
                            <p className="text-slate-200 font-semibold">{rev.focus}</p>
                            {rev.topics && rev.topics.length > 0 && (
                              <p className="text-slate-400">Topics: {rev.topics.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mock Test Schedule */}
                  {studyPlan.mockTests && studyPlan.mockTests.length > 0 && (
                    <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
                      <h3 className="text-base font-bold text-white flex items-center">
                        <Award className="w-5 h-5 mr-2 text-amber-400" />
                        Mock Test & Assessment Timeline
                      </h3>
                      <div className="space-y-3">
                        {studyPlan.mockTests.map((mock, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-400">{mock.testName}</span>
                              <span className="text-slate-400 font-semibold">{mock.date}</span>
                            </div>
                            <p className="text-slate-300">Focus: {mock.focus}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Section 6: Last 7 Days Pre-Exam Sprint */}
                {studyPlan.last7DaysPlan && studyPlan.last7DaysPlan.length > 0 && (
                  <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rose-500/20 bg-rose-950/10">
                    <h3 className="text-base font-bold text-rose-300 flex items-center mb-4">
                      <Zap className="w-5 h-5 mr-2 text-rose-400" />
                      Final 7-Day Pre-Exam Revision Strategy
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {studyPlan.last7DaysPlan.map((sprint, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                          <span className="font-bold text-rose-400 block">{sprint.day}</span>
                          <p className="text-slate-200">{sprint.task}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 7: Healthy Routine & Wellness Planner */}
                <div className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-glow-emerald">
                  <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-white">Healthy Lifestyle & Wellness Routine</h3>
                      <p className="text-xs text-emerald-300">Maintain maximum retention with balanced rest and mental health</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
                      <Moon className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase">Sleep Recommendation</span>
                        <p className="text-sm font-semibold text-white">{healthTips.sleepRecommendation || healthTips.sleepTime || '7-8 hours daily (10:30 PM to 06:00 AM)'}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
                      <Activity className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase">Exercise & Workout</span>
                        <p className="text-sm font-semibold text-white">{healthTips.exerciseRecommendation || healthTips.exerciseTime || '20-30 mins light morning workout'}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
                      <Droplet className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase">Water Hydration</span>
                        <p className="text-sm font-semibold text-white">{healthTips.waterReminder || '250ml water every 2 hours'}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
                      <Brain className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase">Mindfulness & Meditation</span>
                        <p className="text-sm font-semibold text-white">{healthTips.meditationTime || '10 mins post-study relaxation'}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
                      <Eye className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase">Screen Break Timings</span>
                        <p className="text-sm font-semibold text-white">{healthTips.breakTimings || healthTips.screenBreakInterval || '5 min break every 45 mins'}</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Section 8: Exam Strategy & Motivation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {studyPlan.examTips && studyPlan.examTips.length > 0 && (
                    <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
                      <h3 className="text-base font-bold text-white flex items-center">
                        <ShieldCheck className="w-5 h-5 mr-2 text-indigo-400" />
                        AI Exam Strategy Tips
                      </h3>
                      <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                        {studyPlan.examTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {studyPlan.motivation && studyPlan.motivation.length > 0 && (
                    <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3">
                      <h3 className="text-base font-bold text-white flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-amber-400" />
                        Daily Motivation & Mindset
                      </h3>
                      <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                        {studyPlan.motivation.map((mot, idx) => (
                          <li key={idx}>{mot}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>

              </div>
            </div>
          ) : (
            <div className="text-center py-16 px-6 glass-card rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-slate-950/40 text-slate-300 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400 shadow-glow-indigo">
                <Target className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-extrabold text-white">No Mock Test Attempted Yet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  EduBridge AI generates your personalized study roadmap & healthy life balance routine <strong className="text-indigo-300">directly from your mock test performance</strong>. Complete a mock test, and our Gemini 2.5 Flash engine will automatically construct your tailored plan!
                </p>
              </div>
              <a
                href="/test-generator"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl text-sm font-extrabold text-white gradient-bg shadow-glow-indigo hover:opacity-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Take a Mock Test Now</span>
              </a>
            </div>
          )}

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default StudyPlanner;
