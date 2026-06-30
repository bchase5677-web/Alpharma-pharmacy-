import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD6xvtf7GRiCz0CazRTf9WNmHfWYbMDvlI",
  authDomain: "gen-lang-client-0469091192.firebaseapp.com",
  projectId: "gen-lang-client-0469091192",
  storageBucket: "gen-lang-client-0469091192.firebasestorage.app",
  messagingSenderId: "935651895215",
  appId: "1:935651895215:web:5b9bc814c7eb4a7508f15a"
};

// Initialize Firebase client SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID provided in config
export const db = getFirestore(app, "ai-studio-alpharmamedicalh-3f0f7d08-c1d5-4983-96f5-5c4c0d73879d");

// Validate connection to Firestore as requested by the skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Firestore connected successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network status (operating in resilient local-first mode).");
    } else {
      console.warn("Firestore test connection check warning (non-fatal):", error);
    }
  }
}

testConnection();
