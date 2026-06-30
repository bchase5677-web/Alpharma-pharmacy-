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

// Firestore operates in resilient offline/local-first mode automatically

