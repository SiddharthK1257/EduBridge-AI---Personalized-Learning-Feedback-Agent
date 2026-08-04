import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  BrainCircuit, 
  AlertTriangle, 
  Lightbulb, 
  BookOpen, 
  ArrowRight, 
  Zap, 
  Compass, 
  ChevronDown, 
  ChevronUp,
  Award,
  Calendar,
  Layers,
  Flame,
  Activity,
  BarChart3,
  MessageSquare,
  Send,
  Loader2,
  Video,
  FileText
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const TestResult = () => {
  const { attemptId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Recovery Plan Tab
  const [recoveryTab, setRecoveryTab] = useState('7day');

  // AI Mentor State
  const [mentorInput, setMentorInput] = useState('');
  const [mentorChatHistory, setMentorChatHistory] = useState([]);
  const [mentorLoading, setMentorLoading] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/results/${attemptId}`);
        if (res.data.success) {
          setResultData(res.data);
        } else {
          setError('Failed to retrieve test diagnostic result');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching result');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  const handleAskMentor = async (questionText) => {
    const q = questionText || mentorInput;
    if (!q || !q.trim() || mentorLoading) return;

    const userMsg = { sender: 'user', text: q };
    setMentorChatHistory((prev) => [...prev, userMsg]);
    setMentorInput('');
    setMentorLoading(true);

    try {
      const res = await api.post('/tests/mentor/chat', {
        attemptId,
        question: q
      });

      if (res.data.success && res.data.answer) {
        setMentorChatHistory((prev) => [...prev, { sender: 'mentor', text: res.data.answer }]);
      } else {
        setMentorChatHistory((prev) => [...prev, { sender: 'mentor', text: 'Sorry, I could not analyze your request right now.' }]);
      }
    } catch (err) {
      console.error('Mentor Chat Error:', err);
      setMentorChatHistory((prev) => [...prev, { sender: 'mentor', text: 'Error connecting to AI Mentor service.' }]);
    } finally {
      setMentorLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Fetching Gemini AI diagnostic analysis & question review..." />
        </div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 max-w-md">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Result Error</h3>
            <p className="text-sm text-slate-400 mb-6">{error || 'Result details missing'}</p>
            <Link to="/dashboard" className="px-6 py-3 rounded-xl text-sm font-bold text-white gradient-bg">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { attempt, feedback } = resultData;
  const mockTest = attempt.mockTest || {};
  const questions = mockTest.questions || [];
  const userAnswers = attempt.userAnswers || [];

  const isZeroScore = attempt.correctCount === 0 || attempt.accuracy === 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-8">
          
          {/* Header Banner */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs uppercase tracking-widest mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Gemini AI Diagnostic Report</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {mockTest.title || 'Diagnostic Test Result'}
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  {mockTest.exam} • {mockTest.subject?.name} • Submitted on {new Date(attempt.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Score Circle */}
              <div className="flex items-center space-x-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Overall Grade</span>
                  <span className={`text-2xl font-black ${isZeroScore ? 'text-rose-400' : 'text-indigo-400'}`}>
                    {feedback?.overallGrade || (isZeroScore ? 'Needs Focus' : 'B')}
                  </span>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-white ${
                  isZeroScore ? 'bg-rose-600 shadow-glow-rose' : 'gradient-bg shadow-glow-indigo'
                }`}>
                  <span className="text-xl leading-none">{attempt.accuracy}%</span>
                  <span className="text-[10px] opacity-80 uppercase font-bold">Accuracy</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Study Roadmap Auto-Generated Banner */}
          <div className="glass-card p-6 rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-glow-indigo">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <span>Gemini 2.5 Flash Study Roadmap Auto-Generated!</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  EduBridge AI has automatically built a personalized study roadmap & healthy life balance schedule based on your score ({attempt.accuracy}% accuracy).
                </p>
              </div>
            </div>
            <Link
              to="/study-planner"
              className="px-5 py-3 rounded-xl text-xs font-extrabold text-white gradient-bg shadow-glow-indigo hover:opacity-95 transition-all whitespace-nowrap flex items-center space-x-2 shrink-0"
            >
              <span>View My Study Roadmap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 0% SCORE CRITICAL ALERT BADGES (STRICT RULE IMPLEMENTATION) */}
          {isZeroScore && (
            <div className="glass-card p-6 rounded-3xl border border-rose-500/40 bg-rose-500/10 space-y-4">
              <div className="flex items-center space-x-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <h3 className="text-lg font-bold">Critical Performance Alert (0% Score Recorded)</h3>
              </div>
              <p className="text-xs text-rose-200">
                No correct answers were detected in this attempt. Demonstrating zero accuracy triggers immediate priority concept rebuilding before proceeding to advanced practice.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-rose-500/30 text-center">
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold">Current Performance</span>
                  <span className="text-sm font-extrabold text-rose-400">Critical</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-rose-500/30 text-center">
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold">Learning Gap</span>
                  <span className="text-sm font-extrabold text-rose-400">Very High</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-rose-500/30 text-center">
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold">Concept Clarity</span>
                  <span className="text-sm font-extrabold text-rose-400">Very Low</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-rose-500/30 text-center">
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold">Exam Readiness</span>
                  <span className="text-sm font-extrabold text-amber-400">Low</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-rose-500/30 text-center">
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold">Confidence</span>
                  <span className="text-sm font-extrabold text-amber-400">Low</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-rose-500/30 text-center">
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold">Recovery Priority</span>
                  <span className="text-sm font-extrabold text-rose-400">Immediate</span>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase">Score</span>
              <span className="text-xl font-extrabold text-white">{attempt.score} / {attempt.totalMarks}</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase">Accuracy</span>
              <span className="text-xl font-extrabold text-indigo-400">{attempt.accuracy}%</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-emerald-400 block uppercase">Correct</span>
              <span className="text-xl font-extrabold text-emerald-400">{attempt.correctCount}</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-rose-400 block uppercase">Wrong</span>
              <span className="text-xl font-extrabold text-rose-400">{attempt.wrongCount}</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase">Negative</span>
              <span className="text-xl font-extrabold text-rose-300">-{attempt.negativeMarks || 0}</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase">Percentile</span>
              <span className="text-xl font-extrabold text-purple-400">{attempt.percentile || 50}%</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase">Avg Time</span>
              <span className="text-xl font-extrabold text-amber-400">{attempt.avgTimePerQuestionSeconds}s</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase">Speed</span>
              <span className="text-xl font-extrabold text-emerald-300">{attempt.speedRating || 'Optimal'}</span>
            </div>
          </div>

          {/* AI Strengths vs Weaknesses Card */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <BrainCircuit className="w-6 h-6 text-indigo-400" />
              <h3 className="text-lg font-extrabold text-white">Gemini AI Diagnostic Performance Breakdown</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Demonstrated Strengths
                </h4>
                {isZeroScore ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    Current assessment shows no measurable strengths in this attempt. Focus should be on rebuilding fundamental concepts before moving to advanced topics.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {(feedback?.strengths || []).map((str, idx) => (
                      <li key={idx} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-200 flex items-start">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 mr-2.5 flex-shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Weaknesses */}
              <div>
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center">
                  <XCircle className="w-4 h-4 mr-1.5" /> Weaknesses & Concept Breakdown
                </h4>
                <ul className="space-y-2">
                  {(feedback?.weaknesses || ['Concepts need deeper foundation review']).map((wk, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-slate-200 flex items-start">
                      <span className="w-2 h-2 rounded-full bg-rose-400 mt-1 mr-2.5 flex-shrink-0" />
                      <span>{wk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* TOPIC ANALYSIS TABLE */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <Layers className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Topic Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Topic</th>
                    <th className="p-3.5 text-center">Questions</th>
                    <th className="p-3.5 text-center">Correct</th>
                    <th className="p-3.5 text-center">Wrong</th>
                    <th className="p-3.5 text-center">Accuracy</th>
                    <th className="p-3.5 text-center">Avg Time</th>
                    <th className="p-3.5 text-center">Confidence</th>
                    <th className="p-3.5 rounded-r-xl">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {(feedback?.topicWiseAnalysis || attempt.topicWiseAccuracy || []).map((t, i) => (
                    <tr key={i} className="hover:bg-slate-900/40">
                      <td className="p-3.5 font-bold text-white">{t.topicName}</td>
                      <td className="p-3.5 text-center">{t.questionsCount || t.attempted || 0}</td>
                      <td className="p-3.5 text-center text-emerald-400 font-bold">{t.correct}</td>
                      <td className="p-3.5 text-center text-rose-400 font-bold">{t.wrong}</td>
                      <td className="p-3.5 text-center font-extrabold text-indigo-300">{t.accuracy}%</td>
                      <td className="p-3.5 text-center text-amber-400">{t.averageTime}s</td>
                      <td className="p-3.5 text-center">{t.confidence || t.accuracy}%</td>
                      <td className="p-3.5 text-slate-400 text-[11px]">{t.recommendation || 'Targeted drill'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHAPTER ANALYSIS TABLE */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Chapter Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Chapter</th>
                    <th className="p-3.5 text-center">Questions</th>
                    <th className="p-3.5 text-center">Correct</th>
                    <th className="p-3.5 text-center">Wrong</th>
                    <th className="p-3.5 text-center">Accuracy</th>
                    <th className="p-3.5 text-center">Learning Gap</th>
                    <th className="p-3.5 text-center">Est. Study Hours</th>
                    <th className="p-3.5 rounded-r-xl text-center">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {(feedback?.chapterWiseAnalysis || attempt.chapterWiseAccuracy || []).map((c, i) => (
                    <tr key={i} className="hover:bg-slate-900/40">
                      <td className="p-3.5 font-bold text-white">{c.chapterName}</td>
                      <td className="p-3.5 text-center">{c.questionsCount || c.attempted || 0}</td>
                      <td className="p-3.5 text-center text-emerald-400 font-bold">{c.correct}</td>
                      <td className="p-3.5 text-center text-rose-400 font-bold">{c.wrong}</td>
                      <td className="p-3.5 text-center font-extrabold text-indigo-300">{c.accuracy}%</td>
                      <td className="p-3.5 text-center">{c.learningGap || (c.accuracy < 50 ? 'High' : 'Low')}</td>
                      <td className="p-3.5 text-center text-amber-300">{c.estimatedStudyHours || 4} hrs</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          (c.priority === 'Immediate' || c.priority === 'High') ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {c.priority || 'Medium'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DIFFICULTY ANALYSIS */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Difficulty Analysis</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(feedback?.difficultyWiseAnalysis || attempt.difficultyWiseAccuracy || []).map((d, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-sm">{d.difficulty} Difficulty</span>
                    <span className="text-xs font-bold text-indigo-400">{d.accuracy}% Acc</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${d.accuracy}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Attempted: <strong className="text-slate-200">{d.attempted}</strong> | Correct: <strong className="text-emerald-400">{d.correct}</strong> | Wrong: <strong className="text-rose-400">{d.wrong}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI LEARNING GAP DETECTOR */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <Activity className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white">AI Learning Gap Detector</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-rose-400 block mb-1">Repeated Mistakes</span>
                <p className="text-slate-300">{feedback?.aiLearningGaps?.repeatedMistakes?.[0] || 'Option distractor traps'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">Concept Weakness</span>
                <p className="text-slate-300">{feedback?.aiLearningGaps?.conceptWeakness?.[0] || 'Core theoretical principles'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-purple-400 block mb-1">Calculation & Numerical</span>
                <p className="text-slate-300">{feedback?.aiLearningGaps?.calculationErrors?.[0] || 'Numerical steps precision'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-indigo-400 block mb-1">Memory & Recall</span>
                <p className="text-slate-300">{feedback?.aiLearningGaps?.memoryErrors?.[0] || 'Formula recall under time pressure'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">Application Skills</span>
                <p className="text-slate-300">{feedback?.aiLearningGaps?.applicationWeakness?.[0] || 'Problem solving steps'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-cyan-400 block mb-1">Time Management</span>
                <p className="text-slate-300">{feedback?.aiLearningGaps?.timeManagementIssues?.[0] || 'Question pacing & speed'}</p>
              </div>
            </div>
          </div>

          {/* ONE CLICK RECOVERY PLAN */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <Compass className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">One-Click AI Recovery Plan</h3>
                  <p className="text-xs text-slate-400">Step-by-step roadmap to eliminate learning gaps</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setRecoveryTab('7day')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${recoveryTab === '7day' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}
                >
                  7 Day Plan
                </button>
                <button
                  onClick={() => setRecoveryTab('15day')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${recoveryTab === '15day' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}
                >
                  15 Day Plan
                </button>
                <button
                  onClick={() => setRecoveryTab('30day')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${recoveryTab === '30day' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}
                >
                  30 Day Plan
                </button>
              </div>
            </div>

            {/* Active Recovery Plan Days */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {((recoveryTab === '7day' ? feedback?.recoveryPlan?.plan7Days : recoveryTab === '15day' ? feedback?.recoveryPlan?.plan15Days : feedback?.recoveryPlan?.plan30Days) || [
                { day: 1, focus: "Concept Rebuild", hours: 3, tasks: ["Review incorrect questions", "Practice 15 drills"] },
                { day: 2, focus: "Topic Drills", hours: 3, tasks: ["Solve targeted problems"] }
              ]).map((d, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>Day {d.day || i + 1}</span>
                    <span className="text-slate-400">{d.hours || 3} hrs</span>
                  </div>
                  <h4 className="font-extrabold text-white text-sm">{d.focus}</h4>
                  <ul className="space-y-1 text-slate-400 text-[11px]">
                    {(d.tasks || []).map((t, idx) => (
                      <li key={idx}>• {t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Extras: Recommended Videos & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs">
                <span className="font-bold text-purple-400 flex items-center mb-2">
                  <Video className="w-4 h-4 mr-2" /> Recommended Conceptual Videos
                </span>
                <ul className="space-y-1 text-slate-300">
                  {(feedback?.recoveryPlan?.recommendedVideos || [`${mockTest.subject?.name} Foundational Lecture`]).map((v, i) => (
                    <li key={i}>▶ {v}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs">
                <span className="font-bold text-indigo-400 flex items-center mb-2">
                  <FileText className="w-4 h-4 mr-2" /> Recommended Notes & Revision Sheets
                </span>
                <ul className="space-y-1 text-slate-300">
                  {(feedback?.recoveryPlan?.recommendedNotes || [`${mockTest.subject?.name} Formula Flashcards`]).map((n, i) => (
                    <li key={i}>📄 {n}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* AI STUDY PLANNER */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">AI Study Planner Recommendations</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Daily Study</span>
                <span className="text-base font-extrabold text-indigo-400 mt-1 block">{feedback?.studyPlanner?.dailyStudyHours || 4} hrs</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Revision</span>
                <span className="text-base font-extrabold text-purple-400 mt-1 block">{feedback?.studyPlanner?.revisionHours || 1.5} hrs</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Practice</span>
                <span className="text-base font-extrabold text-emerald-400 mt-1 block">{feedback?.studyPlanner?.practiceHours || 2} hrs</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Mock Frequency</span>
                <span className="text-base font-extrabold text-amber-400 mt-1 block">{feedback?.studyPlanner?.mockTestFrequency || '2 / week'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Sleep</span>
                <span className="text-base font-extrabold text-cyan-400 mt-1 block">{feedback?.studyPlanner?.sleepRecommendation || '7-8 hrs'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Breaks</span>
                <span className="text-base font-extrabold text-rose-300 mt-1 block">{feedback?.studyPlanner?.breakSchedule || '10 min / hr'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Target Completion</span>
                <span className="text-base font-extrabold text-white mt-1 block">{feedback?.studyPlanner?.targetCompletionDate || '30 Days'}</span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE AI MENTOR CHAT BOX */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-indigo-500/30 space-y-6 shadow-glow-indigo">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Ask AI Mentor About Your Test</h3>
                <p className="text-xs text-indigo-300">Answers are generated strictly using your verified MongoDB student data</p>
              </div>
            </div>

            {/* Quick Question Pills */}
            <div className="flex flex-wrap gap-2">
              {[
                "Why did I lose marks?",
                "Which chapter should I study first?",
                "How many hours should I study?",
                "Can I score 95 percentile?",
                "Explain my mistakes."
              ].map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAskMentor(pill)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/20 transition-all"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="max-h-80 overflow-y-auto space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              {mentorChatHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  Ask any question about your test results, weak topics, or study plan above!
                </p>
              ) : (
                mentorChatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3.5 rounded-2xl max-w-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {mentorLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-slate-900 text-slate-400 border border-slate-800 text-xs flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>AI Mentor is analyzing your MongoDB data...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={mentorInput}
                onChange={(e) => setMentorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskMentor()}
                placeholder="Ask AI Mentor anything about your test..."
                className="flex-1 px-4 py-3 rounded-xl glass-input text-xs font-medium bg-slate-900 text-slate-100 border border-slate-800 focus:border-indigo-500 outline-none"
              />
              <button
                onClick={() => handleAskMentor()}
                disabled={mentorLoading || !mentorInput.trim()}
                className="px-5 py-3 rounded-xl text-xs font-extrabold text-white gradient-bg flex items-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </button>
            </div>
          </div>

          {/* DETAILED QUESTION-BY-QUESTION REVIEW */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white pb-3 border-b border-slate-800">
              Detailed Question-by-Question Review
            </h3>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAns = userAnswers.find(a => String(a.question?._id || a.question) === String(q._id));
                const selectedIdx = userAns ? userAns.selectedOptionIndex : -1;
                const isCorrect = userAns ? userAns.isCorrect : false;
                const isSkipped = selectedIdx === -1;
                const isExpanded = expandedQuestion === idx;

                return (
                  <div key={idx} className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
                    <div
                      onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                      className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : isSkipped ? (
                          <MinusCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                        )}
                        <div>
                          <span className="text-xs font-bold text-slate-400 mr-2">Q{idx + 1}.</span>
                          <span className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-xl">
                            {q.questionText}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCorrect ? 'bg-emerald-500/20 text-emerald-400' : isSkipped ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-800/80 bg-slate-950/80 space-y-4 text-xs">
                        <div className="space-y-2">
                          <p className="font-bold text-white text-sm">{q.questionText}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, oIdx) => {
                              const isThisSelected = selectedIdx === oIdx;
                              const isThisCorrect = q.correctOptionIndex === oIdx;

                              return (
                                <div
                                  key={oIdx}
                                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                                    isThisCorrect
                                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                      : isThisSelected
                                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                                      : 'bg-slate-900 border-slate-800 text-slate-400'
                                  }`}
                                >
                                  <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                  {isThisCorrect && <span className="text-[10px] font-bold uppercase text-emerald-400">Correct Answer</span>}
                                  {isThisSelected && !isThisCorrect && <span className="text-[10px] font-bold uppercase text-rose-400">Your Selection</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Explanation Box */}
                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
                          <span className="font-bold text-indigo-400 block uppercase tracking-wider text-[10px]">Detailed Explanation</span>
                          <p className="text-slate-300 leading-relaxed text-xs">{q.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default TestResult;
