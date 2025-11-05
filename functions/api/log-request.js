// This serverless function runs on Cloudflare.
// It logs song requests from users for songs not in the repertoire.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore/lite';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }
    
    const successHeaders = { 'Content-Type': 'application/json', ...CORS_HEADERS };

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
        const { term } = await request.json();
        const requestTerm = term?.trim();

        if (!requestTerm) {
            return new Response(JSON.stringify({ error: "Request term is empty." }), { status: 400, headers: successHeaders });
        }

        const requestRef = doc(db, 'songRequests', requestTerm);
        const requestDocSnap = await getDoc(requestRef);
        
        const newCount = (requestDocSnap.exists() ? requestDocSnap.data().count : 0) + 1;
        
        await setDoc(requestRef, { count: newCount }, { merge: true });

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: successHeaders });

    } catch (error) {
        console.warn('Logging request failed:', error);
        return new Response(JSON.stringify({ error: "Internal logging error" }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
    }
}