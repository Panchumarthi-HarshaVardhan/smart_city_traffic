import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Activity,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function CityflowStoryAnimation() {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const { isDark } = useTheme();

  // Track scroll position through the storytelling section
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start calculating when container enters view, finish when it leaves
      const total = rect.height + windowHeight;
      const current = windowHeight - rect.top;
      const progress = Math.min(Math.max(current / total, 0), 1);

      setScrollProgress(progress);

      if (progress < 0.25) setActiveStep(0);
      else if (progress < 0.50) setActiveStep(1);
      else if (progress < 0.75) setActiveStep(2);
      else setActiveStep(3);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scrub via manual button clicks as well
  const handleScrubStep = (stepIdx) => {
    setActiveStep(stepIdx);
    setScrollProgress(stepIdx * 0.28 + 0.1);
  };

  // Ambulance position interpolation along path
  // Start: (80, 200) -> Congestion checkpoint: (320, 200) -> Reroute curve: (450, 320) -> Destination: (720, 320)
  let ambX = 80;
  let ambY = 200;
  let ambRotation = 0;

  if (activeStep === 0) {
    ambX = 80 + scrollProgress * 400;
    ambY = 200;
    ambRotation = 0;
  } else if (activeStep === 1) {
    ambX = 300;
    ambY = 200;
    ambRotation = 0;
  } else if (activeStep === 2) {
    ambX = 300 + (scrollProgress - 0.5) * 600;
    ambY = 200 + (scrollProgress - 0.5) * 480;
    ambRotation = 25;
  } else {
    ambX = 720;
    ambY = 320;
    ambRotation = 0;
  }

  const steps = [
    {
      badge: 'PREDICT',
      title: 'Emergency Dispatch',
      desc: 'Ambulance departs from Central Station. CITYFLOW AI continuously models ahead.',
      icon: Activity,
      color: 'text-accent bg-accent-light',
    },
    {
      badge: 'DETECT',
      title: 'Bottleneck Identified',
      desc: 'Real-time telemetry detects unexpected gridlock (+18 min delay) on primary arterial.',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      badge: 'OPTIMIZE',
      title: 'Intelligent Rerouting',
      desc: 'CITYFLOW dynamically redirects the ambulance to a clear, low-congestion arterial corridor.',
      icon: Zap,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      badge: 'NAVIGATE',
      title: 'Destination Reached',
      desc: 'Ambulance arrives safely at Hospital Trauma Center via alternative clear corridor (illustrative scenario).',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50',
    },
  ];

  return (
    <section
      ref={containerRef}
      className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <div className="bg-slate-50 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-navy-900 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-10 shadow-soft dark:shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative transition-colors">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent/15 dark:bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 dark:bg-accent/20 text-accent dark:text-sky-300 text-xs font-semibold mb-3 border border-accent/20 dark:border-sky-400/30">
            <Zap className="w-3.5 h-3.5" />
            <span>HOW CITYFLOW WORKS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Intelligent Urban Rerouting in Action
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            Watch how CITYFLOW AI detects sudden corridor congestion and guides emergency vehicles safely to their destination.
          </p>
        </div>

        {/* Step Progression Pills (Interactive) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8 relative z-10 max-w-3xl mx-auto">
          {steps.map((st, idx) => {
            const isActive = activeStep === idx;
            const Icon = st.icon;
            return (
              <button
                key={st.badge}
                type="button"
                onClick={() => handleScrubStep(idx)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-800/90 border-accent shadow-md shadow-accent/20 ring-1 ring-accent'
                    : 'bg-slate-100/80 dark:bg-slate-800/40 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-accent text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {st.badge}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <div className={`text-xs font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                  {st.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Vector Animation Scene */}
        <div className="relative bg-white dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 sm:p-6 overflow-hidden transition-colors shadow-xs">
          <svg
            viewBox="0 0 800 420"
            className="w-full h-auto max-h-[380px] select-none"
          >
            <defs>
              {/* Grid pattern for minimal city map */}
              <pattern id="cityGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? "#1E293B" : "#F1F5F9"} strokeWidth="0.8" opacity="0.8" />
              </pattern>

              {/* Glowing gradients */}
              <linearGradient id="clearCorridor" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>

              <linearGradient id="congestedCorridor" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>

            {/* City Ground & Grid */}
            <rect width="800" height="420" fill="url(#cityGrid)" />

            {/* City Building Silhouettes (Minimalist Tech) */}
            <g fill={isDark ? "#1E293B" : "#E2E8F0"} opacity={isDark ? 0.75 : 0.85}>
              <rect x="140" y="80" width="70" height="90" rx="6" />
              <rect x="230" y="60" width="80" height="110" rx="6" />
              <rect x="330" y="90" width="60" height="80" rx="6" />
              <rect x="420" y="70" width="90" height="100" rx="6" />
              <rect x="530" y="80" width="70" height="90" rx="6" />

              <rect x="140" y="240" width="80" height="100" rx="6" />
              <rect x="240" y="270" width="90" height="70" rx="6" />
              <rect x="490" y="250" width="80" height="90" rx="6" />
              <rect x="590" y="230" width="70" height="110" rx="6" />
            </g>

            {/* Dispatch Station (Start A) */}
            <g transform="translate(40, 170)">
              <rect width="60" height="60" rx="12" fill="#0284C7" opacity="0.2" />
              <rect x="5" y="5" width="50" height="50" rx="10" fill="#0284C7" />
              <text x="30" y="34" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle">
                HUB A
              </text>
            </g>

            {/* Destination Trauma Center (Hospital B) */}
            <g transform="translate(710, 290)">
              <rect width="60" height="60" rx="12" fill="#10B981" opacity="0.2" />
              <rect x="5" y="5" width="50" height="50" rx="10" fill="#10B981" />
              <text x="30" y="34" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle">
                HOSP B
              </text>
            </g>

            {/* ROAD 1: Original Congested Arterial (Direct East) */}
            <path
              d="M 100 200 L 400 200 L 710 200"
              fill="none"
              stroke={isDark ? "#334155" : "#CBD5E1"}
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* Congested section highlight (Heavy Red Bottleneck) */}
            <path
              d="M 320 200 L 520 200"
              fill="none"
              stroke="url(#congestedCorridor)"
              strokeWidth="16"
              strokeLinecap="round"
              opacity={activeStep >= 1 ? 0.95 : 0.4}
            />

            {/* ROAD 2: CITYFLOW Dynamic Reroute Bypass (Curving South to Clear Corridor) */}
            <path
              d="M 280 200 C 350 200, 360 320, 480 320 L 710 320"
              fill="none"
              stroke={activeStep >= 2 ? 'url(#clearCorridor)' : (isDark ? '#1E293B' : '#E2E8F0')}
              strokeWidth={activeStep >= 2 ? '14' : '10'}
              strokeLinecap="round"
              strokeDasharray={activeStep < 2 ? '6,6' : 'none'}
              className="transition-all duration-500"
            />

            {/* Congestion Alert Marker on Blocked Section */}
            {activeStep >= 1 && (
              <g transform="translate(420, 160)" className="animate-pulse">
                <rect x="-60" y="-12" width="120" height="24" rx="12" fill="#EF4444" />
                <text x="0" y="4" fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle">
                  CONGESTION +18m
                </text>
              </g>
            )}

            {/* Clear Corridor Badge on Bypass */}
            {activeStep >= 2 && (
              <g transform="translate(520, 360)" className="animate-in fade-in">
                <rect x="-65" y="-12" width="130" height="24" rx="12" fill="#10B981" />
                <text x="0" y="4" fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle">
                  CLEAR CORRIDOR
                </text>
              </g>
            )}

            {/* THE AMBULANCE (Vector Vehicle with Emergency Beacon) */}
            <g
              transform={`translate(${ambX}, ${ambY}) rotate(${ambRotation})`}
              className="transition-transform duration-700 ease-out"
            >
              {/* Shadow */}
              <ellipse cx="0" cy="14" rx="20" ry="6" fill="#000000" opacity={isDark ? 0.4 : 0.2} />

              {/* Vehicle Body */}
              <rect x="-18" y="-10" width="36" height="20" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
              {/* Windshield */}
              <path d="M 6 -8 L 14 -8 L 12 8 L 6 8 Z" fill="#0284C7" opacity="0.8" />
              {/* Red Cross */}
              <rect x="-8" y="-7" width="4" height="14" fill="#EF4444" rx="1" />
              <rect x="-13" y="-2" width="14" height="4" fill="#EF4444" rx="1" />

              {/* Flashing Beacon */}
              <circle cx="2" cy="0" r="3.5" fill="#EF4444" className="animate-ping" opacity="0.75" />
              <circle cx="2" cy="0" r="2.5" fill="#EF4444" />
            </g>
          </svg>

          {/* Current Narrative Status Banner */}
          <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <span className="font-extrabold text-slate-900 dark:text-white">{steps[activeStep].title}:</span>
              <span className="text-slate-600 dark:text-slate-300 font-normal">{steps[activeStep].desc}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Phase {activeStep + 1} of 4</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
