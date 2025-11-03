// functions/api/songs.js - Secure Backend with Self-Diagnostics

// --- Firebase SDK Imports ---
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore/lite';

// --- Singleton Pattern for Firebase Initialization ---
let app;
let db;

function initializeFirebase(env) {
    // --- SELF-DIAGNOSTIC CHECK ---
    // Check if all required environment variables are present.
    const requiredEnvVars = [
        'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID',
    ];

    for (const varName of requiredEnvVars) {
        if (!env[varName]) {
            // Log a specific error to the Cloudflare dashboard.
            const errorMessage = `[DIAGNOSTIC] Environment variable ${varName} is missing or empty! Please check your Cloudflare Pages project settings.`;
            console.error(errorMessage);
            // Throw an error to stop execution.
            throw new Error(errorMessage);
        }
    }

    if (getApps().length === 0) {
        try {
            const firebaseConfig = {
                apiKey: env.FIREBASE_API_KEY,
                authDomain: env.FIREBASE_AUTH_DOMAIN,
                projectId: env.FIREBASE_PROJECT_ID,
                storageBucket: env.FIREBASE_STORAGE_BUCKET,
                messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
                appId: env.FIREBASE_APP_ID,
            };
            app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            console.log("[DIAGNOSTIC] Firebase initialized successfully.");
        } catch (initError) {
            const errorMessage = `[DIAGNOSTIC] Firebase initialization failed: ${initError.message}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
}

// --- Generic Error Handler ---
function handleError(error, requestType) {
    const errorMessage = `[${requestType} Error] ${error.message}`;
    console.error(errorMessage);
    return new Response(JSON.stringify({ error: "An internal server error occurred.", details: errorMessage }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
}

// --- Request Handlers ---

// Handle GET requests (fetch the song list)
export async function onRequestGet({ env }) {
    try {
        initializeFirebase(env);
        const docRef = doc(db, 'songs', 'playableList');
        const docSnap = await getDoc(docRef);

        let data;
        if (docSnap.exists()) {
            data = docSnap.data();
        } else {
            data = { list_string: "夜に駆ける,YOASOBI\nPretender,Official髭男dism" };
            await setDoc(docRef, data);
        }

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    } catch (error) {
        return handleError(error, 'GET');
    }
}

// Handle POST requests (save the song list)
export async function onRequestPost({ request, env }) {
    try {
        initializeFirebase(env);
        const docRef = doc(db, 'songs', 'playableList');
        const body = await request.json();

        if (typeof body.list_string !== 'string') {
            return new Response('Invalid data format', { status: 400 });
        }
        await setDoc(docRef, { list_string: body.list_string });

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    } catch (error) {
        return handleError(error, 'POST');
    }
}

// Handle OPTIONS requests (for CORS preflight)
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
