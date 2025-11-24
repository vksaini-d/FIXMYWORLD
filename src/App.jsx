import React, { useState, useEffect, useMemo } from 'react';
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
    const handleOffline = () => toast.error('You are offline. Some features may be limited.');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      toast.error('You are offline. Some features may be limited.');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Weather Helper
  const fetchWeather = async (lat, lon) => {
    if (!navigator.onLine) return null; // Skip if offline
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

  // 1. Sync Global Weather (Background Effects) based on User Location
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

  // 2. Handle Map Center Weather Fetching
  const handleMapCenterChange = async (center) => {
    if (!center) return;
    // Debounce could be added here if needed, but for now we fetch on moveend
    const data = await fetchWeather(center.lat, center.lng);
    if (data) setMapCenterWeather(data);
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
      case 'pothole': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'garbage-dump': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'broken-streetlight': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'water-leakage': return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
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
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <span className="text-2xl font-orbitron text-cyan-400 animate-pulse">Initializing System...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full font-share-tech text-gray-200 bg-black bg-gradient-to-br from-gray-900 via-black to-blue-900">
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
    <div className="flex w-full h-[100dvh] overflow-hidden font-share-tech text-gray-200 bg-black bg-gradient-to-br from-gray-900 via-black to-blue-900">
      <WeatherEffects weatherCondition={weather?.condition} />
      <Toaster position="top-center" toastOptions={{ style: { background: '#1f2937', color: '#fff', border: '1px solid rgba(6, 182, 212, 0.3)' } }} />

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
            <div className="overflow-y-auto p-4 h-full scrollbar-hide">
              {view === 'analytics' && <AnalyticsView data={analyticsData} />}
              {view === 'report' && <ReportIssueView db={db} userId={user.uid} onIssueReported={() => setView('dashboard')} />}
              {view === 'detail' && <IssueDetailView issue={selectedIssue} handleBack={handleBack} getCategoryClass={getCategoryClass} db={db} userId={user.uid} />}
            </div>
          )}
        </main>

        <Footer weather={weather} />
      </div>
    </div>
  );
}