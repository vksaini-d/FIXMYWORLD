import React, { useEffect, useState, useRef } from 'react';
import { Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Helper for linear interpolation
const lerp = (start, end, factor) => {
    return start + (end - start) * factor;
};

export const LiveUserMarker = () => {
    const map = useMap();
    const [position, setPosition] = useState(null); // This is the interpolated "smooth" position
    const [heading, setHeading] = useState(0);
    const [accuracy, setAccuracy] = useState(0);

    // Refs for animation
    const targetPosition = useRef(null);
    const currentPosition = useRef(null);
    const animationFrameId = useRef(null);

    // Sensor Fusion & Location Logic
    // Uses: GPS + Wi-Fi + Cell (via navigator.geolocation)
    // Uses: Compass + Accelerometer (via deviceorientation)
    // Note: Barometer data is typically handled by the OS location provider for altitude corrections 
    // or requires the Generic Sensor API (AbsoluteOrientationSensor) which has limited browser support.
    // In a native Capacitor app, we can access raw sensor data more reliably.

    useEffect(() => {
        let geoId;

        const success = (pos) => {
            const { latitude, longitude, accuracy, heading: gpsHeading } = pos.coords;

            // Update target position
            targetPosition.current = { lat: latitude, lng: longitude };
            setAccuracy(accuracy);

            // If this is the first fix, snap immediately
            if (!currentPosition.current) {
                currentPosition.current = { lat: latitude, lng: longitude };
                setPosition([latitude, longitude]);
            }

            // Use GPS heading if available and reliable, otherwise fallback to compass
            if (gpsHeading && !isNaN(gpsHeading)) {
                setHeading(gpsHeading);
            }
        };

        const error = (err) => {
            console.warn("Location error (High Accuracy):", err);
        };

        const options = {
            enableHighAccuracy: true, // Forces use of GPS/Wi-Fi/Cell/Sensors
            maximumAge: 0,            // Do not use cached positions
            timeout: 10000
        };

        if (navigator.geolocation) {
            geoId = navigator.geolocation.watchPosition(success, error, options);
        }

        // Compass / Magnetometer / Accelerometer handling
        const handleOrientation = (e) => {
            // If GPS heading is not available (e.g. stationary), use compass
            // We prioritize GPS heading when moving, but here we just mix them or use compass as fallback
            // For simplicity, we use compass if available as it updates faster for rotation
            let compass = e.alpha;
            if (e.webkitCompassHeading) compass = e.webkitCompassHeading; // iOS
            if (compass !== null && compass !== undefined) {
                setHeading(360 - compass);
            }
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", handleOrientation, true);
        }

        return () => {
            if (geoId) navigator.geolocation.clearWatch(geoId);
            window.removeEventListener("deviceorientation", handleOrientation);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, []);

    // Animation Loop for Smooth Movement
    useEffect(() => {
        const animate = () => {
            if (targetPosition.current && currentPosition.current) {
                const latDiff = targetPosition.current.lat - currentPosition.current.lat;
                const lngDiff = targetPosition.current.lng - currentPosition.current.lng;

                // If distance is significant, interpolate
                if (Math.abs(latDiff) > 0.000001 || Math.abs(lngDiff) > 0.000001) {
                    const factor = 0.1; // Smoothing factor (lower = smoother but more lag)
                    currentPosition.current.lat = lerp(currentPosition.current.lat, targetPosition.current.lat, factor);
                    currentPosition.current.lng = lerp(currentPosition.current.lng, targetPosition.current.lng, factor);
                    setPosition([currentPosition.current.lat, currentPosition.current.lng]);
                } else {
                    // Snap if very close
                    currentPosition.current = { ...targetPosition.current };
                    setPosition([targetPosition.current.lat, targetPosition.current.lng]);
                }
            }
            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, []);

    const handleLocateClick = (e) => {
        e.stopPropagation();
        if (position) {
            map.flyTo(position, 18, {
                animate: true,
                duration: 1.5,
                easeLinearity: 0.25
            });
        } else {
            alert("Acquiring high-precision location...");
        }
    };

    const UserIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="transform: rotate(${heading}deg); transition: transform 0.1s linear;">
             <div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 30px solid rgba(14, 165, 233, 0.5); margin-left: -2px; margin-top: -15px;"></div>
             <div style="width: 16px; height: 16px; background: #0ea5e9; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 15px #0ea5e9; position: absolute; top: 10px; left: 0;"></div>
           </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });

    return (
        <>
            {position && (
                <>
                    <Marker position={position} icon={UserIcon} zIndexOffset={1000}>
                        <Popup>
                            <div className="text-center">
                                <strong>You are here</strong><br />
                                Accuracy: {Math.round(accuracy)}m<br />
                                <span className="text-xs text-gray-500">GPS • WiFi • Cell • Sensors</span>
                            </div>
                        </Popup>
                    </Marker>
                    <Circle
                        center={position}
                        radius={accuracy}
                        pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.05, weight: 1, dashArray: '5, 5' }}
                    />
                </>
            )}
            <div className="leaflet-bottom leaflet-right">
                <div className="leaflet-control leaflet-bar">
                    <button
                        onClick={handleLocateClick}
                        className="flex h-12 w-12 cursor-pointer items-center justify-center border-2 border-cyan-500 bg-gray-900 text-cyan-400 shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-all hover:bg-cyan-500 hover:text-white"
                        style={{ borderRadius: '50%', marginBottom: '20px', marginRight: '10px', pointerEvents: 'auto' }}
                        title="Locate Me (High Accuracy)"
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
