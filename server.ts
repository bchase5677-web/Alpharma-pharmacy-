import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot 
} from "firebase/firestore";

dotenv.config();

const firebaseConfig = {
  apiKey: "AIzaSyD6xvtf7GRiCz0CazRTf9WNmHfWYbMDvlI",
  authDomain: "gen-lang-client-0469091192.firebaseapp.com",
  projectId: "gen-lang-client-0469091192",
  storageBucket: "gen-lang-client-0469091192.firebasestorage.app",
  messagingSenderId: "935651895215",
  appId: "1:935651895215:web:5b9bc814c7eb4a7508f15a"
};

// Initialize Firebase client on the server side
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, "ai-studio-alpharmamedicalh-3f0f7d08-c1d5-4983-96f5-5c4c0d73879d");

const app = express();
// Increase body-parser limits for Base64 image upload strings
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Persistent local JSON file path
const PRODUCTS_FILE_PATH = path.join(process.cwd(), "products_db.json");

// Default initial high-quality products
const DEFAULT_PRODUCTS = [
  {
    id: "1",
    name: "Paracetamol 500mg Tablets",
    category: "Over-the-Counter Medicines",
    price: 650,
    description: "Effective relief from mild to moderate pain including headache, toothache, and menstrual pains. Helps reduce fever.",
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.8,
    reviewsCount: 124
  },
  {
    id: "2",
    name: "Amoxicillin 500mg Capsules",
    category: "Prescription Medicines",
    price: 2200,
    description: "Broad-spectrum antibiotic used to treat bacterial infections such as respiratory tract infections, dental infections, and UTIs. Prescription required.",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    availability: "Requires Prescription",
    rating: 4.6,
    reviewsCount: 88
  },
  {
    id: "3",
    name: "Omeprazole 20mg Capsules",
    category: "Prescription Medicines",
    price: 1500,
    description: "Proton pump inhibitor (PPI) that decreases the amount of acid produced in the stomach. Used to treat acid reflux, peptic ulcers, and GERD.",
    image: "https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.7,
    reviewsCount: 54
  },
  {
    id: "4",
    name: "Digital Blood Pressure Monitor",
    category: "Blood Pressure Monitors",
    price: 24500,
    description: "Premium fully-automatic upper arm blood pressure monitor. Features intelligent wrapping detection, arrhythmia alert, and 90-record memory capacity.",
    image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.9,
    reviewsCount: 42
  },
  {
    id: "5",
    name: "Accu-Chek Active Glucose Meter",
    category: "Diabetes Care",
    price: 19800,
    description: "Highly accurate digital blood glucose monitoring system. Delivers results in 5 seconds with a tiny blood sample. Easy-to-read display.",
    image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.8,
    reviewsCount: 61
  },
  {
    id: "6",
    name: "Infant Multivitamin Drops",
    category: "Baby & Mother Care",
    price: 3400,
    description: "Essential multivitamin drops formulated for infants and toddlers. Contains vitamins A, C, D, and B-complex to support healthy growth and immune defense.",
    image: "https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.7,
    reviewsCount: 39
  },
  {
    id: "7",
    name: "Vitamin C 1000mg Effervescent",
    category: "Vitamins & Supplements",
    price: 2800,
    description: "High-strength premium orange-flavored Vitamin C effervescent tablets. Dissolves quickly in water to support daily immunity and vitality.",
    image: "https://images.unsplash.com/photo-1626715243389-7cfdb6271c69?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.9,
    reviewsCount: 112
  },
  {
    id: "8",
    name: "First Aid Kit (Standard Home/Office)",
    category: "First Aid",
    price: 8500,
    description: "Fully compliant emergency first aid bag containing medical tape, bandages, shears, antiseptic wipes, burn gel, CPR mask, and safety pins.",
    image: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.8,
    reviewsCount: 27
  },
  {
    id: "9",
    name: "Fingertip Pulse Oximeter",
    category: "Medical Equipment",
    price: 9500,
    description: "Accurate SpO2 pulse rate oxygen monitor with crisp multi-directional OLED display. Perfect for clinics and home monitoring of arterial hemoglobin levels.",
    image: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.6,
    reviewsCount: 33
  },
  {
    id: "10",
    name: "Digital Clinical Thermometer",
    category: "Medical Equipment",
    price: 2500,
    description: "Fast-reading digital body thermometer for oral, underarm, or rectal temperature measurement. Sound indicator alert for high temperature.",
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.7,
    reviewsCount: 74
  },
  {
    id: "11",
    name: "Dettol Antiseptic Liquid 500ml",
    category: "Personal Care",
    price: 3100,
    description: "Chloroxylenol formulation for antiseptic disinfection of cuts, wounds, skin, household surfaces, and laundry. Essential family germ defense.",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.9,
    reviewsCount: 156
  },
  {
    id: "12",
    name: "Surgical Face Masks (Box of 50)",
    category: "Hospital Supplies",
    price: 3500,
    description: "Premium 3-ply medical-grade disposable face masks with high filtration efficiency. Comfortable nose clips and stretchable elastic ear loops.",
    image: "https://images.unsplash.com/photo-1586942593568-29361efcd571?w=500&auto=format&fit=crop&q=80",
    availability: "In Stock",
    rating: 4.5,
    reviewsCount: 48
  }
];

