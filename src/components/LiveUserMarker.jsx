import React, { useEffect, useState } from 'react';
import { Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

export const LiveUserMarker = () => {
    const map = useMap();
    const [position, setPosition] = useState(null);
    const [heading, setHeading] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [useHighAccuracy, setUseHighAccuracy] = useState(true);

    useEffect(() => {
        let geoId;

        const success = (pos) => {
            const { latitude, longitude, accuracy, heading: gpsHeading } = pos.coords;
            setPosition([latitude, longitude]);
            setAccuracy(accuracy);
            if (gpsHeading && !isNaN(gpsHeading)) setHeading(gpsHeading);
        };

        const error = (err) => {
            console.warn(`Location error (${useHighAccuracy ? 'High' : 'Low'} Accuracy):`, err);
            // If timeout (3) or position unavailable (2), try low accuracy
            if (useHighAccuracy && (err.code === 3 || err.code === 2)) {
                console.log("Falling back to low accuracy mode...");
                setUseHighAccuracy(false);
            }
        };

        const options = {
            enableHighAccuracy: useHighAccuracy,
            maximumAge: 30000, // Accept older cached positions
            timeout: 20000     // Wait longer before timing out
        };

        if (navigator.geolocation) {
            geoId = navigator.geolocation.watchPosition(success, error, options);
        }

        const handleOrientation = (e) => {
            let compass = e.alpha;
            if (e.webkitCompassHeading) compass = e.webkitCompassHeading;
            if (compass) setHeading(360 - compass);
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", handleOrientation, true);
        }

        return () => {
            if (geoId) navigator.geolocation.clearWatch(geoId);
            window.removeEventListener("deviceorientation", handleOrientation);
        };
    }, [useHighAccuracy]);

    const handleLocateClick = (e) => {
        e.stopPropagation();
        if (position) {
            map.flyTo(position, 17, { duration: 1.5 });
        } else {
            alert("Acquiring GPS signal... Please wait.");
        }
    };

    const UserIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="transform: rotate(${heading}deg); transition: transform 0.2s ease;">
             <div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 30px solid rgba(14, 165, 233, 0.5); margin-left: -2px; margin-top: -15px;"></div>
             <div style="width: 16px; height: 16px; background: #0ea5e9; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px #0ea5e9; position: absolute; top: 10px; left: 0;"></div>
           </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });

    return (
        <>
            {position && (
                <>
                    <Marker position={position} icon={UserIcon} zIndexOffset={1000}>
                        <Popup>Accuracy: {Math.round(accuracy)}m</Popup>
                    </Marker>
                    <Circle
                        center={position}
                        radius={accuracy}
                        pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.1, weight: 1 }}
                    />
                </>
            )}
            <div className="leaflet-bottom leaflet-right">
                <div className="leaflet-control leaflet-bar">
                    <button
                        onClick={handleLocateClick}
                        className="flex h-12 w-12 cursor-pointer items-center justify-center border-2 border-cyan-500 bg-gray-900 text-cyan-400 shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-all hover:bg-cyan-500 hover:text-white"
                        style={{ borderRadius: '50%', marginBottom: '20px', marginRight: '10px', pointerEvents: 'auto' }}
                        title="Locate Me"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
};
