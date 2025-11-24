import React, { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import toast from 'react-hot-toast';
import { issueCategories } from '../constants';
import { StyleSwitcher } from './StyleSwitcher';

// Component to handle map clicks and updates
const LocationPicker = ({ position, setPosition }) => {
    const map = useMap();

    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position ? <Marker position={position} /> : null;
};

export const ReportIssueView = ({ db, userId, onIssueReported }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'pothole',
    });
    const [position, setPosition] = useState(null); // { lat, lng }
    const [loading, setLoading] = useState(false);
    const [mapStyle, setMapStyle] = useState('dark');

    // Manual input handlers
    const handleLatChange = (e) => {
        const lat = parseFloat(e.target.value);
        if (!isNaN(lat)) {
            setPosition(prev => ({ ...prev, lat, lng: prev?.lng || 0 }));
        }
    };

    const handleLngChange = (e) => {
        const lng = parseFloat(e.target.value);
        if (!isNaN(lng)) {
            setPosition(prev => ({ ...prev, lat: prev?.lat || 0, lng }));
        }
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            toast.loading('Fetching location...', { id: 'location' });
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    toast.success('Location found!', { id: 'location' });
                },
                (err) => toast.error('Could not fetch location: ' + err.message, { id: 'location' })
            );
        } else {
            toast.error("Geolocation not supported.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db) return;

        if (!position) {
            toast.error('Please select a location on the map.');
            return;
        }

        if (!formData.title.trim() || !formData.description.trim()) {
            toast.error('Please fill in all fields.');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Submitting report...');

        try {
            await addDoc(collection(db, 'issues'), {
                ...formData,
                userId,
                status: 'reported',
                upvotes: [],
                createdAt: serverTimestamp(),
                lat: position.lat,
                lng: position.lng,
            });
            toast.success('Issue reported successfully!', { id: toastId });
            onIssueReported();
        } catch (err) {
            console.error("Error adding document: ", err);
            toast.error('Failed to report issue.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const getTileLayer = () => {
        switch (mapStyle) {
            case 'street': return <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />;
            case 'satellite': return <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />;
            case 'terrain': return <TileLayer attribution='&copy; OpenTopoMap' url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />;
            case 'dark': default: return <TileLayer attribution='&copy; CartoDB' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />;
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-10">
            <h2 className="mb-6 text-3xl font-orbitron text-cyan-400">Report New Issue</h2>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-cyan-500/30 bg-gray-900/80 p-6 backdrop-blur-md">

                {/* Map Section */}
                <div className="space-y-2">
                    <label className="block text-sm text-gray-400">Location (Click on map or use GPS)</label>
                    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-700 relative z-0">
                        <MapContainer center={[28.6139, 77.2090]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                            {getTileLayer()}
                            <StyleSwitcher currentStyle={mapStyle} setStyle={setMapStyle} />
                            <LocationPicker position={position} setPosition={setPosition} />
                        </MapContainer>
                        <button
                            type="button"
                            onClick={getLocation}
                            className="absolute bottom-4 right-4 z-[1000] bg-cyan-600 text-white p-2 rounded-full shadow-lg hover:bg-cyan-500"
                            title="Use My Location"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Manual Inputs */}
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={position?.lat || ''}
                                onChange={handleLatChange}
                                className="w-full rounded bg-gray-800 border border-gray-700 text-white p-2 text-sm focus:border-cyan-500"
                                placeholder="0.000000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={position?.lng || ''}
                                onChange={handleLngChange}
                                className="w-full rounded bg-gray-800 border border-gray-700 text-white p-2 text-sm focus:border-cyan-500"
                                placeholder="0.000000"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full rounded bg-gray-800 border border-gray-700 text-white p-2 focus:border-cyan-500 focus:outline-none"
                    >
                        {issueCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Title</label>
                    <input
                        required
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded bg-gray-800 border border-gray-700 text-white p-2 focus:border-cyan-500 focus:outline-none"
                        placeholder="Brief title..."
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded bg-gray-800 border border-gray-700 text-white p-2 focus:border-cyan-500 focus:outline-none"
                        placeholder="Details..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-cyan-600 py-3 font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-all"
                >
                    {loading ? 'Submitting...' : 'Submit Report'}
                </button>
            </form>
        </div>
    );
};
