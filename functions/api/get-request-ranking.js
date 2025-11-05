// This serverless function runs on Cloudflare.
// It retrieves the song request ranking data from Firestore.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore/lite';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getFirebaseApp(env) {
    if (getApps().length) {
        return getApps()[0];
    }
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

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        console.warn("Firebase Init Failed:", e.message);
        return new Response(JSON.stringify({ error: "Server configuration error." }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
    }

    const db = getFirestore(app);

    try {
        const requestsRef = collection(db, 'songRequests');
        const q = query(requestsRef, orderBy('count', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);

        const rankings = [];
        querySnapshot.forEach((doc) => {
            rankings.push({
                id: doc.id, // This is the song title
                ...doc.data()
            });
        });

        return new Response(JSON.stringify(rankings), { 
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
                ...CORS_HEADERS
            } 
        });
    } catch (error) {
        console.warn('Get request ranking failed:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch request rankings.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
    }
}