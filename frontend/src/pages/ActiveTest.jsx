import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const ActiveTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: { selectedOptionIndex, timeSpentSeconds } }
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [totalTimeSpentSeconds, setTotalTimeSpentSeconds] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const timerRef = useRef(null);

  // Fetch test details from MongoDB
  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tests/${testId}`);
        if (res.data.success && res.data.test) {
          setTest(res.data.test);
          setTimeRemainingSeconds(res.data.test.totalTimeSeconds || 600);
        } else {
          setError('Test paper not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading test');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  // Master Timer countdown
  useEffect(() => {
    if (!test || submitting) return;

    timerRef.current = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
      setTotalTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [test, submitting]);

  const handleSelectOption = (questionId, optionIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selectedOptionIndex: optionIndex,
        timeSpentSeconds: (prev[questionId]?.timeSpentSeconds || 0) + 1
      }
    }));
  };

  const handleClearAnswer = (questionId) => {
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowSubmitModal(false);

    try {
      const formattedAnswers = test.questions.map((q) => {
        const ans = userAnswers[q._id];
        return {
          questionId: q._id,
          selectedOptionIndex: ans ? ans.selectedOptionIndex : -1,
          timeSpentSeconds: ans ? ans.timeSpentSeconds : 0
        };
      });

      const payload = {
        mockTestId: test._id,
        userAnswers: formattedAnswers,
        totalTimeSpentSeconds
      };

      const res = await api.post('/tests/submit', payload);

      if (res.data.success && res.data.attempt) {
        navigate(`/results/${res.data.attempt._id}`);
      } else {
        setError('Submission failed. Please retry.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Submit test error:', err);
      setError(err.response?.data?.message || 'Server error on submission');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Loading questions & starting test timer..." />
        </div>
      </div>
    );
  }

  if (error || !test || !Array.isArray(test.questions) || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 max-w-md">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Test Unavailable</h3>
            <p className="text-sm text-slate-400 mb-6">{error || 'No questions available for this test paper yet.'}</p>
            <button
              onClick={() => navigate('/generate-test')}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white gradient-bg"
            >
              Back to Test Generator
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = test.questions[currentIndex] || {};
  const totalQuestions = test.questions.length;
  const answeredCount = Object.keys(userAnswers).length;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500">
      <Navbar />

      {/* Top Test Header Bar */}
      <div className="sticky top-16 z-20 glass-panel border-b border-slate-800/80 px-4 sm:px-8 py-3 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
              {test.exam} • {test.subject?.name || 'Subject'}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-xs sm:max-w-md">
              {test.title}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer Badge */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-sm font-extrabold font-mono ${
              timeRemainingSeconds < 120
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-slate-900 text-indigo-300 border-slate-800'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeRemainingSeconds)}</span>
            </div>

            {/* Submit Test Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-bg shadow-glow-indigo hover:opacity-90 flex items-center space-x-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit Test</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Quiz Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Question Card (Cols 1-3) */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 relative">
            
            {/* Top Q meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                {currentQ.questionType && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[11px] font-semibold border border-purple-500/20">
                    {currentQ.questionType}
                  </span>
                )}
                {currentQ.bloomLevel && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[11px] font-semibold border border-emerald-500/20">
                    Bloom: {currentQ.bloomLevel}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {currentQ.conceptTested && (
                  <span className="hidden md:inline text-slate-500 font-normal text-[11px]">
                    Concept: <strong className="text-slate-300">{currentQ.conceptTested}</strong>
                  </span>
                )}
                <span>
                  Difficulty: <span className="text-amber-400">{currentQ.difficulty}</span>
                </span>
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed mb-8">
              {currentQ.questionText}
            </h3>

            {/* Options List */}
            <div className="space-y-3.5">
              {(currentQ.options || []).map((optionText, idx) => {
                const isSelected = userAnswers[currentQ._id]?.selectedOptionIndex === idx;
                const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(currentQ._id, idx)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center space-x-4 transition-all duration-150 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-glow-indigo'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {optionLabel}
                    </div>
                    <span className="text-sm font-medium leading-normal flex-1">{optionText}</span>
                  </button>
                );
              })}
            </div>

            {/* Clear selection */}
            {userAnswers[currentQ._id]?.selectedOptionIndex !== undefined && (
              <div className="mt-4 text-right">
                <button
                  type="button"
                  onClick={() => handleClearAnswer(currentQ._id)}
                  className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            )}

          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-5 py-3 rounded-xl border border-slate-800 text-sm font-bold text-slate-300 hover:bg-slate-800/60 disabled:opacity-30 disabled:hover:bg-transparent flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white gradient-bg hover:opacity-90 flex items-center space-x-2"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 flex items-center space-x-2"
              >
                <span>Submit Final Test</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Question Palette Sidebar (Col 4) */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-xs font-normal text-indigo-400">{answeredCount} / {totalQuestions} Answered</span>
            </h4>

            <div className="grid grid-cols-5 gap-2.5">
              {test.questions.map((q, idx) => {
                const isAnswered = userAnswers[q._id]?.selectedOptionIndex !== undefined;
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-bold text-xs border transition-all ${
                      isCurrent
                        ? 'ring-2 ring-indigo-400 border-indigo-500 text-white bg-indigo-600'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-xs space-y-2 text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-500 inline-block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800 inline-block" />
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 max-w-md w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-white">Submit Test & Analyze Performance?</h3>
            <p className="text-sm text-slate-400">
              You have answered <span className="text-white font-bold">{answeredCount}</span> out of <span className="text-white font-bold">{totalQuestions}</span> questions. Gemini AI will immediately analyze your answers to build your learning gap report.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-800 text-sm font-bold text-slate-300 hover:bg-slate-800"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white gradient-bg shadow-glow-indigo hover:opacity-90 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span>Submit Now</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ActiveTest;
