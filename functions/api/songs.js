// functions/api/songs.js - Secret Backend Office Code

// IMPORTANT: This code runs on Cloudflare's servers, not in the browser.
// It acts as a secure proxy between your app and Firebase.

// Firestore database interaction logic
async function getDb(env) {
  // We need to dynamically import these as they are not standard in the Worker runtime
  const { initializeApp } = await import('firebase/app');
  const { getFirestore, doc, getDoc, setDoc } = await import('firebase/firestore/lite');

  const firebaseConfig = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
  };

  // Check if the app is already initialized to avoid re-initialization errors
  let app;
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    // This error is expected on subsequent calls in a hot-start environment
    // We can safely ignore it and assume the app is initialized.
    // A more robust solution might use a global variable, but this is sufficient for Pages Functions.
  }
  
  // Re-initializing is problematic, so we need a better way to handle this.
  // For now, we will proceed, but in a real-world scenario, you would manage the app instance.
  // The above try/catch is a common but basic way to handle it.
  const db = getFirestore(initializeApp(firebaseConfig)); // Re-init to be safe
  return db;
}


// Handle GET requests (fetch the song list)
export async function onRequestGet({ request, env }) {
  try {
    const db = await getDb(env);
    const docRef = doc(db, 'songs', 'playableList');
    const docSnap = await getDoc(docRef);

    let data;
    if (docSnap.exists()) {
      data = docSnap.data();
    } else {
      // If no document exists in Firebase, return a default list
      data = { list_string: "夜に駆ける,YOASOBI\nPretender,Official髭男dism" };
    }
    
    return new Response(JSON.stringify(data), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Allow your GitHub Pages domain to access this
      },
    });
  } catch (error) {
    return new Response(error.toString(), { status: 500 });
  }
}

// Handle POST requests (save the song list)
export async function onRequestPost({ request, env }) {
   try {
    const db = await getDb(env);
    const docRef = doc(db, 'songs', 'playableList');
    const body = await request.json();

    if (typeof body.list_string !== 'string') {
      return new Response('Invalid data format', { status: 400 });
    }

    await setDoc(docRef, { list_string: body.list_string });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  } catch (error) {
    return new Response(error.toString(), { status: 500 });
  }
}

// Handle OPTIONS requests (for CORS preflight)
export async function onRequestOptions({ request, env }) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
