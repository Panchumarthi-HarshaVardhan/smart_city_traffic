/**
 * CITYFLOW AI - Authentication Context & Provider
 * Manages Supabase Auth session, user profile state, and reactive listener.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refresh profile from Supabase
  const refreshProfile = async (targetUser = null) => {
    const u = targetUser || user;
    if (!u) {
      setProfile(null);
      return null;
    }
    const prof = await authService.getProfile(u);
    setProfile(prof);
    return prof;
  };

  // Initialize session on mount and attach reactive auth listener
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const initialSession = await authService.getCurrentSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);

          if (initialSession?.user) {
            const prof = await authService.getProfile(initialSession.user);
            if (mounted) setProfile(prof);
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to real-time auth events (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          const prof = await authService.getProfile(currentSession.user);
          if (mounted) setProfile(prof);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, fullName) => {
    const result = await authService.signUp(email, password, fullName);
    if (result.user && result.session) {
      setUser(result.user);
      setSession(result.session);
      await refreshProfile(result.user);
    }
    return result;
  };

  const signIn = async (email, password) => {
    const result = await authService.signIn(email, password);
    setUser(result.user);
    setSession(result.session);
    await refreshProfile(result.user);
    return result;
  };

  const signInDemoCitizen = async () => {
    const result = await authService.signInDemoCitizen();
    setUser(result.user);
    setSession(result.session);
    await refreshProfile(result.user);
    return result;
  };

  const signInAuthority = async (email, password) => {
    const result = await authService.signInAuthority(email, password);
    setUser(result.user);
    setSession(result.session);
    await refreshProfile(result.user);
    return result;
  };

  const signInDemoAuthority = async () => {
    const result = await authService.signInDemoAuthority();
    setUser(result.user);
    setSession(result.session);
    await refreshProfile(result.user);
    return result;
  };

  const signInDemoEmergency = async () => {
    const result = await authService.signInDemoEmergency();
    setUser(result.user);
    setSession(result.session);
    await refreshProfile(result.user);
    return result;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email) => {
    return await authService.resetPassword(email);
  };

  const updateProfile = async (profileData) => {
    const updated = await authService.updateProfile(profileData);
    setProfile(updated);
    return updated;
  };

  const isAuthority =
    profile?.role === 'authority' ||
    user?.user_metadata?.role === 'authority' ||
    user?.email === 'authority.demo@cityflow.ai' ||
    user?.email === 'emergency.demo@cityflow.ai';

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInDemoCitizen,
    signInAuthority,
    signInDemoAuthority,
    signInDemoEmergency,
    signOut,
    resetPassword,
    refreshProfile,
    updateProfile,
    isAuthenticated: !!user,
    isAuthority: !!isAuthority,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
