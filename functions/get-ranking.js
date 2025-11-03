// This serverless function runs on Cloudflare, not in the user's browser.
// It retrieves the search ranking data from Firestore.

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore/lite';

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
    
    // Basic validation
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error("Firebase environment variables are not set correctly.");
    }
    
    return initializeApp(firebaseConfig);
}

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        console.error("Firebase Init Failed:", e.message);
        return new Response(JSON.stringify({ error: "Server configuration error." }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }

    const db = getFirestore(app);

    try {
        const countsRef = collection(db, 'songSearchCounts');
        const q = query(countsRef, orderBy('count', 'desc'), limit(100)); // Limit to top 100
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
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            } 
        });
    } catch (error) {
        console.error('Get ranking failed:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch rankings.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
