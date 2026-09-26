import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Activity,
  Shield,
  Info,
  Menu,
  X,
  ArrowRight,
  User,
  Home,
  LogOut,
  ChevronDown,
  Settings,
  Zap,
  Radio,
  AlertTriangle,
  Siren,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, isAuthority, signOut } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const pathname = location.pathname;
  const isLanding = pathname === '/';
  const isAuthorityLogin = pathname === '/authority/login';
  const isAuthoritySection = pathname.startsWith('/authority') && !isAuthorityLogin;
  const isCitizenSection =
    pathname.startsWith('/citizen') || pathname === '/profile' || pathname === '/onboarding';

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const isActive = (path) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const homeCity = profile?.home_city || user?.user_metadata?.home_city;

  // 1. PUBLIC LANDING NAVBAR LINKS
  const landingNavLinks = [
    { name: 'Overview', href: '/#overview', path: '/' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'For Citizens', href: '/#for-citizens' },
    { name: 'For Authorities', href: '/#for-authorities' },
    { name: 'About', path: '/about' },
  ];

  // 2. CITIZEN PORTAL NAVBAR LINKS
  const citizenNavLinks = [
    { name: 'Home', path: '/citizen', icon: Home },
    { name: 'Plan Journey', path: '/citizen/route', icon: Compass },
    { name: 'Traffic Prediction', path: '/citizen/traffic', icon: Activity },
    { name: 'AI Assistant', path: '/citizen/assistant', icon: Sparkles },
    { name: 'Profile', path: '/citizen/profile', icon: User },
  ];

  // 3. AUTHORITY PORTAL NAVBAR LINKS
  const authorityNavLinks = [
    { name: 'Overview', path: '/authority', icon: Activity },
    { name: 'Congestion', path: '/authority/congestion', icon: Zap },
    { name: 'Emergency Routes', path: '/authority/routes', icon: Siren },
    { name: 'Incidents', path: '/authority/incidents', icon: Radio },
    { name: 'Hotspots', path: '/authority/hotspots', icon: AlertTriangle },
  ];

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b bg-white/95 dark:bg-slate-950/95 border-surface-border dark:border-slate-800 text-slate-900 dark:text-white shadow-xs transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ─────────────────────────────────────────────────────────────
              A. BRAND LOGO (Always acts as Home button -> /)
             ───────────────────────────────────────────────────────────── */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            title="Return to Public Landing Page"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md transition-colors ${
                isAuthoritySection
                  ? 'bg-accent/15 dark:bg-accent/25 text-accent border border-accent/30'
                  : 'bg-accent text-white group-hover:bg-accent-hover shadow-accent/20'
              }`}
            >
              {isAuthoritySection ? (
                <Shield className="w-5 h-5 text-accent" />
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold tracking-tight text-lg text-slate-900 dark:text-white">
                CITYFLOW
              </span>
              {isAuthoritySection ? (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-accent text-white uppercase tracking-wider">
                  AUTHORITY
                </span>
              ) : (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-accent-light dark:bg-accent/20 text-accent">
                  AI
                </span>
              )}
              {!isAuthoritySection && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-normal ml-0.5 hidden sm:inline">
                  India
                </span>
              )}
            </div>
          </Link>

          {/* ─────────────────────────────────────────────────────────────
              B. NAVIGATION LINKS (Center)
             ───────────────────────────────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1.5">
            {/* 1. PUBLIC LANDING NAVBAR */}
            {isLanding &&
              landingNavLinks.map((link) => {
                if (link.href) {
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all"
                    >
                      {link.name}
                    </a>
                  );
                }
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? 'text-accent bg-accent/10 dark:bg-accent/20 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

            {/* 2. CITIZEN PORTAL NAVBAR */}
            {isCitizenSection &&
              citizenNavLinks.map((link) => {
                const active = isActive(link.path);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                      active
                        ? 'text-accent bg-accent/10 dark:bg-accent/20 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 opacity-75" />}
                    <span>{link.name}</span>
                  </Link>
                );
              })}

            {/* 3. AUTHORITY PORTAL NAVBAR */}
            {isAuthoritySection &&
              authorityNavLinks.map((link) => {
                const active =
                  link.path === '/authority'
                    ? pathname === '/authority'
                    : pathname.startsWith(link.path);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-accent text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{link.name}</span>
                  </Link>
                );
              })}

            {/* 4. PUBLIC SUB-PAGES (e.g. /about, /login, /signup) */}
            {!isLanding && !isCitizenSection && !isAuthoritySection && (
              <Link
                to="/about"
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/about')
                    ? 'text-accent bg-accent/10 dark:bg-accent/20 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                }`}
              >
                About CityFlow AI
              </Link>
            )}
          </nav>

          {/* ─────────────────────────────────────────────────────────────
              C. RIGHT ACTIONS / PORTAL BUTTONS / USER DROPDOWNS
             ───────────────────────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Global Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-surface-border dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Case 1: Public Landing Page Actions */}
            {isLanding && (
              <>
                {isAuthenticated ? (
                  /* Authenticated User on Landing Page */
                  <div className="flex items-center gap-2">
                    {isAuthority ? (
                      <Link
                        to="/authority"
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Shield className="w-3.5 h-3.5 text-accent" />
                        <span>Open Authority Portal</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <Link
                        to="/citizen"
                        className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/20 transition-all flex items-center gap-1.5"
                      >
                        <span>Open Citizen Portal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {/* Compact User Menu */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-surface-border dark:border-slate-800"
                      >
                        <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs">
                          {initial}
                        </div>
                      </button>

                      {userDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-surface-border dark:border-slate-800 py-2 z-50 animate-in fade-in">
                          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {displayName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                          </div>
                          <div className="py-1">
                            {isAuthority ? (
                              <Link
                                to="/authority"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-accent dark:hover:text-accent"
                              >
                                <Shield className="w-4 h-4 text-accent" />
                                <span>Authority Operations</span>
                              </Link>
                            ) : (
                              <Link
                                to="/citizen/profile"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-accent dark:hover:text-accent"
                              >
                                <User className="w-4 h-4 text-slate-400" />
                                <span>Profile & Settings</span>
                              </Link>
                            )}
                          </div>
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                            <button
                              type="button"
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Unauthenticated Visitor on Landing Page */
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login"
                      className="px-3.5 py-1.5 rounded-xl border border-surface-border dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Citizen Login
                    </Link>
                    <Link
                      to="/authority/login"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 border dark:border-slate-700"
                    >
                      <Shield className="w-3.5 h-3.5 text-accent" />
                      <span>Authority Portal</span>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Case 2: Citizen Portal Actions */}
            {isCitizenSection && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-surface-border dark:border-slate-800 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {initial}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight max-w-[110px] truncate">
                      {displayName}
                    </span>
                    {homeCity && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5 leading-tight">
                        <Home className="w-2.5 h-2.5 text-accent" />
                        <span className="truncate max-w-[90px]">{homeCity}</span>
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-surface-border dark:border-slate-800 py-2 z-50 animate-in fade-in">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/citizen/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-accent dark:hover:text-accent transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Profile & Home</span>
                      </Link>

                      {homeCity && (
                        <Link
                          to={`/citizen/route?from=${encodeURIComponent(homeCity)}`}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-accent dark:hover:text-accent transition-colors"
                        >
                          <Compass className="w-4 h-4 text-accent" />
                          <span>Plan from {homeCity}</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Case 3: Authority Portal Actions */}
            {isAuthoritySection && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-surface-border dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-mono">
                    {initial}
                  </div>
                  <span className="truncate max-w-[120px]">{displayName}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-accent/20 text-accent font-mono uppercase">
                    OP
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 text-slate-900 dark:text-white animate-in fade-in">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{user?.email}</p>
                      <div className="mt-1 text-[10px] font-mono text-accent">
                        ● Authorized Operator
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/authority"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-accent dark:hover:text-white transition-colors"
                      >
                        <Shield className="w-4 h-4 text-accent" />
                        <span>Authority Account</span>
                      </Link>
                      <Link
                        to="/citizen/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-accent dark:hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Operator Profile</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Case 4: Authority Login Page Actions */}
            {isAuthorityLogin && (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl border border-surface-border dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Citizen Login
                </Link>
                <Link
                  to="/about"
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2"
                >
                  About
                </Link>
              </div>
            )}

            {/* Case 5: Other Public Pages (/about, /login, /signup) */}
            {!isLanding && !isCitizenSection && !isAuthoritySection && !isAuthorityLogin && (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl border border-surface-border dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Citizen Login
                </Link>
                <Link
                  to="/authority/login"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold border dark:border-slate-700"
                >
                  Authority Portal
                </Link>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              D. MOBILE MENU TOGGLE
             ───────────────────────────────────────────────────────────── */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-surface-border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          E. MOBILE MENU DROPDOWN
         ───────────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-b px-4 pt-3 pb-6 space-y-2 shadow-lg bg-white dark:bg-slate-950 border-surface-border dark:border-slate-800 text-slate-900 dark:text-white transition-colors"
        >
          {/* Landing mobile links */}
          {isLanding && (
            <>
              {landingNavLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href || link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 text-center rounded-xl border border-surface-border dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Citizen Login
                </Link>
                <Link
                  to="/authority/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 text-center rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold"
                >
                  Authority Portal
                </Link>
              </div>
            </>
          )}

          {/* Citizen mobile links */}
          {isCitizenSection && (
            <>
              {citizenNavLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl"
                  >
                    {Icon && <Icon className="w-4 h-4 text-accent" />}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}

          {/* Authority mobile links */}
          {isAuthoritySection && (
            <>
              {authorityNavLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl"
                  >
                    {Icon && <Icon className="w-4 h-4 text-accent" />}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
