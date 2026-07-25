import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { StyleSwitcher } from './StyleSwitcher';
import { LiveUserMarker } from './LiveUserMarker';
import { issueCategories } from '../constants';
import { getCategoryIcon } from './Icons';

// Custom Marker Icons based on status
const getStatusIcon = (status) => {
    let color = '#f43f5e'; // Soft Rose for reported
    let glow = 'rgba(244, 63, 94, 0.5)';

    if (status === 'in-progress') {
        color = '#f59e0b'; // Ochre Amber
        glow = 'rgba(245, 158, 11, 0.5)';
    } else if (status === 'resolved') {
        color = '#10b981'; // Soft Sage Emerald
        glow = 'rgba(16, 185, 129, 0.5)';
    }

    return L.divIcon({
        className: 'custom-status-marker',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 12px ${glow}; border: 2.5px solid white;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10],
    });
};

const DynamicWeatherMarker = ({ onCenterChange }) => {
    const map = useMapEvents({
        moveend: () => {
            onCenterChange(map.getCenter());
        },
    });
    return null;
};

export const MapDashboardView = ({ issues, filteredIssues, handleViewDetails, categoryFilter, setCategoryFilter, getCategoryClass, onMapCenterChange, weatherAtCenter }) => {
    const defaultCenter = [28.6139, 77.2090];
    const displayIssues = filteredIssues || issues;
    const [mapStyle, setMapStyle] = useState('dark');

    const getTileLayer = () => {
        switch (mapStyle) {
            case 'street': return <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />;
            case 'satellite': return <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />;
            case 'terrain': return <TileLayer attribution='&copy; OpenTopoMap' url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />;
            case 'dark': default: return <TileLayer attribution='&copy; CartoDB' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />;
        }
    };

    return (
        <div className="flex flex-col h-full w-full relative">

            {/* HORIZONTAL ASYMMETRIC FILTER CHIPS */}
            <div className="absolute top-0 left-0 right-0 z-[1000] px-4 py-3 flex gap-2.5 overflow-x-auto whitespace-nowrap scrollbar-hide bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent">
                <button
                    onClick={() => setCategoryFilter('all')}
                    className={`flex items-center gap-1.5 flex-shrink-0 px-4 py-2 text-xs font-bold transition-all duration-300 backdrop-blur-md glass-chip-asymmetric ${
                        categoryFilter === 'all'
                            ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105 font-orbitron'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <span>All Issues ({issues.length})</span>
                </button>

                {issueCategories.map((cat) => {
                    const count = issues.filter(i => i.category === cat.value).length;
                    const isSelected = categoryFilter === cat.value;
                    return (
                        <button
                            key={cat.value}
                            onClick={() => setCategoryFilter(cat.value)}
                            className={`flex items-center gap-2 flex-shrink-0 px-3.5 py-2 text-xs font-bold transition-all duration-300 backdrop-blur-md glass-chip-asymmetric ${
                                isSelected
                                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105 font-orbitron'
                                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className={isSelected ? 'text-slate-950' : 'text-emerald-400'}>
                                {getCategoryIcon(cat.value, "w-4 h-4")}
                            </span>
                            <span>{cat.label}</span>
                            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${isSelected ? 'bg-black/20 text-slate-950' : 'bg-white/10 text-emerald-300'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Dynamic Weather Info Overlay */}
            {weatherAtCenter && (
                <div className="absolute top-20 left-4 z-[1000] glass-pod-layered">
                    <div className="glass-pod-inner p-3 flex items-center gap-3">
                        {weatherAtCenter.icon && <img src={weatherAtCenter.icon} alt="weather" className="h-8 w-8" />}
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">Telemetry Weather</p>
                            <p className="text-xs font-bold text-slate-100 font-orbitron">{weatherAtCenter.temp_c}°C, {weatherAtCenter.condition}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-grow w-full border-t border-white/10 relative z-0">
                <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    {getTileLayer()}
                    <StyleSwitcher currentStyle={mapStyle} setStyle={setMapStyle} />
                    <LiveUserMarker />
                    <DynamicWeatherMarker onCenterChange={onMapCenterChange} />

                    <MarkerClusterGroup chunkedLoading>
                        {displayIssues.map((issue) => (
                            issue.lat && issue.lng && (
                                <Marker
                                    key={issue.id}
                                    position={[issue.lat, issue.lng]}
                                    icon={getStatusIcon(issue.status)}
                                >
                                    <Popup>
                                        <div className="min-w-[210px] text-slate-100 p-1">
                                            <h3 className="font-bold text-sm mb-1">{issue.title || 'Untitled Issue'}</h3>
                                            <div className="flex items-center gap-1.5 my-2">
                                                <span className="text-emerald-400">
                                                    {getCategoryIcon(issue.category, "w-4 h-4")}
                                                </span>
                                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                                                    {issueCategories.find(c => c.value === issue.category)?.label || issue.category}
                                                </span>
                                            </div>
                                            <div className="text-xs mb-3 capitalize text-slate-300 flex items-center gap-1.5">
                                                <span>Status:</span>
                                                <span className={`font-bold ${issue.status === 'resolved' ? 'text-emerald-400' : issue.status === 'in-progress' ? 'text-amber-400' : 'text-rose-400'}`}>
                                                    {issue.status}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleViewDetails(issue.id)}
                                                className="w-full rounded-xl glass-btn px-3 py-1.5 text-xs font-bold transition-all"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>
        </div>
    );
};
