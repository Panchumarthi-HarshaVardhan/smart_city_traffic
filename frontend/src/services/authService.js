/**
 * CITYFLOW AI - Supabase Authentication & Profile Service
 * Production-ready wrapper for Supabase Auth with session persistence,
 * profile synchronization, and friendly error translation.
 */

import { supabase } from './supabaseClient';

/**
 * Translate raw Supabase errors into human-friendly messages
 */
export function formatAuthError(error) {
  if (!error) return 'An unexpected error occurred.';
  const msg = error.message || String(error);

  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Email or password is incorrect.';
  }
  if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Please verify your email address before signing in. Check your inbox for the confirmation link.';
  }
  if (msg.includes('User already registered') || msg.includes('already_registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (msg.includes('Password should be at least')) {
    return 'Please choose a stronger password (minimum 6 characters).';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
    return 'Unable to connect to the authentication server. Please check your network connection.';
  }
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
    return 'Too many attempts. Please wait a few moments before trying again.';
  }

  return msg;
}

/**
 * Register a new user with email, password, and full name
 */
export async function signUp(email, password, fullName) {
  try {
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: trimmedName,
          role: 'citizen',
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) throw error;

    const user = data.user;
    const session = data.session;

    // If an active session was created immediately (email confirmation disabled/auto-confirm),
    // attempt to initialize the relational profile record
    if (user && session) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: trimmedName,
          role: 'citizen',
          updated_at: new Date().toISOString(),
        });
      } catch (profileErr) {
        // Table might not exist yet; metadata in auth.users is already saved
        console.warn('Profile table insert notice:', profileErr);
      }
    }

    return {
      user,
      session,
      needsEmailConfirmation: !session,
    };
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

/**
 * Sign in existing user with email and password
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    return {
      user: data.user,
      session: data.session,
    };
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

/**
 * Quick 1-click Sign In as Citizen for evaluations and demos.
 */
export async function signInDemoCitizen() {
  const demoEmail = 'citizen.demo@cityflow.ai';
  const demoPass = 'CityflowCitizen2026!';

  try {
    return await signIn(demoEmail, demoPass);
  } catch (signInErr) {
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPass,
        options: {
          data: {
            full_name: 'Demo Citizen Traveler',
            role: 'citizen',
            home_city: 'Bengaluru',
            home_state: 'Karnataka',
          },
        },
      });

      if (signUpErr) throw signUpErr;

      if (signUpData.session) {
        return {
          user: signUpData.user,
          session: signUpData.session,
        };
      }

      return await signIn(demoEmail, demoPass);
    } catch (provisionErr) {
      console.error('Demo citizen provisioning notice:', provisionErr);
      throw new Error(formatAuthError(provisionErr));
    }
  }
}

/**
 * Sign in specifically for Authority Operations Center operators
 * Validates authority role and enforces role separation.
 */
export async function signInAuthority(email, password) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) throw error;

    const user = data.user;
    const meta = user?.user_metadata || {};
    const isAuthority =
      meta.role === 'authority' ||
      cleanEmail === 'authority.demo@cityflow.ai' ||
      cleanEmail === 'emergency.demo@cityflow.ai';

    if (!isAuthority) {
      // Disallow citizen account from authority portal
      await supabase.auth.signOut();
      throw new Error(
        'Access denied. This account has Citizen privileges only. Please sign in with an authorized Authority account.'
      );
    }

    // Ensure role is explicitly set to authority
    if (meta.role !== 'authority') {
      try {
        await supabase.auth.updateUser({
          data: { role: 'authority' },
        });
      } catch (e) {}
    }

    return {
      user: data.user,
      session: data.session,
    };
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

/**
 * Quick 1-click Sign In as Verified Authority Operator for evaluations and demos.
 */
