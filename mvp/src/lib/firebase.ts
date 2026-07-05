import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "future-cos-dev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:1234567890",
};

// Initialize Firebase app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators in development environment
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const hostname = window.location.hostname || "localhost";
  
  try {
    // Connect Firestore Emulator
    connectFirestoreEmulator(db, hostname, 8080);
    console.log(`Firebase Client: Connected to Firestore Emulator at ${hostname}:8080`);
    
    // Connect Auth Emulator
    connectAuthEmulator(auth, `http://${hostname}:9099`);
    console.log(`Firebase Client: Connected to Auth Emulator at ${hostname}:9099`);
  } catch (err) {
    console.warn("Firebase Emulator connection warning:", err);
  }
}

export { app, auth, db };
