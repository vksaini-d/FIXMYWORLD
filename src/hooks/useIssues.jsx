import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    orderBy
} from 'firebase/firestore';

export const useIssues = (db) => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }

        try {
            // Order by createdAt desc so newest issues are first
            const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const list = [];
                snapshot.forEach((doc) => {
                    list.push({ id: doc.id, ...doc.data() });
                });
                setIssues(list);
                setLoading(false);
            }, (err) => {
                console.error('Firestore listener error:', err);
                setError(err);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error('Error setting up listener:', err);
            setError(err);
            setLoading(false);
        }
    }, [db]);

    return { issues, loading, error };
};
