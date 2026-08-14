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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-8">
          
          {/* Header */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-widest mb-1">
              <BrainCircuit className="w-4 h-4" />
              <span>Smart AI Question Generation Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dynamic <span className="gradient-text">Gemini AI Test Generator</span>
            </h1>
            <p className="text-slate-600 text-sm mt-1 font-medium">
              All Subjects, Chapters, and Topics are fetched live from MongoDB. Choose your target exam and parameters below.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => fetchSubjects()} className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold border border-rose-300">
                Retry Seeding & Fetching
              </button>
            </div>
          )}

          {/* Form Configuration Card */}
          <form onSubmit={handleGenerateTest} className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-md space-y-6">
            
            {/* Step 1: Exam & Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label htmlFor="exam-select" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2 text-emerald-600" />
                  1. Target Examination
                </label>
                <select
                  id="exam-select"
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
                >
                  {EXAMS_LIST.map((exam) => (
                    <option key={exam} value={exam}>{exam}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="grade-select" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-violet-600" />
                  2. Class / Grade Level
                </label>
                <select
                  id="grade-select"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
                >
                  {GRADES_LIST.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Step 2: Subject Selection Dropdown & Grid */}
            <div>
              <label htmlFor="subject-select" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <Layers className="w-4 h-4 mr-2 text-teal-600" />
                  3. Choose Subject (MongoDB API)
                </span>
                {loadingSubjects && (
                  <span className="text-[11px] text-emerald-700 flex items-center lowercase font-bold">
                    <Loader2 className="w-3 h-3 animate-spin mr-1 text-emerald-600" /> fetching subjects...
                  </span>
                )}
              </label>

              {loadingSubjects ? (
                <div className="py-6 text-sm text-slate-600 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
                  <Loader2 className="w-5 h-5 animate-spin mr-2 text-emerald-600" />
                  <span>Fetching dynamic subjects from MongoDB...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Primary Dropdown Selector */}
                  <select
                    id="subject-select"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-bold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
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
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-soft-sm font-black ring-2 ring-emerald-400/30'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/30'
                          }`}
                        >
                          <p className="font-extrabold text-sm truncate">{sub.name}</p>
                          <p className="text-[11px] text-slate-500 capitalize font-medium">{sub.category}</p>
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
                    ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-400 text-violet-950 shadow-soft-sm ring-2 ring-violet-400/30 font-extrabold'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${testType === 'Chapter' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-left text-slate-900">Chapter Wise Test</h4>
                    <p className="text-xs text-slate-600 text-left font-medium">Comprehensive chapter coverage (15 Qs)</p>
                  </div>
                </div>
                <CheckCircle2 className={`w-5 h-5 ${testType === 'Chapter' ? 'text-violet-600' : 'text-slate-300'}`} />
              </button>

              <button
                type="button"
                onClick={() => handleTestTypeChange('Topic')}
                className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
                  testType === 'Topic'
                    ? 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-400 text-teal-950 shadow-soft-sm ring-2 ring-teal-400/30 font-extrabold'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${testType === 'Topic' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-left text-slate-900">Topic Wise Test</h4>
                    <p className="text-xs text-slate-600 text-left font-medium">Target single specific topic (5 Qs)</p>
                  </div>
                </div>
                <CheckCircle2 className={`w-5 h-5 ${testType === 'Topic' ? 'text-teal-600' : 'text-slate-300'}`} />
              </button>
            </div>

            {/* Step 4: Specific Chapter / Topic Dropdown */}
            <div>
              <label 
                htmlFor={testType === 'Chapter' ? 'chapter-select' : 'topic-select'} 
                className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between"
              >
                <span>4. Select Specific {testType} ({currentSubjectObj ? currentSubjectObj.name : 'Subject'})</span>
                {loadingSubItems && (
                  <span className="text-[11px] text-violet-700 flex items-center lowercase font-bold">
                    <Loader2 className="w-3 h-3 animate-spin mr-1 text-violet-600" /> loading {testType.toLowerCase()}s...
                  </span>
                )}
              </label>

              {loadingSubItems ? (
                <div className="py-4 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-violet-600" />
                  <span>Fetching {testType.toLowerCase()}s for {currentSubjectObj?.name || 'subject'} from MongoDB...</span>
                </div>
              ) : testType === 'Chapter' ? (
                chapters.length > 0 ? (
                  <select
                    id="chapter-select"
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-bold focus:border-violet-500 focus:outline-none shadow-soft-sm"
                  >
                    {chapters.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                    No specific chapters listed in MongoDB for {currentSubjectObj?.name || 'this subject'}. A general subject test paper will be generated.
                  </div>
                )
              ) : (
                topics.length > 0 ? (
                  <select
                    id="topic-select"
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-bold focus:border-teal-500 focus:outline-none shadow-soft-sm"
                  >
                    {topics.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                    No specific topics listed in MongoDB for {currentSubjectObj?.name || 'this subject'}. A general subject test paper will be generated.
                  </div>
                )
              )}
            </div>

            {/* Step 5: Difficulty & Question Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                  <Flame className="w-4 h-4 mr-2 text-amber-500" />
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
                          ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-soft-sm font-black'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                  <Sliders className="w-4 h-4 mr-2 text-teal-600" />
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
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-900 shadow-soft-sm font-black'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
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
                className="w-full py-4 px-6 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 shadow-glow-emerald hover:opacity-95 active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span>{loadingProgressMessage}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>
                      {pregeneratedTest ? '✨ Test Ready - Launch Instantly' : 'Generate AI Test Paper & Start'}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {generating && (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 shadow-soft-sm animate-pulse">
                  <div className="flex items-center justify-center space-x-2 text-emerald-800 font-extrabold text-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    <span>{loadingProgressMessage}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-violet-600 h-full w-4/5 animate-pulse rounded-full" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
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