export async function signInDemoAuthority() {
  const demoEmail = 'authority.demo@cityflow.ai';
  const demoPass = 'CityFlowDemo@2026';

  try {
    // 1. Try signing in directly
    return await signInAuthority(demoEmail, demoPass);
  } catch (signInErr) {
    // 2. If user does not exist yet, provision in Supabase Auth
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPass,
        options: {
          data: {
            full_name: 'Demo Authority Operator',
            role: 'authority',
            agency: 'Bengaluru Traffic & Operations Center',
          },
        },
      });

      if (signUpErr) throw signUpErr;

      if (signUpData.session) {
        return {
          user: signUpData.user,
          session: signUpData.session,
        };
      }

      // If signup succeeded without instant session, sign in
      return await signInAuthority(demoEmail, demoPass);
    } catch (provisionErr) {
      console.error('Demo authority provisioning notice:', provisionErr);
      throw new Error(formatAuthError(provisionErr));
    }
  }
}

/**
 * Quick 1-click Sign In as Demo Emergency Controller for evaluations and demos.
 */
export async function signInDemoEmergency() {
  const demoEmail = 'emergency.demo@cityflow.ai';
  const demoPass = 'CityFlowEmergency@2026';

  try {
    return await signInAuthority(demoEmail, demoPass);
  } catch (signInErr) {
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPass,
        options: {
          data: {
            full_name: 'Demo Emergency Controller',
            role: 'authority',
            agency: 'Bengaluru Emergency Dispatch Command',
          },
        },
      });

      if (signUpErr) throw signUpErr;

      if (signUpData.session) {
        return {
          user: signUpData.user,
          session: signUpData.session,
        };
      }

      return await signInAuthority(demoEmail, demoPass);
    } catch (provisionErr) {
      console.error('Demo emergency provisioning notice:', provisionErr);
      throw new Error(formatAuthError(provisionErr));
    }
  }
}

/**
 * Sign out the currently authenticated user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

/**
 * Retrieve the current active session
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (err) {
    console.error('Failed to get session:', err);
    return null;
  }
}

/**
 * Retrieve current authenticated user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (err) {
    return null;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

/**
 * Update user password (from authenticated session or reset token flow)
 */
export async function updatePassword(newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

/**
 * Retrieve user profile including home location
 */
export async function getProfile(targetUser = null) {
  try {
    const user = targetUser || (await getCurrentUser());
    if (!user) return null;

    let profileFromTable = null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        profileFromTable = data;
      }
    } catch (e) {
      // Table may be absent or not yet created
    }

    // Merge with user metadata for guaranteed persistence
    const meta = user.user_metadata || {};
    const role =
      profileFromTable?.role ||
      meta.role ||
      (user.email?.toLowerCase().includes('authority') ? 'authority' : 'citizen');

    return {
      id: user.id,
      email: user.email,
      role: role,
      full_name: profileFromTable?.full_name || meta.full_name || user.email?.split('@')[0] || (role === 'authority' ? 'Authority Officer' : 'Citizen'),
      home_city: profileFromTable?.home_city || meta.home_city || null,
      home_state: profileFromTable?.home_state || meta.home_state || null,
      home_display_name: profileFromTable?.home_display_name || meta.home_display_name || null,
      home_latitude: profileFromTable?.home_latitude ?? meta.home_latitude ?? null,
      home_longitude: profileFromTable?.home_longitude ?? meta.home_longitude ?? null,
      created_at: profileFromTable?.created_at || user.created_at,
    };
  } catch (err) {
    console.error('getProfile error:', err);
    return null;
  }
}

/**
 * Update user profile and home location
 */
export async function updateProfile(profileData) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('No active user session found.');

    // 1. Update user metadata in Supabase Auth (persists across all auth tokens & reloads)
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        full_name: profileData.full_name,
        home_city: profileData.home_city,
        home_state: profileData.home_state,
        home_display_name: profileData.home_display_name,
        home_latitude: profileData.home_latitude,
        home_longitude: profileData.home_longitude,
      },
    });

    if (metaError) throw metaError;

    // 2. Also upsert to relational profiles table if available
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: profileData.full_name,
        home_city: profileData.home_city,
        home_state: profileData.home_state,
        home_display_name: profileData.home_display_name,
        home_latitude: profileData.home_latitude,
        home_longitude: profileData.home_longitude,
        updated_at: new Date().toISOString(),
      });
    } catch (tblErr) {
      console.warn('Profile table upsert skipped:', tblErr);
    }

    return await getProfile(user);
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}
