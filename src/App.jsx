import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { doc, setDoc } from 'firebase/firestore';

// Hooks
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { useIssues } from './hooks/useIssues';
import { useGeolocation } from './hooks/useGeolocation';

// Components
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { MapDashboardView } from './components/MapDashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReportIssueView } from './components/ReportIssueView';
import { IssueDetailView } from './components/IssueDetailView';
import { LoginOverlay } from './components/LoginOverlay';
import { WeatherEffects } from './components/WeatherEffects';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';

// Constants
import { issueCategories } from './constants';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

export default function App() {
  const [view, setView] = useState('dashboard');
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [weather, setWeather] = useState(null);
  const [mapCenterWeather, setMapCenterWeather] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const weatherTimerRef = useRef(null);

  // Custom Hooks
  const { auth, db, user, isAuthReady, handleGoogleLogin, handleEmailLogin, handleEmailSignup, handleLogout } = useFirebaseAuth();
  const { issues } = useIssues(db);
  const { location: userLocation } = useGeolocation();

  // Sync user name
  useEffect(() => {
    if (user) {
      setUserName(user.displayName || '');
    }
  }, [user]);

  // Network Status Monitoring
  useEffect(() => {
    const handleOnline = () => toast.success('Back online!');
    const handleOffline = () => toast.error('You are offline. Cached data is available.');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      toast.error('You are offline. Cached data is available.');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Weather Helper
  const fetchWeather = async (lat, lon) => {
    if (!navigator.onLine || !WEATHER_API_KEY) return null;
    try {
      const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lon}`;
      const r = await fetch(url);
      const data = await r.json();
      return {
        condition: data.current?.condition?.text,
        icon: data.current?.condition?.icon ? `https:${data.current.condition.icon}` : null,
        temp_c: data.current?.temp_c,
        humidity: data.current?.humidity,
      };
    } catch (e) {
      console.error('Weather fetch error:', e);
      return null;
    }
  };

  // Sync Global Weather based on User Location
  useEffect(() => {
    if (userLocation) {
      fetchWeather(userLocation.lat, userLocation.lng).then(data => {
        if (data) setWeather(data);
      });
    } else {
      // Default fallback (New Delhi)
      fetchWeather(28.6139, 77.2090).then(data => {
        if (data) setWeather(data);
      });
    }
  }, [userLocation]);

  // Handle Map Center Weather Fetching with 600ms Debounce
  const handleMapCenterChange = (center) => {
    if (!center) return;
    if (weatherTimerRef.current) {
      clearTimeout(weatherTimerRef.current);
    }
    weatherTimerRef.current = setTimeout(async () => {
      const data = await fetchWeather(center.lat, center.lng);
      if (data) setMapCenterWeather(data);
    }, 600);
  };

  const handleNameChange = async (e) => {
    const newName = e.target.value;
    setUserName(newName);
    if (db && user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { name: newName }, { merge: true });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleViewChange = (newView) => {
    setView(newView);
    setIsMobileMenuOpen(false);
  };

  const handleViewDetails = (issueId) => {
    setSelectedIssueId(issueId);
    setView('detail');
    setIsMobileMenuOpen(false);
  };

  const handleBack = () => {
    setView('dashboard');
    setSelectedIssueId(null);
  };

  const getCategoryClass = (category) => {
    switch (category) {
      case 'pothole': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'garbage-dump': return 'bg-teal-500/20 text-teal-300 border border-teal-500/30';
      case 'broken-streetlight': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'water-leakage': return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    }
  };

  const filteredIssues = useMemo(() => {
    if (categoryFilter === 'all') return issues;
    return issues.filter((i) => i.category === categoryFilter);
  }, [issues, categoryFilter]);

  const analyticsData = useMemo(() => {
    const total = issues.length;
    const reported = issues.filter((i) => i.status === 'reported').length;
    const inProgress = issues.filter((i) => i.status === 'in-progress').length;
    const resolved = issues.filter((i) => i.status === 'resolved').length;
    const byCategory = issueCategories.reduce((acc, cat) => {
      acc[cat.value] = issues.filter((i) => i.category === cat.value).length;
      return acc;
    }, {});
    return { total, reported, inProgress, resolved, byCategory };
  }, [issues]);

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-950">
        <span className="text-2xl font-orbitron font-bold text-emerald-400 animate-pulse tracking-wider">
          Initializing System Telemetry...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full font-share-tech text-slate-200 bg-neutral-950 bg-gradient-to-br from-neutral-950 via-slate-950 to-stone-950">
        <WeatherEffects weatherCondition={weather?.condition} />
        <LoginOverlay
          onGoogleLogin={handleGoogleLogin}
          onEmailLogin={handleEmailLogin}
          onEmailSignup={handleEmailSignup}
        />
        <Toaster position="top-center" />
      </div>
    );
  }

  const selectedIssue = issues.find((i) => i.id === selectedIssueId);

  return (
    <div className="flex w-full h-[100dvh] overflow-hidden font-share-tech text-slate-200 bg-neutral-950 bg-gradient-to-br from-neutral-950 via-slate-950 to-stone-950">
      <WeatherEffects weatherCondition={weather?.condition} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(20px)',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
          },
        }}
      />

      <Sidebar
        user={user}
        userName={userName}
        onNameChange={handleNameChange}
        view={view}
        setView={handleViewChange}
        selectedIssueId={selectedIssueId}
        setSelectedIssueId={setSelectedIssueId}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleLogout={handleLogout}
      />

      <div className="flex flex-1 flex-col h-full w-full md:pl-64 transition-all duration-300 relative z-0">
        <MobileHeader isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        <main className="flex-grow flex flex-col overflow-hidden relative w-full">
          {view === 'dashboard' ? (
            <MapDashboardView
              issues={issues}
              filteredIssues={filteredIssues}
              handleViewDetails={handleViewDetails}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              getCategoryClass={getCategoryClass}
              onMapCenterChange={handleMapCenterChange}
              weatherAtCenter={mapCenterWeather}
            />
          ) : (
            <div className="overflow-y-auto p-4 sm:p-6 h-full scrollbar-hide">
              {view === 'analytics' && <AnalyticsView data={analyticsData} />}
              {view === 'report' && <ReportIssueView db={db} userId={user.uid} onIssueReported={() => setView('dashboard')} />}
              {view === 'detail' && <IssueDetailView issue={selectedIssue} handleBack={handleBack} getCategoryClass={getCategoryClass} db={db} userId={user.uid} />}
            </div>
          )}
        </main>

        <Footer weather={weather} />
        <BottomNav view={view} setView={handleViewChange} />
      </div>
    </div>
  );
}
