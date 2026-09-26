import React from 'react';
import { Link } from 'react-router-dom';
import {
  Navigation,
  Activity,
  Shield,
  Compass,
  ArrowRight,
  Globe2,
  CheckCircle2,
  Zap,
  TrendingUp,
  MapPin,
  Clock,
  Car,
  Database,
  BarChart3,
  Layers,
  ChevronRight,
  Sparkles,
  Siren,
  KeyRound,
  UserCheck,
  Radio,
} from 'lucide-react';
import CityflowStoryAnimation from '../components/CityflowStoryAnimation';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, isAuthority } = useAuth();

  // 3 Core Platform Pillars (Predict / Navigate / Optimize)
  const corePillars = [
    {
      id: 'predict',
      badge: 'PREDICT',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Predictive Congestion AI',
      subtitle: '24-hour advance machine learning forecasts',
      description:
        'Calibrated Scikit-Learn models trained on multi-day arterial data forecast congestion percentages, estimated speeds, and traffic volumes 24 hours in advance with zero temporal leakage.',
      icon: TrendingUp,
      highlights: ['24-hour lookahead window', 'Historical trend modeling', 'Zero-leakage validated data'],
    },
    {
      id: 'navigate',
      badge: 'NAVIGATE',
      badgeColor: 'bg-sky-50 text-accent border-sky-200',
      title: 'Traffic-Aware Dynamic Routing',
      subtitle: 'Real-time telemetry and delay evaluation',
      description:
        'Calculates multi-corridor driving routes across India with real-time speed, live incident delays, and step-by-step turn guidance. Compares alternate paths so travelers know why a route is recommended.',
      icon: Compass,
      highlights: ['Nationwide road network', 'Real-time delay breakdown', 'Pin-drop map selection'],
    },
    {
      id: 'optimize',
      badge: 'OPTIMIZE',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      title: 'Municipal & Emergency Clearance',
      subtitle: 'Actionable decision support and emergency corridors',
      description:
        'Empowers traffic authorities with prioritized congestion mitigation advisories, automated nearby hospital discovery, and emergency vehicle routing for critical golden-hour medical clearance.',
      icon: Shield,
      highlights: ['Hotspot risk diagnostics', 'Automated hospital discovery', 'In-cab emergency driver HUD'],
    },
  ];

  // System Stats
  const platformStats = [
    { label: 'Validated ML Corridors', value: '16', unit: 'Arterials', desc: 'Bengaluru testbed' },
    { label: 'ML Test Suite', value: '29 / 29', unit: 'Tests', desc: '100% verified passing' },
    { label: 'Forecast Horizon', value: '24', unit: 'Hours', desc: 'Pre-journey lookahead' },
    { label: 'Routing Coverage', value: 'All-India', unit: 'Nationwide', desc: 'OSM & live telemetry' },
  ];

  // Architectural Workflow Steps
  const workflowSteps = [
    {
      step: '01',
      title: 'Ingestion & Telemetry',
      desc: 'Aggregates real-time speed, live incident alerts, and atmospheric weather observations into Supabase PostgreSQL.',
      icon: Database,
    },
    {
      step: '02',
      title: 'Predictive ML Engine',
      desc: 'Trained Random Forest and regression models evaluate multi-day traffic patterns and weather features to forecast congestion.',
      icon: BarChart3,
    },
    {
      step: '03',
      title: 'Multi-Corridor Routing',
      desc: 'Traffic-aware routing evaluates congestion density and live road incidents to recommend the optimal transit path.',
      icon: Layers,
    },
    {
      step: '04',
      title: 'Emergency Priority Preemption',
      desc: 'Dynamically routes ambulances and high-priority municipal transit through prioritized green corridors.',
      icon: Zap,
    },
  ];

  // Citizen Portal Features
  const citizenFeatures = [
    'Find driving routes across all major cities and highways in India',
    'Compare traffic-aware routes with real-time speed and delay breakdowns',
    'Check current road conditions and active incident alerts',
    'Inspect CITYFLOW next-day machine-learned congestion forecasts',
    'Save home location for instant 1-click personalized journey planning',
    'Use current GPS location for immediate point-to-point departure',
  ];

  // Authority Portal Features
  const authorityFeatures = [
    'Monitor real-time citywide traffic flow across key arterial corridors',
    'Analyze spatial congestion bottlenecks and evaluate network risk',
    'Review live traffic incident feeds within a 25 km municipal radius',
    'Access actionable congestion mitigation and dispersal recommendations',
    'Plan priority emergency routes with auto-discovered hospital destinations',
    'Support ambulance and fire-engine dispatch with dedicated driver HUD sync',
  ];

  // Resolve Portal Links based on Auth State
  const citizenPortalLink = isAuthenticated && !isAuthority ? '/citizen' : '/login';
  const authorityPortalLink = isAuthenticated && isAuthority ? '/authority' : '/authority/login';

  return (
    <div className="space-y-20 sm:space-y-28 pb-20">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION (Product Introduction & Two Portal Entrypoints)
         ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-light/60 dark:bg-accent/20 border border-accent/20 text-accent dark:text-sky-300 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>AI Urban Mobility Intelligence • Nationwide Routing</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            Predict the road ahead. <br />
            <span className="text-accent dark:text-sky-400">Navigate with intelligence.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            CITYFLOW AI combines 24-hour machine learning congestion forecasts, real-time traffic telemetry, and emergency priority routing for smarter urban mobility across India.
          </p>

          {/* Two Clear Entry CTAs (Citizen vs Authority) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {isAuthenticated ? (
              isAuthority ? (
                <Link
                  to="/authority"
                  className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-bold shadow-md shadow-slate-900/20 transition-all flex items-center gap-2 border dark:border-slate-700"
                >
                  <Shield className="w-4 h-4 text-accent" />
                  <span>Open Authority Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/citizen"
                  className="px-6 py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-white text-sm font-bold shadow-md shadow-accent/20 transition-all flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Open Citizen Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-white text-sm font-bold shadow-md shadow-accent/20 transition-all flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Enter Citizen Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/authority/login"
                  className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-bold shadow-md shadow-slate-900/20 transition-all flex items-center gap-2 border dark:border-slate-700"
                >
                  <Shield className="w-4 h-4 text-accent" />
                  <span>Authority Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}

            <a
              href="#how-it-works"
              className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition-all border border-transparent dark:border-slate-700"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* ── Key Metrics Bar ── */}
        <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {platformStats.map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800/80 border border-surface-border dark:border-slate-700 rounded-2xl p-4 text-center shadow-xs transition-colors"
            >
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</span>
                <span className="text-xs font-semibold text-accent dark:text-sky-400">{stat.unit}</span>
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{stat.label}</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">{stat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. PLATFORM OVERVIEW (Predict / Navigate / Optimize)
         ───────────────────────────────────────────────────────────── */}
      <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-3 border border-transparent dark:border-slate-700">
            <Globe2 className="w-3.5 h-3.5 text-accent dark:text-sky-400" />
            <span>Platform Overview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Predict. Navigate. Optimize.
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-2">
            Three interconnected pillars providing intelligent mobility solutions for commuters and municipal traffic controllers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {corePillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className="bg-white dark:bg-slate-800/80 border border-surface-border dark:border-slate-700 rounded-3xl p-7 shadow-soft hover:shadow-soft-lg hover:border-accent/40 dark:hover:border-accent/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${pillar.badgeColor}`}
                    >
                      {pillar.badge}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                      <Icon className="w-5 h-5 text-accent dark:text-sky-400" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {pillar.title}
                  </h3>
                  <div className="text-xs font-semibold text-accent dark:text-sky-400 mb-3">
                    {pillar.subtitle}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    {pillar.description}
                  </p>

                  <div className="space-y-2">
                    {pillar.highlights.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. DEDICATED SECTION: FOR CITIZENS
         ───────────────────────────────────────────────────────────── */}
      <section id="for-citizens" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-sky-50/60 dark:bg-slate-850 dark:bg-slate-800/40 border border-sky-200/70 dark:border-slate-700/60 rounded-3xl p-8 sm:p-12 shadow-soft transition-colors">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light dark:bg-accent/20 text-accent dark:text-sky-300 text-xs font-bold border border-accent/20">
                <Compass className="w-3.5 h-3.5" />
                <span>FOR CITIZENS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Plan smarter. Travel better.
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Take the guesswork out of your daily commute with traffic-aware route planning, real-time delay analysis, and 24-hour advance machine learning predictions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {citizenFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-accent dark:text-sky-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  to={citizenPortalLink}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-md shadow-accent/20 transition-all"
                >
                  <Compass className="w-4 h-4" />
                  <span>{isAuthenticated && !isAuthority ? 'Open Citizen Portal' : 'Enter Citizen Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 border border-sky-200/80 dark:border-slate-700 rounded-3xl p-6 shadow-soft space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Citizen Mobility Suite
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-accent dark:text-sky-300 uppercase">
                  Commuter Hub
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-bold shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Plan Journey</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Multi-corridor routes with live delay breakdowns
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Traffic Prediction</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      24-hour ML forecasts and 14-day history trends
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold shrink-0">
                    <MapPin className="w-4 h-4 text-accent dark:text-sky-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Saved Home & GPS</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      1-click instant pre-trip planning from your home city
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. DEDICATED SECTION: FOR AUTHORITIES (Fixed Global Theme)
         ───────────────────────────────────────────────────────────── */}
      <section id="for-authorities" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-8 sm:p-12 shadow-soft dark:shadow-soft-xl border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-accent border border-slate-300 dark:border-slate-700 text-xs font-bold font-mono uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-accent dark:text-sky-400" />
                <span>FOR AUTHORITIES</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Turn traffic intelligence into operational decisions.
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Empower municipal controllers and emergency dispatchers with real-time incident feeds, machine-learned corridor risk diagnostics, and priority emergency clearance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {authorityFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  to={authorityPortalLink}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-md shadow-accent/20 transition-all"
                >
                  <Shield className="w-4 h-4 text-white" />
                  <span>{isAuthenticated && isAuthority ? 'Open Authority Portal' : 'Authority Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-soft space-y-4 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  Command Capabilities
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-accent uppercase font-mono border border-slate-200 dark:border-slate-700">
                  Operator Tier
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Congestion Recommendations</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Telemetry vs forecast correlation & action plans
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center font-bold shrink-0">
                    <Siren className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Emergency Routes</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Lowest-ETA hospital discovery & dispatch to driver HUD
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-accent dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Incident Intelligence</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Near-live TomTom incident feed within 25 km grid
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. HOW IT WORKS (Technical Architecture Overview - Fixed Global Theme)
         ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-8 sm:p-12 shadow-soft dark:shadow-soft-xl border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-accent dark:text-sky-400">
              System Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 text-slate-900 dark:text-white">
              How CITYFLOW AI Operates
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2">
              From roadside telemetry to predictive machine learning and dynamic routing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.step}
                  className="bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black text-accent dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/40 px-2 py-0.5 rounded-lg">
                        STEP {step.step}
                      </span>
                      <StepIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scientific Transparency Callout */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span>
                <strong>Zero Leakage Assurance:</strong> Chronological train/val/test splits strictly preserve physical causality.
              </span>
            </div>
            <Link
              to="/about"
              className="text-accent dark:text-sky-400 hover:text-accent-hover dark:hover:text-sky-300 font-bold inline-flex items-center gap-1"
            >
              <span>Read Architecture Documentation</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. IN ACTION: EMERGENCY VEHICLE REROUTING STORY
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Interactive Clearance Simulation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dynamic Priority Clearance in Action
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
            See how the system detects corridor bottlenecks, calculates priority green waves, and routes emergency vehicles around gridlock.
          </p>
        </div>

        {/* Scroll Story Animation Component */}
        <CityflowStoryAnimation />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. CALL TO ACTION BANNER (Dual Portal Gateway)
         ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-accent to-accent-hover text-white rounded-3xl p-8 sm:p-12 shadow-soft-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to experience intelligent mobility?
            </h2>
            <p className="text-sky-100 text-sm font-normal leading-relaxed">
              Choose your dedicated portal to begin planning your personal journey or managing municipal traffic operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              to={citizenPortalLink}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-accent font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>{isAuthenticated && !isAuthority ? 'Open Citizen Portal' : 'Enter Citizen Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={authorityPortalLink}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 border border-slate-700"
            >
              <Shield className="w-4 h-4 text-accent" />
              <span>{isAuthenticated && isAuthority ? 'Open Authority Portal' : 'Authority Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
