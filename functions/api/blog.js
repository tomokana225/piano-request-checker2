// This serverless function provides a RESTful API for blog posts.

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore/lite';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

// Helper to generate a unique ID for new posts
const generateId = () => {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}_${random}`;
}

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const isAdmin = url.searchParams.get('admin') === 'true';
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server configuration error." }), { 
            status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
    }

    const db = getFirestore(app);
    const postsCollection = collection(db, 'blogPosts');

    try {
        switch (request.method) {
            case 'GET': {
                if (id) { // Get a single post
                    const postDoc = await getDoc(doc(postsCollection, id));
                    if (!postDoc.exists()) return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
                    return new Response(JSON.stringify({ id: postDoc.id, ...postDoc.data() }), { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
                } else { // Get all posts
                    const q = isAdmin 
                        ? query(postsCollection, orderBy('createdAt', 'desc'))
                        : query(postsCollection, where('isPublished', '==', true), orderBy('createdAt', 'desc'));
                    
                    const snapshot = await getDocs(q);
                    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    return new Response(JSON.stringify(posts), { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
                }
            }

            case 'POST': { // Create or Update
                const body = await request.json();
                const postId = id || body.id || generateId();
                const postRef = doc(postsCollection, postId);

                const data = {
                    title: body.title,
                    content: body.content,
                    isPublished: body.isPublished || false,
                    updatedAt: Date.now(),
                    // Only set createdAt on new posts
                    ...(!id && !body.id && { createdAt: Date.now() })
                };

                await setDoc(postRef, data, { merge: true });
                return new Response(JSON.stringify({ success: true, id: postId }), { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
            }

            case 'DELETE': {
                if (!id) return new Response(JSON.stringify({ error: "ID is required" }), { status: 400 });
                await deleteDoc(doc(postsCollection, id));
                return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
            }

            default:
                return new Response('Method Not Allowed', { status: 405 });
        }
    } catch (error) {
        console.error('Blog API error:', error);
        return new Response(JSON.stringify({ error: 'Database operation failed.' }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
    }
}