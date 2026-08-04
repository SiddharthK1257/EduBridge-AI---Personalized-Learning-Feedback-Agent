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

const MarksheetAnalyzer = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Navigation Tabs: 'upload' | 'validate' | 'dashboard' | 'deep_breakdown' | 'recovery' | 'target' | 'compare' | 'mentor' | 'bonus'
  const [activeTab, setActiveTab] = useState('upload');
  
  // Saved Marksheets list from MongoDB
  const [savedMarksheets, setSavedMarksheets] = useState([]);
  const [selectedMarksheet, setSelectedMarksheet] = useState(null);
  
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 relative">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Hero Header */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/20 shadow-2xl overflow-hidden print:hidden">
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI-Powered Multimodal Marksheet Engine</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  AI Marksheet <span className="gradient-text">Analyzer</span>
                </h1>
                <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                  Upload your scorecard for evidence-based OCR extraction, dynamic score calculation, zero-hallucination analysis, and 1-click recovery plans using ONLY your real marks.
                </p>
              </div>

              {/* Saved Marksheet Selector Dropdown */}
              {savedMarksheets.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 backdrop-blur-md">
                  <span className="text-xs text-slate-400 font-medium px-1">Active Record:</span>
                  <select
                    value={selectedMarksheet?._id || ''}
                    onChange={(e) => {
                      const found = savedMarksheets.find(m => m._id === e.target.value);
                      if (found) {
                        setSelectedMarksheet(found);
                        setActiveTab('dashboard');
                      }
                    }}
                    className="bg-slate-950 text-white text-xs font-medium rounded-xl px-3 py-2 border border-indigo-500/30 focus:outline-none focus:border-indigo-400"
                  >
                    {savedMarksheets.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.extractedData?.examName || m.fileName} ({m.extractedData?.overallPercentage || 'N/A'}%)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 shadow-glow-indigo shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload New</span>
                  </button>
                </div>
              )}
            </div>

            {/* Supported Formats Pills */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Supported Formats:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700">PDF</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-emerald-300 border border-slate-700">JPG / JPEG</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">PNG</span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="font-semibold text-slate-300">Evidence Standards:</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">100% Dynamic Math</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">Zero Hallucinations</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">MongoDB History Saved</span>
            </div>
          </div>

          {/* Stepper Pipeline Indicator */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/20 space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 flex items-center space-x-1">
                <Brain className="w-4 h-4" />
                <span>Evidence-Based AI Pipeline Workflow</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Verified Data Pipeline • Strict Evidence Rules</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[10px]">
              <div className={`p-2 rounded-xl border transition-all ${activeTab === 'upload' ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <span className="block text-indigo-400 font-bold">1. Upload</span> File Input
              </div>
              <div className={`p-2 rounded-xl border transition-all ${isUploading ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : extractedData ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <span className="block text-emerald-400 font-bold">2. OCR Extract</span> Vision Extraction
              </div>
              <div className={`p-2 rounded-xl border transition-all ${activeTab === 'validate' ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold' : extractedData ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <span className="block text-cyan-400 font-bold">3. Verify</span> Student Confirmation
              </div>
              <div className={`p-2 rounded-xl border transition-all ${selectedMarksheet ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <span className="block text-amber-400 font-bold">4. Store</span> MongoDB Save
              </div>
              <div className={`p-2 rounded-xl border transition-all ${selectedMarksheet ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <span className="block text-purple-400 font-bold">5. Fetch History</span> Merge Database
              </div>
              <div className={`p-2 rounded-xl border transition-all ${selectedMarksheet ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <span className="block text-indigo-400 font-bold">6. Dynamic Math</span> Score Formulas
              </div>
              <div className={`p-2 rounded-xl border transition-all ${activeTab === 'dashboard' && selectedMarksheet ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <span className="block text-teal-400 font-bold">7. AI Insights</span> Deep Analysis
              </div>
              <div className={`p-2 rounded-xl border transition-all ${activeTab === 'recovery' && selectedMarksheet ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <span className="block text-pink-400 font-bold">8. Recovery</span> Action Plan
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800 print:hidden">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>1. Upload OCR</span>
            </button>

            <button
              onClick={() => setActiveTab('validate')}
              disabled={!extractedData}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                activeTab === 'validate'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : extractedData
                  ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>2. Verify Data</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : selectedMarksheet
                  ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>3. AI Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('deep_breakdown')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                activeTab === 'deep_breakdown'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : selectedMarksheet
                  ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>4. Subject & Chapter Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab('recovery')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                activeTab === 'recovery'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : selectedMarksheet
                  ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>5. Recovery Plan</span>
            </button>

            <button
              onClick={() => setActiveTab('target')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                activeTab === 'target'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : selectedMarksheet
                  ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Target className="w-4 h-4 text-cyan-400" />
              <span>6. Target Score</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              disabled={savedMarksheets.length < 2}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : savedMarksheets.length >= 2
                  ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>7. Compare Marksheets</span>
            </button>

            <button
              onClick={() => setActiveTab('mentor')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                activeTab === 'mentor'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : selectedMarksheet
                  ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Bot className="w-4 h-4 text-teal-400" />
              <span>8. Ask AI Mentor</span>
            </button>

            <button
              onClick={() => setActiveTab('bonus')}
              disabled={!selectedMarksheet}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${
                activeTab === 'bonus'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : selectedMarksheet
                  ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Award className="w-4 h-4 text-pink-400" />
              <span>9. Reports & Career Hub</span>
            </button>
          </div>

          {/* TAB 1: UPLOAD & OCR SCAN */}
          {activeTab === 'upload' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card p-6 sm:p-10 border border-slate-800 rounded-3xl text-center space-y-6">
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-slate-900/40 hover:bg-slate-900/80 p-8 sm:p-12 rounded-3xl transition-all cursor-pointer group flex flex-col items-center justify-center space-y-4"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-glow-indigo">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-white">
                      Drag & Drop your Marksheet or Scorecard here
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Supports PDF, JPG, JPEG, and PNG (Maximum file size: 10 MB)
                    </p>
                  </div>
                  <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors">
                    Browse Files from Device
                  </button>
                </div>

                {uploadError && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Upload File Preview */}
                {uploadFile && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                    <div className="flex items-center space-x-3">
                      {filePreviewUrl ? (
                        <img src={filePreviewUrl} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-slate-700" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          FILE
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white truncate max-w-xs">{uploadFile.name}</p>
                        <p className="text-xs text-slate-400">
                          {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadFile.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <button
                        onClick={() => setUploadFile(null)}
                        className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Remove File"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleUploadAndOCR}
                        disabled={isUploading}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-glow-indigo flex items-center justify-center space-x-2"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Scanning OCR ({uploadProgress}%)...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Extract & Verify Marksheet</span>
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
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">
                    {extractedData.lowConfidence || extractedData.requiresManualConfirmation
                      ? '⚠️ OCR Confidence Low — Manual Confirmation Required'
                      : 'Step 2: Verify & Edit Extracted Scorecard Data'}
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed mt-0.5">
                    Review your extracted subject names and marks below. You can edit any subject, adjust marks, or click "Add Subject Row" to add missing subjects before proceeding. Overall percentage is calculated dynamically as <span className="underline font-mono font-bold">(sum of obtained marks ÷ total max marks) × 100</span>.
                  </p>
                </div>
              </div>

              {/* Metadata Fields */}
              <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span>Student & Institution Metadata</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Student Name</label>
                    <input
                      type="text"
                      value={extractedData.studentName || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, studentName: e.target.value })}
                      placeholder="Student Name"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Roll / Seat Number</label>
                    <input
                      type="text"
                      value={extractedData.rollNumber || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, rollNumber: e.target.value })}
                      placeholder="Roll Number"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Exam Name</label>
                    <input
                      type="text"
                      value={extractedData.examName || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, examName: e.target.value })}
                      placeholder="e.g. CBSE 12 / B.Tech Sem 4"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Board / University</label>
                    <input
                      type="text"
                      value={extractedData.board || extractedData.university || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, board: e.target.value, university: e.target.value })}
                      placeholder="Board / University"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">College / School</label>
                    <input
                      type="text"
                      value={extractedData.college || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, college: e.target.value })}
                      placeholder="College Name"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Class / Semester</label>
                    <input
                      type="text"
                      value={extractedData.classGrade || extractedData.semester || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, classGrade: e.target.value })}
                      placeholder="Class or Semester"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Overall Percentage (%) [Auto-Calculated]</label>
                    <input
                      type="number"
                      readOnly
                      value={extractedData.overallPercentage || 0}
                      className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-emerald-400 font-extrabold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Calculated CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      readOnly
                      value={extractedData.cgpa || 0}
                      className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-2 text-indigo-300 font-extrabold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Subject Marks Editable Table */}
              <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <span>Parsed Subjects & Marks Breakdown</span>
                  </h3>

                  <button
                    onClick={handleAddSubject}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
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
                    <tbody className="divide-y divide-slate-800/80">
                      {(extractedData.subjects || []).map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={sub.subjectName}
                              onChange={(e) => handleSubjectChange(idx, 'subjectName', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:border-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <input
                              type="text"
                              value={sub.subjectCode || ''}
                              onChange={(e) => handleSubjectChange(idx, 'subjectCode', e.target.value)}
                              className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 focus:border-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              value={sub.obtainedMarks}
                              onChange={(e) => handleSubjectChange(idx, 'obtainedMarks', e.target.value)}
                              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-bold text-center focus:border-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              value={sub.maxMarks || 100}
                              onChange={(e) => handleSubjectChange(idx, 'maxMarks', e.target.value)}
                              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-400 text-center focus:border-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <input
                              type="text"
                              value={sub.grade || ''}
                              onChange={(e) => handleSubjectChange(idx, 'grade', e.target.value)}
                              className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-amber-300 font-bold text-center uppercase focus:border-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              sub.confidence === 'Uncertain' || sub.confidence === 'Low'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {sub.confidence || 'High'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              onClick={() => handleRemoveSubject(idx)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm border border-slate-700 transition-colors"
                >
                  Back to Upload
                </button>
                <button
                  onClick={handleRunDeepAnalysis}
                  disabled={isAnalyzing}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-bold rounded-xl text-sm transition-all shadow-glow-indigo flex items-center space-x-2"
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
              {/* Key Metric Hero Cards - Calculated Strictly from Uploaded Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Performance Rating */}
                <div className="glass-card p-5 border border-slate-800 rounded-3xl flex items-center space-x-4 bg-gradient-to-br from-indigo-900/30 via-slate-900 to-slate-950">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Performance Rating</p>
                    <p className="text-xl font-black text-white">
                      {selectedMarksheet.aiAnalysis?.performanceRating || 'Good'}
                    </p>
                    <p className="text-[11px] text-indigo-400 font-semibold mt-0.5">
                      Risk Level: {selectedMarksheet.aiAnalysis?.riskLevel || 'Low'}
                    </p>
                  </div>
                </div>

                {/* Overall Percentage & Marks */}
                <div className="glass-card p-5 border border-slate-800 rounded-3xl flex items-center space-x-4 bg-gradient-to-br from-emerald-900/30 via-slate-900 to-slate-950">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Overall Percentage</p>
                    <p className="text-2xl font-black text-white">
                      {selectedMarksheet.extractedData?.overallPercentage || selectedMarksheet.aiAnalysis?.overallPercentage || '0'}%
                    </p>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                      Marks: {totalObtainedMarks} / {totalMaxMarks} (Avg: {averageMarksValue})
                    </p>
                  </div>
                </div>

                {/* Exam Readiness Score */}
                <div className="glass-card p-5 border border-slate-800 rounded-3xl flex items-center space-x-4 bg-gradient-to-br from-amber-900/30 via-slate-900 to-slate-950">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Exam Readiness</p>
                    <p className="text-2xl font-black text-white">
                      {selectedMarksheet.aiAnalysis?.examReadinessScore || 70}/100
                    </p>
                    <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                      AI Confidence: {selectedMarksheet.aiAnalysis?.confidenceScore || 'High'}
                    </p>
                  </div>
                </div>

                {/* Learning Gap Score */}
                <div className="glass-card p-5 border border-slate-800 rounded-3xl flex items-center space-x-4 bg-gradient-to-br from-rose-900/30 via-slate-900 to-slate-950">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Learning Gap Score</p>
                    <p className="text-2xl font-black text-white">
                      {selectedMarksheet.aiAnalysis?.learningGapScore || 30}%
                    </p>
                    <p className="text-[11px] text-rose-400 font-semibold mt-0.5">
                      Potential Gain: +{selectedMarksheet.aiAnalysis?.estimatedImprovementPotential || 15}%
                    </p>
                  </div>
                </div>

              </div>

              {/* Strongest & Weakest Subject Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Strongest Subject</span>
                    <span className="text-lg font-extrabold text-white">{topSubject ? topSubject.subjectName : 'N/A'}</span>
                  </div>
                  <span className="text-xl font-black text-emerald-400">{topSubject ? `${topSubject.obtainedMarks}/${topSubject.maxMarks || 100}` : ''}</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-rose-400 font-bold uppercase tracking-wider block">Weakest Subject</span>
                    <span className="text-lg font-extrabold text-white">{bottomSubject ? bottomSubject.subjectName : 'N/A'}</span>
                  </div>
                  <span className="text-xl font-black text-rose-400">{bottomSubject ? `${bottomSubject.obtainedMarks}/${bottomSubject.maxMarks || 100}` : ''}</span>
                </div>
              </div>

              {/* CONTINUOUS AI AUTO-UPDATE BANNER */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 text-indigo-200 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <Brain className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white flex items-center space-x-2">
                      <span>Evidence-Based Estimation & Strict Anti-Hallucination Policy</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </p>
                    <p className="text-indigo-300/90 leading-relaxed mt-0.5">
                      <span className="font-semibold text-white">Assumptions Used:</span> {selectedMarksheet.aiAnalysis?.assumptionsUsed || 'Calculated strictly from verified marksheet data, MongoDB historical attempts, and study velocity.'}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-[11px] shrink-0 flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Real-Time Dynamic Score Calculation</span>
                </div>
              </div>

              {/* EVIDENCE-BASED AI RECOMMENDATIONS */}
              <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <span>Evidence-Based AI Recommendations</span>
                  </h3>
                  <span className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full font-medium">
                    Strict Verified Evidence • Clear Reasoning (Why & How)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedMarksheet.aiAnalysis?.evidenceBasedRecommendations && selectedMarksheet.aiAnalysis.evidenceBasedRecommendations.length > 0
                    ? selectedMarksheet.aiAnalysis.evidenceBasedRecommendations
                    : (selectedMarksheet.extractedData?.subjects || []).map(s => ({
                        subject: s.subjectName,
                        evidence: `Semester Marksheet Score: ${s.obtainedMarks}/${s.maxMarks || 100}`,
                        confidence: s.confidence || 'High',
                        reason: (s.obtainedMarks / (s.maxMarks || 100)) < 0.65 ? `Score is below the 65% benchmark.` : `Maintained steady performance above 65%.`,
                        recommendedStudy: [s.subjectName + ' Numericals', s.subjectName + ' Formulas'],
                        action: (s.obtainedMarks / (s.maxMarks || 100)) < 0.65 ? `Dedicate 8 hours to core numerical & theory drills in ${s.subjectName}.` : `Practice 2 hours of weekly spaced recall in ${s.subjectName}.`,
                        expectedImprovement: (s.obtainedMarks / (s.maxMarks || 100)) < 0.65 ? '+12 Marks' : '+5 Marks',
                        estimatedStudyHours: (s.obtainedMarks / (s.maxMarks || 100)) < 0.65 ? 8 : 3,
                        priority: (s.obtainedMarks / (s.maxMarks || 100)) < 0.65 ? 'Critical' : 'Medium'
                      }))
                  ).map((rec, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Subject: {rec.subject}</span>
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            rec.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            rec.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            Priority: {rec.priority}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                            Confidence: {rec.confidence}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                        <p className="text-[11px] font-semibold text-slate-400">Evidence Used:</p>
                        <p className="text-xs text-indigo-300 font-mono">{rec.evidence}</p>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-amber-300">Reason (Why generated):</p>
                        <p className="text-slate-300 leading-relaxed">{rec.reason}</p>
                      </div>

                      {rec.recommendedStudy && rec.recommendedStudy.length > 0 && (
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-cyan-300">Recommended Study Focus:</p>
                          <div className="flex flex-wrap gap-1">
                            {rec.recommendedStudy.map((item, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-200 text-[10px]">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-emerald-400">Recommended Action & Target:</p>
                          <span className="text-[10px] text-emerald-300 font-semibold">{rec.expectedImprovement} • {rec.estimatedStudyHours} Hours</span>
                        </div>
                        <p className="text-slate-200">{rec.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HISTORICAL STUDENT DATA COMPARISON FROM MONGODB */}
              <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span>Historical Student Data Comparison (MongoDB Merged)</span>
                  </h3>
                  <span className="text-xs text-slate-400">Previous vs Current Performance Analysis</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="text-slate-400 font-medium">Previous Semester</p>
                    <p className="text-sm font-black text-white truncate">
                      {selectedMarksheet.aiAnalysis?.historicalComparison?.previousSemesterScore || 'Insufficient verified data.'}
                    </p>
                    <p className="text-[10px] text-slate-500">From MongoDB History</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="text-slate-400 font-medium">Current Marksheet Score</p>
                    <p className="text-sm font-black text-emerald-400 truncate">
                      {selectedMarksheet.aiAnalysis?.historicalComparison?.currentSemesterScore || `${selectedMarksheet.extractedData?.overallPercentage}%`}
                    </p>
                    <p className="text-[10px] text-slate-500">Current Validated Scorecard</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="text-slate-400 font-medium">Previous Mock Tests Avg</p>
                    <p className="text-sm font-black text-indigo-300 truncate">
                      {selectedMarksheet.aiAnalysis?.historicalComparison?.previousMockTestAverage || 'Insufficient verified data.'}
                    </p>
                    <p className="text-[10px] text-slate-500">From Mock Test History</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="text-slate-400 font-medium">Growth & Consistency</p>
                    <p className="text-sm font-black text-amber-300 truncate">
                      {selectedMarksheet.aiAnalysis?.historicalComparison?.growthTrend || 'Insufficient verified data.'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Consistency: {selectedMarksheet.aiAnalysis?.historicalComparison?.consistencyScore || 'Insufficient verified data.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* VISUAL ANALYTICS CHARTS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Subject Marks Bar Chart */}
                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    <span>Subject Marks vs Maximum Marks</span>
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getBarChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" />
                        <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                        <Bar dataKey="Obtained" fill="#6366f1" radius={[6, 6, 0, 0]} name="Obtained Marks" />
                        <Bar dataKey="Max" fill="#1e293b" radius={[6, 6, 0, 0]} name="Max Marks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subject Competency Radar Chart */}
                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <span>Subject Competency & Mastery Spiderweb</span>
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarChartData()}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                        <Radar name="Performance Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                        <Radar name="Confidence Level" dataKey="confidence" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
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
              <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    <span>Subject Analysis Breakdown</span>
                  </h3>
                  <span className="text-xs text-slate-400">Ranked by Obtained Percentage</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
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
                    <tbody className="divide-y divide-slate-800/80">
                      {(selectedMarksheet.aiAnalysis?.subjectAnalysis || []).map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-white">{sub.subjectName}</td>
                          <td className="py-3 px-2">{sub.marks} / {sub.maxMarks || 100}</td>
                          <td className="py-3 px-2 font-bold text-indigo-300">{sub.percentage}%</td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                              {sub.grade || 'B'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-400">{sub.difficulty || 'Medium'}</td>
                          <td className="py-3 px-2 font-mono font-bold text-emerald-400">#{sub.rank || idx + 1}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              sub.performanceLevel === 'Mastery' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              sub.performanceLevel === 'Proficient' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                              sub.performanceLevel === 'Developing' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {sub.performanceLevel}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-300">
                            {(sub.estimatedChapterWeaknesses || [sub.subjectName + ' Chapter 1 (AI Estimate)']).map((ch, cidx) => (
                              <span key={cidx} className="inline-block bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] mr-1 mb-1">
                                {ch}
                              </span>
                            ))}
                          </td>
                          <td className="py-3 px-2 font-medium">{sub.estimatedStudyHours} Hours</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => navigate('/generate-test')}
                              className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-[11px] font-semibold border border-indigo-500/30 transition-all inline-flex items-center space-x-1"
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
              <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <span>Topic-Wise Analysis (Marksheet + MongoDB Mock Tests)</span>
                  </h3>
                  <span className="text-xs text-slate-400">Topic Accuracy & Weak Concepts</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {(selectedMarksheet.aiAnalysis?.topicAnalysis && selectedMarksheet.aiAnalysis.topicAnalysis.length > 0
                    ? selectedMarksheet.aiAnalysis.topicAnalysis
                    : (selectedMarksheet.extractedData?.subjects || []).map(s => ({
                        topicName: s.subjectName + ' Core Topics',
                        subjectName: s.subjectName,
                        topicAccuracy: 'Insufficient verified data.',
                        weakConcepts: [s.subjectName + ' Numericals'],
                        repeatedErrors: [],
                        retentionScore: 'Insufficient verified data.',
                        confidence: 'Medium',
                        hasMockTestData: false
                      }))
                  ).map((tp, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{tp.topicName}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {tp.subjectName}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Topic Accuracy:</span>
                          <span className="font-bold text-cyan-300">{tp.topicAccuracy}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Retention Score:</span>
                          <span className="font-bold text-indigo-300">{tp.retentionScore}</span>
                        </div>
                      </div>

                      {tp.weakConcepts && tp.weakConcepts.length > 0 && (
                        <div className="space-y-1">
                          <span className="font-semibold text-rose-300 text-[11px]">Weak Concepts:</span>
                          <p className="text-slate-300 text-xs">{tp.weakConcepts.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* CHAPTER ANALYSIS SECTION */}
              <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <span>Chapter-Wise Performance & Inferred Chapter Weaknesses</span>
                  </h3>
                  <span className="text-xs text-purple-300 font-mono bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                    AI Syllabus Inference (Clearly Marked)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
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
                    <tbody className="divide-y divide-slate-800/80">
                      {(selectedMarksheet.aiAnalysis?.chapterAnalysis && selectedMarksheet.aiAnalysis.chapterAnalysis.length > 0
                        ? selectedMarksheet.aiAnalysis.chapterAnalysis
                        : (selectedMarksheet.extractedData?.subjects || []).map(s => ({
                            chapterName: s.subjectName + ' Chapter 1 (AI Estimate)',
                            subjectName: s.subjectName,
                            accuracy: 'Insufficient verified data.',
                            questionsAttempted: 'Insufficient verified data.',
                            correctCount: 'Insufficient verified data.',
                            wrongCount: 'Insufficient verified data.',
                            studyTime: 'Insufficient verified data.'
                          }))
                      ).map((ch, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-white flex items-center space-x-2">
                            <span>{ch.chapterName}</span>
                            {ch.chapterName.includes('(AI Estimate)') && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">AI Estimate</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-slate-400">{ch.subjectName}</td>
                          <td className="py-3 px-2 font-bold text-purple-300">{ch.accuracy}</td>
                          <td className="py-3 px-2">{ch.questionsAttempted}</td>
                          <td className="py-3 px-2 text-emerald-400 font-bold">{ch.correctCount}</td>
                          <td className="py-3 px-2 text-rose-400 font-bold">{ch.wrongCount}</td>
                          <td className="py-3 px-2 text-slate-300 font-medium">{ch.studyTime}</td>
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
              <div className="glass-card p-6 border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Dynamic 1-Click Academic Recovery Plan</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white">
                    Personalized 7-Day, 30-Day & 90-Day Roadmap
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Recovery Score: <span className="text-amber-400 font-bold">{selectedMarksheet.recoveryPlan?.recoveryScore || 75}/100</span> • Estimated Total Hours: <span className="text-white font-bold">{selectedMarksheet.recoveryPlan?.estimatedTotalStudyHours || 40} Hours</span> • Expected Improvement: <span className="text-emerald-400 font-bold">{selectedMarksheet.recoveryPlan?.expectedImprovement || '+15% Gain'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleExportCalendar}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-semibold rounded-xl text-xs transition-all flex items-center space-x-1.5"
                  >
                    <CalendarDays className="w-4 h-4 text-indigo-400" />
                    <span>Export to Google Calendar (.ics)</span>
                  </button>

                  <button
                    onClick={handleSyncToStudyPlanner}
                    disabled={isSyncing}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-glow-indigo flex items-center space-x-2 shrink-0"
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
              <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>7-Day Intensive Action Plan (Weakest Subjects First)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(selectedMarksheet.recoveryPlan?.plan7Days || []).map((dayPlan, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">Day {dayPlan.day || idx + 1}: {dayPlan.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                          {dayPlan.hours || 3} Hrs
                        </span>
                      </div>
                      <p className="text-xs text-amber-300 font-semibold">Focus: {dayPlan.focus}</p>
                      <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc">
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
                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span>Daily Study Schedule & Time Slots</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.recoveryPlan?.dailySchedule || []).map((ds, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-indigo-300 font-mono">{ds.timeSlot}</p>
                          <p className="text-white font-medium mt-0.5">{ds.activity}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-bold border border-slate-700">
                          {ds.focusSubject}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <CalendarDays className="w-5 h-5 text-emerald-400" />
                    <span>Revision Days & Mock Test Schedule</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-300 mb-2">Revision Calendar:</p>
                      <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
                        {(selectedMarksheet.recoveryPlan?.revisionCalendar || []).map((rc, idx) => (
                          <li key={idx}>{rc}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <p className="font-bold text-slate-300 mb-2">Scheduled Mock Tests:</p>
                      <ul className="space-y-1.5 list-disc pl-4 text-emerald-300 font-medium">
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
                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <span>30-Day Monthly Targets</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.recoveryPlan?.plan30Days || []).map((w, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                          W{w.week || idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-white">{w.focus}</p>
                          <p className="text-slate-400 mt-0.5">{(w.goals || []).join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Award className="w-5 h-5 text-purple-400" />
                    <span>Topic & Chapter Priorities</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.recoveryPlan?.topicPriorities || []).map((tp, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{tp.subject}: {tp.topic}</p>
                          <p className="text-slate-400 text-[11px]">Priority: {tp.priority}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold">
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
              <div className="glass-card p-6 sm:p-8 border border-slate-800 rounded-3xl space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                    <Target className="w-6 h-6 text-emerald-400" />
                    <span>Target Score & Daily Study Hours Calculator</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Select your desired target percentage. EduBridge AI calculates current gap, required marks, daily study hours, probability of success, and completion date based on your real marks ({selectedMarksheet.extractedData?.overallPercentage}%).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Desired Score (%): <span className="text-emerald-400 font-extrabold text-sm">{targetPercentage}%</span>
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
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Desired CGPA: <span className="text-indigo-400 font-extrabold text-sm">{targetCGPA}</span>
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
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCalculateTargetScore}
                  disabled={isCalculatingTarget}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-glow-indigo flex items-center justify-center space-x-2"
                >
                  {isCalculatingTarget ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Calculating AI Target Projections...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Calculate Required Study Hours & Gap</span>
                    </>
                  )}
                </button>

                {/* Target Result Projections Card */}
                {targetResult && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-6">
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <span>AI Target Score Calculation & Roadmap</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <p className="text-xs text-slate-400">Current Score Gap</p>
                        <p className="text-2xl font-black text-rose-400">+{targetResult.currentGap}%</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <p className="text-xs text-slate-400">Required Marks</p>
                        <p className="text-2xl font-black text-emerald-400">{targetResult.requiredMarks} Marks</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <p className="text-xs text-slate-400">Daily Study Hours</p>
                        <p className="text-2xl font-black text-indigo-400">{targetResult.dailyStudyHours} Hrs/Day</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <p className="text-xs text-slate-400">Expected Completion</p>
                        <p className="text-sm font-bold text-amber-300 mt-1">{targetResult.expectedCompletionDate}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Probability of Success:</span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                        {targetResult.probabilityOfSuccess}
                      </span>
                    </div>

                    {targetResult.weakTopicsToMaster && (
                      <div className="space-y-2 text-xs">
                        <p className="font-bold text-slate-300">Weak Topics to Master for Target Attainment:</p>
                        <div className="flex flex-wrap gap-2">
                          {targetResult.weakTopicsToMaster.map((topic, i) => (
                            <span key={i} className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
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
              <div className="glass-card p-6 sm:p-8 border border-slate-800 rounded-3xl space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                    <Layers className="w-6 h-6 text-purple-400" />
                    <span>Comparative Marksheet & Multi-Semester Progress Analyzer</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Compare any two marksheets stored in your MongoDB account.
                  </p>
                </div>

                {/* Marksheet Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">First Scorecard</label>
                    <select
                      value={compareId1}
                      onChange={(e) => setCompareId1(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs font-medium focus:border-indigo-500 focus:outline-none"
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
                    <label className="block text-xs font-bold text-slate-300 mb-2">Second Scorecard</label>
                    <select
                      value={compareId2}
                      onChange={(e) => setCompareId2(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs font-medium focus:border-indigo-500 focus:outline-none"
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
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-glow-indigo flex items-center space-x-2"
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
                  <div className="space-y-6 pt-4 border-t border-slate-800">
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <p className="text-slate-400">First Marksheet Score</p>
                        <p className="text-xl font-black text-slate-200">{compareData.marksheet1?.percentage}%</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <p className="text-slate-400">Second Marksheet Score</p>
                        <p className="text-xl font-black text-indigo-400">{compareData.marksheet2?.percentage}%</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <p className="text-slate-400">Overall Growth</p>
                        <p className={`text-xl font-black ${compareData.percentageChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {compareData.overallGrowth || (compareData.percentageChange >= 0 ? `+${compareData.percentageChange}%` : `${compareData.percentageChange}%`)}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <p className="text-slate-400">Most Improved Subject</p>
                        <p className="text-sm font-bold text-amber-300 mt-1">{compareData.mostImprovedSubject || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Trend Line Chart */}
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>Semester Score Performance Trend Graph</span>
                      </h4>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getTrendGraphData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="exam" stroke="#94a3b8" fontSize={10} />
                            <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                            <Line type="monotone" dataKey="Percentage" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} name="Overall Percentage %" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Subject by Subject Comparison Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                          <tr>
                            <th className="py-3 px-3">Subject</th>
                            <th className="py-3 px-2">First Marksheet</th>
                            <th className="py-3 px-2">Second Marksheet</th>
                            <th className="py-3 px-2">Difference</th>
                            <th className="py-3 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {(compareData.subjectComparison || []).map((sc, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-white">{sc.subjectName}</td>
                              <td className="py-2.5 px-2">{sc.marksPrevious !== null ? sc.marksPrevious : 'N/A'}</td>
                              <td className="py-2.5 px-2 font-bold text-white">{sc.marksCurrent}</td>
                              <td className="py-2.5 px-2 font-bold">
                                {sc.diff !== null ? (sc.diff > 0 ? `+${sc.diff}` : sc.diff) : 'N/A'}
                              </td>
                              <td className="py-2.5 px-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sc.status === 'Improved' ? 'bg-emerald-500/20 text-emerald-300' :
                                  sc.status === 'Declined' ? 'bg-rose-500/20 text-rose-300' :
                                  'bg-slate-800 text-slate-400'
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
              <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Ask AI Mentor About My Marksheet</h3>
                    <p className="text-xs text-slate-400">
                      Answers based STRICTLY on your actual marksheet data for {selectedMarksheet.extractedData?.examName || 'your scorecard'}.
                    </p>
                  </div>
                </div>

                {/* Dynamic Preset Prompt Buttons based on actual subjects */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => handleSendChatMessage(`Which subject is my weakest and how many marks do I need to improve?`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                  >
                    ❓ Which subject is weakest?
                  </button>
                  <button
                    onClick={() => handleSendChatMessage(`How many marks should I improve to reach my target score?`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                  >
                    🎯 How many marks to improve?
                  </button>
                  <button
                    onClick={() => handleSendChatMessage(`Can I score above 90% in my next examination?`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                  >
                    📈 Can I score above 90%?
                  </button>
                  <button
                    onClick={() => handleSendChatMessage(`Create a personalized revision timetable for my weak subjects.`)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                  >
                    📝 Create revision timetable
                  </button>
                  {subjectsList.length >= 2 && (
                    <button
                      onClick={() => handleSendChatMessage(`Compare my performance between ${subjectsList[0]?.subjectName} and ${subjectsList[1]?.subjectName}.`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                    >
                      ⚖️ Compare {subjectsList[0]?.subjectName} & {subjectsList[1]?.subjectName}
                    </button>
                  )}
                </div>

                {/* Chat History Box */}
                <div className="h-80 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none whitespace-pre-wrap'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatting && (
                    <div className="flex justify-start">
                      <div className="p-3 rounded-2xl bg-slate-900 text-slate-400 text-xs flex items-center space-x-2 border border-slate-800">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
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
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendChatMessage()}
                    disabled={isChatting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-glow-indigo flex items-center space-x-1"
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
              <div className="glass-card p-6 border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                    <Award className="w-6 h-6 text-pink-400" />
                    <span>AI Reports, Career & Academic Guidance Hub</span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Download official AI PDF reports, export teacher/parent summaries, and view personalized career/college guidance.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePrintPDFReport}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-glow-indigo flex items-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / Download PDF AI Report</span>
                  </button>
                </div>
              </div>

              {/* TEACHER & PARENT REPORTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-indigo-400" />
                    <span>Teacher Diagnostic Report</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <p className="text-slate-300 leading-relaxed">
                      {selectedMarksheet.aiAnalysis?.bonusFeatures?.teacherReport?.diagnosticSummary || 'Academic diagnostic for educators.'}
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <p className="font-bold text-indigo-300">Pedagogical Recommendation:</p>
                      <p className="text-slate-400">{selectedMarksheet.aiAnalysis?.bonusFeatures?.teacherReport?.pedagogicalAdvice || 'Focus on step-by-step problem solving.'}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <FileCheck className="w-5 h-5 text-emerald-400" />
                    <span>Parent Progress Report</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <p className="text-slate-300 leading-relaxed">
                      {selectedMarksheet.aiAnalysis?.bonusFeatures?.parentReport?.academicHealthSummary || 'Student performance overview for parents.'}
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <p className="font-bold text-emerald-300">Home Support Tips:</p>
                      <ul className="list-disc pl-4 text-slate-400 space-y-1">
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
                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-amber-400" />
                    <span>Career Suggestions (Based on Actual Strengths)</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.aiAnalysis?.bonusFeatures?.careerSuggestions || []).map((cs, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{cs.field}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">{cs.reason}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold">
                          {cs.matchPercentage}% Match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Gift className="w-5 h-5 text-purple-400" />
                    <span>Scholarship & Eligibility Suggestions</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.aiAnalysis?.bonusFeatures?.scholarshipSuggestions || []).map((sch, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{sch.scholarshipName}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">{sch.details}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold">
                          {sch.eligibilityStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COMPETITIVE EXAM & INTERVIEW READINESS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-cyan-400" />
                    <span>Competitive Exam Readiness</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(selectedMarksheet.aiAnalysis?.bonusFeatures?.competitiveExamReadiness || []).map((ex, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{ex.examName}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">Status: {ex.readinessStatus}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold">
                          {ex.estimatedPercentile}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6 border border-slate-800 rounded-3xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-pink-400" />
                    <span>Interview & Resume Recommendations</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <p className="font-bold text-pink-300">Resume Enhancements:</p>
                      <ul className="list-disc pl-4 text-slate-300 space-y-1">
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
    </div>
  );
};

export default MarksheetAnalyzer;
