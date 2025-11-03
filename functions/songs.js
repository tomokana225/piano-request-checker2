// This serverless function runs on Cloudflare, not in the user's browser.
// It acts as a secure intermediary to communicate with Firebase.

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore/lite';

// Default song list to be used if Firestore is empty
const PLAYABLE_SONGS_EXAMPLE_STR = "夜に駆ける,YOASOBI,J-Pop,new\nPretender,Official髭男dism,J-Pop\nLemon,米津玄師,J-Pop\n紅蓮華,LiSA,Anime\nドライフラワー,優里,J-Pop\n白日,King Gnu,J-Rock\nマリーゴールド,あいみょん,J-Pop\n猫,DISH//,J-Rock\nうっせぇわ,Ado,J-Pop\n廻廻奇譚,Eve,Anime\n炎,LiSA,Anime\nCry Baby,Official髭男dism,Anime\nアイドル,YOASOBI,Anime,new\nKICK BACK,米津玄師,Anime\n新時代,Ado,Anime\n旅路,藤井風,J-Pop\n何なんw,藤井風,J-Pop\ngrace,藤井風,J-Pop\nきらり,藤井風,J-Pop\nSubtitle,Official髭男dism,J-Pop\n怪獣の花唄,Vaundy,J-Rock\nミックスナッツ,Official髭男dism,Anime\n水平線,back number,J-Pop\nシンデレラボーイ,Saucy Dog,J-Rock\nなんでもないや,RADWIMPS,Anime\nひまわりの約束,秦基博,J-Pop\nHANABI,Mr.Children,J-Pop\n天体観測,BUMP OF CHICKEN,J-Rock\n残酷な天使のテーゼ,高橋洋子,Anime";


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
    let app;
    
    try {
        app = await getFirebaseApp(env);
    } catch(e) {
        console.error("Firebase Init Failed:", e.message);
        return new Response(JSON.stringify({ error: "Server configuration error." }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }

    const db = getFirestore(app);
    const songDocRef = doc(db, 'songlist/default');

    try {
        if (request.method === 'GET') {
            const docSnap = await getDoc(songDocRef);
            if (docSnap.exists()) {
                return new Response(JSON.stringify(docSnap.data()), { headers: { 'Content-Type': 'application/json' } });
            } else {
                // If the document doesn't exist, create it with the default list and return it
                await setDoc(songDocRef, { list: PLAYABLE_SONGS_EXAMPLE_STR });
                return new Response(JSON.stringify({ list: PLAYABLE_SONGS_EXAMPLE_STR }), { headers: { 'Content-Type': 'application/json' } });
            }
        }

        if (request.method === 'POST') {
            const { list } = await request.json();
            if (typeof list !== 'string') {
                 return new Response(JSON.stringify({ error: "Invalid data format." }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }
            await setDoc(songDocRef, { list });
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        // Handle other methods
        return new Response('Method Not Allowed', { status: 405 });

    } catch (error) {
        console.error('Firebase operation failed:', error);
        return new Response(JSON.stringify({ error: 'Failed to communicate with the database.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}