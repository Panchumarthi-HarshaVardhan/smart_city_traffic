import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, profile, isAuthenticated, isAuthority, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Checking authorization credentials...</p>
      </div>
    );
  }

  // If unauthenticated:
  if (!isAuthenticated || !user) {
    if (requiredRole === 'authority') {
      return <Navigate to="/authority/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If Authority role required:
  if (requiredRole === 'authority') {
    if (!isAuthority) {
      // Authenticated citizen attempting to enter Authority portal
      return (
        <Navigate
          to="/authority/login"
          state={{
            from: location,
            unauthorizedError:
              'Access denied. Your account is registered as Citizen. Authority Operations Center requires authorized operator credentials.',
          }}
          replace
        />
      );
    }
  }

  return children;
}

