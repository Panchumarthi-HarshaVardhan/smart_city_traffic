import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Shield, MapPin, Compass, AlertTriangle, Menu, X, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { name: 'Overview', path: '/' },
    { 
      name: 'Citizen Portal', 
      path: '/citizen', 
      badge: 'Public',
      subLinks: [
        { name: 'Route Planning', path: '/citizen/route', icon: Compass },
        { name: 'Traffic Intelligence', path: '/citizen/traffic', icon: MapPin },
      ]
    },
    { 
      name: 'Authority Center', 
      path: '/authority', 
      badge: 'Decision Support',
      subLinks: [
        { name: 'Hotspot Diagnostics', path: '/authority/hotspots', icon: AlertTriangle },
        { name: 'Emergency Routing', path: '/authority/emergency', icon: Shield },
      ]
    },
    { name: 'About', path: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-accent group-hover:border-accent/40 transition-colors">
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-white text-base">CITYFLOW</span>
                <span className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/20">AI</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider">BENGALURU</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <div key={link.name} className="relative group">
                  <Link
                    to={link.path}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      active
                        ? 'text-white bg-surface-elevated border border-surface-border'
                        : 'text-slate-400 hover:text-white hover:bg-surface/50'
                    }`}
                  >
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-surface text-slate-400 border border-surface-border">
                        {link.badge}
                      </span>
                    )}
                  </Link>

                  {/* Dropdown if sublinks */}
                  {link.subLinks && (
                    <div className="absolute left-0 mt-1 w-52 rounded-lg bg-surface border border-surface-border shadow-xl opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all p-1">
                      {link.subLinks.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = location.pathname === sub.path;
                        return (
                          <Link
                            key={sub.name}
                            to={sub.path}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                              subActive ? 'bg-accent/15 text-accent' : 'text-slate-300 hover:bg-surface-elevated hover:text-white'
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sub.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Action Portals CTA */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              to="/citizen/route"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-surface border border-transparent hover:border-surface-border transition-colors flex items-center gap-1"
            >
              <span>Plan Journey</span>
            </Link>
            <Link
              to="/authority"
              className="text-xs font-medium text-white bg-accent hover:bg-accent-hover px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1 shadow-sm shadow-accent/20"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Authority Center</span>
              <ArrowUpRight className="w-3 h-3 opacity-70" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-surface border border-surface-border"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-surface-border bg-surface px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-surface-elevated"
            >
              Overview
            </Link>
            <div className="pt-2 pb-1 text-xs font-mono uppercase text-slate-500 px-3">Citizen Experience</div>
            <Link
              to="/citizen"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-surface-elevated"
            >
              Citizen Portal Home
            </Link>
            <Link
              to="/citizen/route"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-surface-elevated pl-6"
            >
              → AI Route Planning
            </Link>
            <Link
              to="/citizen/traffic"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-surface-elevated pl-6"
            >
              → Bengaluru Traffic Map
            </Link>

            <div className="pt-3 pb-1 text-xs font-mono uppercase text-slate-500 px-3">Authority Suite</div>
            <Link
              to="/authority"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-surface-elevated"
            >
              Traffic Intelligence Center
            </Link>
            <Link
              to="/authority/hotspots"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-surface-elevated pl-6"
            >
              → Corridor Hotspot Diagnostics
            </Link>
            <Link
              to="/authority/emergency"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-surface-elevated pl-6"
            >
              → Emergency Route Support
            </Link>

            <div className="pt-2">
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-surface-elevated"
              >
                About CityFlow AI
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
