import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Flame, 
  Sliders, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  BrainCircuit,
  FileText,
  Bookmark
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import api from '../services/api';

const EXAMS_LIST = [
  'JEE Main', 'JEE Advanced', 'NEET', 'UPSC', 'GATE', 'CAT', 'CUET', 
  'NDA', 'SSC CGL', 'Bank PO', 'CBSE', 'ICSE', 'State Board', 'University', 'Custom'
];

const GRADES_LIST = [
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'College', 'University'
];

const TestGenerator = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState('JEE Main');
  const [selectedGrade, setSelectedGrade] = useState('Class 12');
  
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  const [testType, setTestType] = useState('Chapter'); // 'Chapter' or 'Topic'
  
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');

  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState('');

  const [difficulty, setDifficulty] = useState('Mixed');
  const [questionCount, setQuestionCount] = useState('15');

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingSubItems, setLoadingSubItems] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Load subjects dynamically from GET /api/subjects
  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    setError('');
    try {
      const res = await api.get(`/subjects?exam=${encodeURIComponent(selectedExam)}&grade=${encodeURIComponent(selectedGrade)}`);
      
      let fetchedSubjects = [];
      if (res.data.success && res.data.subjects && res.data.subjects.length > 0) {
        fetchedSubjects = res.data.subjects;
      } else {
        // Fallback fetch all subjects if exam filter returned empty
        const fallbackRes = await api.get('/subjects');
        if (fallbackRes.data.success && fallbackRes.data.subjects) {
          fetchedSubjects = fallbackRes.data.subjects;
        }
      }

      setSubjects(fetchedSubjects);
      if (fetchedSubjects.length > 0) {
        // Retain selection if available, else pick first
        if (!selectedSubjectId || !fetchedSubjects.some(s => s._id === selectedSubjectId)) {
          setSelectedSubjectId(fetchedSubjects[0]._id);
        }
      } else {
        setSelectedSubjectId('');
      }
    } catch (err) {
      console.error('Failed to load subjects from MongoDB:', err.message);
      setError('Failed to fetch subjects from database. Please check your server connection.');
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [selectedExam, selectedGrade]);

  // Load topics & chapters from MongoDB when selectedSubjectId changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setTopics([]);
      setSelectedChapterId('');
      setSelectedTopicId('');
      return;
    }

    const fetchSubItems = async () => {
      setLoadingSubItems(true);
      try {
        const [chapRes, topRes] = await Promise.all([
          api.get(`/chapters?subjectId=${selectedSubjectId}`),
          api.get(`/topics?subjectId=${selectedSubjectId}`)
        ]);

        if (chapRes.data.success && chapRes.data.chapters) {
          setChapters(chapRes.data.chapters);
          if (chapRes.data.chapters.length > 0) {
            setSelectedChapterId(chapRes.data.chapters[0]._id);
          } else {
            setSelectedChapterId('');
          }
        }

        if (topRes.data.success && topRes.data.topics) {
          setTopics(topRes.data.topics);
          if (topRes.data.topics.length > 0) {
            setSelectedTopicId(topRes.data.topics[0]._id);
          } else {
            setSelectedTopicId('');
          }
        }
      } catch (err) {
        console.error('Failed to load topics/chapters from MongoDB:', err.message);
      } finally {
        setLoadingSubItems(false);
      }
    };

    fetchSubItems();
  }, [selectedSubjectId]);

  const handleTestTypeChange = (type) => {
    setTestType(type);
    if (type === 'Topic') {
      setQuestionCount('5');
    } else {
      setQuestionCount('15');
    }
  };

  const [pregeneratedTest, setPregeneratedTest] = useState(null);
  const [loadingProgressMessage, setLoadingProgressMessage] = useState('Analyzing syllabus & chapter parameters...');
  const [pregenLoading, setPregenLoading] = useState(false);

  // Pre-trigger test generation in background as soon as parameters are selected
  useEffect(() => {
    if (!selectedSubjectId) return;

    let isMounted = true;
    setPregeneratedTest(null);

    const triggerPregen = async () => {
      setPregenLoading(true);
      try {
        const payload = {
          exam: selectedExam,
          grade: selectedGrade,
          subjectId: selectedSubjectId,
          testType,
          topicId: testType === 'Topic' ? selectedTopicId : undefined,
          chapterId: testType === 'Chapter' ? selectedChapterId : undefined,
          difficulty,
          questionCount: parseInt(questionCount)
        };
        const res = await api.post('/tests/generate', payload);
        if (isMounted && res.data.success && res.data.test) {
          setPregeneratedTest(res.data.test);
        }
      } catch (err) {
        // Silent catch for pregen background task
      } finally {
        if (isMounted) setPregenLoading(false);
      }
    };

    const timer = setTimeout(() => {
      triggerPregen();
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedExam, selectedGrade, selectedSubjectId, testType, selectedTopicId, selectedChapterId, difficulty, questionCount]);

  const handleGenerateTest = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedSubjectId) {
      return setError('Please select a subject from the dropdown.');
    }

    // Fast-path: If background pregeneration already finished, navigate instantly (<50ms)!
    if (pregeneratedTest && pregeneratedTest._id) {
      return navigate(`/test/${pregeneratedTest._id}`);
    }

    setGenerating(true);
    setLoadingProgressMessage('⚡ Initializing Gemini 2.0 Flash engine...');

    const msgTimer1 = setTimeout(() => setLoadingProgressMessage('🧠 Generating questions in single API request...'), 500);
    const msgTimer2 = setTimeout(() => setLoadingProgressMessage('🛡️ Validating options & verifying anti-duplication filter...'), 1400);
    const msgTimer3 = setTimeout(() => setLoadingProgressMessage('✨ Paper ready! Launching test...'), 2400);

    try {
      const payload = {
        exam: selectedExam,
        grade: selectedGrade,
        subjectId: selectedSubjectId,
        testType,
        topicId: testType === 'Topic' ? selectedTopicId : undefined,
        chapterId: testType === 'Chapter' ? selectedChapterId : undefined,
        difficulty,
        questionCount: parseInt(questionCount)
      };

      const res = await api.post('/tests/generate', payload);

      if (res.data.success && res.data.test) {
        navigate(`/test/${res.data.test._id}`);
      } else {
        setError('Failed to generate test paper. Please try again.');
      }
    } catch (err) {
      console.error('Test generation error:', err);
      setError(err.response?.data?.message || 'Server error while generating test');
    } finally {
      clearTimeout(msgTimer1);
      clearTimeout(msgTimer2);
      clearTimeout(msgTimer3);
      setGenerating(false);
    }
  };

  const currentSubjectObj = subjects.find(s => s._id === selectedSubjectId);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-8">
          
          {/* Header */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs uppercase tracking-widest mb-1">
              <BrainCircuit className="w-4 h-4" />
              <span>Smart AI Question Generation Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dynamic <span className="gradient-text">Gemini AI Test Generator</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              All Subjects, Chapters, and Topics are fetched live from MongoDB. Choose your target exam and parameters below.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => fetchSubjects()} className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold">
                Retry Seeding & Fetching
              </button>
            </div>
          )}

          {/* Form Configuration Card */}
          <form onSubmit={handleGenerateTest} className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            
            {/* Step 1: Exam & Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label htmlFor="exam-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2 text-indigo-400" />
                  1. Target Examination
                </label>
                <select
                  id="exam-select"
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium bg-slate-900 text-slate-100 border border-slate-800 focus:border-indigo-500 outline-none"
                >
                  {EXAMS_LIST.map((exam) => (
                    <option key={exam} value={exam}>{exam}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="grade-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-purple-400" />
                  2. Class / Grade Level
                </label>
                <select
                  id="grade-select"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium bg-slate-900 text-slate-100 border border-slate-800 focus:border-indigo-500 outline-none"
                >
                  {GRADES_LIST.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Step 2: Subject Selection Dropdown & Grid */}
            <div>
              <label htmlFor="subject-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <Layers className="w-4 h-4 mr-2 text-emerald-400" />
                  3. Choose Subject (MongoDB API)
                </span>
                {loadingSubjects && (
                  <span className="text-[11px] text-indigo-400 flex items-center lowercase font-normal">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" /> fetching subjects...
                  </span>
                )}
              </label>

              {loadingSubjects ? (
                <div className="py-6 text-sm text-slate-400 flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800">
                  <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-400" />
                  <span>Fetching dynamic subjects from MongoDB...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Primary Dropdown Selector */}
                  <select
                    id="subject-select"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm font-semibold bg-slate-900 text-slate-100 border border-slate-800 focus:border-indigo-500 outline-none"
                  >
                    {subjects.length === 0 ? (
                      <option value="">No subjects found. Auto-seeding MongoDB...</option>
                    ) : (
                      subjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name} ({sub.category})
                        </option>
                      ))
                    )}
                  </select>

                  {/* Subject Badges / Quick Selection Cards */}
                  {subjects.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {subjects.map((sub) => (
                        <button
                          key={sub._id}
                          type="button"
                          onClick={() => setSelectedSubjectId(sub._id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            selectedSubjectId === sub._id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-glow-indigo'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <p className="font-bold text-sm truncate">{sub.name}</p>
                          <p className="text-[11px] text-slate-500 capitalize">{sub.category}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Test Type Selection (Chapter vs Topic) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => handleTestTypeChange('Chapter')}
                className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
                  testType === 'Chapter'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-glow-purple'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${testType === 'Chapter' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-500'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-left">Chapter Wise Test</h4>
                    <p className="text-xs text-slate-400 text-left">Comprehensive chapter coverage (15 Qs)</p>
                  </div>
                </div>
                <CheckCircle2 className={`w-5 h-5 ${testType === 'Chapter' ? 'text-purple-400' : 'text-slate-700'}`} />
              </button>

              <button
                type="button"
                onClick={() => handleTestTypeChange('Topic')}
                className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
                  testType === 'Topic'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-glow-indigo'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${testType === 'Topic' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-left">Topic Wise Test</h4>
                    <p className="text-xs text-slate-400 text-left">Target single specific topic (5 Qs)</p>
                  </div>
                </div>
                <CheckCircle2 className={`w-5 h-5 ${testType === 'Topic' ? 'text-indigo-400' : 'text-slate-700'}`} />
              </button>
            </div>

            {/* Step 4: Specific Chapter / Topic Dropdown */}
            <div>
              <label 
                htmlFor={testType === 'Chapter' ? 'chapter-select' : 'topic-select'} 
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between"
              >
                <span>4. Select Specific {testType} ({currentSubjectObj ? currentSubjectObj.name : 'Subject'})</span>
                {loadingSubItems && (
                  <span className="text-[11px] text-purple-400 flex items-center lowercase font-normal">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" /> loading {testType.toLowerCase()}s...
                  </span>
                )}
              </label>

              {loadingSubItems ? (
                <div className="py-4 px-4 rounded-xl glass-input text-xs text-slate-400 flex items-center bg-slate-900/60 border border-slate-800">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-purple-400" />
                  <span>Fetching {testType.toLowerCase()}s for {currentSubjectObj?.name || 'subject'} from MongoDB...</span>
                </div>
              ) : testType === 'Chapter' ? (
                chapters.length > 0 ? (
                  <select
                    id="chapter-select"
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm font-semibold bg-slate-900 text-slate-100 border border-slate-800 focus:border-purple-500 outline-none"
                  >
                    {chapters.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    No specific chapters listed in MongoDB for {currentSubjectObj?.name || 'this subject'}. A general subject test paper will be generated.
                  </div>
                )
              ) : (
                topics.length > 0 ? (
                  <select
                    id="topic-select"
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm font-semibold bg-slate-900 text-slate-100 border border-slate-800 focus:border-indigo-500 outline-none"
                  >
                    {topics.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    No specific topics listed in MongoDB for {currentSubjectObj?.name || 'this subject'}. A general subject test paper will be generated.
                  </div>
                )
              )}
            </div>

            {/* Step 5: Difficulty & Question Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                  <Flame className="w-4 h-4 mr-2 text-amber-400" />
                  5. Difficulty Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Easy', 'Medium', 'Hard', 'Mixed'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        difficulty === lvl
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                  <Sliders className="w-4 h-4 mr-2 text-indigo-400" />
                  6. Question Count
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {['5', '10', '15', '20', '25', '30'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        questionCount === num
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Submit Button & Interactive Loading Progress Screen */}
            <div className="pt-4 space-y-4">
              <button
                type="submit"
                disabled={generating || !selectedSubjectId || loadingSubjects}
                className="w-full py-4 px-6 rounded-2xl text-base font-extrabold text-white gradient-bg shadow-glow-indigo hover:opacity-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span>{loadingProgressMessage}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-white" />
                    <span>
                      {pregeneratedTest ? '✨ Test Ready - Launch Instantly' : 'Generate AI Test Paper & Start'}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {generating && (
                <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-3 animate-pulse">
                  <div className="flex items-center justify-center space-x-2 text-indigo-400 font-bold text-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{loadingProgressMessage}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full w-4/5 animate-pulse" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Generating {questionCount} original questions in a single request using Gemini 2.0 Flash. Target time: &lt; 3 seconds.
                  </p>
                </div>
              )}
            </div>

          </form>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default TestGenerator;
