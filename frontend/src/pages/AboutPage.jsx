import React from 'react';
import SectionHeading from '../components/SectionHeading';
import { Database, ShieldCheck, Cpu, Code2, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  const techStack = [
    { name: 'React 18 & Vite', category: 'Frontend UI', desc: 'Ultra-fast modular single-page interface' },
    { name: 'Tailwind CSS', category: 'Design System', desc: 'Swiss-modern restrained design tokens' },
    { name: 'Three.js', category: '3D Graphics', desc: 'Real-time urban road network topology simulation' },
    { name: 'Leaflet & CARTO', category: 'Cartography', desc: 'Minimal dark cartographic visualizer' },
    { name: 'Python & scikit-learn', category: 'Machine Learning', desc: 'Random Forest, HistGradientBoosting, Linear Regression' },
    { name: 'FastAPI', category: 'Inference Backend', desc: 'High-performance model serving service layer' },
    { name: 'OSRM', category: 'Routing Engine', desc: 'Open Source Routing Machine highway distance & geometry' },
    { name: 'Open-Meteo API', category: 'Meteorology', desc: 'Historical hourly ambient temperature & monsoon precipitation' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-surface-border text-xs font-mono text-accent">
          <span>DataQuest 2026 • Bengaluru</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
          About CITYFLOW AI
        </h1>
        <p className="text-lg text-slate-300 leading-relaxed max-w-3xl">
          An AI-powered urban traffic congestion forecasting and intelligent route recommendation platform engineered specifically for Bengaluru's complex arterial road network.
        </p>
      </div>

      {/* The Problem & The Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-2xl bg-surface/70 border border-surface-border space-y-4">
          <span className="text-xs font-mono uppercase text-rose-400 font-semibold block">01 // The Problem</span>
          <h3 className="text-xl font-semibold text-white">Urban Gridlock in Bengaluru</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Bengaluru is globally recognized for acute urban traffic bottlenecks. Commuters rely on static map engines that calculate travel time assuming constant road velocity or lagging probes, frequently routing thousands of vehicles directly into saturated corridor bottlenecks like Silk Board, Sarjapur Road, and Hebbal.
          </p>
          <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-surface-border/50">
            <li className="flex items-center gap-2">• Inability to anticipate next-day bottleneck formations</li>
            <li className="flex items-center gap-2">• Delayed emergency fleet response times</li>
            <li className="flex items-center gap-2">• Lack of empirical data-driven municipal intervention triggers</li>
          </ul>
        </div>

        <div className="p-8 rounded-2xl bg-surface/70 border border-surface-border space-y-4">
          <span className="text-xs font-mono uppercase text-accent font-semibold block">02 // The Solution</span>
          <h3 className="text-xl font-semibold text-white">Predictive Traffic Intelligence</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            CITYFLOW AI synthesizes 2.5 years of continuous daily Bengaluru road sensor telemetry (8,936 observations) with meteorological sensor data (22,848 hourly weather readings). By learning multi-day volume inertia and localized saturation thresholds, it accurately predicts next-day congestion levels across 16 arterial corridors.
          </p>
          <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-surface-border/50">
            <li className="flex items-center gap-2">• Next-day road-level congestion and speed forecasts</li>
            <li className="flex items-center gap-2">• Predictive OSRM route duration modifiers</li>
            <li className="flex items-center gap-2">• Municipal decision support and emergency dispatch corridors</li>
          </ul>
        </div>
      </div>

      {/* Rigorous ML Architecture */}
      <div className="p-8 rounded-2xl bg-surface-elevated/40 border border-surface-border space-y-6">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold text-white tracking-tight">Machine Learning Methodology</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-background border border-surface-border space-y-1">
            <span className="text-slate-400 uppercase text-[10px]">Congestion Forecaster</span>
            <span className="text-sm font-bold text-white block">Tuned Random Forest</span>
            <span className="text-accent text-[11px]">MAE 16.34 | RMSE 20.84 | R² 0.24</span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-surface-border space-y-1">
            <span className="text-slate-400 uppercase text-[10px]">Traffic Volume Forecaster</span>
            <span className="text-sm font-bold text-white block">Tuned Random Forest</span>
            <span className="text-accent text-[11px]">MAE 8,565 | RMSE 10,583 | R² 0.32</span>
          </div>

          <div className="p-4 rounded-xl bg-background border border-surface-border space-y-1">
            <span className="text-slate-400 uppercase text-[10px]">Average Speed Model</span>
            <span className="text-sm font-bold text-white block">Linear Regression</span>
            <span className="text-accent text-[11px]">MAE 8.42 km/h (Corridor Mean)</span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            <strong>Zero Data Leakage:</strong> All rolling features are strictly formulated with a <code className="text-accent font-mono">shift(1).rolling(w).mean()</code> structure. Lags and rolling aggregates are calculated strictly within isolated road corridor groups, ensuring that current or future observations never infiltrate historical features.
          </p>
          <p>
            <strong>Chronological Splitting:</strong> The dataset was split strictly by unique calendar dates (70% Train: Jan 2022 – Oct 2023; 15% Validation: Oct 2023 – Mar 2024; 15% Test: Mar 2024 – Aug 2024). Models were tuned exclusively using TimeSeriesSplit on training data.
          </p>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Technology Architecture</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techStack.map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-surface border border-surface-border space-y-1 text-xs">
              <span className="text-[10px] font-mono text-accent uppercase">{item.category}</span>
              <div className="text-sm font-bold text-white">{item.name}</div>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team CTA */}
      <div className="p-8 rounded-2xl bg-surface border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Explore the Live System</h3>
          <p className="text-xs text-slate-400 mt-1">Navigate using our simulated route optimizer or inspect municipality hotspots.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/citizen"
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium font-mono transition-colors"
          >
            Citizen Portal
          </Link>
          <Link
            to="/authority"
            className="px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface-border text-white text-xs font-medium font-mono transition-colors border border-surface-border"
          >
            Authority Center
          </Link>
        </div>
      </div>
    </div>
  );
}
