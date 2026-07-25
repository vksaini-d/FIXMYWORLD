import React, { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import toast from 'react-hot-toast';
import { issueCategories } from '../constants';
import { StyleSwitcher } from './StyleSwitcher';
import { getCategoryIcon, IconLocation, IconUpload } from './Icons';

// Component to handle map clicks and smooth camera flyTo
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
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mapStyle, setMapStyle] = useState('dark');

    // Handle Image file selection & instant preview
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be under 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

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
            toast.loading('Fetching GPS location...', { id: 'location' });
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    toast.success('Location locked!', { id: 'location' });
                },
                (err) => toast.error('Location error: ' + err.message, { id: 'location' })
            );
        } else {
            toast.error('Geolocation is not supported on this browser.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db) return;

        if (!position) {
            toast.error('Please tap on the map to pinpoint the location.');
            return;
        }

        if (!formData.title.trim() || !formData.description.trim()) {
            toast.error('Please provide a title and detailed description.');
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
                imageUrl: imagePreview || null,
                createdAt: serverTimestamp(),
                lat: position.lat,
                lng: position.lng,
            });
            toast.success('Issue reported successfully!', { id: toastId });
            onIssueReported();
        } catch (err) {
            console.error('Error adding issue: ', err);
            toast.error('Failed to report issue. Check your connection.', { id: toastId });
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
        <div className="max-w-3xl mx-auto pb-20 space-y-6">
            <div>
                <h2 className="text-3xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    Report Issue
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">Submit civic telemetry data to community infrastructure logs</p>
            </div>

            <div className="glass-pod-layered">
                <form onSubmit={handleSubmit} className="glass-pod-inner p-6 sm:p-8 space-y-7">
                    
                    {/* 1. Asymmetric Category Pills Selector */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>1. Select Issue Category</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {issueCategories.map((c) => {
                                const isSelected = formData.category === c.value;
                                return (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: c.value })}
                                        className={`glass-chip-asymmetric flex flex-col items-center justify-center p-3.5 transition-all duration-300 ${
                                            isSelected
                                                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.03]'
                                                : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg mb-2 ${isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-black/40 text-slate-400'}`}>
                                            {getCategoryIcon(c.value, 'w-5 h-5')}
                                        </div>
                                        <span className="text-xs font-bold text-center">{c.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Interactive Location Map */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>2. Pinpoint Location on Map</span>
                            </label>
                            {position && (
                                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                                    {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                                </span>
                            )}
                        </div>

                        <div className="h-64 w-full rounded-2xl overflow-hidden border border-white/15 relative z-0 shadow-2xl">
                            <MapContainer center={[28.6139, 77.2090]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                {getTileLayer()}
                                <StyleSwitcher currentStyle={mapStyle} setStyle={setMapStyle} />
                                <LocationPicker position={position} setPosition={setPosition} />
                            </MapContainer>

                            <button
                                type="button"
                                onClick={getLocation}
                                className="absolute bottom-4 right-4 z-[1000] p-3 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500/35 transition-all group"
                                title="Locate via GPS"
                            >
                                <IconLocation className="w-6 h-6 stroke-emerald-300 group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                                <input
                                    type="number"
                                    step="any"
                                    value={position?.lat || ''}
                                    onChange={handleLatChange}
                                    className="glass-input w-full rounded-xl p-2.5 text-xs font-mono"
                                    placeholder="Latitude (e.g. 28.6139)"
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    step="any"
                                    value={position?.lng || ''}
                                    onChange={handleLngChange}
                                    className="glass-input w-full rounded-xl p-2.5 text-xs font-mono"
                                    placeholder="Longitude (e.g. 77.2090)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Issue Title & Description */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>3. Issue Title</span>
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="glass-input w-full rounded-xl p-3 text-xs sm:text-sm font-medium"
                                placeholder="e.g. Hazardous Pothole near Main Market Crossing"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-1.5 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>4. Detailed Description</span>
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="glass-input w-full rounded-xl p-3 text-xs sm:text-sm"
                                placeholder="Describe severity, approximate dimensions, or safety hazards..."
                            />
                        </div>
                    </div>

                    {/* 4. Photo Upload Area */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>5. Attach Photo Evidence (Optional)</span>
                        </label>
                        
                        {imagePreview ? (
                            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-emerald-500/40 group">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setImagePreview(null)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-rose-400 hover:bg-black border border-rose-500/40"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/15 rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-emerald-500/40 transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <IconUpload className="w-7 h-7 text-emerald-400 mb-1.5" />
                                    <p className="text-xs text-slate-300"><span className="font-semibold text-emerald-400">Click to upload</span> or drag photo</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">PNG, JPG, WEBP (Max 5MB)</p>
                                </div>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="glass-btn w-full rounded-xl py-3.5 font-bold font-orbitron tracking-wider text-xs sm:text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                <span>Transmitting Report...</span>
                            </>
                        ) : (
                            <span>Submit Issue Report</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
