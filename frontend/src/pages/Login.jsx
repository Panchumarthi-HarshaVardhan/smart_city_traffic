import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, LogIn, Info, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState(null);

  const { signIn, signInDemoCitizen, isAuthenticated, isAuthority } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      if (isAuthority) {
        navigate('/authority', { replace: true });
      } else {
        navigate('/citizen', { replace: true });
      }
    }
  }, [isAuthenticated, isAuthority, navigate]);

  const fromLocation = location.state?.from;
  // Ensure citizens are never redirected to Authority pages
  const redirectPath =
    fromLocation && !fromLocation.pathname.startsWith('/authority')
      ? fromLocation.pathname + (fromLocation.search || '')
      : '/citizen';
  const isRedirectedFromProtected = Boolean(fromLocation);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      await signInDemoCitizen();
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Demo sign in failed.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent text-white shadow-lg shadow-accent/25 mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Sign in to access your saved home location and personalized route alerts
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-8 shadow-soft">
          {isRedirectedFromProtected && !error && (
            <div className="p-3.5 mb-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-accent shrink-0" />
              <span>Please sign in to plan journeys and access traffic intelligence tools.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-accent dark:text-accent-light hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition-all shadow-md shadow-accent/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                  Or One-Click Demo
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={demoLoading || loading}
              className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-surface-border dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              {demoLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-accent rounded-full animate-spin" />
                  <span>Entering Demo Session...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Explore as Demo Citizen</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer switch */}
        <div className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/signup" className="font-bold text-accent dark:text-accent-light hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
