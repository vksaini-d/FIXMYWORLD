import { useState, useEffect } from 'react';

export const useGeolocation = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [accuracy, setAccuracy] = useState(0);
    const [heading, setHeading] = useState(0);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        const geoId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy, heading: gpsHeading } = pos.coords;
                setLocation({ lat: latitude, lng: longitude });
                setAccuracy(accuracy);
                if (gpsHeading && !isNaN(gpsHeading)) setHeading(gpsHeading);
            },
            (err) => setError(err.message),
            { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
        );

        const handleOrientation = (e) => {
            let compass = e.alpha;
            if (e.webkitCompassHeading) compass = e.webkitCompassHeading;
            if (compass) setHeading(360 - compass);
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", handleOrientation, true);
        }

        return () => {
            navigator.geolocation.clearWatch(geoId);
            window.removeEventListener("deviceorientation", handleOrientation);
        };
    }, []);

    return { location, error, accuracy, heading };
};
