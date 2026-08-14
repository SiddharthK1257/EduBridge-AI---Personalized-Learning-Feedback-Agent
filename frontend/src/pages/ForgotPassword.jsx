import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, CheckCircle2, AlertCircle, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setMessage('Password reset token generated! You can proceed to reset your password.');
        if (res.data.resetToken) {
          setResetToken(res.data.resetToken);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing password reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Radiant ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-violet-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-glow-emerald group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 font-sans">
              EduBridge<span className="gradient-text">.AI</span>
            </span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Forgot Password</h2>
          <p className="text-sm text-slate-600 mt-1 font-medium">Enter your registered email to receive a password reset token</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-slate-200 bg-white shadow-soft-md">
          
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center space-x-3 text-rose-800 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm space-y-2 font-medium">
              <div className="flex items-center space-x-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>{message}</span>
              </div>
              {resetToken && (
                <div className="pt-3 border-t border-emerald-200 mt-2">
                  <p className="text-xs text-slate-700 font-bold mb-1">Your Generated Reset Token:</p>
                  <code className="block p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-emerald-800 text-xs font-mono select-all break-all font-bold">
                    {resetToken}
                  </code>
                  <Link
                    to={`/reset-password?token=${resetToken}`}
                    className="inline-flex items-center space-x-1.5 mt-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs hover:opacity-95 shadow-glow-emerald transition-all"
                  >
                    <span>Click to Reset Password Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@edubridge.ai"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 shadow-glow-emerald hover:opacity-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Request...</span>
                  </>
                ) : (
                  <span>Send Reset Token</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to Login
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;

