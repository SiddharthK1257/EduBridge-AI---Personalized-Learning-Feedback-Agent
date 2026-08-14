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
import DrillTestModal from '../components/drill/DrillTestModal';
import api from '../services/api';

const TestResult = () => {
  const { attemptId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Drill Test Modal State
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [activeDrillTopics, setActiveDrillTopics] = useState([]);

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
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Fetching Gemini AI diagnostic analysis & question review..." />
        </div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="glass-card p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-md max-w-md">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-900 mb-2">Result Error</h3>
            <p className="text-sm text-slate-600 mb-6">{error || 'Result details missing'}</p>
            <Link to="/dashboard" className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-glow-emerald">
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

  // Extract structured weak topics for targeted AI Drill Tests
  const extractedWeakTopics = (() => {
    const list = [];
    if (Array.isArray(feedback?.weaknesses) && feedback.weaknesses.length > 0) {
      list.push(...feedback.weaknesses);
    }
    if (Array.isArray(feedback?.topicWiseAnalysis)) {
      feedback.topicWiseAnalysis
        .filter(t => t && (t.accuracy < 70 || t.weaknessScore > 50))
        .forEach(t => { if (t.topicName) list.push(t.topicName); });
    }
    if (Array.isArray(feedback?.conceptsNeedingRevision) && feedback.conceptsNeedingRevision.length > 0) {
      list.push(...feedback.conceptsNeedingRevision);
    }
    if (mockTest.topic?.name) {
      list.push(mockTest.topic.name);
    }
    const cleanList = Array.from(new Set(list.filter(t => t && typeof t === 'string' && t.trim().length > 0)));
    return cleanList.length > 0 ? cleanList : [mockTest.subject?.name ? `${mockTest.subject.name} Problem Solving Foundations` : 'Core Subject Mastery'];
  })();

  // Extract incorrect questions context for AI drill context
  const incorrectQuestionsList = (userAnswers || [])
    .filter(a => !a.isCorrect)
    .map(a => ({
      questionText: a.question?.questionText || a.questionText || a.question?.question || 'Diagnostic practice question',
      topic: a.question?.topic?.name || a.topic || mockTest.subject?.name || ''
    }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-8">
          
          {/* Header Banner */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 text-emerald-700 font-extrabold text-xs uppercase tracking-widest mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Gemini AI Diagnostic Report</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {mockTest.title || 'Diagnostic Test Result'}
                </h1>
                <p className="text-slate-600 text-sm mt-1 font-medium">
                  {mockTest.exam} • {mockTest.subject?.name} • Submitted on {new Date(attempt.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Score Circle */}
              <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-soft-sm">
                <div className="text-right">
                  <span className="text-xs text-slate-500 block uppercase font-black tracking-wider">Overall Grade</span>
                  <span className={`text-2xl font-black ${isZeroScore ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {feedback?.overallGrade || (isZeroScore ? 'Needs Focus' : 'B+')}
                  </span>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-soft-sm ${
                  isZeroScore ? 'bg-rose-600 shadow-glow-rose' : 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-glow-emerald'
                }`}>
                  <span className="text-xl leading-none">{attempt.accuracy}%</span>
                  <span className="text-[10px] opacity-90 uppercase font-bold mt-0.5">Accuracy</span>
                </div>
              </div>
            </div>
          </div>

          {/* 🎯 PROMINENT DRILL TEST ACTION CARD (NEW CORE FEATURE) */}
          <div className="p-6 rounded-3xl border border-teal-300 bg-gradient-to-r from-teal-50 via-emerald-50 to-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-glow-teal">
                <Target className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-200">
                    🎯 Gemini 3.7 Flash Precision Drill
                  </span>
                  <span className="text-xs text-slate-500 font-bold hidden sm:inline">• Adaptive Recovery</span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Drill Test: Practice Topics You Need to Improve
                </h3>
                <p className="text-xs text-slate-700 mt-0.5 font-medium">
                  Instantly generate an adaptive test specifically focused on your identified weak topics in {mockTest.subject?.name || 'this subject'}.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveDrillTopics(extractedWeakTopics);
                setDrillModalOpen(true);
              }}
              className="px-6 py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 shadow-glow-teal hover:opacity-95 transition-all whitespace-nowrap flex items-center space-x-2 shrink-0"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Start Drill Test Now 🚀</span>
            </button>
          </div>

          {/* AI Study Roadmap Auto-Generated Banner */}
          <div className="p-6 rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-glow-emerald">
                <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <span>Gemini AI Study Roadmap Auto-Generated!</span>
                </h3>
                <p className="text-xs text-slate-700 mt-0.5 font-medium">
                  EduBridge AI has automatically built a personalized study roadmap & healthy life balance schedule based on your score ({attempt.accuracy}% accuracy).
                </p>
              </div>
            </div>
            <Link
              to="/study-planner"
              className="px-5 py-3 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-glow-emerald hover:opacity-95 transition-all whitespace-nowrap flex items-center space-x-2 shrink-0"
            >
              <span>View My Study Roadmap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 0% SCORE CRITICAL ALERT BADGES (STRICT RULE IMPLEMENTATION) */}
          {isZeroScore && (
            <div className="p-6 rounded-3xl border border-rose-300 bg-rose-50/80 space-y-4 shadow-soft-sm">
              <div className="flex items-center space-x-3 text-rose-800">
                <AlertTriangle className="w-6 h-6 text-rose-600 animate-pulse" />
                <h3 className="text-lg font-black">Critical Performance Alert (0% Score Recorded)</h3>
              </div>
              <p className="text-xs text-rose-800 font-medium">
                No correct answers were detected in this attempt. Demonstrating zero accuracy triggers immediate priority concept rebuilding before proceeding to advanced practice.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white border border-rose-200 text-center shadow-soft-sm">
                  <span className="text-[11px] text-slate-500 block uppercase font-bold">Current Performance</span>
                  <span className="text-sm font-black text-rose-700">Critical</span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-rose-200 text-center shadow-soft-sm">
                  <span className="text-[11px] text-slate-500 block uppercase font-bold">Learning Gap</span>
                  <span className="text-sm font-black text-rose-700">Very High</span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-rose-200 text-center shadow-soft-sm">
                  <span className="text-[11px] text-slate-500 block uppercase font-bold">Concept Clarity</span>
                  <span className="text-sm font-black text-rose-700">Very Low</span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-rose-200 text-center shadow-soft-sm">
                  <span className="text-[11px] text-slate-500 block uppercase font-bold">Exam Readiness</span>
                  <span className="text-sm font-black text-amber-700">Low</span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-rose-200 text-center shadow-soft-sm">
                  <span className="text-[11px] text-slate-500 block uppercase font-bold">Confidence</span>
                  <span className="text-sm font-black text-amber-700">Low</span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-rose-200 text-center shadow-soft-sm">
                  <span className="text-[11px] text-slate-500 block uppercase font-bold">Recovery Priority</span>
                  <span className="text-sm font-black text-rose-700">Immediate</span>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="glass-card p-3.5 rounded-2xl border border-slate-200 bg-white text-center shadow-soft-sm">
              <span className="text-[11px] text-slate-500 block font-bold uppercase">Score</span>
              <span className="text-xl font-black text-slate-900">{attempt.score} / {attempt.totalMarks}</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-slate-200 bg-white text-center shadow-soft-sm">
              <span className="text-[11px] text-slate-500 block font-bold uppercase">Accuracy</span>
              <span className="text-xl font-black text-emerald-700">{attempt.accuracy}%</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 text-center shadow-soft-sm">
              <span className="text-[11px] font-bold text-emerald-800 block uppercase">Correct</span>
              <span className="text-xl font-black text-emerald-700">{attempt.correctCount}</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 text-center shadow-soft-sm">
              <span className="text-[11px] font-bold text-rose-800 block uppercase">Wrong</span>
              <span className="text-xl font-black text-rose-700">{attempt.wrongCount}</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-slate-200 bg-white text-center shadow-soft-sm">
              <span className="text-[11px] text-slate-500 block font-bold uppercase">Negative</span>
              <span className="text-xl font-black text-rose-600">-{attempt.negativeMarks || 0}</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-violet-200 bg-violet-50/50 text-center shadow-soft-sm">
              <span className="text-[11px] text-violet-800 block font-bold uppercase">Percentile</span>
              <span className="text-xl font-black text-violet-700">{attempt.percentile || 50}%</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 text-center shadow-soft-sm">
              <span className="text-[11px] text-amber-800 block font-bold uppercase">Avg Time</span>
              <span className="text-xl font-black text-amber-700">{attempt.avgTimePerQuestionSeconds}s</span>
            </div>
            <div className="glass-card p-3.5 rounded-2xl border border-teal-200 bg-teal-50/50 text-center shadow-soft-sm">
              <span className="text-[11px] text-teal-800 block font-bold uppercase">Speed</span>
              <span className="text-xl font-black text-teal-700">{attempt.speedRating || 'Optimal'}</span>
            </div>
          </div>

          {/* AI Strengths vs Weaknesses Card */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
              <BrainCircuit className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-black text-slate-900">Gemini AI Diagnostic Performance Breakdown</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div>
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-3 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" /> Demonstrated Strengths
                </h4>
                {isZeroScore ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                    Current assessment shows no measurable strengths in this attempt. Focus should be on rebuilding fundamental concepts before moving to advanced topics.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {(feedback?.strengths || []).map((str, idx) => (
                      <li key={idx} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-slate-800 flex items-start font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 mr-2.5 flex-shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Weaknesses */}
              <div>
                <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider mb-3 flex items-center">
                  <XCircle className="w-4 h-4 mr-1.5 text-rose-600" /> Weaknesses & Concept Breakdown
                </h4>
                <ul className="space-y-2">
                  {(feedback?.weaknesses || ['Concepts need deeper foundation review']).map((wk, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-slate-800 flex items-center justify-between font-medium">
                      <div className="flex items-start mr-2">
                        <span className="w-2 h-2 rounded-full bg-rose-600 mt-1 mr-2.5 flex-shrink-0" />
                        <span>{wk}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDrillTopics([wk]);
                          setDrillModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[10px] border border-rose-300 transition-colors flex items-center space-x-1 shrink-0"
                        title={`Practice Drill on ${wk}`}
                      >
                        <Target className="w-3 h-3 text-rose-600" />
                        <span>Drill</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* TOPIC ANALYSIS TABLE */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
              <Layers className="w-5 h-5 text-violet-600" />
              <h3 className="text-base font-black text-slate-900">Topic Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[11px] border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(feedback?.topicWiseAnalysis || attempt.topicWiseAccuracy || []).map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{t.topicName}</td>
                      <td className="p-3.5 text-center">{t.questionsCount || t.attempted || 0}</td>
                      <td className="p-3.5 text-center text-emerald-700 font-extrabold">{t.correct}</td>
                      <td className="p-3.5 text-center text-rose-700 font-extrabold">{t.wrong}</td>
                      <td className="p-3.5 text-center font-black text-emerald-800">{t.accuracy}%</td>
                      <td className="p-3.5 text-center text-amber-700 font-bold">{t.averageTime}s</td>
                      <td className="p-3.5 text-center font-bold">{t.confidence || t.accuracy}%</td>
                      <td className="p-3.5 text-slate-600 text-[11px] font-medium">{t.recommendation || 'Targeted drill'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHAPTER ANALYSIS TABLE */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">Chapter Analysis</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[11px] border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(feedback?.chapterWiseAnalysis || attempt.chapterWiseAccuracy || []).map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{c.chapterName}</td>
                      <td className="p-3.5 text-center">{c.questionsCount || c.attempted || 0}</td>
                      <td className="p-3.5 text-center text-emerald-700 font-extrabold">{c.correct}</td>
                      <td className="p-3.5 text-center text-rose-700 font-extrabold">{c.wrong}</td>
                      <td className="p-3.5 text-center font-black text-emerald-800">{c.accuracy}%</td>
                      <td className="p-3.5 text-center font-bold">{c.learningGap || (c.accuracy < 50 ? 'High' : 'Low')}</td>
                      <td className="p-3.5 text-center text-amber-700 font-black">{c.estimatedStudyHours || 4} hrs</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          (c.priority === 'Immediate' || c.priority === 'High') ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
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
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-slate-900">Difficulty Analysis</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(feedback?.difficultyWiseAnalysis || attempt.difficultyWiseAccuracy || []).map((d, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{d.difficulty} Difficulty</span>
                    <span className="text-xs font-black text-emerald-700">{d.accuracy}% Acc</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-emerald-600 transition-all duration-300 rounded-full" style={{ width: `${d.accuracy}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Attempted: <strong className="text-slate-900">{d.attempted}</strong> | Correct: <strong className="text-emerald-700">{d.correct}</strong> | Wrong: <strong className="text-rose-700">{d.wrong}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI LEARNING GAP DETECTOR */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
              <Activity className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-black text-slate-900">AI Learning Gap Detector</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="font-extrabold text-rose-800 block mb-1">Repeated Mistakes</span>
                <p className="text-slate-700 font-medium">{feedback?.aiLearningGaps?.repeatedMistakes?.[0] || 'Option distractor traps'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="font-extrabold text-amber-800 block mb-1">Concept Weakness</span>
                <p className="text-slate-700 font-medium">{feedback?.aiLearningGaps?.conceptWeakness?.[0] || 'Core theoretical principles'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200">
                <span className="font-extrabold text-violet-800 block mb-1">Calculation & Numerical</span>
                <p className="text-slate-700 font-medium">{feedback?.aiLearningGaps?.calculationErrors?.[0] || 'Numerical steps precision'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                <span className="font-extrabold text-indigo-800 block mb-1">Memory & Recall</span>
                <p className="text-slate-700 font-medium">{feedback?.aiLearningGaps?.memoryErrors?.[0] || 'Formula recall under time pressure'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="font-extrabold text-emerald-800 block mb-1">Application Skills</span>
                <p className="text-slate-700 font-medium">{feedback?.aiLearningGaps?.applicationWeakness?.[0] || 'Problem solving steps'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
                <span className="font-extrabold text-sky-800 block mb-1">Time Management</span>
                <p className="text-slate-700 font-medium">{feedback?.aiLearningGaps?.timeManagementIssues?.[0] || 'Question pacing & speed'}</p>
              </div>
            </div>
          </div>

          {/* ONE CLICK RECOVERY PLAN */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <Compass className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-black text-slate-900">One-Click AI Recovery Plan</h3>
                  <p className="text-xs text-slate-600 font-medium">Step-by-step roadmap to eliminate learning gaps</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setRecoveryTab('7day')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${recoveryTab === '7day' ? 'bg-emerald-600 text-white shadow-soft-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  7 Day Plan
                </button>
                <button
                  onClick={() => setRecoveryTab('15day')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${recoveryTab === '15day' ? 'bg-emerald-600 text-white shadow-soft-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  15 Day Plan
                </button>
                <button
                  onClick={() => setRecoveryTab('30day')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${recoveryTab === '30day' ? 'bg-emerald-600 text-white shadow-soft-sm' : 'text-slate-600 hover:text-slate-900'}`}
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
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-emerald-800 font-bold">
                    <span>Day {d.day || i + 1}</span>
                    <span className="text-slate-500 font-semibold">{d.hours || 3} hrs</span>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">{d.focus}</h4>
                  <ul className="space-y-1 text-slate-600 text-[11px] font-medium">
                    {(d.tasks || []).map((t, idx) => (
                      <li key={idx}>• {t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Extras: Recommended Videos & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 text-xs">
                <span className="font-extrabold text-violet-800 flex items-center mb-2">
                  <Video className="w-4 h-4 mr-2 text-violet-600" /> Recommended Conceptual Videos
                </span>
                <ul className="space-y-1 text-slate-700 font-medium">
                  {(feedback?.recoveryPlan?.recommendedVideos || [`${mockTest.subject?.name} Foundational Lecture`]).map((v, i) => (
                    <li key={i}>▶ {v}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="font-extrabold text-emerald-800 flex items-center mb-2">
                  <FileText className="w-4 h-4 mr-2 text-emerald-600" /> Recommended Notes & Revision Sheets
                </span>
                <ul className="space-y-1 text-slate-700 font-medium">
                  {(feedback?.recoveryPlan?.recommendedNotes || [`${mockTest.subject?.name} Formula Flashcards`]).map((n, i) => (
                    <li key={i}>📄 {n}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* AI STUDY PLANNER */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">AI Study Planner Recommendations</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-semibold">Daily Study</span>
                <span className="text-base font-black text-emerald-700 mt-1 block">{feedback?.studyPlanner?.dailyStudyHours || 4} hrs</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-semibold">Revision</span>
                <span className="text-base font-black text-violet-700 mt-1 block">{feedback?.studyPlanner?.revisionHours || 1.5} hrs</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-semibold">Practice</span>
                <span className="text-base font-black text-teal-700 mt-1 block">{feedback?.studyPlanner?.practiceHours || 2} hrs</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-semibold">Mock Frequency</span>
                <span className="text-base font-black text-amber-700 mt-1 block">{feedback?.studyPlanner?.mockTestFrequency || '2 / week'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-semibold">Sleep</span>
                <span className="text-base font-black text-sky-700 mt-1 block">{feedback?.studyPlanner?.sleepRecommendation || '7-8 hrs'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-semibold">Breaks</span>
                <span className="text-base font-black text-rose-700 mt-1 block">{feedback?.studyPlanner?.breakSchedule || '10 min / hr'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-semibold">Target Completion</span>
                <span className="text-base font-black text-slate-900 mt-1 block">{feedback?.studyPlanner?.targetCompletionDate || '30 Days'}</span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE AI MENTOR CHAT BOX */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-200 bg-white space-y-6 shadow-soft-md">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-glow-emerald">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Ask AI Mentor About Your Test</h3>
                <p className="text-xs text-slate-600 font-medium">Answers are generated strictly using your verified MongoDB student data</p>
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
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="max-h-80 overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              {mentorChatHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 font-medium">
                  Ask any question about your test results, weak topics, or study plan above!
                </p>
              ) : (
                mentorChatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3.5 rounded-2xl max-w-2xl text-xs leading-relaxed font-medium ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none shadow-soft-sm'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-soft-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {mentorLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-white text-slate-600 border border-slate-200 text-xs flex items-center space-x-2 shadow-soft-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
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
                className="flex-1 px-4 py-3 rounded-xl bg-white text-slate-900 border border-slate-300 text-xs font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
              />
              <button
                onClick={() => handleAskMentor()}
                disabled={mentorLoading || !mentorInput.trim()}
                className="px-5 py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-glow-emerald hover:opacity-95 flex items-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </button>
            </div>
          </div>

          {/* DETAILED QUESTION-BY-QUESTION REVIEW */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-200">
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
                  <div key={idx} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-soft-sm">
                    <div
                      onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                      className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        ) : isSkipped ? (
                          <MinusCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                        )}
                        <div>
                          <span className="text-xs font-black text-slate-500 mr-2">Q{idx + 1}.</span>
                          <span className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-xl">
                            {q.questionText}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          isCorrect ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : isSkipped ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-200 bg-slate-50/70 space-y-4 text-xs">
                        <div className="space-y-2">
                          <p className="font-bold text-slate-900 text-sm">{q.questionText}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, oIdx) => {
                              const isThisSelected = selectedIdx === oIdx;
                              const isThisCorrect = q.correctOptionIndex === oIdx;

                              return (
                                <div
                                  key={oIdx}
                                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                                    isThisCorrect
                                      ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-black'
                                      : isThisSelected
                                      ? 'bg-rose-100 border-rose-400 text-rose-950 font-black'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                  {isThisCorrect && <span className="text-[10px] font-black uppercase text-emerald-800">Correct Answer</span>}
                                  {isThisSelected && !isThisCorrect && <span className="text-[10px] font-black uppercase text-rose-800">Your Selection</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Explanation Box */}
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                          <span className="font-black text-emerald-800 block uppercase tracking-wider text-[10px]">Detailed Explanation</span>
                          <p className="text-slate-800 leading-relaxed text-xs font-medium">{q.explanation}</p>
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

      {/* Gemini 3.7 Flash Precision Targeted Drill Test Modal */}
      <DrillTestModal
        isOpen={drillModalOpen}
        onClose={() => setDrillModalOpen(false)}
        subjectName={mockTest.subject?.name || 'Mathematics'}
        weakTopics={activeDrillTopics.length > 0 ? activeDrillTopics : extractedWeakTopics}
        score={attempt.score !== undefined ? attempt.score : attempt.correctCount}
        totalMarks={attempt.totalQuestions || questions.length || 10}
        percentage={attempt.accuracy}
        feedback={typeof feedback?.motivationalFeedback === 'string' ? feedback.motivationalFeedback : (feedback?.mistakeAnalysis || '')}
        incorrectQuestions={incorrectQuestionsList}
        sourceType="scorecard"
      />

      <Footer />
    </div>
  );
};

export default TestResult;
