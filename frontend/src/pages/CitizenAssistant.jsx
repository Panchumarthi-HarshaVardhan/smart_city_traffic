import React from 'react';
import { Sparkles, Radio, Compass, TrendingUp, Shield, Info, ArrowRight } from 'lucide-react';
import TrafficAgentChat from '../components/TrafficAgentChat';

export default function CitizenAssistant() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* ── Page Hero Header ── */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Grounded Urban Mobility Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Traffic Intelligence Agent
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl mx-auto">
          Ask conversational questions grounded in real-time sensor speeds, active road obstruction feeds, traffic-aware routes, and validated next-day ML forecasts.
        </p>
      </div>

      {/* ── Main Layout: Chat (8 cols) + Architectural Transparency Card (4 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Chat Interface */}
        <div className="lg:col-span-8">
          <TrafficAgentChat role="citizen" />
        </div>

        {/* Right Column: Architectural Source Transparency & Rules */}
        <div className="lg:col-span-4 space-y-5">
          {/* Data Sources Legend */}
          <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-5 shadow-soft space-y-4 transition-colors">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-accent" />
              <span>Grounded Data Foundations</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-extrabold">
                  <Radio className="w-3.5 h-3.5 text-amber-600" />
                  <span>TomTom Traffic Feed</span>
                </div>
                <p className="text-amber-800 dark:text-amber-400/90 leading-relaxed text-[11px]">
                  Real-time segment speeds, free-flow baselines, and active road obstructions (accidents, construction, closures).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-950 dark:text-sky-300 font-extrabold">
                  <Compass className="w-3.5 h-3.5 text-accent" />
                  <span>Google Routes API</span>
                </div>
                <p className="text-sky-900 dark:text-sky-400/90 leading-relaxed text-[11px]">
                  Live traffic-aware driving duration, delay comparisons, and route alternatives across Indian highways.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-950 dark:text-emerald-300 font-extrabold">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CITYFLOW ML Engine</span>
                </div>
                <p className="text-emerald-900 dark:text-emerald-400/90 leading-relaxed text-[11px]">
                  Next-day predictive machine learning forecasts trained on 7-day persistence & weather patterns (validated for Bengaluru arterial corridors).
                </p>
              </div>
            </div>
          </div>

          {/* Model & Privacy Transparency */}
          <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-5 shadow-soft space-y-3 text-xs text-slate-600 dark:text-slate-400 transition-colors">
            <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Agent Capabilities & Honesty</span>
            </h3>
            <ul className="space-y-2 text-[11px] leading-relaxed list-disc pl-4 text-slate-600 dark:text-slate-400">
              <li>
                <strong>No Fabricated Numbers:</strong> All speeds, delays, and ETAs are retrieved from deterministic backend services before answering.
              </li>
              <li>
                <strong>Coverage Honesty:</strong> Next-day ML forecasting is explicitly identified as Bengaluru-specific. Other cities receive current speeds or routing.
              </li>
              <li>
                <strong>Evidence-Based Congestion:</strong> When answering "Why is traffic bad?", the agent clearly distinguishes verified incident reports from unconfirmed causes.
              </li>
              <li>
                <strong>Zero Secret Leakage:</strong> Groq API keys remain strictly on the backend and are never sent to the browser.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
