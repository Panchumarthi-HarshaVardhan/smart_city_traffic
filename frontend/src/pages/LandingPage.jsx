import React from 'react';
import { Link } from 'react-router-dom';
import Hero3D from '../components/Hero3D';
import SectionHeading from '../components/SectionHeading';
import MetricCard from '../components/MetricCard';
import PortalCard from '../components/PortalCard';
import {
  Compass,
  Shield,
  Activity,
  ArrowRight,
  Database,
  CloudSun,
  Cpu,
  Layers,
  BarChart3,
  GitBranch,
  CheckCircle,
} from 'lucide-react';

export default function LandingPage() {
  const verifiedStats = [
    { label: 'Historical Observations', value: '8,936', subtext: 'Daily road sensor records across Bengaluru' },
    { label: 'Calendar Dates', value: '952', subtext: 'Jan 2022 to Aug 2024 continuous timeline' },
    { label: 'Arterial Corridors', value: '16', subtext: 'Major city highways, flyovers & CBD circles' },
    { label: 'Urban Sectors', value: '8', subtext: 'Key commercial and residential zones' },
    { label: 'Test Suite Verification', value: '29 / 29', subtext: '100% passing tests with zero data leakage', indicator: 'VERIFIED' },
  ];

  const modelsList = [
    {
      target: 'Next-Day Congestion Level',
      model: 'Random Forest (Tuned)',
      metric: 'MAE 16.34 | R² 0.24',
      baselineComparison: '21.0% improvement over persistence baseline (MAE 20.70)',
      features: '7-day rolling volume, corridor area identity, previous speed lag',
    },
    {
      target: 'Next-Day Traffic Volume',
      model: 'Random Forest (Tuned)',
      metric: 'MAE 8,565 | R² 0.32',
      baselineComparison: '27.5% improvement over previous day baseline (MAE 11,821)',
      features: 'Historical volume inertia, weekly seasonality, day of week',
    },
    {
      target: 'Next-Day Average Speed',
      model: 'Linear Regression',
      metric: 'MAE 8.42 km/h',
      baselineComparison: '29.6% reduction in error vs persistence baseline (MAE 11.96)',
      features: 'Learns static corridor mean velocities (dynamic daily r=0.05)',
    },
  ];

  return (
    <div className="space-y-24 sm:space-y-32 pb-24">
      {/* ── HERO SECTION ── */}
      <section className="relative pt-12 sm:pt-16 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Hero Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-surface-border text-xs font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span>Next-Day Traffic Forecasting • Bengaluru</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
                Predict. <br />
                Navigate. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400">
                  Optimize.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                AI-powered urban traffic intelligence for Bengaluru. Sourced from 8,936 real historical road observations and meteorological telemetry to forecast corridor congestion before you travel.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                <Link
                  to="/citizen"
                  className="px-6 py-3 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-white transition-all shadow-md shadow-accent/20 flex items-center justify-center gap-2 group"
                >
                  <span>Explore Citizen Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/authority"
                  className="px-6 py-3 rounded-lg text-sm font-medium bg-surface-elevated hover:bg-surface-border text-white border border-surface-border transition-all flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>Authority Center</span>
                </Link>
              </div>

              {/* Technical compliance badge */}
              <div className="pt-4 flex items-center gap-4 text-xs font-mono text-slate-400 border-t border-surface-border/50">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pure Real Data</span>
                </div>
                <span>•</span>
                <div>Zero Synthetic Telemetry</div>
                <span>•</span>
                <div>No Temporal Leakage</div>
              </div>
            </div>

            {/* Right: 3D Visualization */}
            <div className="lg:col-span-6">
              <Hero3D />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: WHAT CITYFLOW AI DOES ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          number="01 // CAPABILITIES"
          title="What CITYFLOW AI Does"
          subtitle="Moving beyond naive static map routing by introducing predictive intelligence into daily travel and urban traffic control."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl bg-surface/60 border border-surface-border hover:border-surface-border/80 transition-all space-y-4">
            <span className="font-mono text-xs text-accent font-semibold">01</span>
            <h3 className="text-xl font-semibold text-white tracking-tight">Predict</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Forecast upcoming road-level traffic density, speeds, and congestion indices from 2.5 years of historical Bengaluru traffic and Open-Meteo weather patterns.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface/60 border border-surface-border hover:border-surface-border/80 transition-all space-y-4">
            <span className="font-mono text-xs text-accent font-semibold">02</span>
            <h3 className="text-xl font-semibold text-white tracking-tight">Navigate</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Compare transit routes using AI-predicted travel times and corridor bottleneck forecasts rather than misleading free-flow assumptions.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface/60 border border-surface-border hover:border-surface-border/80 transition-all space-y-4">
            <span className="font-mono text-xs text-accent font-semibold">03</span>
            <h3 className="text-xl font-semibold text-white tracking-tight">Optimize</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Provide urban authorities and emergency responders with decision-support intelligence, corridor hotspot rankings, and rapid dispatch pathways.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: TWO WAYS TO USE CITYFLOW ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          number="02 // WORKFLOWS"
          title="Two Dedicated Experiences"
          subtitle="Engineered specifically for commuters navigating the city and municipal authorities managing urban corridors."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <PortalCard
            title="Citizen Portal"
            subtitle="COMMUTER INTELLIGENCE"
            description="Navigate Bengaluru with predicted traffic conditions. Avoid severe bottlenecks like Silk Board and Sarjapur Road before departure."
            features={[
              'Multi-alternative route comparison with predicted travel times',
              'Corridor-level congestion categorization (Low to Severe)',
              'Time-differential savings calculations',
              'Bengaluru arterial traffic map inspection',
            ]}
            ctaText="Open Citizen Portal"
            ctaLink="/citizen"
            icon={Compass}
            badge="Public Access"
          />

          <PortalCard
            title="Authority Portal"
            subtitle="DECISION SUPPORT"
            description="Comprehensive urban intelligence center for traffic managers, city planners, and emergency dispatch services."
            features={[
              'Ranked congestion hotspot diagnostics across all 16 arterial roads',
              'Contributing feature factor breakdowns from trained ML models',
              'Historical volume, speed, and capacity saturation telemetry',
              'Emergency route decision support for Ambulance, Police, and Fire',
            ]}
            ctaText="Open Authority Center"
            ctaLink="/authority"
            icon={Shield}
            badge="Decision Support"
            variant="accent"
          />
        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS (PIPELINE) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          number="03 // PIPELINE"
          title="How It Works"
          subtitle="A transparent, leak-free machine learning pipeline transforming historical telemetry into decision support."
          align="center"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          {[
            { step: '01', title: 'Historical Traffic', desc: '8,936 daily records', icon: Database },
            { step: '02', title: 'Daily Weather', desc: '14 aggregated metrics', icon: CloudSun },
            { step: '03', title: 'Feature Lags', desc: '52 leak-free features', icon: Layers },
            { step: '04', title: 'Machine Learning', desc: 'Chronological training', icon: Cpu },
            { step: '05', title: 'Congestion Forecast', desc: 'Next-day road level', icon: BarChart3 },
            { step: '06', title: 'Route Intelligence', desc: 'OSRM ETA adjustment', icon: GitBranch },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="p-4 rounded-xl bg-surface/70 border border-surface-border flex flex-col items-center justify-center space-y-2 hover:border-surface-border/90"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-accent">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-mono text-[10px] text-slate-400 font-semibold">{item.step}</div>
                <div className="text-xs font-semibold text-white leading-tight">{item.title}</div>
                <div className="text-[10px] text-slate-400 font-mono">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 4: AI INTELLIGENCE (VERIFIED STATS) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          number="04 // AUDITED TELEMETRY"
          title="Validated Project Scope"
          subtitle="Real, verifiable figures directly from the project's data quality audit and machine learning reports."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {verifiedStats.map((st, i) => (
            <MetricCard
              key={i}
              label={st.label}
              value={st.value}
              subtext={st.subtext}
              indicator={st.indicator}
            />
          ))}
        </div>
      </section>

      {/* ── SECTION 5: MODEL INTELLIGENCE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          number="05 // METHODOLOGY"
          title="Trained Forecasting Models"
          subtitle="Models are trained using strictly chronological historical data to prevent future-data leakage."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modelsList.map((m, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-surface/80 border border-surface-border space-y-3 font-mono text-xs"
            >
              <div className="text-slate-400 uppercase text-[10px] tracking-wider">{m.target}</div>
              <div className="text-base font-bold text-white tracking-tight">{m.model}</div>
              <div className="text-accent text-sm font-semibold">{m.metric}</div>
              <p className="text-slate-400 font-sans text-xs leading-normal pt-1 border-t border-surface-border">
                {m.baselineComparison}
              </p>
              <div className="text-[11px] text-slate-400 pt-1">
                <span className="text-slate-400">Key Drivers:</span> {m.features}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 6: FINAL CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-b from-surface-elevated to-surface border border-surface-border text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white max-w-xl mx-auto">
            Move through Bengaluru with predictive intelligence.
          </h2>

          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Choose your portal to begin exploring route comparisons or corridor-level decision support analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/citizen"
              className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-white transition-all shadow-md shadow-accent/20"
            >
              Explore Citizen Portal
            </Link>
            <Link
              to="/authority"
              className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium bg-surface-elevated hover:bg-surface-border text-white border border-surface-border transition-all"
            >
              Open Authority Center
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
