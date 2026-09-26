import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Globe2, Shield, Compass } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-surface-border dark:border-slate-800 bg-white dark:bg-slate-950 pt-12 pb-10 text-slate-600 dark:text-slate-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Identity */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2 group inline-flex" title="Return to Public Landing Page">
              <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center font-bold group-hover:bg-accent-hover transition-colors">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base group-hover:text-accent transition-colors">CITYFLOW AI</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-light dark:bg-accent/20 text-accent">India</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm leading-relaxed">
              AI-powered urban traffic intelligence for India's cities. Find nationwide routes and forecast road conditions before you travel.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <div className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">Plan & Travel</div>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/citizen" className="hover:text-accent transition-colors">Citizen Home</Link>
              </li>
              <li>
                <Link to="/citizen/route" className="hover:text-accent transition-colors">Plan Journey</Link>
              </li>
              <li>
                <Link to="/citizen/traffic" className="hover:text-accent transition-colors">Traffic Prediction</Link>
              </li>
            </ul>
          </div>

          {/* Authority & About */}
          <div className="space-y-2.5">
            <div className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">Intelligence</div>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/authority" className="hover:text-accent transition-colors">Traffic Intelligence Center</Link>
              </li>
              <li>
                <Link to="/authority/hotspots" className="hover:text-accent transition-colors">Hotspot Diagnostics</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-accent transition-colors">About & Technology</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 dark:text-slate-500 text-[11px]">
          <p>
            CITYFLOW AI • DataQuest 2026 • AI-Powered Urban Traffic Intelligence for India
          </p>
          <p className="text-right">
            OpenStreetMap &copy; Contributors • AI Forecast Models
          </p>
        </div>
      </div>
    </footer>
  );
}
