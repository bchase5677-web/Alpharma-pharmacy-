import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyD6xvtf7GRiCz0CazRTf9WNmHfWYbMDvlI",
  authDomain: "gen-lang-client-0469091192.firebaseapp.com",
  projectId: "gen-lang-client-0469091192",
  storageBucket: "gen-lang-client-0469091192.firebasestorage.app",
  messagingSenderId: "935651895215",
  appId: "1:935651895215:web:5b9bc814c7eb4a7508f15a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-alpharmamedicalh-3f0f7d08-c1d5-4983-96f5-5c4c0d73879d");

const restore = async () => {
  try {
    let settings = JSON.parse(fs.readFileSync("settings_db.json", "utf-8"));
    settings.websiteName = "Alpharma Medical Hub Nig Ltd";
    settings.websiteSubName = "";
    settings.companyFullName = "Alpharma Medical Hub Nig Ltd";
    
    fs.writeFileSync("settings_db.json", JSON.stringify(settings, null, 2), "utf-8");
    await setDoc(doc(db, "settings", "config"), settings);
    console.log("Updated settings successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error restoring settings", err);
  }
};
restore();
