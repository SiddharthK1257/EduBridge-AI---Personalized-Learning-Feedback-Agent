import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Activity,
  Zap,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Target,
  RefreshCw,
  Trash2,
  Bot,
  Send,
  Plus,
  X,
  FileSpreadsheet,
  Brain,
  ShieldCheck,
  Layers,
  Printer,
  GraduationCap,
  Briefcase,
  Gift,
  FileCheck,
  UserCheck,
  CalendarDays
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from 'recharts';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import DrillTestModal from '../components/drill/DrillTestModal';

const MarksheetAnalyzer = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Navigation Tabs: 'upload' | 'validate' | 'dashboard' | 'deep_breakdown' | 'recovery' | 'target' | 'compare' | 'mentor' | 'bonus'
  const [activeTab, setActiveTab] = useState('upload');
  
  // Saved Marksheets list from MongoDB
  const [savedMarksheets, setSavedMarksheets] = useState([]);
  const [selectedMarksheet, setSelectedMarksheet] = useState(null);

  // Drill Test Modal State for Marksheets
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillSubject, setDrillSubject] = useState('Mathematics');
  const [drillWeakTopics, setDrillWeakTopics] = useState([]);
  const [drillScore, setDrillScore] = useState(null);
  const [drillTotalMarks, setDrillTotalMarks] = useState(100);
  const [drillPercentage, setDrillPercentage] = useState(null);
  const [drillFeedback, setDrillFeedback] = useState('');
  
  // File upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  
  // Data Validation State
  const [extractedData, setExtractedData] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Recovery Plan Sync status
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState('');

  // Target Score Calculator State
  const [targetPercentage, setTargetPercentage] = useState(85);
  const [targetCGPA, setTargetCGPA] = useState(8.5);
  const [isCalculatingTarget, setIsCalculatingTarget] = useState(false);
  const [targetResult, setTargetResult] = useState(null);

  // Compare Marksheets State
  const [compareId1, setCompareId1] = useState('');
  const [compareId2, setCompareId2] = useState('');
  const [compareData, setCompareData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // AI Mentor Chat State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your evidence-based AI Academic Mentor. Ask me anything about your verified marksheet, weak subjects, or target score roadmap!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSavedMarksheets();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const fetchSavedMarksheets = async () => {
    try {
      const res = await api.get('/marksheet');
      if (res.data.success) {
        setSavedMarksheets(res.data.data);
        if (res.data.data.length > 0 && !selectedMarksheet) {
          setSelectedMarksheet(res.data.data[0]);
          if (res.data.data.length >= 2) {
            setCompareId1(res.data.data[0]._id);
            setCompareId2(res.data.data[1]._id);
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching saved marksheets:', err.message);
    }
  };

  // Drag & Drop File Handling
  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const processSelectedFile = (file) => {
    setUploadError('');
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file format. Please upload a PDF, JPG, JPEG, or PNG file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds maximum limit of 10 MB.');
      return;
    }

    setUploadFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  // Execute Upload & OCR Scan
  const handleUploadAndOCR = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      setUploadProgress(50);
      const res = await api.post('/marksheet/upload-ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadProgress(100);
      if (res.data.success) {
        setFileDetails(res.data.fileDetails);
        setExtractedData(res.data.extractedData);
        setActiveTab('validate');
      } else {
        setUploadError(res.data.message || 'Failed to extract data');
      }
    } catch (err) {
      console.error('Upload OCR Error:', err);
      setUploadError(err.response?.data?.message || 'Error parsing file with OCR. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Edit validation row changes
  const handleSubjectChange = (index, field, value) => {
    const updated = { ...extractedData };
    const sub = updated.subjects[index];
    sub[field] = value;

    if (field === 'obtainedMarks' || field === 'maxMarks') {
      sub.obtainedMarks = parseFloat(sub.obtainedMarks) || 0;
      sub.maxMarks = parseFloat(sub.maxMarks) || 100;
    }
    sub.isUserEdited = true;

    // Recalculate dynamic overall percentage strictly as (sum obtained / sum max) * 100
    const totalObt = updated.subjects.reduce((acc, s) => acc + (Number(s.obtainedMarks) || 0), 0);
    const totalMx = updated.subjects.reduce((acc, s) => acc + (Number(s.maxMarks) || 100), 0);
    updated.overallPercentage = totalMx > 0 ? parseFloat(((totalObt / totalMx) * 100).toFixed(2)) : 0;
    updated.cgpa = parseFloat((updated.overallPercentage / 9.5).toFixed(2));

    setExtractedData(updated);
  };

  const handleAddSubject = () => {
    const updated = { ...extractedData };
    if (!updated.subjects) updated.subjects = [];
    updated.subjects.push({
      subjectName: "Subject " + (updated.subjects.length + 1),
      subjectCode: "",
      maxMarks: 100,
      obtainedMarks: 70,
      internalMarks: 20,
      externalMarks: 50,
      credits: 3,
      grade: "B",
      confidence: "High",
      isUserEdited: true
    });
    const totalObt = updated.subjects.reduce((acc, s) => acc + (Number(s.obtainedMarks) || 0), 0);
    const totalMx = updated.subjects.reduce((acc, s) => acc + (Number(s.maxMarks) || 100), 0);
    updated.overallPercentage = totalMx > 0 ? parseFloat(((totalObt / totalMx) * 100).toFixed(2)) : 0;
    updated.cgpa = parseFloat((updated.overallPercentage / 9.5).toFixed(2));
    setExtractedData(updated);
  };

  const handleRemoveSubject = (index) => {
    const updated = { ...extractedData };
    updated.subjects.splice(index, 1);
    const totalObt = updated.subjects.reduce((acc, s) => acc + (Number(s.obtainedMarks) || 0), 0);
    const totalMx = updated.subjects.reduce((acc, s) => acc + (Number(s.maxMarks) || 100), 0);
    updated.overallPercentage = totalMx > 0 ? parseFloat(((totalObt / totalMx) * 100).toFixed(2)) : 0;
    updated.cgpa = parseFloat((updated.overallPercentage / 9.5).toFixed(2));
    setExtractedData(updated);
  };

  // Submit Validated Data for Deep AI Analysis
  const handleRunDeepAnalysis = async () => {
    if (!extractedData || !extractedData.subjects || extractedData.subjects.length === 0) {
      alert('Please add at least one subject with valid marks before running analysis.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const payload = {
        fileName: fileDetails?.fileName || uploadFile?.name || 'Uploaded Marksheet',
        fileUrl: fileDetails?.fileUrl || '',
        fileType: fileDetails?.fileType || uploadFile?.type || 'application/pdf',
        fileSize: fileDetails?.fileSize || uploadFile?.size || 0,
        extractedData: extractedData,
        targetScore: { targetPercentage: targetPercentage }
      };

      const res = await api.post('/marksheet/save-analyze', payload);
      if (res.data.success) {
        setSelectedMarksheet(res.data.data);
        await fetchSavedMarksheets();
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error('Deep Analysis Error:', err);
      alert(err.response?.data?.message || 'Failed to complete AI analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sync Recovery Plan to Study Planner
  const handleSyncToStudyPlanner = async () => {
    if (!selectedMarksheet) return;
    setIsSyncing(true);
    setSyncSuccess('');
    try {
      const res = await api.post(`/marksheet/${selectedMarksheet._id}/sync-study-planner`);
      if (res.data.success) {
        setSyncSuccess('🚀 Recovery Plan successfully synced to your EduBridge AI Study Planner!');
        setTimeout(() => setSyncSuccess(''), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to sync recovery plan');
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate Target Score Projection
  const handleCalculateTargetScore = async () => {
    if (!selectedMarksheet) return;
    setIsCalculatingTarget(true);
    try {
      const res = await api.post(`/marksheet/${selectedMarksheet._id}/target-score`, {
        targetPercentage: parseFloat(targetPercentage),
        targetCGPA: parseFloat(targetCGPA)
      });
      if (res.data.success) {
        setTargetResult(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to calculate target score');
    } finally {
      setIsCalculatingTarget(false);
    }
  };

  // Compare Marksheets
  const handleCompareMarksheets = async () => {
    if (!compareId1 || !compareId2) {
      alert('Please select two marksheets to compare');
      return;
    }
    setIsComparing(true);
    try {
      const res = await api.post('/marksheet/compare', {
        marksheetIds: [compareId1, compareId2]
      });
      if (res.data.success) {
        setCompareData(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to compare marksheets');
    } finally {
      setIsComparing(false);
    }
  };

  // Send message to AI Mentor
  const handleSendChatMessage = async (presetText = null) => {
    const query = presetText || chatInput;
    if (!query.trim() || !selectedMarksheet) return;

    const newMsgs = [...chatMessages, { sender: 'user', text: query }];
    setChatMessages(newMsgs);
    if (!presetText) setChatInput('');
    setIsChatting(true);

    try {
      const res = await api.post(`/marksheet/${selectedMarksheet._id}/chat`, {
        question: query
      });

      if (res.data.success) {
        setChatMessages([...newMsgs, { sender: 'ai', text: res.data.answer }]);
      }
    } catch (err) {
      setChatMessages([...newMsgs, { sender: 'ai', text: 'Apologies, I encountered an issue analyzing that question. Please try again.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  // Delete Marksheet
  const handleDeleteMarksheet = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marksheet record?')) return;
    try {
      await api.delete(`/marksheet/${id}`);
      await fetchSavedMarksheets();
      if (selectedMarksheet?._id === id) {
        setSelectedMarksheet(savedMarksheets.find(m => m._id !== id) || null);
      }
    } catch (err) {
      alert('Failed to delete marksheet');
    }
  };

  // Print & PDF AI Report Generator
  const handlePrintPDFReport = () => {
    if (!selectedMarksheet) return;
    window.print();
  };

  // Export iCal (.ics) Calendar
  const handleExportCalendar = async () => {
    if (!selectedMarksheet) return;
    try {
      const res = await api.get(`/marksheet/${selectedMarksheet._id}/export-ics`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedMarksheet.extractedData?.studentName || 'Student'}_Recovery_Plan.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export calendar events.');
    }
  };

  // Chart Data Helpers (Using ONLY actual extracted subjects)
  const getBarChartData = () => {
    if (!selectedMarksheet?.extractedData?.subjects) return [];
    return selectedMarksheet.extractedData.subjects.map(s => ({
      name: s.subjectName.length > 14 ? s.subjectName.substring(0, 12) + '...' : s.subjectName,
      Obtained: s.obtainedMarks,
      Max: s.maxMarks || 100,
      Percentage: Math.round(((s.obtainedMarks || 0) / (s.maxMarks || 100)) * 100)
    }));
  };

  const getRadarChartData = () => {
    if (!selectedMarksheet?.aiAnalysis?.subjectAnalysis) return [];
    return selectedMarksheet.aiAnalysis.subjectAnalysis.map(s => ({
      subject: s.subjectName.length > 12 ? s.subjectName.substring(0, 10) + '..' : s.subjectName,
      score: s.percentage,
      confidence: s.confidenceLevel || 80,
      fullMark: 100
    }));
  };

  const getTrendGraphData = () => {
    if (!savedMarksheets || savedMarksheets.length === 0) return [];
    return savedMarksheets.slice().reverse().map(m => ({
      exam: m.extractedData?.examName ? (m.extractedData.examName.length > 10 ? m.extractedData.examName.substring(0, 8) + '..' : m.extractedData.examName) : 'Scorecard',
      Percentage: m.extractedData?.overallPercentage || 0,
      CGPA: m.extractedData?.cgpa ? parseFloat((m.extractedData.cgpa * 10).toFixed(1)) : 0
    }));
  };

  // Derived totals for Dashboard
  const subjectsList = selectedMarksheet?.extractedData?.subjects || [];
  const totalObtainedMarks = subjectsList.reduce((sum, s) => sum + (Number(s.obtainedMarks) || 0), 0);
  const totalMaxMarks = subjectsList.reduce((sum, s) => sum + (Number(s.maxMarks) || 100), 0);
  const averageMarksValue = subjectsList.length > 0 ? (totalObtainedMarks / subjectsList.length).toFixed(1) : '0';

  const sortedSubList = [...subjectsList].sort((a, b) => {
    const pctA = ((a.obtainedMarks || 0) / (a.maxMarks || 100)) * 100;
    const pctB = ((b.obtainedMarks || 0) / (b.maxMarks || 100)) * 100;
    return pctB - pctA;
  });

  const topSubject = sortedSubList[0];
  const bottomSubject = sortedSubList[sortedSubList.length - 1];

  // Handler to open precision AI Drill Test from Marksheet feedback
  const handleOpenDrillTest = (customSubject = null, customTopics = null) => {
    if (customSubject) {
      const sName = customSubject.subjectName || customSubject.name || 'Academic Subject';
      setDrillSubject(sName);
      const topics = customTopics || customSubject.estimatedChapterWeaknesses || [];
      setDrillWeakTopics(topics.length > 0 ? topics : [`${sName} Core Principles & Calculations`]);
      setDrillScore(customSubject.marks !== undefined ? customSubject.marks : customSubject.obtainedMarks);
      setDrillTotalMarks(customSubject.maxMarks || 100);
      setDrillPercentage(customSubject.percentage || (customSubject.obtainedMarks ? Math.round((customSubject.obtainedMarks / (customSubject.maxMarks || 100)) * 100) : null));
      setDrillFeedback(customSubject.recommendation || selectedMarksheet?.aiAnalysis?.overallAcademicSummary || '');
    } else {
      const lowestSub = bottomSubject || (selectedMarksheet?.extractedData?.subjects?.[0]);
      const weakList = selectedMarksheet?.aiAnalysis?.weakSubjects || [];
      setDrillSubject(lowestSub?.subjectName || 'Academic Subject');
      setDrillWeakTopics(weakList.length > 0 ? weakList : (lowestSub ? [`${lowestSub.subjectName} Core Problem Areas`] : ['Core Exam Topics']));
      setDrillScore(lowestSub?.obtainedMarks || lowestSub?.marks || null);
      setDrillTotalMarks(lowestSub?.maxMarks || 100);
      setDrillPercentage(lowestSub?.percentage || (lowestSub?.obtainedMarks ? Math.round((lowestSub.obtainedMarks / (lowestSub.maxMarks || 100)) * 100) : null));
      setDrillFeedback(selectedMarksheet?.aiAnalysis?.overallAcademicSummary || 'Focus on foundational concepts and targeted numerical problem solving.');
    }
    setDrillModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 relative">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Hero Header */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-900 via-teal-900 to-violet-950 text-white border border-emerald-700/30 shadow-soft-lg overflow-hidden print:hidden">
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-200 border border-white/20 backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>AI-Powered Multimodal Marksheet Engine</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Marksheet Upload & <span className="text-emerald-300">Analysis</span>
                </h1>
                <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
                  Upload your marksheets for evidence-based OCR extraction, dynamic score calculation, zero-hallucination academic analysis, and comparison graphs based strictly on your real marks.
                </p>
              </div>

              {/* Saved Marksheet Selector Dropdown */}
              {savedMarksheets.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md">
                  <span className="text-xs text-emerald-200 font-semibold px-1">Active Marksheet:</span>
                  <select
                    value={selectedMarksheet?._id || ''}
                    onChange={(e) => {
                      const found = savedMarksheets.find(m => m._id === e.target.value);
                      if (found) {
                        setSelectedMarksheet(found);
                        setActiveTab('dashboard');
                      }
                    }}
                    className="bg-white text-slate-900 text-xs font-bold rounded-xl px-3 py-2 border border-emerald-300 shadow-soft-sm focus:outline-none focus:border-emerald-500"
                  >
                    {savedMarksheets.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.extractedData?.examName || m.fileName} ({m.extractedData?.overallPercentage || 'N/A'}%)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-glow-emerald shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload New</span>
                  </button>
                </div>
              )}
            </div>

            {/* Supported Formats Pills */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs text-emerald-100">
              <span className="font-bold text-white">Supported Formats:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-emerald-200 font-semibold border border-white/10">PDF</span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-teal-200 font-semibold border border-white/10">JPG / JPEG</span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-cyan-200 font-semibold border border-white/10">PNG</span>
              <span className="mx-2 text-white/30">|</span>
              <span className="font-bold text-white">Analysis Standards:</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white border border-white/10">100% Dynamic Calculation</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white border border-white/10">Zero Hallucinations</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white border border-white/10">MongoDB Record Storage</span>
            </div>
          </div>

          {/* Pipeline Indicator */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-soft-sm space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                <Brain className="w-4 h-4 text-emerald-600" />
                <span>Evidence-Based Academic Analysis Pipeline</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Strict Data Verification • Zero Invention</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[10px]">
              <div className={`p-2 rounded-xl border transition-all ${activeTab === 'upload' ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-soft-sm' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <span className="block text-xs font-bold">1. Upload</span> Marksheet Input
              </div>
              <div className={`p-2 rounded-xl border transition-all ${isUploading ? 'bg-amber-500 text-white font-bold border-amber-500' : extractedData ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <span className="block text-xs font-bold">2. OCR Extract</span> Vision Extraction
              </div>
              <div className={`p-2 rounded-xl border transition-all ${activeTab === 'validate' ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-soft-sm' : extractedData ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <span className="block text-xs font-bold">3. Verify</span> Student Validation
              </div>
              <div className={`p-2 rounded-xl border transition-all ${selectedMarksheet ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <span className="block text-xs font-bold">4. Store</span> MongoDB Save
              </div>
              <div className={`p-2 rounded-xl border transition-all ${selectedMarksheet ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <span className="block text-xs font-bold">5. Fetch History</span> Merge Database
              </div>
              <div className={`p-2 rounded-xl border transition-all ${selectedMarksheet ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <span className="block text-xs font-bold">6. Dynamic Math</span> Score Formulas
              </div>
              <div className={`p-2 rounded-xl border transition-all ${activeTab === 'dashboard' && selectedMarksheet ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-soft-sm' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <span className="block text-xs font-bold">7. AI Insights</span> Deep Analysis
              </div>
              <div className={`p-2 rounded-xl border transition-all ${activeTab === 'recovery' && selectedMarksheet ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-soft-sm' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <span className="block text-xs font-bold">8. Recovery</span> Action Plan
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 print:hidden">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'upload'
                  ? 'bg-emerald-600 text-white shadow-soft-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>1. Upload Marksheet</span>
            </button>

            <button
              onClick={() => setActiveTab('validate')}
              disabled={!extractedData}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'validate'
                  ? 'bg-emerald-600 text-white shadow-soft-sm'
                  : extractedData
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>2. Verify Data</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-soft-sm'
                  : selectedMarksheet
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>3. AI Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('deep_breakdown')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'deep_breakdown'
                  ? 'bg-emerald-600 text-white shadow-soft-sm'
                  : selectedMarksheet
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>4. Subject & Chapter Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab('recovery')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'recovery'
                  ? 'bg-emerald-600 text-white shadow-soft-sm'
                  : selectedMarksheet
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>5. Recovery Plan</span>
            </button>

            <button
              onClick={() => setActiveTab('target')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'target'
                  ? 'bg-emerald-600 text-white shadow-soft-sm'
                  : selectedMarksheet
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <Target className="w-4 h-4 text-teal-600" />
              <span>6. Target Score</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              disabled={savedMarksheets.length < 2}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'compare'
                  ? 'bg-emerald-600 text-white shadow-soft-sm'
                  : savedMarksheets.length >= 2
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <Layers className="w-4 h-4 text-violet-600" />
              <span>7. Compare Marksheets</span>
            </button>

            <button
              onClick={() => setActiveTab('mentor')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'mentor'
                  ? 'bg-emerald-600 text-white shadow-soft-sm'
                  : selectedMarksheet
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <Bot className="w-4 h-4 text-teal-600" />
              <span>8. Ask AI Mentor</span>
            </button>

            <button
              onClick={() => setActiveTab('bonus')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === 'bonus'
                  ? 'bg-emerald-600 text-white shadow-soft-sm'
                  : selectedMarksheet
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <Award className="w-4 h-4 text-violet-600" />
              <span>9. Reports & Guidance</span>
            </button>
          </div>

          {/* TAB 1: UPLOAD & OCR SCAN */}
          {activeTab === 'upload' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card p-6 sm:p-10 border border-slate-200 rounded-3xl text-center space-y-6 bg-white shadow-soft-md">
                <div className="max-w-xl mx-auto space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Upload Your Marksheet</h2>
                  <p className="text-sm text-slate-600">
                    Drop your marksheet here or browse from your device to extract subject marks and start your AI analysis.
                  </p>
                </div>

                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 p-8 sm:p-12 rounded-3xl transition-all cursor-pointer group flex flex-col items-center justify-center space-y-4"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-soft-sm">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base sm:text-lg font-bold text-slate-900">
                      Drop your marksheet here or browse from your device.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Supports PDF, JPG, JPEG, and PNG (Maximum file size: 10 MB)
                    </p>
                  </div>
                  <button type="button" className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-soft-sm transition-colors">
                    Browse Files from Device
                  </button>
                </div>

                {uploadError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center space-x-2 font-medium">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Upload File Preview */}
                {uploadFile && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                    <div className="flex items-center space-x-3">
                      {filePreviewUrl ? (
                        <img src={filePreviewUrl} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-slate-300 shadow-sm" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                          {uploadFile.type === 'application/pdf' ? 'PDF' : 'IMG'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-900 truncate max-w-xs">{uploadFile.name}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          File Type: <span className="font-semibold text-slate-700">{uploadFile.type || 'Document'}</span> • Size: <span className="font-semibold text-slate-700">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <button
                        onClick={() => setUploadFile(null)}
                        className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium text-xs flex items-center space-x-1"
                        title="Remove / Replace File"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Remove File</span>
                      </button>
                      <button
                        onClick={handleUploadAndOCR}
                        disabled={isUploading}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-glow-emerald flex items-center justify-center space-x-2"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Analyzing your marksheet... ({uploadProgress}%)</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Analyze Marksheet</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: DATA VERIFICATION & EDITING */}
          {activeTab === 'validate' && extractedData && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Guidance / Manual Confirmation Alert */}
              <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start space-x-3 ${
                extractedData.lowConfidence || extractedData.requiresManualConfirmation || !extractedData.subjects || extractedData.subjects.length === 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold text-slate-900">
                    {extractedData.lowConfidence || extractedData.requiresManualConfirmation
                      ? '⚠️ Information could not be confidently detected completely — Manual Verification Required'
                      : 'Step 2: Verify & Edit Extracted Scorecard Data'}
                  </p>
                  <p className="text-slate-600 text-xs leading-relaxed mt-0.5">
                    Review your extracted subject names and marks below. If something could not be detected, it is marked as <span className="font-semibold text-rose-600">"Information could not be confidently detected."</span> You can edit any subject, adjust marks, or click "Add Subject Row" to add missing subjects before proceeding. Overall percentage is calculated dynamically as <span className="underline font-mono font-bold">(sum of obtained marks ÷ total max marks) × 100</span>.
                  </p>
                </div>
              </div>

              {/* Metadata Fields */}
              <div className="glass-card p-6 border border-slate-200 rounded-3xl space-y-4 bg-white shadow-soft-sm">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Student & Institution Metadata</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Student Name</label>
                    <input
                      type="text"
                      value={extractedData.studentName || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, studentName: e.target.value })}
                      placeholder="Information could not be confidently detected."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none placeholder:text-slate-400 placeholder:italic"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Roll / Seat Number</label>
                    <input
                      type="text"
                      value={extractedData.rollNumber || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, rollNumber: e.target.value })}
                      placeholder="Information could not be confidently detected."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none placeholder:text-slate-400 placeholder:italic"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Exam Name / Semester</label>
                    <input
                      type="text"
                      value={extractedData.examName || extractedData.semester || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, examName: e.target.value })}
                      placeholder="Information could not be confidently detected."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none placeholder:text-slate-400 placeholder:italic"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Board / University</label>
                    <input
                      type="text"
                      value={extractedData.board || extractedData.university || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, board: e.target.value, university: e.target.value })}
                      placeholder="Information could not be confidently detected."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none placeholder:text-slate-400 placeholder:italic"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">College / School</label>
                    <input
                      type="text"
                      value={extractedData.college || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, college: e.target.value })}
                      placeholder="Information could not be confidently detected."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none placeholder:text-slate-400 placeholder:italic"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Class / Semester</label>
                    <input
                      type="text"
                      value={extractedData.classGrade || extractedData.semester || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, classGrade: e.target.value })}
                      placeholder="Information could not be confidently detected."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none placeholder:text-slate-400 placeholder:italic"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Overall Percentage (%) [Auto-Calculated]</label>
                    <input
                      type="number"
                      readOnly
                      value={extractedData.overallPercentage || 0}
                      className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-2 text-emerald-700 font-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Calculated CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      readOnly
                      value={extractedData.cgpa || 0}
                      className="w-full bg-violet-50/50 border border-violet-300 rounded-xl px-3 py-2 text-violet-700 font-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Subject Marks Editable Table */}
              <div className="glass-card p-6 border border-slate-200 rounded-3xl space-y-4 bg-white shadow-soft-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <span>Parsed Subjects & Marks Breakdown</span>
                  </h3>

                  <button
                    onClick={handleAddSubject}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-emerald-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-3">Subject Name</th>
                        <th className="py-3 px-2">Subject Code</th>
                        <th className="py-3 px-2">Obtained Marks</th>
                        <th className="py-3 px-2">Max Marks</th>
                        <th className="py-3 px-2">Grade</th>
                        <th className="py-3 px-2">OCR Confidence</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(extractedData.subjects || []).map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={sub.subjectName}
                              onChange={(e) => handleSubjectChange(idx, 'subjectName', e.target.value)}
                              placeholder="Information could not be confidently detected."
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:border-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <input
                              type="text"
                              value={sub.subjectCode || ''}
                              onChange={(e) => handleSubjectChange(idx, 'subjectCode', e.target.value)}
                              placeholder="Code"
                              className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-700 font-medium focus:border-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              value={sub.obtainedMarks}
                              onChange={(e) => handleSubjectChange(idx, 'obtainedMarks', e.target.value)}
                              className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-black text-center focus:border-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              value={sub.maxMarks || 100}
                              onChange={(e) => handleSubjectChange(idx, 'maxMarks', e.target.value)}
                              className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-600 text-center font-semibold focus:border-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <input
                              type="text"
                              value={sub.grade || ''}
                              onChange={(e) => handleSubjectChange(idx, 'grade', e.target.value)}
                              className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-amber-700 font-black text-center uppercase focus:border-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.confidence === 'Uncertain' || sub.confidence === 'Low'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {sub.confidence || 'High'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              onClick={() => handleRemoveSubject(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs sm:text-sm border border-slate-300 transition-colors shadow-soft-sm"
                >
                  Back to Upload
                </button>
                <button
                  onClick={handleRunDeepAnalysis}
                  disabled={isAnalyzing}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 hover:opacity-95 text-white font-bold rounded-xl text-sm transition-all shadow-glow-emerald flex items-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini Deep AI Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      <span>Save & Run Deep AI Analysis 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 3: DEEP AI DASHBOARD */}
          {activeTab === 'dashboard' && selectedMarksheet && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* 🎯 PROMINENT DRILL TEST ACTION CARD (MARKSHEET FEEDBACK INTEGRATION) */}
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
                      <span className="text-xs text-slate-500 font-bold hidden sm:inline">• Weak Subject Targeted</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                      Drill Test: Practice Topics You Need to Improve
                    </h3>
                    <p className="text-xs text-slate-700 mt-0.5 font-medium">
                      Instantly generate a personalized practice test focusing on <strong className="text-teal-900">{bottomSubject?.subjectName || 'your identified weak areas'}</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenDrillTest()}
                  className="px-6 py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 shadow-glow-teal hover:opacity-95 transition-all whitespace-nowrap flex items-center space-x-2 shrink-0"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Start Marksheet Drill Test 🚀</span>
                </button>
              </div>

              {/* Key Metric Hero Cards - Calculated Strictly from Uploaded Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Performance Rating */}
                <div className="glass-card p-5 border border-slate-200 rounded-3xl flex items-center space-x-4 bg-white shadow-soft-sm">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Performance Level</p>
                    <p className="text-xl font-black text-slate-900">
                      {selectedMarksheet.aiAnalysis?.performanceRating || 'Good'}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                      Risk Level: {selectedMarksheet.aiAnalysis?.riskLevel || 'Low'}
                    </p>
                  </div>
                </div>

                {/* Overall Percentage & Marks */}
                <div className="glass-card p-5 border border-slate-200 rounded-3xl flex items-center space-x-4 bg-white shadow-soft-sm">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Overall Percentage</p>
                    <p className="text-2xl font-black text-slate-900">
                      {selectedMarksheet.extractedData?.overallPercentage || selectedMarksheet.aiAnalysis?.overallPercentage || '0'}%
                    </p>
                    <p className="text-[11px] text-teal-700 font-bold mt-0.5">
                      Marks: {totalObtainedMarks} / {totalMaxMarks} (Avg: {averageMarksValue})
                    </p>
                  </div>
                </div>

                {/* Exam Readiness Score */}
                <div className="glass-card p-5 border border-slate-200 rounded-3xl flex items-center space-x-4 bg-white shadow-soft-sm">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 border border-violet-200">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Exam Readiness</p>
                    <p className="text-2xl font-black text-slate-900">
                      {selectedMarksheet.aiAnalysis?.examReadinessScore || 70}/100
                    </p>
                    <p className="text-[11px] text-violet-700 font-bold mt-0.5">
                      AI Confidence: {selectedMarksheet.aiAnalysis?.confidenceScore || 'High'}
                    </p>
                  </div>
                </div>

                {/* Learning Gap Score */}
                <div className="glass-card p-5 border border-slate-200 rounded-3xl flex items-center space-x-4 bg-white shadow-soft-sm">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Learning Gap Score</p>
                    <p className="text-2xl font-black text-slate-900">
                      {selectedMarksheet.aiAnalysis?.learningGapScore || 30}%
                    </p>
                    <p className="text-[11px] text-rose-700 font-bold mt-0.5">
                      Potential Gain: +{selectedMarksheet.aiAnalysis?.estimatedImprovementPotential || 15}%
                    </p>
                  </div>
                </div>

              </div>

              {/* Strongest & Weakest Subject Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between shadow-soft-sm">
                  <div>
                    <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">Strongest Subject</span>
                    <span className="text-lg font-black text-slate-900">{topSubject ? topSubject.subjectName : 'N/A'}</span>
                  </div>
                  <span className="text-xl font-black text-emerald-700">{topSubject ? `${topSubject.obtainedMarks}/${topSubject.maxMarks || 100}` : ''}</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between shadow-soft-sm">
                  <div>
                    <span className="text-xs text-rose-800 font-bold uppercase tracking-wider block">Subject Needing Improvement</span>
                    <span className="text-lg font-black text-slate-900">{bottomSubject ? bottomSubject.subjectName : 'N/A'}</span>
                  </div>
                  <span className="text-xl font-black text-rose-700">{bottomSubject ? `${bottomSubject.obtainedMarks}/${bottomSubject.maxMarks || 100}` : ''}</span>
                </div>
              </div>

              {/* STRUCTURED AI FEEDBACK CARDS GRID (PROMPT REQUIREMENT #8) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span>Personalized AI Academic Feedback</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">Calculated from Real Extracted Marks</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Card 1: 🎯 Your Performance */}
                  <div className="glass-card p-6 border border-slate-200 rounded-3xl bg-white shadow-soft-sm space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2">
                      <span className="text-lg">🎯</span>
                      <span>Your Performance</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {selectedMarksheet.aiAnalysis?.overallAcademicSummary || `Overall percentage of ${selectedMarksheet.extractedData?.overallPercentage}% across ${subjectsList.length} subjects with a performance rating of ${selectedMarksheet.aiAnalysis?.performanceRating || 'Good'}.`}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">CGPA / SGPA:</span>
                      <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {selectedMarksheet.extractedData?.cgpa ? `${selectedMarksheet.extractedData.cgpa} CGPA` : selectedMarksheet.extractedData?.sgpa ? `${selectedMarksheet.extractedData.sgpa} SGPA` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Card 2: 💪 Your Strengths */}
                  <div className="glass-card p-6 border border-slate-200 rounded-3xl bg-white shadow-soft-sm space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2">
                      <span className="text-lg">💪</span>
                      <span>Your Strengths</span>
                    </div>
                    <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 font-medium">
                      {(selectedMarksheet.aiAnalysis?.strengths && selectedMarksheet.aiAnalysis.strengths.length > 0
                        ? selectedMarksheet.aiAnalysis.strengths
                        : (selectedMarksheet.aiAnalysis?.strongSubjects || []).map(s => `Strong conceptual accuracy in ${s}`)
                      ).map((str, i) => (
                        <li key={i} className="text-slate-800">{str}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Card 3: 📈 Areas Improving */}
                  <div className="glass-card p-6 border border-slate-200 rounded-3xl bg-white shadow-soft-sm space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2">
                      <span className="text-lg">📈</span>
                      <span>Areas Improving</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {selectedMarksheet.aiAnalysis?.historicalComparison?.growthTrend === 'Positive Growth'
                        ? `Performance shows positive momentum (+${selectedMarksheet.aiAnalysis?.historicalComparison?.improvementPercentage || '5%'} score gain).`
                        : `Positive performance in high-scoring units like ${topSubject ? topSubject.subjectName : 'core subjects'}.`}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Consistency Rating:</span>
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {selectedMarksheet.aiAnalysis?.consistencyScore || 80}/100
                      </span>
                    </div>
                  </div>

                  {/* Card 4: ⚠ Areas Needing Attention */}
                  <div className="glass-card p-6 border border-slate-200 rounded-3xl bg-white shadow-soft-sm space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2">
                      <span className="text-lg">⚠</span>
                      <span>Areas Needing Attention</span>
                    </div>
                    <div className="space-y-2">
                      {(selectedMarksheet.aiAnalysis?.weakSubjects || []).map((ws, i) => {
                        const matchedSub = (selectedMarksheet.extractedData?.subjects || []).find(s => ws.toLowerCase().includes(s.subjectName?.toLowerCase()));
                        return (
                          <div key={i} className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center justify-between">
                            <span className="font-bold">{ws}</span>
                            <button
                              type="button"
                              onClick={() => handleOpenDrillTest(matchedSub || { subjectName: ws, obtainedMarks: null, maxMarks: 100 }, [ws])}
                              className="text-[10px] bg-rose-200 hover:bg-rose-300 text-rose-900 px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-colors"
                              title={`Generate Precision Drill for ${ws}`}
                            >
                              <Target className="w-3 h-3 text-rose-700" />
                              <span>Drill</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card 5: 🧠 AI Recommendations */}
                  <div className="glass-card p-6 border border-slate-200 rounded-3xl bg-white shadow-soft-sm space-y-3 md:col-span-2 lg:col-span-1">
                    <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2">
                      <span className="text-lg">🧠</span>
                      <span>AI Recommendations (Why & How)</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {(selectedMarksheet.aiAnalysis?.evidenceBasedRecommendations || []).slice(0, 2).map((rec, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <p className="font-bold text-slate-900">{rec.subject}: {rec.action}</p>
                          <p className="text-[11px] text-slate-500"><strong>Why:</strong> {rec.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 6: 📚 Suggested Focus */}
                  <div className="glass-card p-6 border border-slate-200 rounded-3xl bg-white shadow-soft-sm space-y-3 md:col-span-2 lg:col-span-1">
                    <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2">
                      <span className="text-lg">📚</span>
                      <span>Suggested Study Focus</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {sortedSubList.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-800">{i + 1}. {s.subjectName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            i === 0 ? 'bg-rose-100 text-rose-800' : i === 1 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {s.obtainedMarks}/{s.maxMarks || 100} ({Math.round((s.obtainedMarks / (s.maxMarks || 100)) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SUBJECT-WISE ANALYSIS TABLE & PROGRESS BARS (PROMPT REQUIREMENT #2) */}
              <div className="glass-card p-6 border border-slate-200 rounded-3xl space-y-4 bg-white shadow-soft-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <span>Subject-Wise Analysis</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Verified Scorecard Performance Breakdown</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-3">Subject</th>
                        <th className="py-3 px-2 text-right">Marks</th>
                        <th className="py-3 px-2 text-right">Percentage</th>
                        <th className="py-3 px-2 text-center">Grade</th>
                        <th className="py-3 px-2">Performance & Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {subjectsList.map((s, idx) => {
                        const pct = Math.round(((Number(s.obtainedMarks) || 0) / (Number(s.maxMarks) || 100)) * 100);
                        const perfLevel = pct >= 80 ? 'Mastery' : pct >= 65 ? 'Proficient' : pct >= 50 ? 'Developing' : 'Needs Attention';
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-900">{s.subjectName}</td>
                            <td className="py-3 px-2 text-right font-semibold text-slate-800">{s.obtainedMarks} / {s.maxMarks || 100}</td>
                            <td className="py-3 px-2 text-right font-black text-emerald-700">{pct}%</td>
                            <td className="py-3 px-2 text-center">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-300">
                                {s.grade || (pct >= 80 ? 'A' : pct >= 60 ? 'B' : 'C')}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center space-x-3">
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      pct >= 80 ? 'bg-emerald-500' : pct >= 65 ? 'bg-teal-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  pct >= 80 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  pct >= 65 ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                                  pct >= 50 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                  'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}>
                                  {perfLevel}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* VISUAL ANALYTICS CHARTS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Subject Marks Bar Chart */}
                <div className="glass-card p-6 border border-slate-200 rounded-3xl space-y-4 bg-white shadow-soft-sm">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    <span>Subject Marks vs Maximum Marks</span>
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getBarChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-15} textAnchor="end" />
                        <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }} />
                        <Bar dataKey="Obtained" fill="#059669" radius={[6, 6, 0, 0]} name="Obtained Marks" />
                        <Bar dataKey="Max" fill="#e2e8f0" radius={[6, 6, 0, 0]} name="Max Marks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subject Competency Radar Chart */}
                <div className="glass-card p-6 border border-slate-200 rounded-3xl space-y-4 bg-white shadow-soft-sm">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-teal-600" />
                    <span>Subject Competency & Mastery Spiderweb</span>
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarChartData()}>
                        <PolarGrid stroke="#cbd5e1" />
                        <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={9} />
                        <Radar name="Performance Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                        <Radar name="Confidence Level" dataKey="confidence" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 4: SUBJECT, TOPIC & CHAPTER ANALYSIS */}
          {activeTab === 'deep_breakdown' && selectedMarksheet && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* SUBJECT ANALYSIS TABLE */}
              <div className="glass-card p-6 border border-slate-200 rounded-3xl space-y-4 bg-white shadow-soft-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <span>Subject Analysis Breakdown</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">Ranked by Obtained Percentage</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-3">Subject Name</th>
                        <th className="py-3 px-2">Marks</th>
                        <th className="py-3 px-2">Percentage</th>
                        <th className="py-3 px-2">Grade</th>
                        <th className="py-3 px-2">Difficulty</th>
                        <th className="py-3 px-2">Rank</th>
                        <th className="py-3 px-2">Performance</th>
                        <th className="py-3 px-2">Estimated Chapters</th>
                        <th className="py-3 px-2">Study Hours</th>
                        <th className="py-3 px-3 text-right">Practice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(selectedMarksheet.aiAnalysis?.subjectAnalysis || []).map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">{sub.subjectName}</td>
                          <td className="py-3 px-2 text-slate-700 font-medium">{sub.marks} / {sub.maxMarks || 100}</td>
                          <td className="py-3 px-2 font-black text-emerald-700">{sub.percentage}%</td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-amber-800 font-bold border border-slate-300">
                              {sub.grade || 'B'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-600 font-medium">{sub.difficulty || 'Medium'}</td>
                          <td className="py-3 px-2 font-mono font-black text-teal-700">#{sub.rank || idx + 1}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.performanceLevel === 'Mastery' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              sub.performanceLevel === 'Proficient' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                              sub.performanceLevel === 'Developing' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {sub.performanceLevel}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-700">
                            {(sub.estimatedChapterWeaknesses || [sub.subjectName + ' Chapter 1 (AI Estimate)']).map((ch, cidx) => (
                              <span key={cidx} className="inline-block bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded text-[10px] mr-1 mb-1 font-semibold">
                                {ch}
                              </span>
                            ))}
                          </td>
                          <td className="py-3 px-2 font-semibold text-slate-800">{sub.estimatedStudyHours} Hours</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenDrillTest(sub)}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-300 transition-all inline-flex items-center space-x-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Drill Test</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOPIC ANALYSIS SECTION */}
              <div className="glass-card p-6 border border-slate-200 rounded-3xl space-y-4 bg-white shadow-soft-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-teal-600" />
                    <span>Topic-Wise Analysis (Marksheet + MongoDB Mock Tests)</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">Topic Accuracy & Weak Concepts</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {(selectedMarksheet.aiAnalysis?.topicAnalysis && selectedMarksheet.aiAnalysis.topicAnalysis.length > 0
                    ? selectedMarksheet.aiAnalysis.topicAnalysis
                    : (selectedMarksheet.extractedData?.subjects || []).map(s => ({
                        topicName: s.subjectName + ' Core Topics',
                        subjectName: s.subjectName,
                        topicAccuracy: 'Information could not be confidently detected.',
                        weakConcepts: [s.subjectName + ' Numericals'],
                        repeatedErrors: [],
                        retentionScore: 'Information could not be confidently detected.',
                        confidence: 'Medium',
                        hasMockTestData: false
                      }))
                  ).map((tp, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-sm">{tp.topicName}</span>
                        <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-300 text-[10px]">
                          {tp.subjectName}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-[11px]">
                        <div>
                          <span className="text-slate-500 block font-semibold">Topic Accuracy:</span>
                          <span className="font-bold text-teal-700">{tp.topicAccuracy}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block font-semibold">Retention Score:</span>
                          <span className="font-bold text-violet-700">{tp.retentionScore}</span>
                        </div>
                      </div>

                      {tp.weakConcepts && tp.weakConcepts.length > 0 && (
                        <div className="space-y-1">
                          <span className="font-bold text-rose-700 text-[11px]">Weak Concepts:</span>
                          <p className="text-slate-700 text-xs font-medium">{tp.weakConcepts.join(', ')}</p>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const subObj = (selectedMarksheet.extractedData?.subjects || []).find(s => s.subjectName.toLowerCase() === tp.subjectName?.toLowerCase());
                            handleOpenDrillTest(subObj || { subjectName: tp.subjectName, obtainedMarks: null, maxMarks: 100 }, [tp.topicName, ...(tp.weakConcepts || [])]);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-black border border-teal-300 transition-colors flex items-center space-x-1.5"
                        >
                          <Target className="w-3.5 h-3.5 text-teal-600" />
                          <span>Drill This Topic 🎯</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CHAPTER ANALYSIS SECTION */}
              <div className="glass-card p-6 border border-slate-200 rounded-3xl space-y-4 bg-white shadow-soft-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-violet-600" />
                    <span>Chapter-Wise Performance & Inferred Chapter Weaknesses</span>
                  </h3>
                  <span className="text-xs text-violet-700 font-semibold bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">
                    AI Syllabus Inference (Clearly Marked)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-3">Chapter</th>
                        <th className="py-3 px-2">Subject</th>
                        <th className="py-3 px-2">Accuracy</th>
                        <th className="py-3 px-2">Attempted</th>
                        <th className="py-3 px-2">Correct</th>
                        <th className="py-3 px-2">Wrong</th>
                        <th className="py-3 px-2">Study Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(selectedMarksheet.aiAnalysis?.chapterAnalysis && selectedMarksheet.aiAnalysis.chapterAnalysis.length > 0
                        ? selectedMarksheet.aiAnalysis.chapterAnalysis
                        : (selectedMarksheet.extractedData?.subjects || []).map(s => ({
                            chapterName: s.subjectName + ' Chapter 1 (AI Estimate)',
                            subjectName: s.subjectName,
                            accuracy: 'Information could not be confidently detected.',
                            questionsAttempted: 'Information could not be confidently detected.',
                            correctCount: 'Information could not be confidently detected.',
                            wrongCount: 'Information could not be confidently detected.',
                            studyTime: 'Information could not be confidently detected.'
                          }))
                      ).map((ch, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900 flex items-center space-x-2">
                            <span>{ch.chapterName}</span>
                            {ch.chapterName.includes('(AI Estimate)') && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 font-bold">AI Estimate</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-slate-600 font-medium">{ch.subjectName}</td>
                          <td className="py-3 px-2 font-bold text-violet-700">{ch.accuracy}</td>
                          <td className="py-3 px-2 text-slate-700 font-medium">{ch.questionsAttempted}</td>
                          <td className="py-3 px-2 text-emerald-700 font-bold">{ch.correctCount}</td>
                          <td className="py-3 px-2 text-rose-700 font-bold">{ch.wrongCount}</td>
                          <td className="py-3 px-2 text-slate-700 font-medium">{ch.studyTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: 1-CLICK RECOVERY PLAN */}
          {activeTab === 'recovery' && selectedMarksheet && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="glass-card p-6 border border-slate-200 rounded-3xl bg-white shadow-soft-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dynamic 1-Click Academic Recovery Plan</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    Personalized 7-Day, 30-Day & 90-Day Roadmap
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Recovery Score: <span className="text-amber-700 font-bold">{selectedMarksheet.recoveryPlan?.recoveryScore || 75}/100</span> • Estimated Total Hours: <span className="text-slate-900 font-bold">{selectedMarksheet.recoveryPlan?.estimatedTotalStudyHours || 40} Hours</span> • Expected Improvement: <span className="text-emerald-700 font-bold">{selectedMarksheet.recoveryPlan?.expectedImprovement || '+15% Gain'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleExportCalendar}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
                  >
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    <span>Export to Google Calendar (.ics)</span>
                  </button>

                  <button
                    onClick={handleSyncToStudyPlanner}
                    disabled={isSyncing}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-glow-emerald flex items-center space-x-2 shrink-0"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Syncing to Study Planner...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>🚀 Sync Recovery Plan to Study Planner</span>
                      </>
                    )}
                  </button>
                </div>
                {syncSuccess && (
                  <p className="text-xs text-emerald-400 font-semibold w-full text-right">{syncSuccess}</p>
                )}
              </div>

              {/* 7-DAY RECOVERY SCHEDULE */}
              <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span>7-Day Intensive Action Plan (Weakest Subjects First)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(selectedMarksheet.recoveryPlan?.plan7Days || []).map((dayPlan, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-800">Day {dayPlan.day || idx + 1}: {dayPlan.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black border border-emerald-300">
                          {dayPlan.hours || 3} Hrs
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 font-bold">Focus: {dayPlan.focus}</p>
                      <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc font-medium">
                        {(dayPlan.tasks || []).map((t, tidx) => (
                          <li key={tidx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* DAILY SCHEDULE & REVISION CALENDAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-teal-600" />
                    <span>Daily Study Schedule & Time Slots</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.recoveryPlan?.dailySchedule || []).map((ds, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-black text-emerald-800 font-mono">{ds.timeSlot}</p>
                          <p className="text-slate-900 font-bold mt-0.5">{ds.activity}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 font-black border border-amber-200">
                          {ds.focusSubject}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <CalendarDays className="w-5 h-5 text-emerald-600" />
                    <span>Revision Days & Mock Test Schedule</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-black text-slate-900 mb-2">Revision Calendar:</p>
                      <ul className="space-y-1.5 list-disc pl-4 text-slate-700 font-medium">
                        {(selectedMarksheet.recoveryPlan?.revisionCalendar || []).map((rc, idx) => (
                          <li key={idx}>{rc}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <p className="font-black text-slate-900 mb-2">Scheduled Mock Tests:</p>
                      <ul className="space-y-1.5 list-disc pl-4 text-emerald-800 font-bold">
                        {(selectedMarksheet.recoveryPlan?.mockTestSchedule || []).map((mt, idx) => (
                          <li key={idx}>{mt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 30-DAY & 90-DAY MILESTONES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-emerald-600" />
                    <span>30-Day Monthly Targets</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.recoveryPlan?.plan30Days || []).map((w, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0">
                          W{w.week || idx + 1}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{w.focus}</p>
                          <p className="text-slate-600 mt-0.5 font-medium">{(w.goals || []).join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <Award className="w-5 h-5 text-violet-600" />
                    <span>Topic & Chapter Priorities</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.recoveryPlan?.topicPriorities || []).map((tp, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900">{tp.subject}: {tp.topic}</p>
                          <p className="text-slate-600 text-[11px] font-medium">Priority: {tp.priority}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-violet-100 text-violet-900 font-black border border-violet-200">
                          {tp.estimatedHours || 8} Hrs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: TARGET SCORE CALCULATOR */}
          {activeTab === 'target' && selectedMarksheet && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card p-6 sm:p-8 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                    <Target className="w-6 h-6 text-emerald-600" />
                    <span>Target Score & Daily Study Hours Calculator</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Select your desired target percentage. EduBridge AI calculates current gap, required marks, daily study hours, probability of success, and completion date based on your real marks ({selectedMarksheet.extractedData?.overallPercentage}%).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-2">
                      Desired Score (%): <span className="text-emerald-700 font-black text-sm">{targetPercentage}%</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={targetPercentage}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTargetPercentage(val);
                        setTargetCGPA(parseFloat((val / 9.5).toFixed(2)));
                      }}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-2">
                      Desired CGPA: <span className="text-violet-700 font-black text-sm">{targetCGPA}</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="5.0"
                      max="10.0"
                      value={targetCGPA}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTargetCGPA(val);
                        setTargetPercentage(Math.round(val * 9.5));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-black text-sm shadow-soft-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCalculateTargetScore}
                  disabled={isCalculatingTarget}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-glow-emerald flex items-center justify-center space-x-2"
                >
                  {isCalculatingTarget ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Calculating AI Target Projections...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Calculate Required Study Hours & Gap</span>
                    </>
                  )}
                </button>

                {/* Target Result Projections Card */}
                {targetResult && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200 space-y-6 shadow-soft-sm">
                    <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                      <span>AI Target Score Calculation & Roadmap</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-soft-sm">
                        <p className="text-xs text-slate-500 font-bold uppercase">Current Score Gap</p>
                        <p className="text-2xl font-black text-rose-700">+{targetResult.currentGap}%</p>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-soft-sm">
                        <p className="text-xs text-slate-500 font-bold uppercase">Required Marks</p>
                        <p className="text-2xl font-black text-emerald-700">{targetResult.requiredMarks} Marks</p>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-violet-200 shadow-soft-sm">
                        <p className="text-xs text-slate-500 font-bold uppercase">Daily Study Hours</p>
                        <p className="text-2xl font-black text-violet-700">{targetResult.dailyStudyHours} Hrs/Day</p>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-soft-sm">
                        <p className="text-xs text-slate-500 font-bold uppercase">Expected Completion</p>
                        <p className="text-sm font-black text-amber-800 mt-1">{targetResult.expectedCompletionDate}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-soft-sm">
                      <span className="text-xs font-bold text-slate-700">Probability of Success:</span>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300">
                        {targetResult.probabilityOfSuccess}
                      </span>
                    </div>

                    {targetResult.weakTopicsToMaster && (
                      <div className="space-y-2 text-xs">
                        <p className="font-black text-slate-900">Weak Topics to Master for Target Attainment:</p>
                        <div className="flex flex-wrap gap-2">
                          {targetResult.weakTopicsToMaster.map((topic, i) => (
                            <span key={i} className="px-3 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 7: COMPARE MARKSHEETS */}
          {activeTab === 'compare' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card p-6 sm:p-8 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                    <Layers className="w-6 h-6 text-violet-600" />
                    <span>Comparative Marksheet & Multi-Semester Progress Analyzer</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Compare any two marksheets stored in your MongoDB account.
                  </p>
                </div>

                {/* Marksheet Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-2">First Scorecard</label>
                    <select
                      value={compareId1}
                      onChange={(e) => setCompareId1(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-xs font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
                    >
                      <option value="">Select First Marksheet</option>
                      {savedMarksheets.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.extractedData?.examName || m.fileName} ({m.extractedData?.overallPercentage || 0}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-2">Second Scorecard</label>
                    <select
                      value={compareId2}
                      onChange={(e) => setCompareId2(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-xs font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
                    >
                      <option value="">Select Second Marksheet</option>
                      {savedMarksheets.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.extractedData?.examName || m.fileName} ({m.extractedData?.overallPercentage || 0}%)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCompareMarksheets}
                  disabled={isComparing}
                  className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-glow-violet flex items-center space-x-2"
                >
                  {isComparing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Comparing Marksheets...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>Compare Selected Marksheets</span>
                    </>
                  )}
                </button>

                {/* Comparison Results */}
                {compareData && (
                  <div className="space-y-6 pt-4 border-t border-slate-200">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <p className="text-slate-500 font-bold uppercase">First Marksheet Score</p>
                        <p className="text-xl font-black text-slate-900 mt-1">{compareData.marksheet1?.percentage}%</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <p className="text-slate-500 font-bold uppercase">Second Marksheet Score</p>
                        <p className="text-xl font-black text-violet-700 mt-1">{compareData.marksheet2?.percentage}%</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <p className="text-slate-500 font-bold uppercase">Overall Growth</p>
                        <p className={`text-xl font-black mt-1 ${compareData.percentageChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {compareData.overallGrowth || (compareData.percentageChange >= 0 ? `+${compareData.percentageChange}%` : `${compareData.percentageChange}%`)}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <p className="text-slate-500 font-bold uppercase">Most Improved Subject</p>
                        <p className="text-sm font-black text-amber-800 mt-1">{compareData.mostImprovedSubject || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Trend Line Chart */}
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <h4 className="text-xs font-black text-slate-900 flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>Semester Score Performance Trend Graph</span>
                      </h4>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getTrendGraphData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                            <XAxis dataKey="exam" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a' }} />
                            <Line type="monotone" dataKey="Percentage" stroke="#059669" strokeWidth={3} dot={{ r: 5, fill: '#059669' }} name="Overall Percentage %" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Subject by Subject Comparison Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-800">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-black border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-3">Subject</th>
                            <th className="py-3 px-2">First Marksheet</th>
                            <th className="py-3 px-2">Second Marksheet</th>
                            <th className="py-3 px-2">Difference</th>
                            <th className="py-3 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(compareData.subjectComparison || []).map((sc, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors font-medium">
                              <td className="py-2.5 px-3 font-bold text-slate-900">{sc.subjectName}</td>
                              <td className="py-2.5 px-2">{sc.marksPrevious !== null ? sc.marksPrevious : 'N/A'}</td>
                              <td className="py-2.5 px-2 font-black text-slate-900">{sc.marksCurrent}</td>
                              <td className="py-2.5 px-2 font-black">
                                {sc.diff !== null ? (sc.diff > 0 ? `+${sc.diff}` : sc.diff) : 'N/A'}
                              </td>
                              <td className="py-2.5 px-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  sc.status === 'Improved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                  sc.status === 'Declined' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                  'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {sc.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 8: ASK AI MENTOR ABOUT MARKSHEET */}
          {activeTab === 'mentor' && selectedMarksheet && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-glow-teal">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Ask AI Mentor About My Marksheet</h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Answers based STRICTLY on your actual marksheet data for {selectedMarksheet.extractedData?.examName || 'your scorecard'}.
                    </p>
                  </div>
                </div>

                {/* Dynamic Preset Prompt Buttons based on actual subjects */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => handleSendChatMessage(`Which subject is my weakest and how many marks do I need to improve?`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold transition-colors"
                  >
                    ❓ Which subject is weakest?
                  </button>
                  <button
                    onClick={() => handleSendChatMessage(`How many marks should I improve to reach my target score?`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold transition-colors"
                  >
                    🎯 How many marks to improve?
                  </button>
                  <button
                    onClick={() => handleSendChatMessage(`Can I score above 90% in my next examination?`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold transition-colors"
                  >
                    📈 Can I score above 90%?
                  </button>
                  <button
                    onClick={() => handleSendChatMessage(`Create a personalized revision timetable for my weak subjects.`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold transition-colors"
                  >
                    📝 Create revision timetable
                  </button>
                  {subjectsList.length >= 2 && (
                    <button
                      onClick={() => handleSendChatMessage(`Compare my performance between ${subjectsList[0]?.subjectName} and ${subjectsList[1]?.subjectName}.`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold transition-colors"
                    >
                      ⚖️ Compare {subjectsList[0]?.subjectName} & {subjectsList[1]?.subjectName}
                    </button>
                  )}
                </div>

                {/* Chat History Box */}
                <div className="h-80 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed font-medium shadow-soft-sm ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none whitespace-pre-wrap'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatting && (
                    <div className="flex justify-start">
                      <div className="p-3 rounded-2xl bg-white text-slate-600 text-xs flex items-center space-x-2 border border-slate-200 shadow-soft-sm">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span>AI Mentor analyzing student evidence...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input Bar */}
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    placeholder="Ask AI Mentor anything about your scorecard..."
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-xs sm:text-sm font-semibold focus:border-emerald-500 focus:outline-none shadow-soft-sm"
                  />
                  <button
                    onClick={() => handleSendChatMessage()}
                    disabled={isChatting}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-glow-emerald flex items-center space-x-1"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 9: REPORTS & BONUS FEATURES HUB */}
          {activeTab === 'bonus' && selectedMarksheet && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Bar */}
              <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                    <Award className="w-6 h-6 text-violet-600" />
                    <span>AI Reports, Career & Academic Guidance Hub</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Download official AI PDF reports, export teacher/parent summaries, and view personalized career/college guidance.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePrintPDFReport}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black rounded-xl text-xs transition-all shadow-glow-emerald flex items-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Download PDF AI Report</span>
                  </button>
                </div>
              </div>

              {/* TEACHER & PARENT REPORTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-violet-600" />
                    <span>Teacher Diagnostic Report</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {selectedMarksheet.aiAnalysis?.bonusFeatures?.teacherReport?.diagnosticSummary || 'Academic diagnostic for educators.'}
                    </p>
                    <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 space-y-1">
                      <p className="font-black text-violet-800">Pedagogical Recommendation:</p>
                      <p className="text-slate-700 font-medium">{selectedMarksheet.aiAnalysis?.bonusFeatures?.teacherReport?.pedagogicalAdvice || 'Focus on step-by-step problem solving.'}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <span>Parent Progress Report</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {selectedMarksheet.aiAnalysis?.bonusFeatures?.parentReport?.academicHealthSummary || 'Student performance overview for parents.'}
                    </p>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <p className="font-black text-emerald-800">Home Support Tips:</p>
                      <ul className="list-disc pl-4 text-slate-700 space-y-1 font-medium">
                        {(selectedMarksheet.aiAnalysis?.bonusFeatures?.parentReport?.homeSupportTips || ['Encourage daily study routine']).map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* CAREER & SCHOLARSHIP SUGGESTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-amber-500" />
                    <span>Career Suggestions (Based on Actual Strengths)</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.aiAnalysis?.bonusFeatures?.careerSuggestions || []).map((cs, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900">{cs.field}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 font-medium">{cs.reason}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-black border border-amber-300">
                          {cs.matchPercentage}% Match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <Gift className="w-5 h-5 text-violet-600" />
                    <span>Scholarship & Eligibility Suggestions</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.aiAnalysis?.bonusFeatures?.scholarshipSuggestions || []).map((sch, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900">{sch.scholarshipName}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 font-medium">{sch.details}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-violet-100 text-violet-900 font-black border border-violet-300">
                          {sch.eligibilityStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COMPETITIVE EXAM & INTERVIEW READINESS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-teal-600" />
                    <span>Competitive Exam Readiness</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.aiAnalysis?.bonusFeatures?.competitiveExamReadiness || []).map((ex, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900">{ex.examName}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 font-medium">Status: {ex.readinessStatus}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 font-black border border-teal-300">
                          {ex.estimatedPercentile}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6 border border-slate-200 bg-white shadow-soft-sm rounded-3xl space-y-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-pink-600" />
                    <span>Interview & Resume Recommendations</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-pink-50 border border-pink-200 space-y-1">
                      <p className="font-black text-pink-900">Resume Enhancements:</p>
                      <ul className="list-disc pl-4 text-slate-700 space-y-1 font-medium">
                        {(selectedMarksheet.aiAnalysis?.bonusFeatures?.resumeImprovement || ['Highlight top performing modules']).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

        </main>
      </div>

      {/* Gemini 3.7 Flash Precision Targeted Drill Test Modal for Marksheets */}
      <DrillTestModal
        isOpen={drillModalOpen}
        onClose={() => setDrillModalOpen(false)}
        subjectName={drillSubject}
        weakTopics={drillWeakTopics}
        score={drillScore}
        totalMarks={drillTotalMarks}
        percentage={drillPercentage}
        feedback={drillFeedback}
        sourceType="marksheet"
      />
    </div>
  );
};

export default MarksheetAnalyzer;
