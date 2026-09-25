import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import CitizenPortal from './pages/CitizenPortal';
import CitizenRoute from './pages/CitizenRoute';
import CitizenTraffic from './pages/CitizenTraffic';
import AuthorityPortal from './pages/AuthorityPortal';
import AuthorityHotspots from './pages/AuthorityHotspots';
import AuthorityEmergency from './pages/AuthorityEmergency';
import AboutPage from './pages/AboutPage';

// Scroll to top on navigation
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-100 font-sans selection:bg-accent/30 selection:text-white">
      <ScrollToTop />
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/citizen" element={<CitizenPortal />} />
          <Route path="/citizen/route" element={<CitizenRoute />} />
          <Route path="/citizen/traffic" element={<CitizenTraffic />} />
          <Route path="/authority" element={<AuthorityPortal />} />
          <Route path="/authority/hotspots" element={<AuthorityHotspots />} />
          <Route path="/authority/emergency" element={<AuthorityEmergency />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
