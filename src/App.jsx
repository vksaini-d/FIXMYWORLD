// src/App.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const issueCategories = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'garbage-dump', label: 'Garbage Dump' },
  { value: 'broken-streetlight', label: 'Broken Streetlight' },
  { value: 'water-leakage', label: 'Water Leakage' },
  { value: 'drainage-failure', label: 'Drainage Failure' },
  { value: 'illegal-construction', label: 'Illegal Construction' },
  { value: 'other', label: 'Other' },
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [weather, setWeather] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [issues, setIssues] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');

  // Firebase Init
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      setDb(getFirestore(app));
      const firebaseAuth = getAuth(app);
      setAuth(firebaseAuth);
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) setUserName(currentUser.displayName || '');
        setIsAuthReady(true);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error('Firebase init error:', e);
      setIsAuthReady(true);
    }
  }, []);

  // Auth Handlers
  const handleGoogleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (error) { console.error("Login failed", error); }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
  };

  // Data Sync
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'issues'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setIssues(list);
    }, (err) => console.error('Firestore listener error:', err));
    return () => unsub();
  }, [user, db]);

  // Weather Sync
  useEffect(() => {
    const fetchWeather = (lat, lon) => {
      const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lon}`;
      fetch(url).then((r) => r.json()).then((data) => {
          setWeather({
            condition: data.current?.condition?.text,
            temp_c: data.current?.temp_c,
            humidity: data.current?.humidity,
          });
        }).catch((e) => console.error('Weather fetch error:', e));
    };
    fetchWeather(28.6139, 77.2090);
  }, []);

  const handleNameChange = async (e) => {
    const newName = e.target.value;
    setUserName(newName);
    if (db && user) {
      try { await setDoc(doc(db, 'users', user.uid), { name: newName }, { merge: true }); } 
      catch (err) { console.error(err); }
    }
  };

  const handleViewChange = (newView) => { setView(newView); setIsMobileMenuOpen(false); };
  const handleViewDetails = (issueId) => { setSelectedIssueId(issueId); setView('detail'); setIsMobileMenuOpen(false); };
  const handleBack = () => { setView('dashboard'); setSelectedIssueId(null); };

  const getCategoryClass = (category) => {
    switch (category) {
      case 'pothole': return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'garbage-dump': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'broken-streetlight': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'water-leakage': return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  const [categoryFilter, setCategoryFilter] = useState('all');
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
    return <div className="flex min-h-screen w-full items-center justify-center bg-black"><span className="text-2xl font-orbitron text-cyan-400 animate-pulse">Initializing System...</span></div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full font-share-tech text-gray-200 bg-black bg-gradient-to-br from-gray-900 via-black to-blue-900">
        <GlobalStyles />
        <WeatherEffects weatherCondition={weather?.condition} />
        <LoginOverlay onLogin={handleGoogleLogin} />
      </div>
    );
  }

  const selectedIssue = issues.find((i) => i.id === selectedIssueId);

  return (
    <div className="flex w-full h-[100dvh] overflow-hidden font-share-tech text-gray-200 bg-black bg-gradient-to-br from-gray-900 via-black to-blue-900">
      <GlobalStyles />
      <WeatherEffects weatherCondition={weather?.condition} />
      
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
                />
            ) : (
                <div className="overflow-y-auto p-4 h-full">
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

/* -------------------------------------------------------------------------- */
/* NEW VIBE UI MAP COMPONENTS                                                 */
/* -------------------------------------------------------------------------- */

const StyleSwitcher = ({ currentStyle, setStyle }) => {
  const styles = [
    { id: 'dark', label: 'Dark', icon: <MoonIcon /> },
    { id: 'street', label: 'Street', icon: <MapIcon /> },
    { id: 'satellite', label: 'Sat', icon: <SatelliteIcon /> },
    { id: 'terrain', label: 'Terra', icon: <MountainIcon /> },
  ];

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', marginTop: '60px', marginRight: '10px' }}>
      <div className="leaflet-control flex flex-col gap-2 rounded-xl border border-cyan-500/30 bg-gray-900/90 p-2 shadow-[0_0_20px_rgba(14,165,233,0.2)] backdrop-blur-xl">
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 hover:scale-110 ${
              currentStyle === s.id 
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_#0ea5e9]' 
                : 'bg-transparent text-gray-400 hover:bg-cyan-900/50 hover:text-cyan-300'
            }`}
            title={s.label}
          >
            {s.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

const LiveUserMarker = () => {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const [heading, setHeading] = useState(0); 
  const [accuracy, setAccuracy] = useState(0);

  useEffect(() => {
    const geoId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading: gpsHeading } = pos.coords;
        setPosition([latitude, longitude]);
        setAccuracy(accuracy);
        if (gpsHeading && !isNaN(gpsHeading)) setHeading(gpsHeading);
      },
      (err) => console.warn("Location error:", err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );
    const handleOrientation = (e) => {
      let compass = e.alpha;
      if (e.webkitCompassHeading) compass = e.webkitCompassHeading;
      if (compass) setHeading(360 - compass);
    };
    if (window.DeviceOrientationEvent) window.addEventListener("deviceorientation", handleOrientation, true);
    return () => { navigator.geolocation.clearWatch(geoId); window.removeEventListener("deviceorientation", handleOrientation); };
  }, []);

  const handleLocateClick = (e) => {
    e.stopPropagation();
    if (position) map.flyTo(position, 17, { duration: 1.5 });
    else alert("Acquiring GPS signal...");
  };

  const UserIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="transform: rotate(${heading}deg); transition: transform 0.2s ease;"><div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 30px solid rgba(14, 165, 233, 0.5); margin-left: -2px; margin-top: -15px;"></div><div style="width: 16px; height: 16px; background: #0ea5e9; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px #0ea5e9; position: absolute; top: 10px; left: 0;"></div></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <>
      {position && (<><Marker position={position} icon={UserIcon} zIndexOffset={1000}><Popup>Accuracy: {Math.round(accuracy)}m</Popup></Marker><Circle center={position} radius={accuracy} pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.1, weight: 1 }} /></>)}
      <div className="leaflet-bottom leaflet-right">
        <div className="leaflet-control leaflet-bar">
          <button onClick={handleLocateClick} className="flex h-12 w-12 cursor-pointer items-center justify-center border-2 border-cyan-500 bg-gray-900 text-cyan-400 shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-all hover:bg-cyan-500 hover:text-white" style={{ borderRadius: '50%', marginBottom: '20px', marginRight: '10px', pointerEvents: 'auto' }}>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
          </button>
        </div>
      </div>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* VIEWS (FLEXBOX LAYOUT + SCROLLABLE FILTERS)                                */
