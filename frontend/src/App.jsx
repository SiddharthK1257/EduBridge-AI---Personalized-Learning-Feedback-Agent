import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Common Routes
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import Dashboard from './pages/Dashboard';
import TestGenerator from './pages/TestGenerator';
import ActiveTest from './pages/ActiveTest';
import TestResult from './pages/TestResult';
import StudyPlanner from './pages/StudyPlanner';
import Analytics from './pages/Analytics';
import NotificationsPage from './pages/NotificationsPage';
import MarksheetAnalyzer from './pages/MarksheetAnalyzer';

import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marksheet-analyzer" element={<MarksheetAnalyzer />} />
            <Route path="/generate-test" element={<TestGenerator />} />
            <Route path="/test/:testId" element={<ActiveTest />} />
            <Route path="/results/:attemptId" element={<TestResult />} />
            <Route path="/study-planner" element={<StudyPlanner />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
