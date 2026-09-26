import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { geocodeLocation } from '../services/geocodingService';
import { CITIES } from '../config/cities';
import {
  MapPin,
  Home,
  Navigation,
  Search,
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';

export default function Onboarding() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [homeLocation, setHomeLocation] = useState({
    city: profile?.home_city || 'Bengaluru',
    state: profile?.home_state || 'Karnataka',
    displayName: profile?.home_display_name || 'Bengaluru, Karnataka, India',
    latitude: profile?.home_latitude || 12.9716,
    longitude: profile?.home_longitude || 77.5946,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const [saving, setSaving] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);
    try {
      const res = await geocodeLocation(searchQuery);
      const parts = res.displayName.split(',').map((p) => p.trim());
      setHomeLocation({
        city: parts[0] || searchQuery.trim(),
        state: parts[1] || 'India',
        displayName: res.displayName,
        latitude: res.latitude,
        longitude: res.longitude,
      });
      setSearchQuery('');
    } catch (err) {
      setSearchError(err.message || 'Location not found. Try searching a major city or district.');
    } finally {
      setSearching(false);
    }
  };

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
            const city = addr.city || addr.town || addr.village || 'My Location';
            const state = addr.state || '';
            setHomeLocation({
              city,
              state,
              displayName: data.display_name || `${city}, India`,
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
        } catch (e) {
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
            ? 'Location access was denied. You can search or select a city below.'
            : 'Unable to retrieve location.'
        );
      },
      { timeout: 10000 }
    );
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: profile?.full_name || user?.user_metadata?.full_name || 'Citizen',
        home_city: homeLocation.city,
        home_state: homeLocation.state,
        home_display_name: homeLocation.displayName,
        home_latitude: homeLocation.latitude,
        home_longitude: homeLocation.longitude,
      });
      navigate('/citizen');
    } catch (err) {
      console.error('Failed to update home location:', err);
      // Still allow navigation
      navigate('/citizen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent text-white shadow-lg shadow-accent/25 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Set Your Home Location
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Configuring your primary home hub powers 1-click route planning, commute alerts, and local congestion forecasts.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
          {/* Active Choice Preview */}
          <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-xs">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Selected: {homeLocation.city}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-light dark:bg-accent/20 text-accent dark:text-accent-light font-semibold">
                    Home Base
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {homeLocation.displayName}
                </div>
              </div>
            </div>
          </div>

          {/* Option A: Browser Geolocation */}
          <div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={geoLocating}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-surface-border dark:border-slate-700 hover:border-accent dark:hover:border-accent text-slate-800 dark:text-slate-200 hover:text-accent dark:hover:text-accent-light font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Navigation className={`w-4 h-4 text-accent ${geoLocating ? 'animate-spin' : ''}`} />
              <span>{geoLocating ? 'Detecting current location...' : 'Use My Current Location'}</span>
            </button>
            {geoError && (
              <p className="text-xs text-rose-600 mt-1.5 text-center">{geoError}</p>
            )}
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              or search
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          {/* Option B: Search Location */}
          <div>
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
                      handleSearch();
                    }
                  }}
                  placeholder="Enter city or neighborhood..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs transition-colors disabled:opacity-40"
              >
                {searching ? 'Finding...' : 'Search'}
              </button>
            </div>
            {searchError && (
              <p className="text-xs text-rose-600 mt-1.5">{searchError}</p>
            )}
          </div>

          {/* Option C: Quick Hub Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Popular Cities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CITIES.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setHomeLocation({
                      city: c.name,
                      state: c.state,
                      displayName: `${c.name}, ${c.state}, India`,
                      latitude: c.latitude,
                      longitude: c.longitude,
                    });
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    homeLocation.city === c.name
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-surface-border dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="w-full py-3.5 px-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition-all shadow-md shadow-accent/25 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                to="/citizen"
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Skip for now, go to Citizen Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