/* -------------------------------------------------------------------------- */

const MapDashboardView = ({ issues, filteredIssues, handleViewDetails, categoryFilter, setCategoryFilter, getCategoryClass }) => {
  const defaultCenter = [28.6139, 77.2090];
  const displayIssues = filteredIssues || issues;
  const [mapStyle, setMapStyle] = useState('dark');

  const getTileLayer = () => {
    switch(mapStyle) {
      case 'street': return <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />;
      case 'satellite': return <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />;
      case 'terrain': return <TileLayer attribution='&copy; OpenTopoMap' url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />;
      case 'dark': default: return <TileLayer attribution='&copy; CartoDB' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      
      {/* HORIZONTAL SCROLLABLE FILTERS - Perfect for Android/Mobile */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 py-3 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => setCategoryFilter('all')} className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition-all ${categoryFilter === 'all' ? 'bg-cyan-500 text-black scale-105' : 'bg-gray-900/80 text-gray-300 border border-gray-700 hover:bg-gray-800'}`}>All</button>
        {issueCategories.map((cat) => (
          <button key={cat.value} onClick={() => setCategoryFilter(cat.value)} className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition-all ${categoryFilter === cat.value ? 'bg-cyan-500 text-black scale-105' : 'bg-gray-900/80 text-gray-300 border border-gray-700 hover:bg-gray-800'}`}>{cat.label}</button>
        ))}
      </div>

      <div className="flex-grow w-full border-t border-cyan-500/30 relative z-0">
        <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          {getTileLayer()}
          <StyleSwitcher currentStyle={mapStyle} setStyle={setMapStyle} />
          <LiveUserMarker />
          
          {displayIssues.map((issue) => (
            issue.lat && issue.lng && (
              <Marker key={issue.id} position={[issue.lat, issue.lng]}>
                <Popup>
                  <div className="min-w-[200px] text-gray-900">
                    <h3 className="font-bold">{issue.title || 'Untitled Issue'}</h3>
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${getCategoryClass(issue.category).split(' ')[0]} text-black my-2`}>{issueCategories.find(c => c.value === issue.category)?.label || issue.category}</span>
                    <button onClick={() => handleViewDetails(issue.id)} className="mt-2 w-full rounded bg-cyan-600 px-3 py-1 text-xs text-white hover:bg-cyan-500">View Details</button>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* UI COMPONENTS                                                              */
/* -------------------------------------------------------------------------- */

const Sidebar = ({ user, userName, onNameChange, view, setView, selectedIssueId, setSelectedIssueId, isMobileMenuOpen, setIsMobileMenuOpen, handleLogout }) => {
  const handleNav = (newView) => { if (newView === 'detail' && selectedIssueId) { setView('detail'); } else { setSelectedIssueId(null); setView(newView); } setIsMobileMenuOpen(false); };
  
  return (
    <>
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[2900] transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)} />
      
      <div className={`fixed inset-y-0 left-0 z-[3000] flex w-64 flex-col border-r border-cyan-500/30 bg-black/80 backdrop-blur-xl transition-transform duration-300 ease-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-cyan-500/30 px-4">
            <span className="text-2xl font-orbitron font-extrabold text-cyan-400" style={{ textShadow: '0 0 5px #0ea5e9' }}>🌍 FixMyWorld</span>
            <button type="button" className="text-cyan-400 md:hidden" onClick={() => setIsMobileMenuOpen(false)}><XIcon /></button>
        </div>
        <div className="flex-grow overflow-y-auto py-2">
            <nav className="space-y-1 px-2">
                <NavItem label="Dashboard" icon={<HomeIcon />} isActive={view === 'dashboard' || view === 'detail'} onClick={() => handleNav('dashboard')} />
                <NavItem label="Analytics" icon={<ChartIcon />} isActive={view === 'analytics'} onClick={() => handleNav('analytics')} />
                <NavItem label="Report Issue" icon={<PlusIcon />} isActive={view === 'report'} onClick={() => handleNav('report')} />
            </nav>
        </div>
        {user && (<div className="border-t border-cyan-500/30 p-4 bg-gray-900/40"><div className="mb-3 flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500"></div><div className="overflow-hidden"><p className="text-xs text-gray-400">Logged in as:</p><p className="text-sm font-bold text-white truncate">{user.email}</p></div></div><label className="block text-xs text-gray-400">Display Name</label><input type="text" value={userName} onChange={onNameChange} className="mt-1 mb-3 block w-full rounded-md border-cyan-500/50 bg-gray-800 text-white text-xs p-1 focus:border-cyan-500" placeholder="Enter name" /><button onClick={handleLogout} className="w-full rounded border border-red-500/50 text-red-400 py-1 text-xs hover:bg-red-900/20">Sign Out</button></div>)}
      </div>
    </>
  );
};

const MobileHeader = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => (
  <div className="flex-none flex h-16 items-center justify-between border-b border-cyan-500/30 bg-gray-900/70 backdrop-blur-xl md:hidden relative z-[2000]">
    <div className="pl-4"><span className="text-2xl font-orbitron font-extrabold text-cyan-400" style={{ textShadow: '0 0 5px #0ea5e9' }}>🌍 FixMyWorld</span></div>
    <button type="button" className="px-4 text-cyan-400" onClick={() => setIsMobileMenuOpen(true)}><MenuIcon /></button>
  </div>
);

// Standard Components
const LoginOverlay = ({ onLogin }) => (<div className="fixed inset-0 z-[4000] flex items-center justify-center backdrop-blur-sm bg-black/60"><div className="relative w-full max-w-md p-8 m-4 rounded-2xl border border-cyan-500/30 bg-gray-900/90 shadow-[0_0_50px_rgba(14,165,233,0.3)] text-center"><div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl"></div><div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl"></div><h1 className="mb-2 text-4xl font-orbitron font-extrabold text-white" style={{ textShadow: '0 0 10px #0ea5e9' }}>FixMyWorld</h1><p className="mb-8 text-gray-400 font-share-tech">Citizen Reporting Platform</p><button onClick={onLogin} className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-white px-6 py-3 font-bold text-gray-900 transition-all hover:bg-gray-100 hover:scale-[1.02]"><svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>Sign in with Google</button></div></div>);
const AnalyticsView = ({ data }) => (<div className="space-y-6"><h2 className="text-3xl font-orbitron text-cyan-400">Platform Analytics</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4"><StatCard label="Total Issues" value={data.total} color="text-cyan-400" border="border-cyan-500/50" /><StatCard label="Reported" value={data.reported} color="text-yellow-400" border="border-yellow-500/50" /><StatCard label="In Progress" value={data.inProgress} color="text-blue-400" border="border-blue-500/50" /><StatCard label="Resolved" value={data.resolved} color="text-green-400" border="border-green-500/50" /></div><div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"><h3 className="mb-4 text-xl font-bold text-gray-300">Issues by Category</h3><div className="space-y-3">{Object.entries(data.byCategory).map(([catKey, count]) => { const label = issueCategories.find(c => c.value === catKey)?.label || catKey; const percentage = data.total > 0 ? ((count / data.total) * 100).toFixed(1) : 0; return (<div key={catKey}><div className="mb-1 flex justify-between text-sm"><span className="text-gray-400">{label}</span><span className="text-cyan-400">{count} ({percentage}%)</span></div><div className="h-2 w-full overflow-hidden rounded-full bg-gray-800"><div className="h-full bg-cyan-600 transition-all duration-500" style={{ width: `${percentage}%` }} /></div></div>); })}</div></div></div>);
const StatCard = ({ label, value, color, border }) => (<div className={`flex flex-col items-center justify-center rounded-xl border ${border} bg-gray-900/80 p-6 shadow-lg backdrop-blur-sm`}><span className={`text-4xl font-bold ${color}`}>{value}</span><span className="mt-2 text-sm text-gray-400 uppercase tracking-wider">{label}</span></div>);
const ReportIssueView = ({ db, userId, onIssueReported }) => {
  const [formData, setFormData] = useState({ title: '', description: '', category: 'pothole', lat: '', lng: '' });
  const [loading, setLoading] = useState(false);
  const getLocation = () => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((pos) => setFormData(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })), (err) => alert('Could not fetch location: ' + err.message)); } else { alert("Geolocation not supported."); } };
  const handleSubmit = async (e) => { e.preventDefault(); if (!db) return; setLoading(true); try { await addDoc(collection(db, 'issues'), { ...formData, userId, status: 'reported', upvotes: [], createdAt: serverTimestamp(), lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) }); alert('Issue reported successfully!'); onIssueReported(); } catch (err) { console.error("Error adding document: ", err); alert('Failed to report issue.'); } finally { setLoading(false); } };
  return (<div className="max-w-2xl mx-auto"><h2 className="mb-6 text-3xl font-orbitron text-cyan-400">Report New Issue</h2><form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-cyan-500/30 bg-gray-900/80 p-6 backdrop-blur-md"><div><label className="block text-sm text-gray-400 mb-1">Category</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full rounded bg-gray-800 border border-gray-700 text-white p-2 focus:border-cyan-500 focus:outline-none">{issueCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div><div><label className="block text-sm text-gray-400 mb-1">Title</label><input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full rounded bg-gray-800 border border-gray-700 text-white p-2 focus:border-cyan-500 focus:outline-none" placeholder="Brief title..." /></div><div><label className="block text-sm text-gray-400 mb-1">Description</label><textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded bg-gray-800 border border-gray-700 text-white p-2 focus:border-cyan-500 focus:outline-none" placeholder="Details..." /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm text-gray-400 mb-1">Lat</label><input required type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} className="w-full rounded bg-gray-800 border border-gray-700 text-white p-2" /></div><div><label className="block text-sm text-gray-400 mb-1">Lng</label><input required type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} className="w-full rounded bg-gray-800 border border-gray-700 text-white p-2" /></div></div><button type="button" onClick={getLocation} className="w-full rounded border border-cyan-500/50 bg-cyan-900/20 py-2 text-cyan-400 hover:bg-cyan-900/40">📍 Use Current Location</button><button type="submit" disabled={loading} className="w-full rounded bg-cyan-600 py-3 font-bold text-white hover:bg-cyan-500 disabled:opacity-50">{loading ? 'Submitting...' : 'Submit Report'}</button></form></div>);
};
const IssueDetailView = ({ issue, handleBack, getCategoryClass, db, userId }) => {
  if (!issue) return <div>Loading...</div>;
  const handleUpvote = async () => { if (!db || !userId) return; try { if (issue.upvotes && issue.upvotes.includes(userId)) { alert("Already upvoted."); return; } await updateDoc(doc(db, 'issues', issue.id), { upvotes: arrayUnion(userId) }); } catch (e) { console.error(e); } };
  return (<div className="mx-auto max-w-4xl"><button onClick={handleBack} className="mb-4 flex items-center text-cyan-400 hover:text-cyan-300">← Back to Dashboard</button><div className="overflow-hidden rounded-xl border border-cyan-500/30 bg-gray-900/80 backdrop-blur-md"><div className="border-b border-gray-800 p-6"><div className="flex items-start justify-between"><div><span className={`mb-2 inline-block rounded px-3 py-1 text-sm font-bold ${getCategoryClass(issue.category)}`}>{issueCategories.find(c => c.value === issue.category)?.label}</span><h1 className="text-3xl font-bold text-white">{issue.title}</h1></div><div className={`px-3 py-1 rounded border ${issue.status === 'resolved' ? 'border-green-500 text-green-400' : 'border-yellow-500 text-yellow-400'}`}>{issue.status?.toUpperCase()}</div></div></div><div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6"><div className="md:col-span-2 space-y-6"><div><h3 className="text-lg font-semibold text-cyan-400">Description</h3><p className="mt-2 text-gray-300 leading-relaxed">{issue.description}</p></div><div><h3 className="text-lg font-semibold text-cyan-400">Location Data</h3><p className="text-sm text-gray-400 font-mono">Lat: {issue.lat}, Lng: {issue.lng}</p></div></div><div className="rounded-lg bg-gray-800/50 p-4 space-y-4 h-fit text-center"><div className="text-4xl font-bold text-white">{issue.upvotes?.length || 0}</div><div className="text-xs text-gray-400 uppercase">Community Priority</div><button onClick={handleUpvote} className="w-full rounded bg-cyan-600 py-2 font-bold text-white hover:bg-cyan-500">▲ Upvote</button></div></div></div></div>);
};
const WeatherEffects = ({ weatherCondition }) => { if (!weatherCondition) return null; const lower = weatherCondition.toLowerCase(); let effectClass = ''; if (lower.includes('rain') || lower.includes('drizzle')) effectClass = 'bg-blue-900/10 mix-blend-overlay'; else if (lower.includes('mist') || lower.includes('fog')) effectClass = 'bg-gray-500/10 backdrop-blur-[1px]'; else if (lower.includes('sunny') || lower.includes('clear')) effectClass = 'bg-yellow-500/5 mix-blend-overlay'; return <div className={`pointer-events-none fixed inset-0 z-0 ${effectClass}`}></div>; };
const Footer = ({ weather }) => (<footer className="flex-none border-t border-gray-800 bg-black/80 p-6 text-center backdrop-blur-md"><p className="text-gray-500 text-sm">© 2024 FixMyWorld. Built for a better tomorrow.</p>{weather && <div className="mt-2 flex items-center justify-center gap-4 text-xs text-cyan-600 font-mono"><span>{weather.condition}</span><span>•</span><span>{weather.temp_c}°C</span><span>•</span><span>Hum: {weather.humidity}%</span></div>}</footer>);
const NavItem = ({ label, icon, isActive, onClick }) => (<button onClick={onClick} className={`group flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-base font-semibold transition-all duration-300 hover:scale-105 hover:bg-cyan-500/20 ${isActive ? 'bg-cyan-500/20 text-cyan-300 shadow-[inset_0_0_10px_rgba(14,165,233,0.5)] border border-cyan-500/50' : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'}`}><span className={isActive ? 'text-cyan-300' : 'text-gray-500 group-hover:text-cyan-400'}>{React.cloneElement(icon, { width: 20, height: 20 })}</span><span>{label}</span></button>);
const GlobalStyles = () => (<style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'); body { margin:0; font-family: 'Inter', sans-serif; } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>);

// ICONS
const MoonIcon = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>;
const MapIcon = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>;
const SatelliteIcon = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>;
const MountainIcon = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;

const HomeIcon = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const ChartIcon = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const PlusIcon = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const XIcon = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24" {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const MenuIcon = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24" {...p}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;