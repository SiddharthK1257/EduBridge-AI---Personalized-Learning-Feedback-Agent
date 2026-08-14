import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  HelpCircle, 
  BarChart3, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FileText,
  Bookmark,
  Layers,
  X
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'students', 'subjects', 'chapters', 'topics', 'questions'
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Filter state for Chapters and Topics tab
  const [filterSubjectId, setFilterSubjectId] = useState('');

  // Modals state
  const [subjectModal, setSubjectModal] = useState({
    show: false,
    mode: 'create', // 'create' | 'edit'
    data: { _id: '', name: '', category: 'School', applicableExams: 'JEE Main, NEET', applicableGrades: 'Class 11, Class 12', description: '' }
  });

  const [chapterModal, setChapterModal] = useState({
    show: false,
    mode: 'create', // 'create' | 'edit'
    data: { _id: '', subject: '', name: '', description: '' }
  });

  const [topicModal, setTopicModal] = useState({
    show: false,
    mode: 'create', // 'create' | 'edit'
    data: { _id: '', subject: '', name: '', description: '' }
  });

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, studentsRes, subjectsRes, chaptersRes, topicsRes, questionsRes] = await Promise.all([
        api.get('/admin/analytics').catch(() => ({ data: { success: false } })),
        api.get('/admin/users').catch(() => ({ data: { success: false } })),
        api.get('/subjects').catch(() => ({ data: { success: false } })),
        api.get('/chapters').catch(() => ({ data: { success: false } })),
        api.get('/topics').catch(() => ({ data: { success: false } })),
        api.get('/admin/questions').catch(() => ({ data: { success: false } }))
      ]);

      if (analyticsRes.data?.success) setStats(analyticsRes.data.stats);
      if (studentsRes.data?.success) setStudents(studentsRes.data.students || []);
      if (subjectsRes.data?.success) {
        const subs = subjectsRes.data.subjects || [];
        setSubjects(subs);
        if (subs.length > 0 && !filterSubjectId) {
          setFilterSubjectId(subs[0]._id);
        }
      }
      if (chaptersRes.data?.success) setChapters(chaptersRes.data.chapters || []);
      if (topicsRes.data?.success) setTopics(topicsRes.data.topics || []);
      if (questionsRes.data?.success) setQuestions(questionsRes.data.questions || []);
    } catch (err) {
      console.error('Admin data fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Student Actions
  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Delete this student account?')) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data.success) {
        setStudents((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  // Subject Actions
  const handleOpenCreateSubject = () => {
    setSubjectModal({
      show: true,
      mode: 'create',
      data: { _id: '', name: '', category: 'School', applicableExams: 'JEE Main, NEET', applicableGrades: 'Class 11, Class 12', description: '' }
    });
  };

  const handleOpenEditSubject = (sub) => {
    setSubjectModal({
      show: true,
      mode: 'edit',
      data: {
        _id: sub._id,
        name: sub.name || '',
        category: sub.category || 'School',
        applicableExams: Array.isArray(sub.applicableExams) ? sub.applicableExams.join(', ') : (sub.applicableExams || ''),
        applicableGrades: Array.isArray(sub.applicableGrades) ? sub.applicableGrades.join(', ') : (sub.applicableGrades || ''),
        description: sub.description || ''
      }
    });
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    const payload = {
      name: subjectModal.data.name,
      category: subjectModal.data.category,
      applicableExams: subjectModal.data.applicableExams.split(',').map(s => s.trim()).filter(Boolean),
      applicableGrades: subjectModal.data.applicableGrades.split(',').map(s => s.trim()).filter(Boolean),
      description: subjectModal.data.description
    };

    try {
      if (subjectModal.mode === 'create') {
        const res = await api.post('/subjects', payload);
        if (res.data.success) {
          setSubjects((prev) => [...prev, res.data.subject]);
        }
      } else {
        const res = await api.put(`/subjects/${subjectModal.data._id}`, payload);
        if (res.data.success) {
          setSubjects((prev) => prev.map(s => s._id === subjectModal.data._id ? res.data.subject : s));
        }
      }
      setSubjectModal({ ...subjectModal, show: false });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete subject and all associated chapters and topics from MongoDB?')) return;
    try {
      const res = await api.delete(`/subjects/${id}`);
      if (res.data.success) {
        setSubjects((prev) => prev.filter((s) => s._id !== id));
        setChapters((prev) => prev.filter((c) => (c.subject?._id || c.subject) !== id));
        setTopics((prev) => prev.filter((t) => (t.subject?._id || t.subject) !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  // Chapter Actions
  const handleOpenCreateChapter = () => {
    setChapterModal({
      show: true,
      mode: 'create',
      data: { _id: '', subject: filterSubjectId || (subjects[0]?._id || ''), name: '', description: '' }
    });
  };

  const handleOpenEditChapter = (chap) => {
    setChapterModal({
      show: true,
      mode: 'edit',
      data: {
        _id: chap._id,
        subject: chap.subject?._id || chap.subject || '',
        name: chap.name || '',
        description: chap.description || ''
      }
    });
  };

  const handleSaveChapter = async (e) => {
    e.preventDefault();
    const payload = {
      subject: chapterModal.data.subject,
      name: chapterModal.data.name,
      description: chapterModal.data.description
    };

    try {
      if (chapterModal.mode === 'create') {
        const res = await api.post('/chapters', payload);
        if (res.data.success) {
          setChapters((prev) => [...prev, res.data.chapter]);
        }
      } else {
        const res = await api.put(`/chapters/${chapterModal.data._id}`, payload);
        if (res.data.success) {
          setChapters((prev) => prev.map(c => c._id === chapterModal.data._id ? res.data.chapter : c));
        }
      }
      setChapterModal({ ...chapterModal, show: false });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save chapter');
    }
  };

  const handleDeleteChapter = async (id) => {
    if (!window.confirm('Delete this chapter from MongoDB?')) return;
    try {
      const res = await api.delete(`/chapters/${id}`);
      if (res.data.success) {
        setChapters((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  // Topic Actions
  const handleOpenCreateTopic = () => {
    setTopicModal({
      show: true,
      mode: 'create',
      data: { _id: '', subject: filterSubjectId || (subjects[0]?._id || ''), name: '', description: '' }
    });
  };

  const handleOpenEditTopic = (top) => {
    setTopicModal({
      show: true,
      mode: 'edit',
      data: {
        _id: top._id,
        subject: top.subject?._id || top.subject || '',
        name: top.name || '',
        description: top.description || ''
      }
    });
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    const payload = {
      subject: topicModal.data.subject,
      name: topicModal.data.name,
      description: topicModal.data.description
    };

    try {
      if (topicModal.mode === 'create') {
        const res = await api.post('/topics', payload);
        if (res.data.success) {
          setTopics((prev) => [...prev, res.data.topic]);
        }
      } else {
        const res = await api.put(`/topics/${topicModal.data._id}`, payload);
        if (res.data.success) {
          setTopics((prev) => prev.map(t => t._id === topicModal.data._id ? res.data.topic : t));
        }
      }
      setTopicModal({ ...topicModal, show: false });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save topic');
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('Delete this topic from MongoDB?')) return;
    try {
      const res = await api.delete(`/topics/${id}`);
      if (res.data.success) {
        setTopics((prev) => prev.filter((t) => t._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Loading Administrative Management Console from MongoDB..." />
        </div>
      </div>
    );
  }

  const filteredChapters = filterSubjectId 
    ? chapters.filter(c => (c.subject?._id || c.subject) === filterSubjectId)
    : chapters;

  const filteredTopics = filterSubjectId 
    ? topics.filter(t => (t.subject?._id || t.subject) === filterSubjectId)
    : topics;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-8">
          
          {/* Admin Header */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center space-x-2 text-amber-700 font-extrabold text-xs uppercase tracking-widest mb-1">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Super Admin Management System</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Admin Control Console <span className="text-amber-600">• Subjects, Chapters & Topics CRUD</span>
              </h1>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex-wrap">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'analytics' ? 'bg-amber-500 text-slate-950 shadow-soft-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('subjects')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'subjects' ? 'bg-amber-500 text-slate-950 shadow-soft-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Subjects ({subjects.length})
              </button>
              <button
                onClick={() => setActiveTab('chapters')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'chapters' ? 'bg-amber-500 text-slate-950 shadow-soft-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chapters ({chapters.length})
              </button>
              <button
                onClick={() => setActiveTab('topics')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'topics' ? 'bg-amber-500 text-slate-950 shadow-soft-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Topics ({topics.length})
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'students' ? 'bg-amber-500 text-slate-950 shadow-soft-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Students ({students.length})
              </button>
            </div>
          </div>

          {/* TAB 1: System Analytics */}
          {activeTab === 'analytics' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card-amber p-5 rounded-2xl">
                  <span className="text-xs font-bold text-amber-800 block uppercase">Total Students</span>
                  <span className="text-3xl font-black text-slate-900 mt-1">{stats.totalUsers || 0}</span>
                </div>
                <div className="stat-card-emerald p-5 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-800 block uppercase">Subjects Catalog</span>
                  <span className="text-3xl font-black text-slate-900 mt-1">{subjects.length}</span>
                </div>
                <div className="stat-card-violet p-5 rounded-2xl">
                  <span className="text-xs font-bold text-violet-800 block uppercase">Total Chapters</span>
                  <span className="text-3xl font-black text-slate-900 mt-1">{chapters.length}</span>
                </div>
                <div className="stat-card-teal p-5 rounded-2xl">
                  <span className="text-xs font-bold text-teal-800 block uppercase">Total Topics</span>
                  <span className="text-3xl font-black text-slate-900 mt-1">{topics.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Subjects Management */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900">MongoDB Subjects Collection</h3>
                  <p className="text-xs text-slate-600 font-medium">Add, edit, or delete subjects stored in MongoDB.</p>
                </div>
                <button
                  onClick={handleOpenCreateSubject}
                  className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center space-x-2 shadow-glow-emerald hover:opacity-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Subject</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((sub) => (
                  <div key={sub._id} className="p-5 rounded-2xl glass-card bg-white border border-slate-200 flex flex-col justify-between hover:border-emerald-300 shadow-soft-sm transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-base text-slate-900">{sub.name}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {sub.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-medium">{sub.description || 'No description provided.'}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-semibold truncate max-w-[160px]">
                        Exams: {Array.isArray(sub.applicableExams) ? sub.applicableExams.slice(0, 2).join(', ') : sub.applicableExams}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenEditSubject(sub)}
                          className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-all"
                          title="Edit Subject"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(sub._id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Chapters Management */}
          {activeTab === 'chapters' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">MongoDB Chapters Collection</h3>
                  <p className="text-xs text-slate-600 font-medium">Manage chapters linked to each subject in MongoDB.</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={filterSubjectId}
                    onChange={(e) => setFilterSubjectId(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 border border-slate-300 shadow-soft-sm"
                  >
                    <option value="">All Subjects ({chapters.length} Chapters)</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleOpenCreateChapter}
                    className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center space-x-2 shadow-glow-emerald hover:opacity-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Chapter</span>
                  </button>
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase font-black">
                        <th className="pb-3 px-3">#</th>
                        <th className="pb-3 px-3">Chapter Name</th>
                        <th className="pb-3 px-3">Parent Subject</th>
                        <th className="pb-3 px-3">Description</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredChapters.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-xs text-slate-500 italic font-medium">
                            No chapters found for this selection.
                          </td>
                        </tr>
                      ) : (
                        filteredChapters.map((chap, idx) => (
                          <tr key={chap._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 text-xs text-slate-500 font-mono font-bold">{idx + 1}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">{chap.name}</td>
                            <td className="py-3 px-3 text-violet-700 font-bold">
                              {chap.subject?.name || (subjects.find(s => s._id === chap.subject)?.name) || 'Subject'}
                            </td>
                            <td className="py-3 px-3 text-slate-600 text-xs truncate max-w-xs font-medium">{chap.description || '-'}</td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleOpenEditChapter(chap)}
                                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteChapter(chap._id)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Topics Management */}
          {activeTab === 'topics' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">MongoDB Topics Collection</h3>
                  <p className="text-xs text-slate-600 font-medium">Manage topics linked to each subject in MongoDB.</p>
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={filterSubjectId}
                    onChange={(e) => setFilterSubjectId(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 border border-slate-300 shadow-soft-sm"
                  >
                    <option value="">All Subjects ({topics.length} Topics)</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleOpenCreateTopic}
                    className="px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center space-x-2 shadow-glow-emerald hover:opacity-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Topic</span>
                  </button>
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase font-black">
                        <th className="pb-3 px-3">#</th>
                        <th className="pb-3 px-3">Topic Name</th>
                        <th className="pb-3 px-3">Parent Subject</th>
                        <th className="pb-3 px-3">Description</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTopics.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-xs text-slate-500 italic font-medium">
                            No topics found for this selection.
                          </td>
                        </tr>
                      ) : (
                        filteredTopics.map((top, idx) => (
                          <tr key={top._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 text-xs text-slate-500 font-mono font-bold">{idx + 1}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">{top.name}</td>
                            <td className="py-3 px-3 text-teal-700 font-bold">
                              {top.subject?.name || (subjects.find(s => s._id === top.subject)?.name) || 'Subject'}
                            </td>
                            <td className="py-3 px-3 text-slate-600 text-xs truncate max-w-xs font-medium">{top.description || '-'}</td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleOpenEditTopic(top)}
                                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTopic(top._id)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Manage Students */}
          {activeTab === 'students' && (
            <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white shadow-soft-sm">
              <h3 className="text-lg font-black text-slate-900 mb-4">Registered Students List</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase font-black">
                      <th className="pb-3 px-3">Name</th>
                      <th className="pb-3 px-3">Email</th>
                      <th className="pb-3 px-3">Target Exam</th>
                      <th className="pb-3 px-3">Class/Grade</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((st) => (
                      <tr key={st._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">{st.name}</td>
                        <td className="py-3 px-3 text-slate-600 font-medium">{st.email}</td>
                        <td className="py-3 px-3 text-emerald-700 font-bold">{st.examTarget || 'JEE Main'}</td>
                        <td className="py-3 px-3 text-slate-700 font-semibold">{st.gradeClass || 'Class 12'}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteStudent(st._id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Subject Modal (Create / Edit) */}
      {subjectModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white max-w-md w-full space-y-4 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {subjectModal.mode === 'create' ? 'Add New Subject' : 'Edit Subject'}
              </h3>
              <button onClick={() => setSubjectModal({ ...subjectModal, show: false })} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSubject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 uppercase font-black mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subjectModal.data.name}
                  onChange={(e) => setSubjectModal({ ...subjectModal, data: { ...subjectModal.data, name: e.target.value } })}
                  placeholder="e.g. Physics"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase font-black mb-1">Category</label>
                <select
                  value={subjectModal.data.category}
                  onChange={(e) => setSubjectModal({ ...subjectModal, data: { ...subjectModal.data, category: e.target.value } })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  <option value="School">School</option>
                  <option value="Competitive">Competitive</option>
                  <option value="Programming">Programming</option>
                  <option value="College">College</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 uppercase font-black mb-1">Applicable Exams (comma separated)</label>
                <input
                  type="text"
                  value={subjectModal.data.applicableExams}
                  onChange={(e) => setSubjectModal({ ...subjectModal, data: { ...subjectModal.data, applicableExams: e.target.value } })}
                  placeholder="JEE Main, NEET, CBSE"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase font-black mb-1">Applicable Grades (comma separated)</label>
                <input
                  type="text"
                  value={subjectModal.data.applicableGrades}
                  onChange={(e) => setSubjectModal({ ...subjectModal, data: { ...subjectModal.data, applicableGrades: e.target.value } })}
                  placeholder="Class 11, Class 12"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase font-black mb-1">Description</label>
                <textarea
                  rows="2"
                  value={subjectModal.data.description}
                  onChange={(e) => setSubjectModal({ ...subjectModal, data: { ...subjectModal.data, description: e.target.value } })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubjectModal({ ...subjectModal, show: false })}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 font-black shadow-glow-emerald hover:opacity-95"
                >
                  {subjectModal.mode === 'create' ? 'Create Subject' : 'Update Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chapter Modal (Create / Edit) */}
      {chapterModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white max-w-md w-full space-y-4 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {chapterModal.mode === 'create' ? 'Add New Chapter' : 'Edit Chapter'}
              </h3>
              <button onClick={() => setChapterModal({ ...chapterModal, show: false })} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveChapter} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 uppercase font-black mb-1">Parent Subject</label>
                <select
                  required
                  value={chapterModal.data.subject}
                  onChange={(e) => setChapterModal({ ...chapterModal, data: { ...chapterModal.data, subject: e.target.value } })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 uppercase font-black mb-1">Chapter Name</label>
                <input
                  type="text"
                  required
                  value={chapterModal.data.name}
                  onChange={(e) => setChapterModal({ ...chapterModal, data: { ...chapterModal.data, name: e.target.value } })}
                  placeholder="e.g. Kinematics"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase font-black mb-1">Description</label>
                <textarea
                  rows="2"
                  value={chapterModal.data.description}
                  onChange={(e) => setChapterModal({ ...chapterModal, data: { ...chapterModal.data, description: e.target.value } })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setChapterModal({ ...chapterModal, show: false })}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 font-black shadow-glow-emerald hover:opacity-95"
                >
                  {chapterModal.mode === 'create' ? 'Create Chapter' : 'Update Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topic Modal (Create / Edit) */}
      {topicModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white max-w-md w-full space-y-4 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {topicModal.mode === 'create' ? 'Add New Topic' : 'Edit Topic'}
              </h3>
              <button onClick={() => setTopicModal({ ...topicModal, show: false })} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveTopic} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 uppercase font-black mb-1">Parent Subject</label>
                <select
                  required
                  value={topicModal.data.subject}
                  onChange={(e) => setTopicModal({ ...topicModal, data: { ...topicModal.data, subject: e.target.value } })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 uppercase font-black mb-1">Topic Name</label>
                <input
                  type="text"
                  required
                  value={topicModal.data.name}
                  onChange={(e) => setTopicModal({ ...topicModal, data: { ...topicModal.data, name: e.target.value } })}
                  placeholder="e.g. Motion in 1D"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 uppercase font-black mb-1">Description</label>
                <textarea
                  rows="2"
                  value={topicModal.data.description}
                  onChange={(e) => setTopicModal({ ...topicModal, data: { ...topicModal.data, description: e.target.value } })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTopicModal({ ...topicModal, show: false })}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 font-black shadow-glow-emerald hover:opacity-95"
                >
                  {topicModal.mode === 'create' ? 'Create Topic' : 'Update Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminDashboard;
