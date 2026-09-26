import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Navigation, ArrowRight, Activity, ShieldCheck, Sparkles, Compass } from 'lucide-react';

export default function CitizenPortal() {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (fromQuery.trim()) params.set('from', fromQuery.trim());
    if (toQuery.trim()) params.set('to', toQuery.trim());
    navigate(`/citizen/route?${params.toString()}`);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light dark:bg-sky-950/60 text-accent dark:text-sky-300 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Urban Mobility</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
          Plan Smarter. <br />
          <span className="text-accent">Travel Better.</span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Find better routes and understand the traffic ahead with AI-powered urban intelligence.
        </p>
      </div>

      {/* Main Journey Search Card */}
      <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft-xl max-w-3xl mx-auto w-full mb-14 transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-accent" />
          <span>Where are you going?</span>
        </h2>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span>FROM</span>
              </label>
              <input
                type="text"
                value={fromQuery}
                onChange={(e) => setFromQuery(e.target.value)}
                placeholder="Search a location in India (e.g. Hyderabad, Delhi)"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>TO</span>
              </label>
              <input
                type="text"
                value={toQuery}
                onChange={(e) => setToQuery(e.target.value)}
                placeholder="Search destination (e.g. Bengaluru, Pune)"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition-all shadow-md shadow-accent/25 flex items-center justify-center gap-2"
          >
            <span>Find Routes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Two Direct Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
        {/* Card 1: Plan Journey */}
        <Link
          to="/citizen/route"
          className="group bg-white dark:bg-slate-900 hover:bg-sky-50/40 dark:hover:bg-slate-800/80 border border-surface-border dark:border-slate-800 hover:border-accent/40 rounded-3xl p-7 transition-all shadow-soft hover:shadow-soft-lg flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-accent-light dark:bg-sky-950/60 text-accent dark:text-sky-300 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Plan Journey
            </h3>

            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-normal">
              Explore driving routes, estimated travel times, distance calculations, and traffic conditions across Indian road networks.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 text-accent font-bold text-sm group-hover:translate-x-1 transition-transform">
            <span>Open Route Planner</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Card 2: Traffic Prediction */}
        <Link
          to="/citizen/traffic"
          className="group bg-white dark:bg-slate-900 hover:bg-sky-50/40 dark:hover:bg-slate-800/80 border border-surface-border dark:border-slate-800 hover:border-accent/40 rounded-3xl p-7 transition-all shadow-soft hover:shadow-soft-lg flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Traffic Prediction
            </h3>

            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-normal">
              Check expected traffic conditions, vehicle volumes, and speed forecasts for key corridors before heading out.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm group-hover:translate-x-1 transition-transform">
            <span>Forecast Road Traffic</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
