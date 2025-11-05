// This serverless function runs on Cloudflare, not in the user's browser.
// It acts as a secure intermediary to communicate with Firebase.
// This function has been extended to act as a router for multiple actions.

import { initializeApp } from 'firebase/app';
// Use the "lite" version of Firestore for serverless environments to avoid timeouts
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, deleteDoc, Timestamp } from 'firebase/firestore/lite';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';


// Default song list to be used if Firestore is empty
const PLAYABLE_SONGS_EXAMPLE_STR = "夜に駆ける,YOASOBI,J-Pop,new\nPretender,Official髭男dism,J-Pop\nLemon,米津玄師,J-Pop\n紅蓮華,LiSA,Anime\nドライフラワー,優里,J-Pop\n白日,King Gnu,J-Rock\nマリーゴールド,あいみょん,J-Pop\n猫,DISH//,J-Rock\nうっせぇわ,Ado,J-Pop\n廻廻奇譚,Eve,Anime\n炎,LiSA,Anime\nCry Baby,Official髭男dism,Anime\nアイドル,YOASOBI,Anime,new\nKICK BACK,米津玄師,Anime\n新時代,Ado,Anime\n旅路,藤井風,J-Pop\n何なんw,藤井風,J-Pop\ngrace,藤井風,J-Pop\nきらり,藤井風,J-Pop\nSubtitle,Official髭男dism,J-Pop\n怪獣の花唄,Vaundy,J-Rock\nミックスナッツ,Official髭男dism,Anime\n水平線,back number,J-Pop\nシンデレラボーイ,Saucy Dog,J-Rock\nなんでもないや,RADWIMPS,Anime\nひまわりの約束,秦基博,J-Pop\nHANABI,Mr.Children,J-Pop\n天体観測,BUMP OF CHICKEN,J-Rock\n残酷な天使のテーゼ,高橋洋子,Anime\n千本桜,黒うさP,Vocaloid,,練習中";

