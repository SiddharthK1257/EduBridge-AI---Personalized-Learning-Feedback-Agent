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
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Loading questions & starting test timer..." />
        </div>
      </div>
    );
  }

  if (error || !test || !Array.isArray(test.questions) || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="glass-card p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-md max-w-md">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Test Unavailable</h3>
            <p className="text-sm text-slate-600 mb-6">{error || 'No questions available for this test paper yet.'}</p>
            <button
              onClick={() => navigate('/generate-test')}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-glow-emerald"
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500">
      <Navbar />

      {/* Top Test Header Bar */}
      <div className="sticky top-[68px] z-20 glass-panel border-b border-slate-200 px-4 sm:px-8 py-3.5 bg-white/95 backdrop-blur-xl shadow-soft-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div>
            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest">
              {test.exam} • {test.subject?.name || 'Subject'}
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 truncate max-w-xs sm:max-w-md">
              {test.title}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer Badge */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-sm font-black font-mono shadow-soft-sm ${
              timeRemainingSeconds < 120
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{formatTime(timeRemainingSeconds)}</span>
            </div>

            {/* Submit Test Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-glow-emerald hover:opacity-95 flex items-center space-x-2"
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
          
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-md relative">
            
            {/* Top Q meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                {currentQ.questionType && (
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-800 text-[11px] font-bold border border-violet-200">
                    {currentQ.questionType}
                  </span>
                )}
                {currentQ.bloomLevel && (
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200">
                    Bloom: {currentQ.bloomLevel}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                {currentQ.conceptTested && (
                  <span className="hidden md:inline text-slate-500 font-medium text-[11px]">
                    Concept: <strong className="text-slate-800">{currentQ.conceptTested}</strong>
                  </span>
                )}
                <span>
                  Difficulty: <span className="text-amber-600 font-extrabold">{currentQ.difficulty}</span>
                </span>
              </div>
            </div>

            {/* Question Text */}
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-relaxed mb-8">
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
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-soft-sm ring-2 ring-emerald-400/30'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/20'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white shadow-glow-emerald' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {optionLabel}
                    </div>
                    <span className="text-sm font-semibold leading-normal flex-1">{optionText}</span>
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
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
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
              className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white flex items-center space-x-2 shadow-soft-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-6 py-3 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-glow-emerald hover:opacity-95 flex items-center space-x-2"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-6 py-3 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 shadow-glow-emerald hover:opacity-95 flex items-center space-x-2"
              >
                <span>Submit Final Test</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Question Palette Sidebar (Col 4) */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
            <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-xs font-bold text-emerald-700">{answeredCount} / {totalQuestions} Answered</span>
            </h4>

            <div className="grid grid-cols-5 gap-2.5">
              {test.questions.map((q, idx) => {
                const isAnswered = userAnswers[q._id]?.selectedOptionIndex !== undefined;
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-black text-xs border transition-all ${
                      isCurrent
                        ? 'ring-2 ring-emerald-500 border-emerald-500 text-white bg-emerald-600 shadow-glow-emerald'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 text-xs space-y-2 text-slate-600 font-medium">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 inline-block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300 inline-block" />
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-8 rounded-3xl border border-slate-200 bg-white max-w-md w-full text-center space-y-5 shadow-soft-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto shadow-glow-emerald">
              <Sparkles className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900">Submit Test & Analyze Performance?</h3>
            <p className="text-sm text-slate-600 font-medium">
              You have answered <span className="text-emerald-700 font-black">{answeredCount}</span> out of <span className="text-slate-900 font-bold">{totalQuestions}</span> questions. Gemini AI will immediately analyze your answers to build your learning gap report.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 shadow-glow-emerald hover:opacity-95 flex items-center justify-center space-x-2"
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
