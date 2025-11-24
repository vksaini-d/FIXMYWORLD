import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { StyleSwitcher } from './StyleSwitcher';
import { LiveUserMarker } from './LiveUserMarker';
import { issueCategories } from '../constants';

// Custom Marker Icons based on status
const getStatusIcon = (status) => {
    let color = '#ef4444'; // Red for reported
    let glow = 'rgba(239, 68, 68, 0.5)';

    if (status === 'in-progress') {
        color = '#eab308'; // Yellow
        glow = 'rgba(234, 179, 8, 0.5)';
    } else if (status === 'resolved') {
        color = '#22c55e'; // Green
        glow = 'rgba(34, 197, 94, 0.5)';
    }

    return L.divIcon({
        className: 'custom-status-marker',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px ${glow}; border: 2px solid white;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -10],
    });
};

// Component to fetch weather for the map center
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

            {/* HORIZONTAL SCROLLABLE FILTERS */}
            <div className="absolute top-0 left-0 right-0 z-[1000] px-4 py-3 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide bg-gradient-to-b from-black/80 to-transparent">
                <button
                    onClick={() => setCategoryFilter('all')}
                    className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition-all ${categoryFilter === 'all' ? 'bg-cyan-500 text-black scale-105' : 'bg-gray-900/80 text-gray-300 border border-gray-700 hover:bg-gray-800'}`}
                >
                    All
                </button>
                {issueCategories.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => setCategoryFilter(cat.value)}
                        className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition-all ${categoryFilter === cat.value ? 'bg-cyan-500 text-black scale-105' : 'bg-gray-900/80 text-gray-300 border border-gray-700 hover:bg-gray-800'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Dynamic Weather Info Overlay */}
            {weatherAtCenter && (
                <div className="absolute top-20 left-4 z-[1000] rounded-xl border border-cyan-500/30 bg-gray-900/80 p-3 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <img src={weatherAtCenter.icon} alt="weather" className="h-8 w-8" />
                        <div>
                            <p className="text-xs text-gray-400">Map Center Weather</p>
                            <p className="text-sm font-bold text-white">{weatherAtCenter.temp_c}°C, {weatherAtCenter.condition}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-grow w-full border-t border-cyan-500/30 relative z-0">
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
                                        <div className="min-w-[200px] text-gray-900">
                                            <h3 className="font-bold">{issue.title || 'Untitled Issue'}</h3>
                                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${getCategoryClass(issue.category).split(' ')[0]} text-black my-2`}>
                                                {issueCategories.find(c => c.value === issue.category)?.label || issue.category}
                                            </span>
                                            <div className="text-xs mb-2 capitalize text-gray-600">Status: {issue.status}</div>
                                            <button
                                                onClick={() => handleViewDetails(issue.id)}
                                                className="mt-2 w-full rounded bg-cyan-600 px-3 py-1 text-xs text-white hover:bg-cyan-500"
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
