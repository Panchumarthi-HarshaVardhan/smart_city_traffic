import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LandingPage from './pages/LandingPage';
import CitizenPortal from './pages/CitizenPortal';
import CitizenRoute from './pages/CitizenRoute';
import CitizenTraffic from './pages/CitizenTraffic';
import AuthorityPortal from './pages/AuthorityPortal';
import AuthorityHotspots from './pages/AuthorityHotspots';
import AuthorityEmergency from './pages/AuthorityEmergency';
import AuthorityIncidents from './pages/AuthorityIncidents';
import AuthorityCongestion from './pages/AuthorityCongestion';
import AuthorityLogin from './pages/AuthorityLogin';
import AmbulanceView from './pages/AmbulanceView';
import AboutPage from './pages/AboutPage';
import CitizenAssistant from './pages/CitizenAssistant';
import FloatingAgentWidget from './components/FloatingAgentWidget';

// Auth Pages
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';

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
    <ThemeProvider>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-background text-slate-900 dark:text-slate-100 font-sans selection:bg-accent/20 selection:text-accent transition-colors duration-200">
          <ScrollToTop />
          <Navbar />

        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Authority Authentication */}
            <Route path="/authority/login" element={<AuthorityLogin />} />

            {/* Protected Authority Routes (Requires Authority Role) */}
            <Route
              path="/authority"
              element={
                <ProtectedRoute requiredRole="authority">
                  <AuthorityPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authority/congestion"
              element={
                <ProtectedRoute requiredRole="authority">
                  <AuthorityCongestion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authority/routes"
              element={
                <ProtectedRoute requiredRole="authority">
                  <AuthorityEmergency />
                </ProtectedRoute>
              }
            />
            {/* Alias /authority/emergency for backward compatibility */}
            <Route
              path="/authority/emergency"
              element={
                <ProtectedRoute requiredRole="authority">
                  <AuthorityEmergency />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authority/hotspots"
              element={
                <ProtectedRoute requiredRole="authority">
                  <AuthorityHotspots />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authority/incidents"
              element={
                <ProtectedRoute requiredRole="authority">
                  <AuthorityIncidents />
                </ProtectedRoute>
              }
            />

            {/* Emergency Vehicle Field HUD */}
            <Route path="/emergency/ambulance" element={<AmbulanceView />} />

            {/* Protected Citizen Routes (Requires Login) */}
            <Route
              path="/citizen"
              element={
                <ProtectedRoute>
                  <CitizenPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/route"
              element={
                <ProtectedRoute>
                  <CitizenRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/traffic"
              element={
                <ProtectedRoute>
                  <CitizenTraffic />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/assistant"
              element={
                <ProtectedRoute>
                  <CitizenAssistant />
                </ProtectedRoute>
              }
            />

            {/* Auth Routes */}
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<LandingPage />} />
          </Routes>
        </main>

        <Footer />
        <FloatingAgentWidget />
      </div>
    </AuthProvider>
  </ThemeProvider>
  );
}
