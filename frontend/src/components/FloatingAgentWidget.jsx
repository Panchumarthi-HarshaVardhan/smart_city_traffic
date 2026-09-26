import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import TrafficAgentChat from './TrafficAgentChat';

export default function FloatingAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const pathname = location.pathname;
  // Determine role: Authority if in authority section, otherwise citizen
  const isAuthority = pathname.startsWith('/authority');
  const role = isAuthority ? 'authority' : 'citizen';

  // Do not show widget on full-page assistant route to avoid duplicate UI
  if (pathname === '/citizen/assistant') {
    return null;
  }

  return (
    <div className="select-none">
      {isOpen ? (
        <div className="fixed inset-x-3 bottom-3 top-16 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[430px] z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <TrafficAgentChat
            role={role}
            isWidget={true}
            onClose={() => setIsOpen(false)}
          />
        </div>
      ) : (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-3">
          {/* Subtle Desktop Prompt Pill */}
          <div className="hidden md:flex items-center px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800 shadow-soft text-xs font-semibold text-slate-700 dark:text-slate-200 animate-in fade-in slide-in-from-right-3 duration-200">
            <span>Ask CITYFLOW AI</span>
          </div>

          {/* Circular Launcher Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Ask CITYFLOW AI"
            title="Ask CITYFLOW AI"
            className="group relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-accent hover:bg-accent-hover text-white shadow-soft-xl border border-sky-300/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-accent/20"
          >
            <Sparkles className="w-6 h-6 transition-transform group-hover:rotate-12" />

            {/* Online Green Indicator Dot */}
            <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 shadow-xs" />
          </button>
        </div>
      )}
    </div>
  );
}

