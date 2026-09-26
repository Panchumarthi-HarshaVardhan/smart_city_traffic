import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Activity,
  AlertTriangle,
  Siren,
  Radio,
  Sparkles,
  Navigation,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:8000/api';

export default function AuthorityNav({ activeEmergencyCount = 0 }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [healthStatus, setHealthStatus] = useState({
    checked: false,
    backend: false,
    tomtom: false,
    google: false,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function checkHealth() {
      try {
        const [backendRes, tomtomRes, googleRes] = await Promise.allSettled([
          fetch(`${API_BASE}/health`),
          fetch(`${API_BASE}/live-traffic/health`),
          fetch(`${API_BASE}/traffic-route/health`),
        ]);

        if (mounted) {
          setHealthStatus({
            checked: true,
            backend: backendRes.status === 'fulfilled' && backendRes.value.ok,
            tomtom: tomtomRes.status === 'fulfilled' && tomtomRes.value.ok,
            google: googleRes.status === 'fulfilled' && googleRes.value.ok,
          });
        }
      } catch (err) {
        if (mounted) {
          setHealthStatus({
            checked: true,
            backend: false,
            tomtom: false,
            google: false,
          });
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    await signOut();
    navigate('/');
  };

  const allOperational =
    healthStatus.backend && healthStatus.tomtom && healthStatus.google;
  const partialOperational =
    healthStatus.backend || healthStatus.tomtom || healthStatus.google;

  const operationsTabs = [
    { name: 'Overview', path: '/authority', icon: Activity },
    { name: 'Incidents', path: '/authority/incidents', icon: Radio },
    { name: 'Hotspots', path: '/authority/hotspots', icon: AlertTriangle },
  ];

  const decisionSupportTabs = [
    {
      name: 'Congestion Recommendations',
      path: '/authority/congestion',
      icon: Sparkles,
      highlight: true,
    },
    {
      name: 'Emergency Routes',
      path: '/authority/routes',
      icon: Siren,
      badge: activeEmergencyCount > 0 ? `${activeEmergencyCount} Active` : null,
      highlight: true,
    },
  ];

  const operatorName = profile?.full_name || user?.email?.split('@')[0] || 'Authority Operator';
  const operatorInitial = operatorName.charAt(0).toUpperCase();

  return (
    <div className="space-y-4 pb-6 border-b border-surface-border dark:border-slate-800 transition-colors">
      {/* Top Header & Operator Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to="/" className="flex items-center gap-2.5 group" title="Return to Public Landing Page">
            <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-bold shadow-sm group-hover:bg-accent-hover transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg group-hover:text-accent transition-colors">
                  CITYFLOW AUTHORITY
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 dark:bg-accent/25 text-accent uppercase tracking-wider border border-accent/20">
                  Ops Center
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Traffic & Emergency Operations Center • Urban Mobility Decision Support
              </p>
            </div>
          </Link>
        </div>

        {/* System Health Status & User Dropdown */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Health Pill */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              !healthStatus.checked
                ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                : allOperational
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                : partialOperational
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !healthStatus.checked
                  ? 'bg-slate-400'
                  : allOperational
                  ? 'bg-emerald-500 animate-pulse'
                  : partialOperational
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {!healthStatus.checked
                ? 'Checking...'
                : allOperational
                ? 'Telemetry Operational'
                : partialOperational
                ? 'Partial Telemetry'
                : 'Backend Offline'}
            </span>
          </div>

          {/* Operator User Menu Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-mono">
                {operatorInitial}
              </div>
              <span className="truncate max-w-[120px]">{operatorName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{operatorName}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                  <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-accent font-mono text-[9px] font-bold">
                    <span>● Verified Operator</span>
                  </div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Authority Profile</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── VISUALLY SEPARATED AUTHORITY TABS (OPERATIONS vs DECISION SUPPORT) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Operations Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
            OPERATIONS:
          </span>
          {operationsTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.path === '/authority'
                ? location.pathname === '/authority'
                : location.pathname.startsWith(tab.path);

            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'opacity-70'}`} />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Decision Support Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t sm:border-t-0 sm:border-l sm:pl-3 border-slate-200 dark:border-slate-800 pt-2 sm:pt-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
            DECISION SUPPORT:
          </span>
          {decisionSupportTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname.startsWith(tab.path);

            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-accent bg-accent-light/50 dark:bg-accent/15 hover:bg-accent-light dark:hover:bg-accent/25 border border-sky-200 dark:border-sky-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-accent'}`} />
                <span>{tab.name}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
