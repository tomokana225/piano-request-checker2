// This serverless function runs on Cloudflare, not in the user's browser.
// It acts as a secure intermediary to manage the website's layout configuration in Firebase.

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore/lite';

// Default layout configuration to be used if none is set in Firestore
const DEFAULT_LAYOUT_CONFIG = {
    header: {
        title: 'リクエスト曲チェッカー',
        subtitle: '弾ける曲 or ぷりんと楽譜にある曲かチェックできます',
        textColor: '#FFFFFF',
    },
    nav: { style: 'grid' },
    banners: {
        doneru: { visible: true, text: '「どねる」を使うと高い還元率で配信者を応援できます', buttonText: '配信者を応援する' },
        twitcast: { visible: true, text: 'ツイキャス配信はこちらから', buttonText: '配信を視聴する' },
    },
    theme: {
        backgroundColor: '#111827', // bg-gray-900
        backgroundImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop',
        primaryColor: '#EC4899', // pink-600
        secondaryColor: '#14B8A6', // teal-500
    }
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getFirebaseApp(env) {
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

    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        console.error("Firebase Init Failed:", e.message);
        return new Response(JSON.stringify({ error: "Server configuration error." }), { 
            status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
    }

    const db = getFirestore(app);
    const configDocRef = doc(db, 'layout/config');

    try {
        if (request.method === 'GET') {
            const docSnap = await getDoc(configDocRef);
            if (docSnap.exists()) {
                return new Response(JSON.stringify(docSnap.data()), { 
                    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } 
                });
            } else {
                // If config doesn't exist, create it with defaults and return it
                await setDoc(configDocRef, DEFAULT_LAYOUT_CONFIG);
                return new Response(JSON.stringify(DEFAULT_LAYOUT_CONFIG), { 
                    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } 
                });
            }
        }

        if (request.method === 'POST') {
            const newConfig = await request.json();
            // Basic validation could be added here
            await setDoc(configDocRef, newConfig);
            return new Response(JSON.stringify({ success: true }), { 
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } 
            });
        }
        
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });

    } catch (error) {
        console.error('Layout config operation failed:', error);
        return new Response(JSON.stringify({ error: 'Failed to communicate with the database.' }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
    }
}