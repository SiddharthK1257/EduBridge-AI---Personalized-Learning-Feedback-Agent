import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Sparkles, 
  Zap, 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  BookOpen, 
  Award, 
  Clock, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  HelpCircle,
  Flame,
  Check
} from 'lucide-react';
import api from '../../services/api';

const DrillTestModal = ({
  isOpen,
  onClose,
  subjectName = 'Mathematics',
  weakTopics = [],
  score = null,
  totalMarks = 100,
  percentage = null,
  feedback = '',
  incorrectQuestions = [],
  sourceType = 'scorecard',
  onDrillCompleted = null
}) => {
  // Modal Stages: 'config' | 'generating' | 'active' | 'submitting' | 'result' | 'error'
  const [stage, setStage] = useState('config');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(5);
  const [selectedDifficulty, setSelectedDifficulty] = useState('Adaptive');
  const [drillData, setDrillData] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionIdx]: selectedOptionIndex }
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [expandedReviewIdx, setExpandedReviewIdx] = useState(null);
  const [previousDrillHistory, setPreviousDrillHistory] = useState(null);

  // Normalize subject name and weak topics safely
  const resolvedSubjectName = typeof subjectName === 'string' && subjectName.trim().length > 0
    ? subjectName.trim()
    : (subjectName?.name || subjectName?.subjectName || 'Academic Subject');

  const cleanWeakTopics = Array.isArray(weakTopics)
    ? weakTopics.map(t => {
        if (typeof t === 'string') return t.trim();
        if (t && typeof t === 'object') return (t.topicName || t.name || t.chapterName || '').trim();
        return String(t || '').trim();
      }).filter(t => t && t.length > 0)
    : (typeof weakTopics === 'string' && weakTopics.trim().length > 0 ? [weakTopics.trim()] : []);

  const displayTopics = cleanWeakTopics.length > 0 ? cleanWeakTopics : [`${resolvedSubjectName} Core Foundations`];

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('config');
      setUserAnswers({});
      setCurrentQuestionIdx(0);
      setDrillData(null);
      setEvaluationResult(null);
      setErrorMessage('');
      setShowHint(false);
      setExpandedReviewIdx(null);
    }
  }, [isOpen, subjectName]);

  if (!isOpen) return null;

  // Handle starting/generating the drill test
  const handleStartDrill = async (customPrevPerformance = null) => {
    setStage('generating');
    setErrorMessage('');
    setUserAnswers({});
    setCurrentQuestionIdx(0);

    try {
      const payload = {
        subjectName: resolvedSubjectName,
        weakTopics: displayTopics,
        score,
        totalMarks,
        percentage: percentage !== null && percentage !== undefined ? percentage : (score && totalMarks ? Math.round((score / totalMarks) * 100) : null),
        feedback: typeof feedback === 'string' ? feedback : JSON.stringify(feedback || ''),
        incorrectQuestions,
        difficulty: selectedDifficulty,
        questionCount: selectedQuestionCount,
        previousDrillPerformance: customPrevPerformance || previousDrillHistory,
        sourceType
      };

      const res = await api.post('/tests/drill/generate', payload);

      if (res.data.success && res.data.drillTest && res.data.drillTest.questions?.length > 0) {
        setDrillData(res.data.drillTest);
        setStage('active');
      } else {
        throw new Error(res.data.message || 'Failed to generate drill test questions');
      }
    } catch (err) {
      console.error('Drill Generation Error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to generate AI drill test. Please try again.');
      setStage('error');
    }
  };

  // Select an option for the current question
  const handleSelectOption = (optIdx) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIdx]: optIdx
    }));
  };

  // Submit the drill test
  const handleSubmitDrill = async () => {
    if (!drillData) return;
    setStage('submitting');
    setErrorMessage('');

    try {
      const formattedAnswers = drillData.questions.map((q, idx) => ({
        questionIndex: idx,
        questionId: q.id,
        selectedOptionIndex: typeof userAnswers[idx] === 'number' ? userAnswers[idx] : -1,
        topic: q.topic || subjectName
      }));

      const res = await api.post('/tests/drill/submit', {
        drillTest: drillData,
        userAnswers: formattedAnswers,
        previousPerformance: previousDrillHistory
      });

      if (res.data.success && res.data.evaluation) {
        setEvaluationResult(res.data.evaluation);
        setPreviousDrillHistory(res.data.evaluation);
        setStage('result');
        if (onDrillCompleted) {
          onDrillCompleted(res.data.evaluation);
        }
      } else {
        throw new Error(res.data.message || 'Failed to evaluate drill test');
      }
    } catch (err) {
      console.error('Drill Submit Error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit drill test');
      setStage('active');
    }
  };

  // Handle Taking Another Adaptive Drill Test
  const handleTakeAnotherDrill = () => {
    if (evaluationResult) {
      // Auto-adapt difficulty for follow-up
      const nextDiff = evaluationResult.nextRecommendedDifficulty || 'Adaptive';
      setSelectedDifficulty(nextDiff);
      handleStartDrill(evaluationResult);
    } else {
      handleStartDrill();
    }
  };

  const currentQuestion = drillData?.questions?.[currentQuestionIdx];
  const totalQuestions = drillData?.questions?.length || 0;
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentQuestionIdx + 1) / totalQuestions) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-soft-lg max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden relative text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-glow-emerald shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Gemini Flash AI Engine
                </span>
                <span className="text-xs text-slate-500 font-bold hidden sm:inline">• Precision Targeted Drill</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                {drillData?.title || `Targeted Drill Test: ${subjectName}`}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0"
            title="Close Drill Test"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* STAGE 1: CONFIGURATION & PRE-LAUNCH PREVIEW */}
        {/* ======================================================== */}
        {stage === 'config' && (
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-black text-emerald-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Custom Diagnostics Focus Identified</span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Practice the exact topics where you need improvement
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                EduBridge AI has extracted your weak areas from your diagnostic results. Instead of a generic exam, this drill test will target only these specific concepts.
              </p>

              {/* Weak Topics Badges */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 block mb-1.5">Target Weak Topics:</span>
                <div className="flex flex-wrap gap-2">
                  {displayTopics.map((topic, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>{topic}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Config Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Question Count Selector */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-soft-sm">
                <label className="text-xs font-black text-slate-800 block uppercase">
                  Number of Practice Questions:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 8, 10].map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSelectedQuestionCount(count)}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                        selectedQuestionCount === count
                          ? 'bg-emerald-600 text-white shadow-soft-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count} Questions
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Takes ~{selectedQuestionCount * 1.5} minutes to complete</p>
              </div>

              {/* Difficulty Mode */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-soft-sm">
                <label className="text-xs font-black text-slate-800 block uppercase">
                  Difficulty Mode:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Adaptive', 'Medium', 'Hard'].map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                        selectedDifficulty === diff
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-soft-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedDifficulty === 'Adaptive' 
                    ? 'AI automatically adjusts based on your past score' 
                    : `Forces ${selectedDifficulty} level question difficulty`}
                </p>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStartDrill()}
                className="w-full sm:w-auto px-8 py-3 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95 shadow-glow-emerald transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Generate Precision Drill Test 🚀</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 2: GENERATING SCREEN */}
        {/* ======================================================== */}
        {stage === 'generating' && (
          <div className="p-8 sm:p-16 flex flex-col items-center justify-center text-center space-y-6 flex-1">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-glow-emerald animate-pulse">
                <Target className="w-10 h-10" />
              </div>
              <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin absolute -bottom-2 -right-2 bg-white rounded-full p-0.5 shadow-soft-sm" />
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-black text-slate-900">
                Generating Personalized Drill Questions...
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Gemini Flash is analyzing your weak topics (<span className="text-emerald-700 font-bold">{displayTopics.join(', ')}</span>) to craft targeted practice questions.
              </p>
            </div>

            <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 3: ACTIVE TEST INTERFACE */}
        {/* ======================================================== */}
        {stage === 'active' && currentQuestion && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Progress & Metadata Bar */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center space-x-2">
                <span className="text-slate-600">Question {currentQuestionIdx + 1} of {totalQuestions}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                  {currentQuestion.topic || subjectName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black">
                  {currentQuestion.bloomLevel || 'Application'}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-slate-500">
                <span className="text-[11px]">{answeredCount}/{totalQuestions} Answered</span>
              </div>
            </div>

            {/* Smooth Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Main Question Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
              
              {/* Question Statement */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft-sm space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase">
                  <span>Question #{currentQuestionIdx + 1}</span>
                  {currentQuestion.hint && (
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="text-amber-600 hover:text-amber-700 flex items-center space-x-1 font-black"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
                    </button>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-relaxed">
                  {currentQuestion.questionText || currentQuestion.question}
                </h3>

                {/* Hint Card */}
                {showHint && currentQuestion.hint && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Hint:</strong> {currentQuestion.hint}</span>
                  </div>
                )}
              </div>

              {/* 4 Interactive Option Cards */}
              <div className="space-y-3">
                {(currentQuestion.options || []).map((optionText, optIdx) => {
                  const isSelected = userAnswers[currentQuestionIdx] === optIdx;
                  const optionLetters = ['A', 'B', 'C', 'D'];

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-soft-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-soft-sm'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                        }`}>
                          {optionLetters[optIdx] || optIdx + 1}
                        </div>
                        <span className={`text-xs sm:text-sm font-bold ${
                          isSelected ? 'text-emerald-950' : 'text-slate-800'
                        }`}>
                          {optionText}
                        </span>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Question Navigation Palette */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Question Navigation:</span>
                <div className="flex flex-wrap gap-2">
                  {drillData.questions.map((q, idx) => {
                    const isAnswered = typeof userAnswers[idx] === 'number';
                    const isCurrent = currentQuestionIdx === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentQuestionIdx(idx);
                          setShowHint(false);
                        }}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                          isCurrent
                            ? 'bg-slate-900 text-white ring-2 ring-slate-900/30 scale-105'
                            : isAnswered
                            ? 'bg-emerald-600 text-white shadow-soft-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Bottom Action Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (currentQuestionIdx > 0) {
                    setCurrentQuestionIdx(prev => prev - 1);
                    setShowHint(false);
                  }
                }}
                disabled={currentQuestionIdx === 0}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                  currentQuestionIdx === 0
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-soft-sm'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-3">
                {currentQuestionIdx < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentQuestionIdx(prev => prev + 1);
                      setShowHint(false);
                    }}
                    className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 shadow-soft-sm transition-all flex items-center space-x-1.5"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitDrill}
                    className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 shadow-glow-emerald transition-all flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Drill Test ({answeredCount}/{totalQuestions})</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 4: SUBMITTING / EVALUATION LOADER */}
        {/* ======================================================== */}
        {stage === 'submitting' && (
          <div className="p-8 sm:p-16 flex flex-col items-center justify-center text-center space-y-6 flex-1">
            <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin" />
            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-black text-slate-900">
                Evaluating Drill Test Mastery...
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Gemini Adaptive Engine is computing topic-wise accuracy, diagnosing residual misconceptions, and tailoring follow-up recommendations.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 5: RESULT & ADAPTIVE FOLLOW-UP SCREEN */}
        {/* ======================================================== */}
        {stage === 'result' && evaluationResult && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            
            {/* Top Score Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft-sm">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-soft-sm shrink-0 ${
                  evaluationResult.accuracy >= 75
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-glow-emerald'
                    : evaluationResult.accuracy >= 50
                    ? 'bg-amber-500 shadow-glow-amber'
                    : 'bg-rose-600 shadow-glow-rose'
                }`}>
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                      Drill Test Diagnostic Summary
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    Score: {evaluationResult.score} / {evaluationResult.totalQuestions} ({evaluationResult.accuracy}% Accuracy)
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {evaluationResult.accuracy >= 80 
                      ? '🎉 Outstanding mastery demonstrated in this target area!'
                      : 'Targeted practice identified specific residual formulas to revise.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons in Banner */}
              <button
                type="button"
                onClick={handleTakeAnotherDrill}
                className="px-5 py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 shadow-glow-emerald transition-all flex items-center space-x-2 shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Take Another Adaptive Drill</span>
              </button>
            </div>

            {/* Topic-Wise Performance Breakdown */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft-sm space-y-4">
              <div className="flex items-center space-x-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Topic Performance Breakdown</span>
              </div>

              <div className="space-y-3">
                {(evaluationResult.topicPerformance || []).map((tp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-xs">{tp.topicName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          tp.accuracy >= 80
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : tp.accuracy >= 50
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {tp.masteryStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {tp.correct} / {tp.total} questions answered correctly
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 sm:w-48">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            tp.accuracy >= 80 ? 'bg-emerald-600' : tp.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${tp.accuracy}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-800 w-10 text-right">{tp.accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Targeted Feedback & Concepts to Revise Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Feedback */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft-sm space-y-3">
                <div className="flex items-center space-x-2 text-xs font-black text-emerald-800 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>AI Mentor Evaluation</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {evaluationResult.feedback || 'Great effort in completing this focused drill test.'}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">Recommended Next Step:</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {evaluationResult.nextRecommendedDifficulty} Difficulty Drill
                  </span>
                </div>
              </div>

              {/* Concepts to Revise */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft-sm space-y-3">
                <div className="flex items-center space-x-2 text-xs font-black text-amber-800 uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Key Concepts to Revise</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                  {(evaluationResult.conceptsToRevise || []).map((concept, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{concept}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Question Review Accordion */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft-sm space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Question Review & Detailed Explanations
              </h4>

              <div className="space-y-2">
                {(evaluationResult.questionResults || []).map((qr, idx) => {
                  const isExpanded = expandedReviewIdx === idx;

                  return (
                    <div 
                      key={idx}
                      className={`border rounded-2xl overflow-hidden transition-all ${
                        qr.isCorrect 
                          ? 'border-emerald-200 bg-emerald-50/20' 
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedReviewIdx(isExpanded ? null : idx)}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {qr.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-slate-900 line-clamp-1">
                            Q{idx + 1}: {qr.questionText}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${
                            qr.isCorrect 
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}>
                            {qr.isCorrect ? 'Correct' : (qr.isSkipped ? 'Skipped' : 'Incorrect')}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-slate-100 text-xs space-y-3 mt-2 bg-white">
                          <p className="font-bold text-slate-900">{qr.questionText}</p>

                          <div className="space-y-1.5">
                            {qr.options?.map((opt, oIdx) => {
                              const isStudentSelected = qr.selectedOptionIndex === oIdx;
                              const isCorrectOpt = qr.correctOptionIndex === oIdx;

                              return (
                                <div 
                                  key={oIdx}
                                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                                    isCorrectOpt
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                      : isStudentSelected
                                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                                      : 'bg-slate-50 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <span>{['A', 'B', 'C', 'D'][oIdx]}. {opt}</span>
                                  {isCorrectOpt && <span className="text-[10px] font-black text-emerald-800">✓ Correct Answer</span>}
                                  {isStudentSelected && !isCorrectOpt && <span className="text-[10px] font-black text-rose-800">✗ Your Choice</span>}
                                </div>
                              );
                            })}
                          </div>

                          {qr.explanation && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1 font-medium">
                              <span className="font-bold text-slate-900 block">Explanation:</span>
                              <p>{qr.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Close & Return
              </button>

              <button
                type="button"
                onClick={handleTakeAnotherDrill}
                className="w-full sm:w-auto px-8 py-3 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 shadow-glow-emerald transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Take Another Adaptive Drill (Level Up) 🚀</span>
              </button>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* ERROR STATE */}
        {/* ======================================================== */}
        {stage === 'error' && (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 flex-1">
            <AlertTriangle className="w-12 h-12 text-rose-500" />
            <h3 className="text-lg font-black text-slate-900">Drill Test Generation Failed</h3>
            <p className="text-xs text-slate-600 max-w-md font-medium">
              {errorMessage || 'Unable to connect to the Gemini AI Drill generator service.'}
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setStage('config')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Back to Config
              </button>
              <button
                onClick={() => handleStartDrill()}
                className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-glow-emerald"
              >
                Retry Generation
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DrillTestModal;
