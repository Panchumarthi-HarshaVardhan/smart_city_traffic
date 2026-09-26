import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { geocodeLocation } from '../services/geocodingService';
import { CITIES } from '../config/cities';
import {
  User,
  Mail,
  Home,
  MapPin,
  Search,
  Check,
  AlertCircle,
  LogOut,
  Navigation,
  Compass,
  ArrowRight,
} from 'lucide-react';

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [homeLocation, setHomeLocation] = useState({
    city: profile?.home_city || '',
    state: profile?.home_state || '',
    displayName: profile?.home_display_name || '',
    latitude: profile?.home_latitude || null,
    longitude: profile?.home_longitude || null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Sync state when profile is loaded or refreshed
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setHomeLocation({
        city: profile.home_city || '',
        state: profile.home_state || '',
        displayName: profile.home_display_name || '',
        latitude: profile.home_latitude || null,
        longitude: profile.home_longitude || null,
      });
    }
  }, [profile]);

  // Geocode address from search input
  const handleLocationSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);
    try {
      const result = await geocodeLocation(searchQuery);
      // Derive city name from display name or query
      const parts = result.displayName.split(',').map((p) => p.trim());
      const cityName = parts[0] || searchQuery.trim();
      const stateName = parts[1] || 'India';

      setHomeLocation({
        city: cityName,
        state: stateName,
        displayName: result.displayName,
        latitude: result.latitude,
        longitude: result.longitude,
      });
      setSearchQuery('');
    } catch (err) {
      setSearchError(err.message || 'Location not found. Please try another Indian city or area.');
    } finally {
      setSearching(false);
    }
  };

  // Browser Geolocation on explicit user click
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Attempt reverse geocoding via Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'CityFlowAI-UrbanTrafficPlanner/1.0',
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || 'My Location';
            const state = addr.state || '';
            const displayName = data.display_name || `${city}, India`;

            setHomeLocation({
              city,
              state,
              displayName,
              latitude,
              longitude,
            });
          } else {
            setHomeLocation({
              city: 'Current Location',
              state: 'India',
              displayName: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
              latitude,
              longitude,
            });
          }
        } catch (err) {
          // Fallback to coordinates
          setHomeLocation({
            city: 'Current Location',
            state: 'India',
            displayName: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
            latitude,
            longitude,
          });
        } finally {
          setGeoLocating(false);
        }
      },
      (err) => {
        setGeoLocating(false);
        setGeoError(
          err.code === 1
            ? 'Location access was denied. Please allow location permissions in your browser or search by city name.'
            : 'Unable to retrieve your current location.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Select predefined city
  const handleSelectCity = (c) => {
    setHomeLocation({
      city: c.name,
      state: c.state,
      displayName: `${c.name}, ${c.state}, India`,
      latitude: c.latitude,
      longitude: c.longitude,
    });
  };

  // Save all profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await updateProfile({
        full_name: fullName.trim(),
        home_city: homeLocation.city,
        home_state: homeLocation.state,
        home_display_name: homeLocation.displayName,
        home_latitude: homeLocation.latitude,
        home_longitude: homeLocation.longitude,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-surface-border dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            User Profile & Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Manage your account credentials and home location for one-click route planning
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Account Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 shadow-soft text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/20 text-accent font-extrabold text-2xl flex items-center justify-center mx-auto shadow-inner">
            {(fullName || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{fullName || 'Citizen'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user?.email}</p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-left space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Saved Home
            </div>
            {homeLocation.displayName ? (
              <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-sky-50/60 dark:bg-sky-950/30 p-3 rounded-2xl border border-sky-100 dark:border-sky-800">
                <Home className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{homeLocation.city || 'Home'}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{homeLocation.displayName}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                No home location configured yet. Set one below for faster commute planning.
              </div>
            )}
          </div>

          {homeLocation.displayName && (
            <button
              onClick={() => navigate(`/citizen/route?from=${encodeURIComponent(homeLocation.city || homeLocation.displayName)}`)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-accent text-white font-semibold text-xs shadow-xs hover:bg-accent-hover transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Plan Route from Home</span>
            </button>
          )}
        </div>

        {/* Right Column: Profile & Home Location Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
            {saveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                <Check className="w-4 h-4 shrink-0" />
                <span className="font-medium">Profile and home location updated successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Section: Personal Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                <span>Personal Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-surface-border dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Managed by Supabase Auth
                  </span>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Section: Home Location */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Home className="w-4 h-4 text-accent" />
                  <span>Configured Home Location</span>
                </h3>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={geoLocating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-accent dark:text-accent-light font-bold text-xs transition-colors"
                >
                  <Navigation className={`w-3.5 h-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
                  <span>{geoLocating ? 'Locating...' : 'Use My Current Location'}</span>
                </button>
              </div>

              {geoError && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                  {geoError}
                </div>
              )}

              {/* Current Selected Home Location View */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-surface-border dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{homeLocation.city || 'No Location Set'}</span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {homeLocation.displayName || 'Search or select your home city below to activate quick home routes.'}
                  </div>
                  {homeLocation.latitude && (
                    <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      Coordinates: {Number(homeLocation.latitude).toFixed(4)}, {Number(homeLocation.longitude).toFixed(4)}
                    </div>
                  )}
                </div>

                {homeLocation.city && (
                  <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Selected
                  </span>
                )}
              </div>

              {/* Search Location Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Search Location or Address
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLocationSearch();
                        }
                      }}
                      placeholder="e.g. Koramangala, Bengaluru or Jubilee Hills, Hyderabad"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLocationSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs transition-colors disabled:opacity-40"
                  >
                    {searching ? 'Finding...' : 'Find'}
                  </button>
                </div>
                {searchError && (
                  <p className="text-xs text-rose-600 mt-1.5">{searchError}</p>
                )}
              </div>

              {/* Quick Hub Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Or select a major hub
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CITIES.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCity(c)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        homeLocation.city === c.name
                          ? 'bg-accent text-white border-accent font-bold shadow-xs'
                          : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-surface-border dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="py-3 px-6 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition-all shadow-md shadow-accent/25 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
