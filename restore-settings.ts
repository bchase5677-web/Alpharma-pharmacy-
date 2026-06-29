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

const DEFAULT_SETTINGS = {
  websiteName: "Alpharma",
  websiteSubName: "Medical Hub",
  companyFullName: "Alpharma Medical Hub Nig Ltd",
  telephone: "+234 803 737 7762",
  email: "alpharmamedicalhubngltd@gmail.com",
  address: "Samaru, Zaria, Kaduna",
  fullAddress: "No.3 Bomo Street opposite yardorawa Samaru, Zaria, Kaduna",
  businessHours: "8am to 10pm all days",
  whatsappNumber: "2348037377762",
  deliveryFee: 1500,
  consultationFee: 5000,
  allowPrescriptionRequires: true,
  maintenanceMode: false
};

const restore = async () => {
  try {
    fs.writeFileSync("settings_db.json", JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf-8");
    await setDoc(doc(db, "settings", "config"), DEFAULT_SETTINGS);
    console.log("Restored settings successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error restoring settings", err);
  }
};
restore();
