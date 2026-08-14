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
        backgroundColor: '#ffffff'
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
      <div className="min-h-screen bg-slate-50 flex flex-col">
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-8">
          
          {/* Header */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center space-x-2 text-emerald-700 font-extrabold text-xs uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Gemini AI Tutor • Study Roadmap & Healthy Life Balance Coach</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Personalized <span className="gradient-text-emerald">AI Study Roadmap & Healthy Life Balance</span>
            </h1>
            <p className="text-slate-600 text-sm mt-1 font-medium">
              EduBridge AI uses <strong className="text-emerald-700 font-extrabold">Gemini AI Engine</strong> to analyze your scorecard and mock test results, crafting a hyper-personalized study roadmap integrated with sleep, breaks, hydration, and exercise.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between font-medium">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-xs font-bold underline">Dismiss</button>
            </div>
          )}

          {/* Generator Input Form */}
          <form onSubmit={handleGeneratePlan} className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center">
              <CalendarCheck className="w-5 h-5 mr-2 text-emerald-600" />
              1. Configure Roadmap Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Target Subject(s)
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Physics, Chemistry, Mathematics"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Key Topics / Chapters (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="e.g. Electrostatics, Calculus, Organic Mechanisms"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Target Exam Date
                </label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Available Hours / Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  required
                  value={availableHoursPerDay}
                  onChange={(e) => setAvailableHoursPerDay(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Target Score Goal (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  required
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
                />
              </div>

            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Weak Areas & Focus Topics (Optional)
              </label>
              <input
                type="text"
                value={weakAreas}
                onChange={(e) => setWeakAreas(e.target.value)}
                placeholder="e.g. Integration by parts, Optic lens formulas"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-4 px-6 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 shadow-glow-emerald hover:opacity-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span>Gemini AI is generating your personalized roadmap...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Generate / Update AI Study Roadmap</span>
                </>
              )}
            </button>

            {generating && (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 shadow-soft-sm animate-pulse">
                <div className="flex items-center justify-center space-x-2 text-emerald-800 font-black text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span>Analyzing syllabus, calculating days remaining & structuring schedule...</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-violet-600 h-full w-4/5 animate-pulse rounded-full" />
                </div>
                <p className="text-xs text-slate-600 font-medium">
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
                <h2 className="text-xl font-black text-slate-900 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-emerald-600" /> Active AI Study Roadmap
                </h2>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={exportingPDF}
                  className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-black flex items-center space-x-2 transition-all disabled:opacity-50 shadow-soft-sm"
                >
                  {exportingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Download PDF Roadmap</span>
                    </>
                  )}
                </button>
              </div>

              {/* PDF Container Wrapper */}
              <div id="study-roadmap-content" className="space-y-8 p-1">
                
                {/* Section 1: Overview Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  
                  <div className="stat-card-teal p-5 rounded-2xl">
                    <span className="text-xs font-bold text-teal-800 block uppercase">Days Remaining</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{overview.daysRemaining || 30} Days</p>
                    <p className="text-[11px] text-slate-600 mt-1 font-medium">Count-down to target exam</p>
                  </div>

                  <div className="stat-card-emerald p-5 rounded-2xl">
                    <span className="text-xs font-bold text-emerald-800 block uppercase">Target Score</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{overview.targetScore || studyPlan.targetScore || 90}%</p>
                    <p className="text-[11px] text-slate-600 mt-1 font-medium">Goal accuracy benchmark</p>
                  </div>

                  <div className="stat-card-violet p-5 rounded-2xl">
                    <span className="text-xs font-bold text-violet-800 block uppercase">Daily Hours</span>
                    <p className="text-2xl font-black text-slate-900 mt-1">{overview.dailyStudyHours || studyPlan.availableHoursPerDay || 5} hrs/day</p>
                    <p className="text-[11px] text-slate-600 mt-1 font-medium">Scheduled study time</p>
                  </div>

                  <div className="stat-card-amber p-5 rounded-2xl">
                    <span className="text-xs font-bold text-amber-800 block uppercase">Exam Target</span>
                    <p className="text-xl font-black text-slate-900 mt-1 truncate">{overview.examTarget || 'Target Exam'}</p>
                    <p className="text-[11px] text-slate-600 mt-1 font-medium">Primary goal</p>
                  </div>

                </div>

                {/* Section 2: Daily Schedule Checklist */}
                <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-emerald-600" />
                        Daily Study Schedule Checklist
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">Click tasks to mark them complete in MongoDB</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(studyPlan.dailyPlan || []).map((task, idx) => (
                      <div
                        key={task._id || idx}
                        onClick={() => task._id && handleToggleTask(task._id)}
                        className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                          task.completed
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-soft-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/20'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {task.completed ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400 shrink-0" />
                          )}
                          <div>
                            <p className={`text-sm font-bold ${task.completed ? 'line-through opacity-70 text-slate-500' : 'text-slate-900'}`}>
                              {task.activity}
                            </p>
                            <p className="text-xs text-slate-600 font-medium">
                              <span className="text-emerald-700 font-bold">{task.timeSlot}</span> • {task.topicOrChapter}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Topic Priority & Difficulty Matrix */}
                {studyPlan.priorityTopics && studyPlan.priorityTopics.length > 0 && (
                  <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
                    <div className="flex items-center space-x-2 mb-6">
                      <Flame className="w-5 h-5 text-amber-500" />
                      <h3 className="text-lg font-black text-slate-900">Topic Priority & Difficulty Matrix</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {studyPlan.priorityTopics.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              item.priority === 'High' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {item.priority || 'High'} Priority
                            </span>
                            <span className="text-xs text-emerald-700 font-black">{item.estimatedHours || 10} hrs</span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900">{item.topicName}</h4>
                          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                            <span>Subject: {item.subject || studyPlan.subject}</span>
                            <span className="text-slate-800 font-semibold">Diff: {item.difficulty || 'Medium'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 4: Weekly Roadmap & Timeline */}
                {studyPlan.weeklyPlan && studyPlan.weeklyPlan.length > 0 && (
                  <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
                    <div className="flex items-center space-x-2 mb-6">
                      <TrendingUp className="w-5 h-5 text-violet-600" />
                      <h3 className="text-lg font-black text-slate-900">Weekly Progression Roadmap</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {studyPlan.weeklyPlan.map((weekItem, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-violet-800 uppercase">{weekItem.week || `Week ${idx + 1}`}</span>
                            <span className="text-xs text-slate-600 font-bold">{weekItem.targetHours || 35} hrs target</span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900">{weekItem.focusArea}</h4>
                          <p className="text-xs text-slate-600 font-medium">{weekItem.taskCount || 14} scheduled learning modules</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 5: Revision & Mock Test Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Revision Schedule */}
                  {studyPlan.revisionPlan && studyPlan.revisionPlan.length > 0 && (
                    <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-4">
                      <h3 className="text-base font-black text-slate-900 flex items-center">
                        <FileCheck className="w-5 h-5 mr-2 text-sky-600" />
                        Structured Revision Schedule
                      </h3>
                      <div className="space-y-3">
                        {studyPlan.revisionPlan.map((rev, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs space-y-1">
                            <span className="font-black text-sky-800 block">{rev.day}</span>
                            <p className="text-slate-900 font-bold">{rev.focus}</p>
                            {rev.topics && rev.topics.length > 0 && (
                              <p className="text-slate-600 font-medium">Topics: {rev.topics.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mock Test Schedule */}
                  {studyPlan.mockTests && studyPlan.mockTests.length > 0 && (
                    <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-4">
                      <h3 className="text-base font-black text-slate-900 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-amber-500" />
                        Mock Test & Assessment Timeline
                      </h3>
                      <div className="space-y-3">
                        {studyPlan.mockTests.map((mock, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-amber-900">{mock.testName}</span>
                              <span className="text-slate-600 font-bold">{mock.date}</span>
                            </div>
                            <p className="text-slate-800 font-medium">Focus: {mock.focus}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Section 6: Last 7 Days Pre-Exam Sprint */}
                {studyPlan.last7DaysPlan && studyPlan.last7DaysPlan.length > 0 && (
                  <div className="glass-card p-6 sm:p-8 rounded-3xl border border-rose-200 bg-rose-50/50 shadow-soft-sm">
                    <h3 className="text-base font-black text-rose-900 flex items-center mb-4">
                      <Zap className="w-5 h-5 mr-2 text-rose-600" />
                      Final 7-Day Pre-Exam Revision Strategy
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {studyPlan.last7DaysPlan.map((sprint, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white border border-rose-200 text-xs space-y-1 shadow-soft-sm">
                          <span className="font-black text-rose-800 block">{sprint.day}</span>
                          <p className="text-slate-800 font-semibold">{sprint.task}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 7: Healthy Routine & Wellness Planner */}
                <div className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-200 bg-white shadow-soft-sm">
                  <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-200">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-glow-emerald">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Healthy Lifestyle & Wellness Routine</h3>
                      <p className="text-xs text-emerald-800 font-medium">Maintain maximum retention with balanced rest and mental health</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                      <Moon className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-extrabold text-slate-600 block uppercase">Sleep Recommendation</span>
                        <p className="text-sm font-bold text-slate-900">{healthTips.sleepRecommendation || healthTips.sleepTime || '7-8 hours daily (10:30 PM to 06:00 AM)'}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                      <Activity className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-extrabold text-slate-600 block uppercase">Exercise & Workout</span>
                        <p className="text-sm font-bold text-slate-900">{healthTips.exerciseRecommendation || healthTips.exerciseTime || '20-30 mins light morning workout'}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                      <Droplet className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-extrabold text-slate-600 block uppercase">Water Hydration</span>
                        <p className="text-sm font-bold text-slate-900">{healthTips.waterReminder || '250ml water every 2 hours'}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                      <Brain className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-extrabold text-slate-600 block uppercase">Mindfulness & Meditation</span>
                        <p className="text-sm font-bold text-slate-900">{healthTips.meditationTime || '10 mins post-study relaxation'}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                      <Eye className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-extrabold text-slate-600 block uppercase">Screen Break Timings</span>
                        <p className="text-sm font-bold text-slate-900">{healthTips.breakTimings || healthTips.screenBreakInterval || '5 min break every 45 mins'}</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Section 8: Exam Strategy & Motivation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {studyPlan.examTips && studyPlan.examTips.length > 0 && (
                    <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-3">
                      <h3 className="text-base font-black text-slate-900 flex items-center">
                        <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600" />
                        AI Exam Strategy Tips
                      </h3>
                      <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside font-medium">
                        {studyPlan.examTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {studyPlan.motivation && studyPlan.motivation.length > 0 && (
                    <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-3">
                      <h3 className="text-base font-black text-slate-900 flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                        Daily Motivation & Mindset
                      </h3>
                      <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside font-medium">
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
            <div className="text-center py-16 px-6 glass-card rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white text-slate-800 space-y-5 shadow-soft-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700 shadow-glow-emerald">
                <Target className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-black text-slate-900">No Mock Test Attempted Yet</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  EduBridge AI generates your personalized study roadmap & healthy life balance routine <strong className="text-emerald-800 font-bold">directly from your mock test performance</strong>. Complete a mock test, and our Gemini AI engine will automatically construct your tailored plan!
                </p>
              </div>
              <a
                href="/generate-test"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-glow-emerald hover:opacity-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
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
