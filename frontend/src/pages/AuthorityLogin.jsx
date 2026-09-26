import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Siren,
  Lock,
  Mail,
  ArrowRight,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  KeyRound,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthorityLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInAuthority, signInDemoAuthority, signInDemoEmergency, isAuthenticated, isAuthority } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'operator' | 'emergency' | null
  const [error, setError] = useState(location.state?.unauthorizedError || null);

  const destination = location.state?.from?.pathname || '/authority';

  // If already authenticated as authority, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated && isAuthority) {
      navigate('/authority', { replace: true });
    }
  }, [isAuthenticated, isAuthority, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both operator email and security password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signInAuthority(email, password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your operator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (type = 'operator') => {
    setDemoLoading(type);
    setError(null);
    try {
      if (type === 'emergency') {
        await signInDemoEmergency();
      } else {
        await signInDemoAuthority();
      }
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Demo operator sign-in failed. Please try standard sign in.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand & Authority Portal Header */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-block group transition-transform hover:scale-105"
            title="Return to Public Landing Page"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-lg shadow-slate-900/20 mb-2 group-hover:bg-slate-800 dark:group-hover:bg-slate-700 transition-colors">
              <Shield className="w-7 h-7 text-accent" />
            </div>

            <div className="flex items-center justify-center gap-1.5">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-xl group-hover:text-accent transition-colors">
                CITYFLOW AI
              </span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-800 text-white uppercase tracking-wider">
                AUTHORITY
              </span>
            </div>
          </Link>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Traffic & Emergency Operations Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Authorized portal for municipal traffic management, corridor congestion analysis, and emergency response coordination.
          </p>
        </div>

        {/* Access Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
          <KeyRound className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
          <div>
            <strong>Access Policy: </strong>
            <span>Authority accounts are provisioned for authorized municipal operators and emergency controllers.</span>
          </div>
        </div>

        {/* Error / Unauthorized Warning Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Authority Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-7 shadow-soft space-y-5">
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Operator Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Operator Email</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@cityflow.ai"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>

            {/* Operator Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Security Password</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-accent dark:text-accent-light hover:underline font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || !!demoLoading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-accent dark:hover:bg-accent-hover text-white font-extrabold text-xs transition-all shadow-md shadow-slate-900/20 dark:shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-accent dark:text-white" />
                  <span>Sign In to Authority Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Evaluation & Demo Access
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* 1-Click Demo Operator & Emergency Sign In Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleDemoSignIn('operator')}
              disabled={loading || !!demoLoading}
              className="py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-900 dark:text-sky-200 border border-sky-200 dark:border-sky-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {demoLoading === 'operator' ? (
                <Loader2 className="w-4 h-4 animate-spin text-sky-600 dark:text-sky-400" />
              ) : (
                <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              )}
              <span>Demo Authority Operator</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn('emergency')}
              disabled={loading || !!demoLoading}
              className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {demoLoading === 'emergency' ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-600 dark:text-rose-400" />
              ) : (
                <Siren className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              )}
              <span>Demo Emergency Controller</span>
            </button>
          </div>

          {/* Expandable Demo Credentials Toggle */}
          <details className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-xs">
            <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between select-none list-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-accent" />
                <span>Show Demo Credentials</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono group-open:hidden">View</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono hidden group-open:inline">Hide</span>
            </summary>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Demo Authority Operator</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 font-mono">Role: authority</span>
                </div>
                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Email: authority.demo@cityflow.ai</div>
                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Password: CityFlowDemo@2026</div>
              </div>

              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Demo Emergency Controller</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 font-mono">Role: authority</span>
                </div>
                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Email: emergency.demo@cityflow.ai</div>
                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Password: CityFlowEmergency@2026</div>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                Note: Citizen accounts cannot enter the Authority portal. Only verified Authority accounts are authorized.
              </p>
            </div>
          </details>
        </div>

        {/* Secondary Citizen Link */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 flex items-center justify-center gap-1.5">
          <span>Are you a citizen?</span>
          <Link
            to="/login"
            className="text-accent dark:text-accent-light hover:underline font-bold flex items-center gap-1"
          >
            <span>Citizen Login</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