const DEFAULT_UI_CONFIG = {
    mainTitle: 'ともかなのリクエスト曲ー検索',
    subtitle: '弾ける曲 or ぷりんと楽譜にある曲かチェックできます',
    primaryColor: '#ec4899',
    twitcastingUrl: 'https://twitcasting.tv/g:101738740616323847745',
    ofuseUrl: '',
    doneruUrl: '',
    amazonWishlistUrl: '',
    navButtons: {
        search: { label: '曲を検索', enabled: true },
        list: { label: '曲リスト', enabled: true },
        ranking: { label: '人気曲', enabled: true },
        requests: { label: 'リクエスト', enabled: true },
        blog: { label: 'ブログ', enabled: true },
        suggest: { label: 'おまかせ選曲', enabled: true },
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

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
});

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    let app;
    try {
        app = await getFirebaseApp(env);
    } catch(e) {
        console.error("Firebase Init Failed:", e.message);
        return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const db = getFirestore(app);
    const storage = getStorage(app);
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    try {
        // --- GET Requests ---
        if (request.method === 'GET') {
            switch (action) {
                case 'getUiConfig': {
                    const docRef = doc(db, 'settings/ui');
                    const docSnap = await getDoc(docRef);
                    const data = docSnap.exists() ? { ...DEFAULT_UI_CONFIG, ...docSnap.data() } : DEFAULT_UI_CONFIG;
                    return jsonResponse(data);
                }
                case 'getBlogPosts': {
                    const postsRef = collection(db, 'blogPosts');
                    const q = query(postsRef, where('isPublished', '==', true));
                    const querySnapshot = await getDocs(q);
                    let posts = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                    
                    // Sort in-memory to avoid needing a composite index in Firestore
                    posts.sort((a, b) => {
                        const timeA = a.createdAt?._seconds ?? 0;
                        const timeB = b.createdAt?._seconds ?? 0;
                        return timeB - timeA;
                    });

                    return jsonResponse(posts);
                }
                case 'getAdminBlogPosts': {
                    const postsRef = collection(db, 'blogPosts');
                    const q = query(postsRef, orderBy('createdAt', 'desc'));
                    const querySnapshot = await getDocs(q);
                    const posts = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                    return jsonResponse(posts);
                }
                default: { // Original song list GET logic
                    const songDocRef = doc(db, 'songlist/default');
                    const docSnap = await getDoc(songDocRef);
                    if (docSnap.exists()) {
                        return jsonResponse(docSnap.data());
                    } else {
                        await setDoc(songDocRef, { list: PLAYABLE_SONGS_EXAMPLE_STR });
                        return jsonResponse({ list: PLAYABLE_SONGS_EXAMPLE_STR });
                    }
                }
            }
        }

        // --- POST Requests ---
        if (request.method === 'POST') {
            const body = await request.json();
            switch (action) {
                case 'saveUiConfig': {
                    const docRef = doc(db, 'settings/ui');
                    await setDoc(docRef, body, { merge: true });
                    return jsonResponse({ success: true });
                }
                case 'saveBlogPost': {
                    const { id, imageBase64, removeImage, ...postData } = body;
                    const docRef = id ? doc(db, 'blogPosts', id) : doc(collection(db, 'blogPosts'));
                    
                    let imageUrl = postData.imageUrl || null;

                    if (removeImage && imageUrl) {
                        try {
                            const imageRef = ref(storage, imageUrl);
                            await deleteObject(imageRef);
                        } catch (e) {
                            console.warn("Old image deletion failed, might not exist:", e.message);
                        }
                        imageUrl = null;
                    }

                    if (imageBase64) {
                        if (imageUrl) {
                            try {
                                const oldImageRef = ref(storage, imageUrl);
                                await deleteObject(oldImageRef);
                            } catch (e) {
                                console.warn("Old image deletion failed during replacement:", e.message);
                            }
                        }

                        const imageMatch = imageBase64.match(/^data:(image\/\w+);base64,(.*)$/);
                        if (!imageMatch) return jsonResponse({ error: "Invalid image format" }, 400);
                        
                        const mimeType = imageMatch[1];
                        const base64 = imageMatch[2];
                        
                        const storageRef = ref(storage, `blog_images/${docRef.id}/${Date.now()}`);
                        await uploadString(storageRef, base64, 'base64', { contentType: mimeType });
                        imageUrl = await getDownloadURL(storageRef);
                    }
                    
                    const dataToSave = {
                        ...postData,
                        imageUrl,
                        createdAt: id ? postData.createdAt : Timestamp.now(),
                        updatedAt: Timestamp.now(),
                    };
                    
                    await setDoc(docRef, dataToSave, { merge: true });
                    return jsonResponse({ success: true, id: docRef.id });
                }
                case 'deleteBlogPost': {
                    const { id } = body;
                    if (!id) return jsonResponse({ error: "ID is required" }, 400);

                    const docRef = doc(db, 'blogPosts', id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists() && docSnap.data().imageUrl) {
                        try {
                            const imageRef = ref(storage, docSnap.data().imageUrl);
                            await deleteObject(imageRef);
                        } catch (e) {
                            console.error("Image deletion failed during post deletion:", e.message);
                        }
                    }
                    
                    await deleteDoc(docRef);
                    return jsonResponse({ success: true });
                }
                default: { // Original song list POST logic
                    const { list } = body;
                    if (typeof list !== 'string') {
                        return jsonResponse({ error: "Invalid data format." }, 400);
                    }
                    const songDocRef = doc(db, 'songlist/default');
                    await setDoc(songDocRef, { list });
                    return jsonResponse({ success: true });
                }
            }
        }
        
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });

    } catch (error) {
        console.error('Firebase operation failed:', error);
        return jsonResponse({ error: 'Failed to communicate with the database.' }, 500);
    }
}
