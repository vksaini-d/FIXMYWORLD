import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
} from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const useFirebaseAuth = () => {
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);

            // Enable offline persistence
            enableIndexedDbPersistence(firestore).catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('Firestore offline persistence failed: Multiple tabs open');
                } else if (err.code === 'unimplemented') {
                    console.warn('Firestore offline persistence not supported in this browser');
                }
            });

            setDb(firestore);
            const firebaseAuth = getAuth(app);
            setAuth(firebaseAuth);

            const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
                setUser(currentUser);
                setIsAuthReady(true);
            });
            return () => unsubscribe();
        } catch (e) {
            console.error('Firebase init error:', e);
            setIsAuthReady(true);
        }
    }, []);

    const handleGoogleLogin = async () => {
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    };

    const handleEmailLogin = async (email, password) => {
        if (!auth) return;
        try {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Email login failed', error);
            throw error;
        }
    };

    const handleEmailSignup = async (email, password, name) => {
        if (!auth) return;
        try {
            const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (name) {
                await updateProfile(userCredential.user, { displayName: name });
            }
        } catch (error) {
            console.error('Signup failed', error);
            throw error;
        }
    };

    const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
    };

    return {
        auth,
        db,
        user,
        isAuthReady,
        handleGoogleLogin,
        handleEmailLogin,
        handleEmailSignup,
        handleLogout
    };
};