// Read from JSON file database
function loadProducts(): any[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE_PATH)) {
      const data = fs.readFileSync(PRODUCTS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(DEFAULT_PRODUCTS, null, 2), "utf-8");
      return DEFAULT_PRODUCTS;
    }
  } catch (err) {
    console.error("Error reading products db file:", err);
    return DEFAULT_PRODUCTS;
  }
}

// Write to JSON file database
function saveProducts(products: any[]) {
  try {
    fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(products, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving products db file:", err);
  }
}

// Persistent settings storage
const SETTINGS_FILE_PATH = path.join(process.cwd(), "settings_db.json");

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
  maintenanceMode: false,
  logo: ""
};

function loadSettings(): any {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed.logo === undefined) parsed.logo = "";
      return parsed;
    } else {
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf-8");
      return DEFAULT_SETTINGS;
    }
  } catch (err) {
    console.error("Error reading settings file:", err);
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving settings file:", err);
  }
}

// Subscribe to real-time Firestore synchronization for Settings
const settingsDocRef = doc(db, "settings", "config");
onSnapshot(settingsDocRef, (snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.data();
    saveSettings(data);
    console.log("Settings synchronized from Firestore successfully.");
  } else {
    console.log("Settings document not found in Firestore. Bootstrapping initial settings...");
    const localSettings = loadSettings();
    setDoc(settingsDocRef, localSettings).catch(err => {
      console.error("Failed to seed initial settings to Firestore:", err);
    });
  }
}, (err) => {
  console.error("Firestore settings sync error:", err);
});

// Subscribe to real-time Firestore synchronization for Products
const productsCollRef = collection(db, "products");
onSnapshot(productsCollRef, (snapshot) => {
  const firestoreProducts: any[] = [];
  snapshot.forEach((doc) => {
    firestoreProducts.push({ id: doc.id, ...doc.data() });
  });

  if (firestoreProducts.length > 0) {
    // Sort products by ID to preserve consistency
    firestoreProducts.sort((a, b) => {
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      if (idA !== idB) return idA - idB;
      return String(a.id).localeCompare(String(b.id));
    });
    saveProducts(firestoreProducts);
    console.log(`Inventory synced from Firestore. Total: ${firestoreProducts.length} items.`);
  } else {
    console.log("Products collection is empty in Firestore. Seeding default medical catalog...");
    const localProducts = loadProducts();
    localProducts.forEach((prod) => {
      const { id, ...data } = prod;
      setDoc(doc(db, "products", String(id)), data).catch(err => {
        console.error(`Failed to seed product ${id} to Firestore:`, err);
      });
    });
  }
}, (err) => {
  console.error("Firestore products sync error:", err);
});


