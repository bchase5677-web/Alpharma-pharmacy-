import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import AIChatWidget from './components/AIChatWidget';
import AccountModal from './components/AccountModal';
import LucideIcon from './components/LucideIcon';
import AdminPanel from './components/AdminPanel';
import InstallPWA from './components/InstallPWA';
import { CATEGORIES, PRODUCTS, TESTIMONIALS, SERVICES } from './data';
import { Product, CartItem, Tab, WebsiteSettings } from './types';
import { 
  Heart, Search, ArrowRight, ShieldCheck, MapPin, Calendar, Clock, Send, CheckCircle2, 
  MessageSquare, Star, ArrowUp, Info, User, HelpCircle, Sparkles, Activity, FileText, CheckCircle, X
} from 'lucide-react';
import { onSnapshot, collection, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { getApiUrl } from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Real-time Dynamic Website Settings State
  const [settings, setSettings] = useState<WebsiteSettings>({
    websiteName: "Alpharma Medical Hub Nig Ltd",
    websiteSubName: "",
    companyFullName: "Alpharma Medical Hub Nig Ltd",
    telephone: "+234 803 737 7762",
    email: "alpharmamedicalhubngltd@gmail.com",
    address: "Kaduna",
    fullAddress: "Kaduna State",
    businessHours: "9am - 10pm all the days",
    whatsappNumber: "2348037377762",
    deliveryFee: 1500,
    consultationFee: 5000,
    allowPrescriptionRequires: true,
    maintenanceMode: false
  });

  const fetchWithRetry = async (url: string, options?: RequestInit, retries = 4, delay = 1000): Promise<Response> => {
    try {
      const res = await fetch(url, options);
      if (!res.ok && retries > 0) {
        throw new Error(`Response status: ${res.status}`);
      }
      return res;
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      throw err;
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetchWithRetry(getApiUrl(`/api/settings?t=${Date.now()}`));
      if (res.ok) {
        const data = await res.json() as WebsiteSettings;
        if (data.logo && !data.logo.startsWith('data:')) {
          const separator = data.logo.includes('?') ? '&' : '?';
          data.logo = `${data.logo}${separator}cb=${Date.now()}`;
        }
        setSettings(data);
      }
    } catch (err) {
      console.warn('Could not fetch website settings from terminal server (using active real-time config):', err);
    }
  };

  const handleUpdateSettings = async (newSettings: WebsiteSettings) => {
    try {
      const res = await fetchWithRetry(getApiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        setSettings(newSettings);
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Server returned status " + res.status);
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      throw err;
    }
  };

  const logEvent = async (type: string, message: string) => {
    try {
      await fetchWithRetry(getApiUrl('/api/logs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message })
      }, 1, 500);
    } catch (err) {
      // non-blocking
    }
  };

  // Real-time Dynamic Products State (initializes with fallback dataset for instant paint)
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // Fetch dynamic products from Express server database
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetchWithRetry(getApiUrl(`/api/products?t=${Date.now()}`));
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.warn('Could not fetch dynamic inventory from terminal server (using active local copy):', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    logEvent('page_view', 'A new user connected to the Alpharma Medical Hub Nig Ltd main portal');

    // 1. Subscribe to Real-Time Settings from Firestore
    const unsubscribeSettings = onSnapshot(doc(db, "settings", "config"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as WebsiteSettings;
        if (data.logo && !data.logo.startsWith('data:')) {
          // Force immediate invalidation by appending cache-busting timestamp
          const separator = data.logo.includes('?') ? '&' : '?';
          data.logo = `${data.logo}${separator}cb=${Date.now()}`;
        }
        setSettings(data);
        
        try {
          // Update document title and icons dynamically for PWA
          document.title = data.companyFullName || "Alpharma Medical Hub Nig Ltd";
          if (data.logo) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = data.logo;

            let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
            if (appleIcon) {
              appleIcon.href = data.logo;
            }
          }
        } catch (domErr) {
          console.error("DOM update error:", domErr);
        }
      } else {
        fetchSettings(); // Fallback if document is not seeded yet
      }
    }, (err) => {
      console.warn("Client failed to sync settings from Firestore, using HTTP poll fallback:", err);
      fetchSettings();
    });

    // 2. Subscribe to Real-Time Products from Firestore
    setIsLoadingProducts(true);
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const firestoreProducts: Product[] = [];
      snapshot.forEach((docSnapshot) => {
        firestoreProducts.push({ id: docSnapshot.id, ...docSnapshot.data() } as Product);
      });

      if (firestoreProducts.length > 0) {
        setProducts(currentProducts => {
          const mergedMap = new Map();
          firestoreProducts.forEach(p => mergedMap.set(p.id, p));
          currentProducts.forEach(p => {
            if (!mergedMap.has(p.id)) {
              mergedMap.set(p.id, p);
            }
          });
          const merged = Array.from(mergedMap.values());
          // Sort products by ID to keep order
          merged.sort((a, b) => {
            const idA = Number(a.id) || 0;
            const idB = Number(b.id) || 0;
            if (idA !== idB) return idA - idB;
            return String(a.id).localeCompare(String(b.id));
          });
          return merged;
        });
      } else {
        fetchProducts(); // Fallback if collection is empty
      }
      setIsLoadingProducts(false);
    }, (err) => {
      console.warn("Client failed to sync products from Firestore, using HTTP poll fallback:", err);
      fetchProducts();
    });

    // Periodic check-in / sync fallback (every 30 seconds) in case of network issues
    const syncInterval = setInterval(() => {
      fetchProducts();
      fetchSettings();
    }, 30000);

    return () => {
      unsubscribeSettings();
      unsubscribeProducts();
      clearInterval(syncInterval);
    };
  }, []);

  // CRUD API Handlers for Admin Panel
  const handleAddProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      const res = await fetch(getApiUrl('/api/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        await fetchProducts();
        return true;
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status: ${res.status}`);
    } catch (err: any) {
      console.error('Failed to add product on server:', err);
      throw err; // Propagate the error so AdminPanel can display it
    }
  };

  const handleEditProduct = async (id: string, updatedFields: Partial<Product>) => {
    try {
      const res = await fetch(getApiUrl(`/api/products/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        await fetchProducts();
        return true;
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status: ${res.status}`);
    } catch (err: any) {
      console.error('Failed to update product on server:', err);
      throw err;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/products/${id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchProducts();
        return true;
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status: ${res.status}`);
    } catch (err: any) {
      console.error('Failed to delete product on server:', err);
      throw err;
    }
  };
  
  // Cart & Wishlist States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  
  // Modal visibility states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('Alhaji Musa');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('All');

  // Contact Form submit state
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Back to top button state
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Apply dark mode theme to root body HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Monitor scroll for Back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    // Visual feedback helper
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Wishlist Handlers
  const handleAddToWishlist = (product: Product) => {
    setWishlist(prev => {
      const isAlreadyWishlisted = prev.some(item => item.id === product.id);
      if (isAlreadyWishlisted) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  // Direct WhatsApp order dispatcher for a single product
  const handleOrderViaWhatsApp = (product: Product) => {
    const message = `Hello Alpharma Medical Hub Nig Ltd,\nI would like to order: *${product.name}*\nCategory: ${product.category}\nPrice: ₦${product.price.toLocaleString()}\n\nPlease verify availability and guide me through the delivery options in Kaduna.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/2348037377762?text=${encoded}`, '_blank');
  };

  // Search filtering logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesAvailability = availabilityFilter === 'All' || 
                                (availabilityFilter === 'In Stock' && product.availability === 'In Stock') ||
                                (availabilityFilter === 'Prescription' && product.availability === 'Requires Prescription');

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Contact form submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    }, 5000);
  };

  // Newsletter signup
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    setTimeout(() => {
      setNewsletterSubscribed(false);
      setNewsletterEmail('');
    }, 4000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Install App Banner */}
      <InstallPWA />

      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // Auto clear filters on switching tab
          setSelectedCategory('All');
        }}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        wishlistCount={wishlist.length}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        isLoggedIn={isLoggedIn}
        username={username}
        settings={settings}
      />

      {/* Main Container */}
      <main className="flex-grow">
        
        {/* HOMEPAGE TAB */}
        {activeTab === 'home' && (
          <div className="space-y-16 pb-16">
            
            {/* Professional Healthcare Hero Section */}
            <section className="relative bg-slate-900 text-white overflow-hidden py-16 sm:py-24 lg:py-32" id="hero-section">
              {/* Decorative health graphics background */}
              <div className="absolute inset-0 opacity-25">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-slate-900 to-emerald-950 mix-blend-multiply z-10" />
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&auto=format&fit=crop&q=80" 
                  alt="Medical Professional Kaduna"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Glowing decorative rings */}
              <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />

              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
                <div className="max-w-3xl space-y-6">
                  {/* High Quality Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-teal-300">
                    <ShieldCheck size={14} className="animate-pulse" />
                    <span>Quality Pharmaceutical & Hospital Supply Hub</span>
                  </div>

                  {/* Headline */}
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                    Your Trusted Medical & <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-blue-300">
                      Pharmacy Partner
                    </span> in Kaduna State
                  </h2>

                  {/* Subheading */}
                  <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                    Providing quality medicines, healthcare products, medical equipment, and professional healthcare services with fast, reliable customer support. Based in Kaduna, delivering across Kaduna State.
                  </p>

                  {/* Smart Immediate Search Bar */}
                  <div className="pt-2 max-w-lg">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-200/50 dark:border-slate-800">
                      <Search className="text-slate-400 ml-2" size={18} />
                      <input
                        type="text"
                        placeholder="Search standard medicines, blood pressure meters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setActiveTab('shop');
                          }
                        }}
                        className="w-full bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-xs sm:text-sm"
                      />
                      <button
                        onClick={() => setActiveTab('shop')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1"
                      >
                        Search <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Primary Call to Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    <button
                      onClick={() => setActiveTab('shop')}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                      Shop Now
                    </button>
                    <button
                      onClick={() => setActiveTab('contact')}
                      className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold py-3 px-6 rounded-xl text-xs sm:text-sm transition-all"
                    >
                      Contact Us
                    </button>
                    <a
                      href="https://wa.me/2348037377762"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                    >
                      <MessageSquare size={16} /> Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Premium Stats Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-30">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xl transition-colors">
                <div className="text-center p-2 border-r border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="block text-3xl font-extrabold text-blue-600 dark:text-blue-400">100%</span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Genuine Pharmas</span>
                </div>
                <div className="text-center p-2 md:border-r border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="block text-3xl font-extrabold text-emerald-500">2 Hr</span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kaduna Delivery</span>
                </div>
                <div className="text-center p-2 border-r border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="block text-3xl font-extrabold text-blue-600 dark:text-blue-400">5k+</span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patients Served</span>
                </div>
                <div className="text-center p-2 last:border-0">
                  <span className="block text-3xl font-extrabold text-emerald-500">24/7</span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Consultation</span>
                </div>
              </div>
            </section>

            {/* Attractive Category Highlight Carousel */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Shop by Medical Categories</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Explore our range of medicines and clinical apparatuses</p>
                </div>
                <button 
                  onClick={() => setActiveTab('categories')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  View All Categories <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {CATEGORIES.slice(0, 6).map((cat) => (
                  <div
                    key={cat.name}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setActiveTab('shop');
                    }}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-900 hover:shadow-lg transition-all flex flex-col items-center justify-center group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <LucideIcon name={cat.icon} size={24} />
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{cat.name}</h4>
                    <span className="text-[10px] text-slate-400 mt-1">{cat.count} products</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Featured Products */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Featured Medical & Pharmacy Products</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Clinically tested, certified authentic pharmaceutical inventory</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setActiveTab('shop');
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  View Full Pharmacy Store <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onAddToWishlist={handleAddToWishlist}
                    isWishlisted={wishlist.some(item => item.id === product.id)}
                    onOrderViaWhatsApp={handleOrderViaWhatsApp}
                    onSelectProduct={setSelectedProduct}
                  />
                ))}
              </div>
            </section>

            {/* AI Medical Copilot Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-12 text-white relative overflow-hidden border border-white/10 shadow-xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-1 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold text-blue-300">
                    <Sparkles size={12} /> Instant Healthcare Diagnostics
                  </div>
                  <h3 className="text-xl sm:text-4xl font-extrabold tracking-tight">Need drug dosages, usage alerts, or fast orders?</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Our intelligent pharmacy AI Assistant is trained specifically on medical equipment operation, prescription safety, and regional delivery questions. It's ready to serve you 24/7.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('ai-assistant')}
                      className="px-5 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow"
                    >
                      Consult AI Assistant Now <ArrowRight size={12} />
                    </button>
                    <a
                      href="https://wa.me/2348037377762"
                      target="_blank"
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                    >
                      Contact Human Pharmacist
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Why Choose Us */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900/40 rounded-3xl p-8 sm:p-12 border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h3 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Why Choose Alpharma Medical Hub Nig Ltd?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Providing trusted medical equipment and health supplies under strict regulatory standards</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Genuine Products", desc: "No mock medicines or substandard items. Every drug and surgical device is direct from premium licensed manufacturers.", icon: "ShieldCheck" },
                  { title: "Affordable Prices", desc: "Competitive and transparent pricing designed to support local families, private clinics, and hospital budgets.", icon: "HeartPulse" },
                  { title: "Professional Support", desc: "Access direct consultations with real certified pharmacists in Kaduna and medical equipment troubleshooting.", icon: "User" },
                  { title: "Fast Delivery", desc: "Dedicated dispatch riders shipping instantly in Kaduna and fast courier shipping across Kaduna State.", icon: "Activity" },
                  { title: "Secure Payments", desc: "Direct secure bank transfers, payment on delivery (POD), and card gateways are fully supported.", icon: "CheckCircle2" },
                  { title: "Trusted Pharmacy", desc: "Fully registered and compliant corporate medical distributor serving individuals and businesses since inception.", icon: "Info" },
                  { title: "AI Customer Support", desc: "Instant help 24/7 with dosages, catalog searches, and seamless escalation to our human staff on WhatsApp.", icon: "Sparkles" },
                  { title: "Quality Assurance", desc: "Rigorous storage control, keeping cold-chain vaccines and sensitive clinical supplies stored under optimal environments.", icon: "ShieldCheck" }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                      <LucideIcon name={item.icon} size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Testimonials Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h3 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white font-bold">What Our Customers Say</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Read reviews from local patients, clinical directors, and families</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {TESTIMONIALS.map((t) => (
                  <div key={t.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex gap-0.5 text-amber-400 mb-2">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">"{t.comment}"</p>
                    </div>
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <img src={t.avatar} alt={t.name} className="w-9 h-9 object-cover rounded-full border border-slate-200 dark:border-slate-800" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.name}</h4>
                        <span className="text-[10px] text-slate-400 block">{t.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Newsletter Subscription */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-blue-600 dark:bg-blue-900 text-white p-8 sm:p-12 rounded-3xl text-center space-y-4 max-w-4xl mx-auto shadow-xl">
                <h3 className="text-xl sm:text-3xl font-extrabold">Stay Informed with Alpharma Medical Hub Nig Ltd Health Alerts</h3>
                <p className="text-xs sm:text-sm text-blue-100 max-w-lg mx-auto">
                  Subscribe to receive safety updates, new clinical machinery stock notifications, and pharmacy tips in Kaduna State.
                </p>

                {newsletterSubscribed ? (
                  <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs max-w-sm mx-auto font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 size={14} /> Thank you! Subscribed to our medical mailing list successfully.
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="flex-1 bg-white/10 border border-white/25 focus:ring-2 focus:ring-white rounded-xl text-white text-xs px-4 py-3 outline-none placeholder:text-white/60"
                    />
                    <button
                      type="submit"
                      className="bg-white hover:bg-slate-100 text-blue-700 font-bold px-6 py-3 rounded-xl text-xs transition-colors shadow"
                    >
                      Subscribe
                    </button>
                  </form>
                )}
              </div>
            </section>

          </div>
        )}

        {/* SHOP TAB */}
        {activeTab === 'shop' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Pharmacy & Medical Catalog</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Filter, search, and order via automated WhatsApp checkout</p>
              </div>

              {/* Dynamic Search Bar */}
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Filter by product name, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Side Filters Sidebar */}
              <div className="w-full lg:w-64 shrink-0 space-y-6">
                
                {/* Category Selector */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Categories</h4>
                    <span className="text-[10px] text-slate-400">Filter inventory collections</span>
                  </div>
                  
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                        selectedCategory === 'All'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span>All Products</span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-semibold">{products.length}</span>
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                          selectedCategory === cat.name
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="truncate pr-1">{cat.name}</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                          {products.filter(p => p.category === cat.name).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prescription & Status Filters */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Prescription Status</h4>
                  
                  <div className="space-y-2 text-xs font-bold">
                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="radio"
                        name="availability"
                        checked={availabilityFilter === 'All'}
                        onChange={() => setAvailabilityFilter('All')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Show All Items</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="radio"
                        name="availability"
                        checked={availabilityFilter === 'In Stock'}
                        onChange={() => setAvailabilityFilter('In Stock')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>In Stock Only</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="radio"
                        name="availability"
                        checked={availabilityFilter === 'Prescription'}
                        onChange={() => setAvailabilityFilter('Prescription')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Requires Prescription</span>
                    </label>
                  </div>
                </div>

                {/* Local Help Desk Banner */}
                <div className="bg-gradient-to-tr from-teal-600 to-blue-700 text-white p-5 rounded-2xl space-y-2">
                  <h5 className="text-xs font-bold">Need a specific medication?</h5>
                  <p className="text-[10px] text-teal-100 leading-relaxed">
                    If you cannot find a specialized oncology or pediatric prescription medication in our active list, submit an inquiry and we will supply it.
                  </p>
                  <button 
                    onClick={() => setActiveTab('contact')}
                    className="w-full mt-2 bg-white text-slate-900 text-[10px] font-bold py-1.5 rounded-lg hover:bg-slate-100"
                  >
                    Submit Custom Prescription
                  </button>
                </div>

              </div>

              {/* Right Side Products Grid */}
              <div className="flex-1 space-y-6">
                
                {filteredProducts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 text-center rounded-2xl">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No products found</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                      No matches for your query. Try clearing your search text or selecting "All Products".
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                        setAvailabilityFilter('All');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Reset Store Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Showing <strong>{filteredProducts.length}</strong> medical product results</span>
                      <span>Category: <strong>{selectedCategory}</strong></span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onAddToWishlist={handleAddToWishlist}
                          isWishlisted={wishlist.some(item => item.id === product.id)}
                          onOrderViaWhatsApp={handleOrderViaWhatsApp}
                          onSelectProduct={setSelectedProduct}
                        />
                      ))}
                    </div>
                  </>
                )}

              </div>

            </div>
          </div>
        )}

        {/* MEDICAL EQUIPMENT TAB */}
        {activeTab === 'equipment' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Medical Equipment & Hospital Supplies</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Professional grade diagnostic devices, clinical apparatus, surgical tools, and durable supplies</p>
            </div>

            {/* Premium equipment banners */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Diagnostic Electronics", desc: "Digital blood pressure monitors, clinical thermometers, fingertip pulse oximeters, and Accu-Chek glucometers with 2-year warranty guidelines.", icon: "Activity" },
                { title: "Hospital Supplies", desc: "High-grade disposable medical masks, latex gloves, clinical sheets, catheters, syringes, and infusion lines for sterile surgery.", icon: "ShieldCheck" },
                { title: "Surgical Equipment", desc: "Stainless steel scalpels, clinical suture kits, artery clamps, wound forceps, and professional surgical diagnostic lights.", icon: "Briefcase" }
              ].map((eq, index) => (
                <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                    <LucideIcon name={eq.icon} size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{eq.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{eq.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filtered equipment store lists */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Available Equipment in Stock</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.filter(p => p.category === 'Medical Equipment' || p.category === 'Blood Pressure Monitors' || p.category === 'Diabetes Care' || p.category === 'Hospital Supplies' || p.category === 'Surgical Equipment').map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onAddToWishlist={handleAddToWishlist}
                    isWishlisted={wishlist.some(item => item.id === product.id)}
                    onOrderViaWhatsApp={handleOrderViaWhatsApp}
                    onSelectProduct={setSelectedProduct}
                  />
                ))}
              </div>
            </div>

            {/* Custom Supply Inquiry Block */}
            <div className="p-8 bg-slate-900 text-white rounded-3xl text-center space-y-4 max-w-4xl mx-auto">
              <h4 className="text-lg sm:text-2xl font-extrabold">Need Custom Clinic Setup or Bulk Equipment?</h4>
              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                We supply autoclave sterilizers, examination couches, diagnostic screens, and dental chairs to general clinics, hospitals, and NGOs across Kaduna State. Let us provide a professional quotation.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('contact')}
                  className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
                >
                  Request Equipment Quote
                </button>
                <a
                  href="https://wa.me/2348037377762"
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5"
                >
                  <MessageSquare size={14} /> Quick WhatsApp Consult
                </a>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Product Categories</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Browse our carefully curated pharmacy collections and surgical instruments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setActiveTab('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-blue-300 dark:hover:border-blue-900 hover:shadow-xl transition-all flex items-start gap-4 group"
                  id={`category-item-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <LucideIcon name={cat.icon} size={22} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cat.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {cat.description}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 block pt-1">
                      {cat.count} clinical formulations
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h3 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Healthcare & Pharmaceutical Services</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Excellent customer care, registered medical supply contracts, and professional pharmaceutical consulting</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {SERVICES.map((serv, index) => (
                <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                      <LucideIcon name={serv.icon} size={24} />
                    </div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">{serv.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{serv.description}</p>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={`https://wa.me/2348037377762?text=Hello%20Alpharma%20Medical%20Hub%20Nig%20Ltd,%20I%20am%20interested%20in%20your%20services%20regarding%20${encodeURIComponent(serv.title)}`}
                      target="_blank"
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Inquire About This Service <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Diagnostic Clinic Banner */}
            <div className="p-8 bg-gradient-to-tr from-emerald-600 to-blue-700 text-white rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto shadow-lg">
              <div className="space-y-2 text-center md:text-left">
                <h4 className="text-lg sm:text-2xl font-extrabold">Visit our Diagnostic Checkup Hub in Kaduna</h4>
                <p className="text-xs text-slate-200 max-w-md leading-relaxed">
                  Drop by Kaduna for rapid testing. Our certified staff will check your Blood Pressure, Glucose levels, pulse rate, and temperature under strict medical supervision.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('contact')}
                className="bg-white hover:bg-slate-50 text-slate-900 font-bold px-6 py-3 rounded-xl text-xs transition-all shrink-0"
              >
                Find Physical Location
              </button>
            </div>
          </div>
        )}

        {/* ABOUT US TAB */}
        {activeTab === 'about' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
            
            {/* Main story panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">About Our Corporation</span>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                    Alpharma Medical Hub Nig Ltd
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Alpharma Medical Hub Nig Ltd is a premier certified pharmaceutical distributor, medical equipment vendor, and community clinical partner committed to providing quality healthcare products, medical devices, and professional consulting services.
                </p>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Located strategically in <strong>Kaduna State</strong>, we service private family clinics, major public hospitals, schools, corporate health centers, and individual patients. We work with strict regulatory safeguards to ensure that every prescription, diagnostic device, and consumable meets strict global safety specifications.
                </p>

                <div className="border-l-4 border-emerald-500 pl-4 py-1 bg-emerald-50/40 dark:bg-emerald-950/10">
                  <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100">Our Sacred Mission</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                    To make critical, life-saving medicines and modern diagnostic electronics accessible, affordable, and readily available across Kaduna State.
                  </p>
                </div>
              </div>

              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800&auto=format&fit=crop&q=80"
                  alt="Medical facility"
                  className="rounded-3xl shadow-xl w-full object-cover aspect-video lg:aspect-square"
                />
                <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg">
                    ✓
                  </div>
                  <div>
                    <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-100">PCN Registered</span>
                    <span className="text-[9px] text-slate-400">Strict regulatory pharmaceutical standards</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Pillars */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-100 dark:border-slate-800 space-y-8">
              <h4 className="text-lg sm:text-2xl font-bold text-center">Our Pillars of Professional Excellence</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "Sourcing Integrity", desc: "We maintain direct procurement accounts with multinational manufacturing labs, ensuring that substandard or counterfeit pharmaceuticals never enter our supply channels." },
                  { title: "Empathetic Healthcare Support", desc: "Whether diagnosing BP anomalies with our meters or discussing prescription safety with our AI and licensed pharmacists, your wellness is our paramount focus." },
                  { title: "Prompt Regional Logistics", desc: "Medicines are time-sensitive. We deploy rapid dispatch riders to Kaduna, and environs to ensure emergency products arrive safely on time." }
                ].map((pillar, idx) => (
                  <div key={idx} className="p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">0{idx+1}</span>
                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">{pillar.title}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* AI ASSISTANT FULLSCREEN TAB */}
        {activeTab === 'ai-assistant' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Ask Alpharma Medical Hub Nig Ltd AI Doctor Co-pilot</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Check active medicine inventories, receive drug dosing explanations, verify shipping options, or connect instantly to a human medical expert.
              </p>
            </div>

            {/* Embeded Chat widget */}
            <AIChatWidget isEmbed={true} onNavigate={setActiveTab} />

            {/* Important Disclaimer */}
            <div className="max-w-3xl mx-auto p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl flex gap-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">Important Medical Disclaimer:</strong> Alpharma Medical Hub Nig Ltd AI Assistant is a digital support companion programmed to assist with pharmaceutical details, general health FAQs, and ordering. It does not replace the professional diagnostic decisions of a physical clinical practitioner. Always consult a physician or our licensed staff pharmacists on WhatsApp (+2348037377762) for prescription validation or diagnostic health concerns.
              </div>
            </div>
          </div>
        )}

        {/* CONTACT PAGE TAB */}
        {activeTab === 'contact' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Contact & Visit Our Hub</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reach out to our customer care team or consult with our Kaduna branch</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Form Side */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Send Us a Direct Message</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Submit prescriptions, ask machinery stock status, or send feedback</p>
                </div>

                {contactSubmitted ? (
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-center space-y-2">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto">
                      ✓
                    </div>
                    <h5 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Message Received Successfully</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Our customer support desk will evaluate your prescription/message and contact you on WhatsApp/Email within 15 minutes.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Ibrahim Abubakar"
                          className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Your Email Address *</label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="e.g. ibrahim@domain.com"
                          className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Subject of Message *</label>
                      <input
                        type="text"
                        required
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="e.g. Bulk Clinic Supplies / Prescription Verification"
                        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Message Content *</label>
                      <textarea
                        required
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Write your inquiries or copy your prescription details here..."
                        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow"
                    >
                      <Send size={14} /> Send Message to Hub
                    </button>
                  </form>
                )}
              </div>

              {/* Physical Details, Map and Hours */}
              <div className="space-y-6">
                
                {/* Contact Information Details */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Corporate Contact Information</h4>
                  
                  <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex gap-3">
                      <MapPin className="text-blue-500 shrink-0" size={16} />
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-200">Physical Address</strong>
                        <span>{settings.fullAddress}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Calendar className="text-emerald-500 shrink-0" size={16} />
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-200">Business Hours</strong>
                        <span>{settings.businessHours}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Clock className="text-blue-500 shrink-0" size={16} />
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-200">E-mail Inquiries</strong>
                        <a href={`mailto:${settings.email}`} className="hover:underline text-blue-600 dark:text-blue-400">{settings.email}</a>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <MessageSquare className="text-emerald-500 shrink-0" size={16} />
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-200">Phone & WhatsApp Helpdesk</strong>
                        <a href={`tel:${(settings.telephone || '').replace(/\s+/g, '')}`} className="hover:underline text-blue-600 dark:text-blue-400 font-bold">{settings.telephone}</a>
                      </div>
                    </div>
                  </div>

                  {/* Immediate Quick WhatsApp Button */}
                  <div className="pt-3">
                    <a
                      href={`https://wa.me/${settings.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow"
                    >
                      <MessageSquare size={14} /> Open WhatsApp Quick Chat
                    </a>
                  </div>
                </div>

                {/* Professional Map Section (interactive SVG map showing Kaduna) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Regional Kaduna Location Map</h4>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Kaduna State</span>
                  </div>

                  <div className="w-full h-44 bg-slate-50 dark:bg-slate-950 rounded-2xl relative border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                    
                    {/* Visual Vector Grid Mimicking Map Roads */}
                    <div className="absolute inset-0 opacity-10 dark:opacity-5">
                      <svg width="100%" height="100%">
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>

                    {/* Styled Interactive Streets */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rotate-12 absolute" />
                      <div className="w-1.5 h-full bg-slate-200 dark:bg-slate-800 -rotate-45 absolute" />
                      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 -rotate-12 absolute" />
                      
                      {/* Kaduna landmarks */}
                      <span className="absolute top-6 left-12 text-[9px] text-slate-400 dark:text-slate-500 font-bold">Kaduna Central Gate</span>
                      <span className="absolute bottom-6 right-12 text-[9px] text-slate-400 dark:text-slate-500 font-bold">Kaduna Market Rd</span>
                      <span className="absolute top-1/2 left-1/4 text-[9px] text-slate-400 dark:text-slate-500 font-bold">Kaduna Hwy</span>
                    </div>

                    {/* Central Pulse Pin */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold animate-ping absolute" />
                      <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold relative z-10">
                        H
                      </div>
                      <span className="mt-1.5 px-2 py-0.5 bg-slate-900/90 text-white rounded text-[9px] font-bold whitespace-nowrap shadow border border-slate-800">
                        ALPHARMA MEDICAL HUB NIG LTD
                      </span>
                      <span className="text-[8px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">Kaduna</span>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ADMIN PORTAL TAB */}
        {activeTab === 'admin' && (
          <AdminPanel
            products={products}
            categories={CATEGORIES}
            onRefreshProducts={fetchProducts}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            isLoading={isLoadingProducts}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white border-t border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Brand column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {settings.logo ? (
                  <div className="h-10 flex items-center justify-start">
                    <img key={settings.logo} src={settings.logo} alt={settings.websiteName} className="h-full max-h-10 w-auto object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                      Α
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white tracking-tight">{settings.websiteName} {settings.websiteSubName}</h4>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Hub • {settings.address}</span>
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Registered pharmaceutical store and premium medical equipment distributor. Delivering certified, trusted healthcare solutions across {settings.address}, and across Kaduna State.
              </p>
              <div className="flex gap-2">
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-teal-300 font-bold">PCN Compliant</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-blue-300 font-bold">Certified Devices</span>
              </div>
            </div>

            {/* Quick Navigation links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Navigation</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {['home', 'about', 'shop', 'equipment', 'services', 'ai-assistant', 'contact'].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => {
                        setActiveTab(item as Tab);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-blue-400 transition-colors capitalize text-left"
                    >
                      {item === 'ai-assistant' ? 'AI Health Doctor' : item === 'about' ? 'About Us' : item === 'equipment' ? 'Medical Equipment' : item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Product categories quick jump */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Product Categories</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {CATEGORIES.slice(0, 5).map((cat) => (
                  <li key={cat.name}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setActiveTab('shop');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-blue-400 transition-colors text-left"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Corporate Location Details */}
            <div className="space-y-3 text-xs text-slate-400">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contact & Support</h4>
              <p><strong>Physical Hub:</strong> {settings.fullAddress}</p>
              <p><strong>Call Support:</strong> <a href={`tel:${(settings.telephone || '').replace(/\s+/g, '')}`} className="hover:underline text-white font-bold">{settings.telephone}</a></p>
              <p><strong>WhatsApp Support:</strong> <a href={`https://wa.me/${settings.whatsappNumber}`} className="hover:underline text-emerald-400 font-bold">{settings.telephone}</a></p>
              <p><strong>Official E-mail:</strong> {settings.email}</p>
            </div>

          </div>

          {/* Social icons, copyrights and legal policy disclaimers */}
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p className="text-center md:text-left">
              &copy; {new Date().getFullYear()} {settings.companyFullName}. All Rights Reserved.
            </p>
            <div className="flex gap-4">
              <button onClick={() => alert("Privacy Policy guidelines conform with clinical patient confidentiality in Kaduna State.")} className="hover:underline">Privacy Policy</button>
              <span>•</span>
              <button onClick={() => alert("Medical product distribution adheres to standard PCN and NAFDAC guidelines.")} className="hover:underline">Terms & Conditions</button>
            </div>
          </div>
        </div>
      </footer>

      {/* FLOATING DRAWERS AND PORTALS */}

      {/* Cart Drawer */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        settings={settings}
        onLogEvent={logEvent}
      />

      {/* Wishlist Drawer/Modal */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6" id="wishlist-modal-container">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsWishlistOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors p-6 max-h-[480px] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                <Heart className="text-rose-500" size={20} fill="currentColor" />
                <h3 className="text-base font-bold">Your Saved Wishlist</h3>
              </div>
              <button onClick={() => setIsWishlistOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {wishlist.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <p className="text-xs">You haven't saved any healthcare items to your wishlist yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlist.map(product => (
                  <div key={product.id} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl items-center justify-between">
                    <div className="flex gap-3 items-center min-w-0">
                      <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{product.name}</h4>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400">₦{product.price.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          handleAddToCart(product);
                          setIsWishlistOpen(false);
                        }}
                        className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-[10px] font-bold"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleAddToWishlist(product)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6" id="product-details-modal">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors overflow-hidden grid grid-cols-1 md:grid-cols-2">
            
            <div className="relative h-64 md:h-auto bg-slate-50 dark:bg-slate-950">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 left-4 p-2 bg-slate-900/40 text-white rounded-full md:hidden"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{selectedProduct.category}</span>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hidden md:block"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{selectedProduct.name}</h3>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    selectedProduct.availability === 'In Stock' 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                  }`}>{selectedProduct.availability}</span>
                  <span className="text-xs text-slate-400">({selectedProduct.reviewsCount} Patient Reviews)</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  {selectedProduct.description}
                </p>

                <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                  ₦{selectedProduct.price.toLocaleString()}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-2">
                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Add to Shopping Cart
                </button>
                <button
                  onClick={() => {
                    handleOrderViaWhatsApp(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={14} /> Quick Order on WhatsApp
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Account Modal Portal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onLoginSuccess={(name) => {
          setUsername(name);
          setIsLoggedIn(true);
          setIsAccountOpen(false);
        }}
        onLogout={() => {
          setIsLoggedIn(false);
          setIsAccountOpen(false);
        }}
        isLoggedIn={isLoggedIn}
        username={username}
      />

      {/* Floating AI Assistant Chat Widget */}
      {activeTab !== 'ai-assistant' && <AIChatWidget onNavigate={setActiveTab} />}

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-40 p-3 bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-800 rounded-full shadow-xl transition-all"
          title="Back to top"
          id="back-to-top-trigger"
        >
          <ArrowUp size={16} />
        </button>
      )}

    </div>
  );
}

// Inline trash component implementation to avoid missing export issues
function Trash2({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 16} 
      height={size || 16} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 6h18"/>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      <line x1="10" x2="10" y1="11" y2="17"/>
      <line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
  );
}
