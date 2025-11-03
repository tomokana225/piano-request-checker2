// This serverless function runs on Cloudflare, not in the user's browser.
// It logs search terms to Firestore to build a popularity ranking.

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getFirebaseApp(env) {
    // Securely construct the Firebase config from environment variables (secrets)
    const firebaseConfig = {
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.FIREBASE_APP_ID,
        measurementId: env.FIREBASE_MEASUREMENT_ID,
    };
    
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error("Firebase environment variables are not set correctly.");
    }
    
    return initializeApp(firebaseConfig);
}

const parseSongs = (str) => {
    if (!str) return [];
    return str.replace(/\r\n/g, '\n').split('\n').map(line => {
        if (!line.trim()) return null;
        const parts = line.split(',');
        if (parts.length < 2 || !parts[0] || !parts[1]) return null;
        return {
            title: parts[0].trim(),
            artist: parts[1].trim(),
            genre: parts[2]?.trim() || '',
            isNew: parts[3]?.trim().toLowerCase() === 'new',
            status: parts[4]?.trim().toLowerCase() === '練習中' ? 'practicing' : 'playable',
        };
    }).filter(Boolean);
};

export async function onRequest(context) {
    const { request, env } = context;
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    const successHeaders = { 'Content-Type': 'application/json', ...CORS_HEADERS };

    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        // Fail gracefully, don't block user
        return new Response(JSON.stringify({ success: true, message: "Server config error" }), { status: 200, headers: successHeaders });
    }

    const db = getFirestore(app);

    try {
        const { term } = await request.json();
        const searchTerm = term?.trim().toLowerCase();

        if (!searchTerm) {
            return new Response(JSON.stringify({ success: true, message: "No term provided" }), { status: 200, headers: successHeaders });
        }

        const songDocRef = doc(db, 'songlist/default');
        const docSnap = await getDoc(songDocRef);

        if (!docSnap.exists()) {
            return new Response(JSON.stringify({ success: true, message: "Song list not found" }), { status: 200, headers: successHeaders });
        }
        
        const songs = parseSongs(docSnap.data().list);

        const matchedSongs = songs.filter(song =>
            song.title.toLowerCase().includes(searchTerm) ||
            song.artist.toLowerCase().includes(searchTerm)
        );

        if (matchedSongs.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "No matching songs" }), { status: 200, headers: successHeaders });
        }
        
        const uniqueTitles = [...new Set(matchedSongs.map(s => s.title))];
        const batch = writeBatch(db);

        // Firestore Lite SDK doesn't support transactions or server-side increments,
        // so we do a read-then-write. This is acceptable for a non-critical counter.
        for (const title of uniqueTitles) {
            const countRef = doc(db, 'songSearchCounts', title);
            const songData = matchedSongs.find(s => s.title === title);
            const countDocSnap = await getDoc(countRef);

            const newCount = (countDocSnap.exists() ? countDocSnap.data().count : 0) + 1;
            batch.set(countRef, { count: newCount, artist: songData.artist }, { merge: true });
        }
        
        await batch.commit();

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: successHeaders });

    } catch (error) {
        console.error('Logging search failed:', error);
        // We return a success response even on failure to avoid impacting the user experience.
        return new Response(JSON.stringify({ success: true, error: "Internal logging error" }), { status: 200, headers: successHeaders });
    }
}