// In-memory visitor analytics and dynamic activity logging
let activityLogs: any[] = [
  { id: "1", type: "system", message: "Server initialized successfully", timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: "2", type: "visitor", message: "New visitor arrived from Zaria Terminal 1", timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: "3", type: "visitor", message: "New visitor arrived from Kaduna Node", timestamp: new Date(Date.now() - 900000).toISOString() }
];

let totalPageViews = 1528;
let totalWhatsappClicks = 194;

function addLog(type: string, message: string) {
  activityLogs.unshift({
    id: String(Date.now()),
    type,
    message,
    timestamp: new Date().toISOString()
  });
  if (activityLogs.length > 50) {
    activityLogs = activityLogs.slice(0, 50);
  }
}

// AI Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not configured. Falling back to offline assistant.");
      return res.json({
        text: "Thank you for reaching out to Alpharma Medical Hub. I'm currently running in sandbox mode. How can I assist you with our services, or would you like to chat with our healthcare team directly on WhatsApp?"
      });
    }

    // Build contents parameter including chat history for context
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.role,
          parts: [{ text: turn.text }]
        });
      }
    }
    // Add the current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const currentProducts = loadProducts();
    const currentSettings = loadSettings();

    const systemInstruction = `You are a highly professional, caring, and intelligent medical and pharmacy AI customer support assistant for **${currentSettings.companyFullName || "Alpharma Medical Hub Nig Ltd"}**, located in ${currentSettings.address || "Samaru, Zaria, Kaduna State, Nigeria"}.
 
Contact Details:
- Business Name: ${currentSettings.companyFullName}
- Phone & WhatsApp: ${currentSettings.telephone}
- Email: ${currentSettings.email}
- Physical Address: ${currentSettings.fullAddress}

Our Services & Scope:
- We provide high-quality prescription medicines, OTC medications, medical equipment, hospital supplies, surgical equipment, diabetes/BP monitors, first aid kits, baby care, vitamins, and supplements.
- We support individuals, private clinics, public hospitals, and businesses across Nigeria.
- We offer fast delivery across our operating region with a standard fee of ₦${(currentSettings.deliveryFee || 1500).toLocaleString()}.
- Secure payments are supported via bank transfers and card payments.

Your goals:
1. Welcoming visitors warmly with Nigerian hospital hospitality.
2. Answering general health, medical equipment, and drug-usage queries scientifically and safely, but with a friendly tone.
3. Helping users find products. Our main product catalog has:
${currentProducts.map(p => `- ${p.name} (${p.category}) - ₦${p.price.toLocaleString()} (${p.availability})`).join("\n")}
4. Explaining drug usages, side effects warning (always advise consulting a doctor for prescription meds), and general health advice.
5. Guiding customers through ordering (adding to cart, and checking out, which initiates a prefilled WhatsApp order text to ${currentSettings.telephone}).
6. Booking consultations or helping customers connect to a real health professional.
7. If you do not know the answer to a question, or if the customer needs medical diagnosis, prescription validation, or complex support, you MUST politely say exactly:
"I’ll connect you directly with our healthcare team on WhatsApp."
and offer to redirect them. Always keep your tone trustworthy, professional, and empathetic. Avoid using flowery language or self-praise. Do not larp about being a system server - talk like a human expert healthcare assistant. Keep responses relatively concise so they fit well in a chat bubble.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to process chat" });
  }
});

// Serve API endpoints first
app.get("/api/products", (req, res) => {
  const products = loadProducts();
  res.json(products);
});

// Add new product
app.post("/api/products", async (req, res) => {
  try {
    const products = loadProducts();
    const newProduct = req.body;
    
    if (!newProduct.name || !newProduct.category || newProduct.price === undefined) {
      return res.status(400).json({ error: "Name, category, and price are required." });
    }

    const productId = newProduct.id || String(Date.now());
    const product = {
      id: productId,
      name: newProduct.name,
      category: newProduct.category,
      price: Number(newProduct.price),
      description: newProduct.description || "",
      image: newProduct.image || "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80",
      availability: newProduct.availability || "In Stock",
      rating: Number(newProduct.rating) || 5.0,
      reviewsCount: Number(newProduct.reviewsCount) || 1
    };

    // Save locally first
    products.push(product);
    saveProducts(products);

    // Save to Firestore
    const { id, ...data } = product;
    await setDoc(doc(db, "products", productId), data);

    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add product" });
  }
});

// Edit/Update product
app.put("/api/products/:id", async (req, res) => {
  try {
    const products = loadProducts();
    const productId = req.params.id;
    const updatedData = req.body;

    const index = products.findIndex((p: any) => p.id === productId);
    if (index === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    const existing = products[index];
    const updatedProduct = {
      ...existing,
      name: updatedData.name !== undefined ? updatedData.name : existing.name,
      category: updatedData.category !== undefined ? updatedData.category : existing.category,
      price: updatedData.price !== undefined ? Number(updatedData.price) : existing.price,
      description: updatedData.description !== undefined ? updatedData.description : existing.description,
      image: updatedData.image !== undefined ? updatedData.image : existing.image,
      availability: updatedData.availability !== undefined ? updatedData.availability : existing.availability,
      rating: updatedData.rating !== undefined ? Number(updatedData.rating) : existing.rating,
      reviewsCount: updatedData.reviewsCount !== undefined ? Number(updatedData.reviewsCount) : existing.reviewsCount,
    };

    products[index] = updatedProduct;
    saveProducts(products);

    // Write updates to Firestore
    const { id, ...data } = updatedProduct;
    await setDoc(doc(db, "products", productId), data, { merge: true });

    res.json(updatedProduct);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update product" });
  }
});

// Delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const products = loadProducts();
    const productId = req.params.id;

    const filtered = products.filter((p: any) => p.id !== productId);
    if (filtered.length === products.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    saveProducts(filtered);

    // Delete from Firestore
    await deleteDoc(doc(db, "products", productId));

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete product" });
  }
});

// Get website configuration settings
app.get("/api/settings", (req, res) => {
  const settings = loadSettings();
  res.json(settings);
});

// Update website configuration settings
app.put("/api/settings", async (req, res) => {
  try {
    const updatedSettings = req.body;
    saveSettings(updatedSettings);
    
    // Save to Firestore config document
    await setDoc(doc(db, "settings", "config"), updatedSettings);

    addLog("system", "Website information & parameters updated dynamically from secure terminal");
    res.json(updatedSettings);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save settings" });
  }
});

// Get dashboard stats and live visitor counter
app.get("/api/stats", (req, res) => {
  const products = loadProducts();
  
  // Dynamic fluctuating visitor counter between 8 and 23
  const minutes = new Date().getMinutes();
  const simulatedLiveVisitors = 8 + (minutes % 15) + (Math.random() > 0.5 ? 1 : 0);
  
  const totalValue = products.reduce((sum, p) => sum + p.price, 0);
  
  res.json({
    liveVisitors: simulatedLiveVisitors,
    totalPageViews,
    totalWhatsappClicks,
    totalProducts: products.length,
    totalStockValue: totalValue,
    logs: activityLogs
  });
});

// Log visitor activity events from frontend
app.post("/api/logs", (req, res) => {
  try {
    const { type, message } = req.body;
    if (message) {
      if (type === "whatsapp_click") {
        totalWhatsappClicks += 1;
      } else if (type === "page_view") {
        totalPageViews += 1;
      }
      addLog(type || "visitor", message);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Message is required" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add activity log" });
  }
});

async function startServer() {
  app.get("/manifest.json", (req, res) => {
    const currentSettings = loadSettings();
    const defaultIcon = "https://placehold.co/512x512/2563eb/ffffff.png?text=A";
    const icon = currentSettings.logo || defaultIcon;
    
    res.json({
      "name": currentSettings.companyFullName || "Alpharmamed.co",
      "short_name": currentSettings.websiteName || "Alpharmamed",
      "description": currentSettings.companyFullName || "Alpharma Medical Hub Nig Ltd",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#ffffff",
      "theme_color": "#2563eb",
      "icons": [
        {
          "src": icon,
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "any maskable"
        },
        {
          "src": icon,
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "any maskable"
        }
      ]
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Alpharma Medical Hub server running on port ${PORT}`);
  });
}

startServer();
