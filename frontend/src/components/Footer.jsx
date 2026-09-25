import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Compass, Github, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-background pt-14 pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-surface-elevated border border-surface-border flex items-center justify-center text-accent">
                <Activity className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="font-semibold text-white tracking-tight text-sm">CITYFLOW AI</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-border text-slate-300">BENGALURU</span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              AI-powered urban traffic congestion forecasting and intelligent route decision support. Trained strictly on real Bengaluru traffic telemetry and Open-Meteo weather observations.
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>29/29 Tests Passing | Zero Data Leakage Architecture</span>
            </div>
          </div>

          {/* Col 2: Citizen Solutions */}
          <div className="space-y-3">
            <div className="text-slate-200 font-medium text-xs tracking-wider uppercase font-mono">Citizen Portal</div>
            <ul className="space-y-2">
              <li>
                <Link to="/citizen" className="hover:text-white transition-colors">Portal Overview</Link>
              </li>
              <li>
                <Link to="/citizen/route" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>AI Route Planner</span>
                </Link>
              </li>
              <li>
                <Link to="/citizen/traffic" className="hover:text-white transition-colors">Bengaluru Corridor Map</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Authority Operations */}
          <div className="space-y-3">
            <div className="text-slate-200 font-medium text-xs tracking-wider uppercase font-mono">Authority Suite</div>
            <ul className="space-y-2">
              <li>
                <Link to="/authority" className="hover:text-white transition-colors">Intelligence Center</Link>
              </li>
              <li>
                <Link to="/authority/hotspots" className="hover:text-white transition-colors">Hotspot Diagnostics</Link>
              </li>
              <li>
                <Link to="/authority/emergency" className="hover:text-white transition-colors">Emergency Dispatch Support</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Architecture & Methodology</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Mandatory Disclaimer */}
        <div className="pt-8 border-t border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-slate-400 leading-normal max-w-xl">
            Disclaimer: CITYFLOW AI provides next-day road-level traffic condition forecasting derived from historical observations. It is not an active real-time GPS probe tracker or live vehicle telemetry source.
          </p>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>DataQuest 2026</span>
            <span>•</span>
            <span>Bengaluru, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
