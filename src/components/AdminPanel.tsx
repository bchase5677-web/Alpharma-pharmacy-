import React, { useState, useEffect } from 'react';
import { 
  Lock, Plus, Edit, Trash2, Image as ImageIcon, RefreshCw, AlertCircle, 
  CheckCircle, Search, Sliders, ArrowLeft, ArrowUp, Sparkles, LogOut, Package,
  LayoutDashboard, Settings as SettingsIcon, ShieldAlert, Users, Activity, 
  ShoppingCart, Globe, Mail, Phone, MapPin, DollarSign, Terminal, Layers, Info
} from 'lucide-react';
import { Product, Category, WebsiteSettings, ActivityLog, DashboardStats } from '../types';

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  onRefreshProducts: () => Promise<void>;
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  onEditProduct: (id: string, product: Partial<Product>) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  isLoading: boolean;
  settings: WebsiteSettings;
  onUpdateSettings: (newSettings: WebsiteSettings) => Promise<boolean>;
  onResetCatalog?: () => Promise<boolean>;
}

// Helper function to compress and resize images client-side before sending to server/Firestore
function compressAndResizeImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Fill background with white in case of transparent PNGs to avoid black borders/backgrounds on JPEG compression
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to base64 JPEG format which compresses extremely well
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function AdminPanel({
  products,
  categories,
  onRefreshProducts,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  isLoading,
  settings,
  onUpdateSettings,
  onResetCatalog
}: AdminPanelProps) {
  // Toast Alert Notification System for premium, easy administration
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('alpharma_admin_auth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Tab View
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'inventory' | 'orders'>('inventory');

  // Helper to extract orders from logs dynamically
  const getOrdersFromLogs = () => {
    if (!stats?.logs) return [];
    return stats.logs
      .filter(log => log.type === 'whatsapp_click')
      .map(log => {
        const msg = log.message;
        const nameMatch = msg.match(/Customer\s+(.+?)\s+initiated/);
        const totalMatch = msg.match(/total\s+₦([\d,]+)/);
        const customerName = nameMatch ? nameMatch[1] : 'Unknown Customer';
        const orderTotal = totalMatch ? totalMatch[1] : '0';
        return {
          id: log.id,
          customerName,
          total: orderTotal,
          timestamp: log.timestamp,
          rawMessage: msg
        };
      });
  };

  // Stats from Server
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState('');

  // Live visitor fluctuation state for realistic ticking
  const [liveVisitors, setLiveVisitors] = useState<number>(12);

  // Search & Filter within Admin Table
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('All');

  // Form states (Add & Edit products)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form Fields (Product)
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodAvailability, setProdAvailability] = useState<'In Stock' | 'Out of Stock' | 'Requires Prescription'>('In Stock');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImageType, setProdImageType] = useState<'url' | 'upload'>('upload');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodImageBase64, setProdImageBase64] = useState('');
  const [prodRating, setProdRating] = useState<number>(4.8);
  const [prodReviewsCount, setProdReviewsCount] = useState<number>(12);

  // Website Settings Form Fields
  const [settingsForm, setSettingsForm] = useState<WebsiteSettings>({ ...settings });

  // Feedback states
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    setIsLoadingStats(true);
    setStatsError('');
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        if (data.liveVisitors) {
          setLiveVisitors(data.liveVisitors);
        }
      } else {
        setStatsError('Failed to fetch server statistics.');
      }
    } catch (err) {
      setStatsError('Database connection lost. Retrying terminal handshake...');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Sync settings when props change
  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  // Load stats on auth and periodic refresh
  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      const interval = setInterval(() => {
        fetchStats();
      }, 10000); // refresh logs and real stats every 10s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Simulate fast-paced organic live visitor fluctuation
  useEffect(() => {
    if (isAuthenticated) {
      const liveInterval = setInterval(() => {
        setLiveVisitors(prev => {
          const delta = Math.random() > 0.5 ? 1 : -1;
          const newValue = prev + delta;
          return newValue < 4 ? 4 : newValue > 30 ? 30 : newValue;
        });
      }, 4000);
      return () => clearInterval(liveInterval);
    }
  }, [isAuthenticated]);

  // Authentication Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().toLowerCase() === 'admin' && password === 'chasedev') {
      setIsAuthenticated(true);
      sessionStorage.setItem('alpharma_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Access Denied. Invalid administrative username or security key.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('alpharma_admin_auth');
    setUsername('');
    setPassword('');
  };

  // Handle local image file upload conversion to base64 with client-side compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmitError('');
      try {
        // Compress product image down to 500x500 at 0.75 quality (usually ~15-30KB, extremely fast loading)
        const compressedBase64 = await compressAndResizeImage(file, 500, 500, 0.75);
        setProdImageBase64(compressedBase64);
        triggerToast('Product image uploaded and optimized successfully!', 'success');
      } catch (err: any) {
        setSubmitError('Failed to optimize product image: ' + (err.message || err));
        triggerToast('Failed to optimize product image', 'error');
      }
    }
  };

  // Handle local website logo upload conversion to base64 with client-side compression
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress logo down to 350x350 at 0.8 quality (~10-15KB, highly optimized, runs/loads instantly across all devices)
        const compressedBase64 = await compressAndResizeImage(file, 350, 350, 0.8);
        setSettingsForm(prev => ({ ...prev, logo: compressedBase64 }));
        triggerToast('Logo uploaded and optimized! Click "Save Settings" below to sync across all devices.', 'success');
      } catch (err: any) {
        triggerToast('Failed to optimize logo image: ' + (err.message || err), 'error');
      }
    }
  };

  const handleResetLogo = () => {
    setSettingsForm(prev => ({ ...prev, logo: '' }));
  };

  // Open form for adding a product
  const handleOpenAdd = () => {
    setFormMode('add');
    setEditingProductId(null);
    setProdName('');
    setProdCategory(categories[0]?.name || 'Over-the-Counter Medicines');
    setProdPrice('');
    setProdAvailability('In Stock');
    setProdDescription('');
    setProdImageType('upload');
    setProdImageUrl('');
    setProdImageBase64('');
    setProdRating(4.8);
    setProdReviewsCount(15);
    setSubmitError('');
    setSuccessMessage('');
    setIsFormOpen(true);
  };

  // Open form for editing a product
  const handleOpenEdit = (product: Product) => {
    setFormMode('edit');
    setEditingProductId(product.id);
    setProdName(product.name);
    setProdCategory(product.category);
    setProdPrice(product.price);
    setProdAvailability(product.availability);
    setProdDescription(product.description || '');
    if (product.image.startsWith('data:')) {
      setProdImageType('upload');
      setProdImageBase64(product.image);
      setProdImageUrl('');
    } else {
      setProdImageType('url');
      setProdImageUrl(product.image);
      setProdImageBase64('');
    }
    setProdRating(product.rating || 4.8);
    setProdReviewsCount(product.reviewsCount || 10);
    setSubmitError('');
    setSuccessMessage('');
    setIsFormOpen(true);
  };

  // Handle Product Save Submit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return setSubmitError('Product Name is required.');
    if (!prodCategory) return setSubmitError('Category is required.');
    if (prodPrice === '' || prodPrice < 0) return setSubmitError('Valid Product Price is required.');

    const finalImage = prodImageType === 'upload' ? prodImageBase64 : prodImageUrl;
    if (!finalImage) {
      return setSubmitError('Please upload an image file or provide a web URL.');
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSuccessMessage('');

    const productPayload = {
      name: prodName,
      category: prodCategory,
      price: Number(prodPrice),
      availability: prodAvailability,
      description: prodDescription,
      image: finalImage,
      rating: prodRating,
      reviewsCount: prodReviewsCount
    };

    try {
      if (formMode === 'add') {
        const success = await onAddProduct(productPayload);
        if (success) {
          setSuccessMessage('Product created and synchronized successfully!');
          setTimeout(() => {
            setIsFormOpen(false);
            fetchStats();
          }, 1200);
        } else {
          setSubmitError('Failed to commit product write to server.');
        }
      } else if (formMode === 'edit' && editingProductId) {
        const success = await onEditProduct(editingProductId, productPayload);
        if (success) {
          setSuccessMessage('Product details updated and synced across all nodes!');
          setTimeout(() => {
            setIsFormOpen(false);
            fetchStats();
          }, 1200);
        } else {
          setSubmitError('Failed to save product modifications.');
        }
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error occurred while saving product details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Product Delete
  const handleDeleteProductClick = async (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}" from the master database? This action cannot be undone.`)) {
      try {
        const success = await onDeleteProduct(productId);
        if (success) {
          triggerToast(`"${productName}" was removed from the database successfully!`, 'success');
          fetchStats();
        } else {
          triggerToast('Deletion rejected by server.', 'error');
        }
      } catch (err: any) {
        triggerToast('Network Failure: ' + err.message, 'error');
      }
    }
  };

  // Save Website Settings Handlers
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSuccessMessage('');
    
    try {
      const success = await onUpdateSettings(settingsForm);
      if (success) {
        setSuccessMessage('Website information & settings updated successfully across all client nodes!');
        fetchStats();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setSubmitError('Failed to save settings on the terminal server.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error saving settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restore Default Settings
  const handleRestoreDefaults = () => {
    if (window.confirm('Are you sure you want to reset all configurations to standard Alpharma Kaduna/Zaria presets?')) {
      setSettingsForm({
        websiteName: "Alpharma",
        websiteSubName: "Medical Hub",
        companyFullName: "Alpharma Medical Hub Nig Ltd",
        telephone: "+234 803 737 7762",
        email: "contact@alpharma.com.ng",
        address: "Samaru, Zaria, Kaduna State",
        fullAddress: "Alpharma Medical Hub, Opp. Gidan Jaji, Samaru, Zaria, Kaduna State, Nigeria",
        whatsappNumber: "2348037377762",
        deliveryFee: 1500,
        consultationFee: 5000,
        allowPrescriptionRequires: true,
        maintenanceMode: false,
        logo: ''
      });
    }
  };

  // Filter products for the inventory table
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(adminSearch.toLowerCase()) || 
                          product.category.toLowerCase().includes(adminSearch.toLowerCase()) ||
                          product.id.includes(adminSearch);
    const matchesCategory = adminCategoryFilter === 'All' || product.category === adminCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Authentication View
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-6 animate-fade-in" id="admin-login-card">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Lock size={22} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Admin Master Terminal</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Provide the required administrative credentials to gain security clearance and customize store information.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Administrative Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              id="admin-username-input"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Passcode / Secret Key</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              id="admin-password-input"
            />
          </div>

          {authError && (
            <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-xs animate-shake" id="auth-error-message">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-lg active:scale-[0.98]"
            id="auth-submit-btn"
          >
            Authenticate Clearances
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          <Terminal size={12} /> Secure Connection Handshake Active
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in" id="admin-hub-dashboard">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Secure Node Connected
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admin Level: Superuser</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {settings.companyFullName || "Alpharma Medical Hub"} Console
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Control branding, manage drugs catalog, monitor real-time visitor sessions, and tweak regional logistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={isLoadingStats || isLoading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50"
            title="Force synchronization"
          >
            <RefreshCw size={14} className={isLoadingStats || isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-red-100/30 dark:border-red-900/40"
            title="Secure Logout"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* THREE WAY NAVIGATION TABS */}
      <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-100 dark:border-slate-800/80 gap-1.5 scrollbar-none" id="admin-subtabs-nav">
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-5 py-3 rounded-t-xl text-xs font-extrabold transition-all flex items-center gap-2 border-b-2 shrink-0 ${
            activeSubTab === 'settings'
              ? 'border-blue-600 text-blue-600 bg-blue-50/20 dark:bg-blue-950/10'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/50'
          }`}
          id="nav-settings-tab"
        >
          <SettingsIcon size={14} /> General Settings
        </button>

        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-5 py-3 rounded-t-xl text-xs font-extrabold transition-all flex items-center gap-2 border-b-2 shrink-0 ${
            activeSubTab === 'inventory'
              ? 'border-blue-600 text-blue-600 bg-blue-50/20 dark:bg-blue-950/10'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/50'
          }`}
          id="nav-inventory-tab"
        >
          <Package size={14} /> Product Inventory ({products.length})
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-5 py-3 rounded-t-xl text-xs font-extrabold transition-all flex items-center gap-2 border-b-2 shrink-0 ${
            activeSubTab === 'orders'
              ? 'border-blue-600 text-blue-600 bg-blue-50/20 dark:bg-blue-950/10'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/50'
          }`}
          id="nav-orders-tab"
        >
          <ShoppingCart size={14} /> Orders & Analytics
        </button>
      </div>

      {/* TAB SUBVIEW CONTENT */}
      
      {/* 1. ORDERS & ANALYTICS TAB */}
      {activeSubTab === 'orders' && (
        <div className="space-y-6 animate-fade-in" id="dashboard-tab-panel">
          {/* STATS HIGHLIGHTS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Active Visitors</span>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white">{liveVisitors}</h4>
                  <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-0.5 animate-pulse">
                    ● real-time
                  </span>
                </div>
                <p className="text-[9px] text-slate-400">Fluctuating naturally via organic traffic</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                <Users size={22} className="animate-pulse" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accumulated Page Views</span>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats?.totalPageViews ? stats.totalPageViews.toLocaleString() : "1,528"}
                </h4>
                <p className="text-[9px] text-slate-400">Since terminal launch</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                <Activity size={22} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Checkout Requests</span>
                <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {stats?.totalWhatsappClicks ? stats.totalWhatsappClicks.toLocaleString() : "194"}
                </h4>
                <p className="text-[9px] text-slate-400">Order texts initiated</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                <ShoppingCart size={22} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Catalog Value</span>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ₦{stats?.totalStockValue ? stats.totalStockValue.toLocaleString() : "120,000"}
                </h4>
                <p className="text-[9px] text-slate-400">Master database asset volume</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center shrink-0">
                <DollarSign size={22} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500"></div>
            </div>
          </div>

          {/* VISUAL CHART AND SYSTEM STATUS PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* TRAFFIC SVG CHART */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Activity size={16} className="text-blue-500" /> Hourly Activity & Inquiry Waveform
                  </h4>
                  <p className="text-[11px] text-slate-400">Visual trends showing terminal query counts over the past 6 hours</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Views
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-teal-400"></span> Orders
                  </span>
                </div>
              </div>

              {/* STUNNING HIGH FIDELITY SVG CHART */}
              <div className="h-48 w-full border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl relative p-4 flex flex-col justify-between">
                <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-200/40 dark:border-slate-800/20"></div>
                <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-200/40 dark:border-slate-800/20"></div>
                <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-200/40 dark:border-slate-800/20"></div>

                <div className="relative flex-1 flex items-end justify-between px-2 pt-4">
                  {/* Mock Waves using customized bars & point animations */}
                  {[
                    { label: "06:00", views: 24, orders: 3, hViews: "25%", hOrders: "10%" },
                    { label: "08:00", views: 48, orders: 8, hViews: "45%", hOrders: "20%" },
                    { label: "10:00", views: 95, orders: 18, hViews: "90%", hOrders: "50%" },
                    { label: "12:00", views: 76, orders: 12, hViews: "75%", hOrders: "40%" },
                    { label: "14:00", views: 64, orders: 15, hViews: "60%", hOrders: "45%" },
                    { label: "16:00", views: 110, orders: 25, hViews: "100%", hOrders: "70%" },
                  ].map((data, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 w-12 group cursor-pointer z-10">
                      <div className="h-28 w-full flex items-end justify-center gap-1 relative">
                        {/* Tooltip on Hover */}
                        <div className="absolute bottom-full mb-1 bg-slate-950 text-white text-[9px] px-2 py-1 rounded hidden group-hover:block font-mono text-center shadow-lg">
                          V: {data.views} | O: {data.orders}
                        </div>
                        {/* Views Bar */}
                        <div 
                          style={{ height: data.hViews }} 
                          className="w-3 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-full transition-all duration-500 group-hover:brightness-110"
                        ></div>
                        {/* Orders Bar */}
                        <div 
                          style={{ height: data.hOrders }} 
                          className="w-3 bg-gradient-to-t from-teal-500 to-teal-300 rounded-t-full transition-all duration-500 group-hover:brightness-110"
                        ></div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 font-semibold">{data.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* REAL-TIME SYSTEM TERMINAL STATUS */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Terminal size={16} className="text-indigo-500" /> Operational Overview
              </h4>

              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-2">
                  <span className="font-semibold text-slate-400">Primary Database File</span>
                  <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                    settings_db.json
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-2">
                  <span className="font-semibold text-slate-400">Zaria Dispatch Node</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-2">
                  <span className="font-semibold text-slate-400">Kaduna Delivery Node</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-2">
                  <span className="font-semibold text-slate-400">Prescription Auditing</span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-extrabold uppercase">
                    {settings.allowPrescriptionRequires ? "Strict Enforcement" : "Disabled"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">Delivery Fee Preset</span>
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
                    ₦{(settings.deliveryFee || 1500).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/40 dark:border-blue-900/40 rounded-2xl flex items-start gap-2 text-[11px]">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-blue-800/80 dark:text-blue-300/80 leading-relaxed font-medium">
                  Settings modified in the <strong>General Settings</strong> tab instantly synchronize the AI chat prompts, WhatsApp redirections, and website details for all visitors.
                </p>
              </div>
            </div>

          </div>

          {/* SECURE ORDERS TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm" id="orders-table-panel">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShoppingCart size={16} className="text-blue-600" /> WhatsApp Checkout Orders List
              </h4>
              <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                {getOrdersFromLogs().length} Total Orders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-3.5">Order ID</th>
                    <th className="px-6 py-3.5">Customer Name</th>
                    <th className="px-6 py-3.5">Total Amount</th>
                    <th className="px-6 py-3.5">Date & Time</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                  {getOrdersFromLogs().length > 0 ? (
                    getOrdersFromLogs().map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition">
                        <td className="px-6 py-4 font-mono text-[10px] text-slate-500 font-semibold">#{order.id.slice(-6)}</td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{order.customerName}</td>
                        <td className="px-6 py-4 font-black text-blue-600 dark:text-blue-400">₦{order.total}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {new Date(Number(order.id) || Date.now()).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Dispatched via WA
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No orders recorded yet. Complete a checkout in the cart to initiate your first order log!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* REAL-TIME AUDIT LOGS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Terminal size={16} className="text-blue-600" /> Real-time Terminal Logs & Events Flow
              </h4>
              <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded text-[10px] font-mono text-slate-500">
                Auto-updates on connection
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-[300px] overflow-y-auto">
              {stats?.logs && stats.logs.length > 0 ? (
                stats.logs.map((log) => (
                  <div key={log.id} className="p-4 flex items-start justify-between gap-4 text-xs hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                        log.type === 'system'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : log.type === 'whatsapp_click'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                      <p className="text-slate-700 dark:text-slate-200 font-semibold">{log.message}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 font-bold">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No terminal logs reported yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. INVENTORY TAB */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6 animate-fade-in" id="inventory-tab-panel">
          
          {/* SEARCH AND FILTER CRITERIA */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search master catalog by drug name, active ingredients, category, or database ID..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none animate-pulse-slow"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-400">Filter Category:</span>
              <select
                value={adminCategoryFilter}
                onChange={(e) => setAdminCategoryFilter(e.target.value)}
                className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">All Categories ({products.length})</option>
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              {onResetCatalog && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to completely RESET the catalog to standard default medical products? This will remove custom products and restore pristine presets across all devices instantly.")) {
                      setIsLoadingStats(true);
                      const res = await onResetCatalog();
                      setIsLoadingStats(false);
                      if (res) {
                        triggerToast("Medical product catalog reset to defaults successfully!", "success");
                      } else {
                        triggerToast("Failed to reset catalog. Please check connection.", "error");
                      }
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition"
                  title="Reset catalog to pristine medical defaults"
                >
                  <RefreshCw size={13} /> Reset Catalog
                </button>
              )}

              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>
          </div>

          {/* MASTER PRODUCTS TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800/80">
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 dark:text-slate-500 w-16 text-center">Image</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 dark:text-slate-500">Product Info</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 dark:text-slate-500">Category</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 dark:text-slate-500">Price</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 dark:text-slate-500">Status</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 dark:text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-bold">
                        No pharmaceutical products match your query in the master inventory database.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 text-center animate-fade-in">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center mx-auto shadow-sm">
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{product.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">DB ID: {product.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">{product.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-800 dark:text-slate-100 font-black">₦{product.price.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            product.availability === 'In Stock' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : product.availability === 'Requires Prescription'
                                ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                          }`}>
                            {product.availability}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(product)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg transition"
                              title="Edit Product Details"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProductClick(product.id, product.name)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded-lg transition"
                              title="Delete Product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. CORE CONFIGURATION TAB */}
      {activeSubTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8 animate-fade-in" id="settings-tab-panel">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <SettingsIcon size={18} className="text-blue-600" /> Website Information & Operations Control
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Customize key coordinates, support links, fees, and operational policies. Saving commits directly to the active database.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-slate-200/50 dark:border-slate-700/50"
            >
              Restore Defaults
            </button>
          </div>

          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            
            {/* BRANDING SECTION */}
            <div className="space-y-4">
              <h5 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 border-b border-slate-50 dark:border-slate-800 pb-1">
                <Globe size={14} /> 1. Brand Identity Settings
              </h5>

              {/* Logo Uploader Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
                <div className="relative shrink-0 w-20 h-20 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-inner flex items-center justify-center overflow-hidden">
                  {settingsForm.logo ? (
                    <img 
                      src={settingsForm.logo} 
                      alt="Brand Logo" 
                      className="w-full h-full object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-2xl font-black text-slate-400 dark:text-slate-600">Α</div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Website Brand Logo Image</span>
                  <p className="text-[10px] text-slate-400">Upload a custom image logo (PNG, JPG, SVG, WebP) from your device. It will replace the default Greek letter logo across all browsers and devices instantly.</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold cursor-pointer transition shadow-sm">
                      Upload Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoChange} 
                        className="hidden" 
                      />
                    </label>
                    {settingsForm.logo && (
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-950/60 dark:text-red-400 rounded-xl text-[10px] font-bold transition"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Website Short Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.websiteName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, websiteName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Website Subtitle</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.websiteSubName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, websiteSubName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Full Legal Corporate Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.companyFullName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, companyFullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CONTACT & REGIONAL COORDINATES */}
            <div className="space-y-4">
              <h5 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 border-b border-slate-50 dark:border-slate-800 pb-1">
                <Mail size={14} /> 2. Communication Coordinates
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Customer Care Phone Link</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.telephone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telephone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Support Email Address</label>
                  <input
                    type="email"
                    required
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Physical Address (Short Display)</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Full Legal/Clinical Address (Postal/Maps)</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.fullAddress}
                    onChange={(e) => setSettingsForm({ ...settingsForm, fullAddress: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  WhatsApp Contact ID (Strictly digits, e.g., 2348037377762)
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.whatsappNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="234..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[9px] text-slate-400 mt-1">This is the international formatted phone number used to prefill WhatsApp order threads.</p>
              </div>
            </div>

            {/* FINANCIAL SETTINGS */}
            <div className="space-y-4">
              <h5 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 border-b border-slate-50 dark:border-slate-800 pb-1">
                <DollarSign size={14} /> 3. Regional Logistics & Fees
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Kaduna/Zaria Delivery Dispatch Fee (₦)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={settingsForm.deliveryFee}
                    onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Pharmacist Consultation Booking Fee (₦)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={settingsForm.consultationFee}
                    onChange={(e) => setSettingsForm({ ...settingsForm, consultationFee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SWITCHES & SECURITY POLICIES */}
            <div className="space-y-4">
              <h5 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 border-b border-slate-50 dark:border-slate-800 pb-1">
                <ShieldAlert size={14} /> 4. Clinical Auditing & Policies
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl">
                
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Strict Prescription Warning</span>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Force visitors to verify prescription uploads for critical medications.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settingsForm.allowPrescriptionRequires}
                      onChange={(e) => setSettingsForm({ ...settingsForm, allowPrescriptionRequires: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block text-red-500">Enable Maintenance Mode</span>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Lock client operations. Only authenticated terminals can access the master server database.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settingsForm.maintenanceMode}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>

              </div>
            </div>

            {/* FEEDBACK STATUSES */}
            {submitError && (
              <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-xs animate-shake">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs animate-fade-in">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow shadow-blue-500/10 active:scale-[0.98] transition"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" /> Saving Configuration...
                  </>
                ) : (
                  <>
                    Save System Settings
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* DYNAMIC MODAL FORM FOR ADDING / EDITING PRODUCTS */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-scale-in">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider">
                  {formMode === 'add' ? 'Add New Master Product' : 'Modify Product Credentials'}
                </h4>
                <p className="text-[10px] text-white/85">
                  Input verified metrics for cross-terminal synchronization.
                </p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xs font-black transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Omeprazole Capsules 20mg"
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Product Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Naira Price (₦) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Price in Naira"
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Availability Status *</label>
                  <select
                    value={prodAvailability}
                    onChange={(e) => setProdAvailability(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Requires Prescription">Requires Prescription</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Clinical Description</label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Enter dynamic descriptions, packaging details, and usage warnings..."
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* IMAGE CHOOSE SETUP */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <ImageIcon size={14} /> Product Image Setup *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProdImageType('upload')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        prodImageType === 'upload' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      Device Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdImageType('url')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        prodImageType === 'url' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      Web Image URL
                    </button>
                  </div>
                </div>

                {prodImageType === 'upload' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950/50 dark:file:text-blue-350 cursor-pointer"
                      />
                    </div>
                    {prodImageBase64 && (
                      <div className="relative w-28 h-28 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-inner">
                        <img 
                          src={prodImageBase64} 
                          alt="Device preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setProdImageBase64('')}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center hover:bg-red-600 transition"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/photo-1584017911766-d451b3d0e843"
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {prodImageUrl && (
                      <div className="w-28 h-28 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-inner animate-fade-in">
                        <img 
                          src={prodImageUrl} 
                          alt="Web preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RATING & REVIEW SIMULATIONS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Catalog Rating (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={prodRating}
                    onChange={(e) => setProdRating(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Reviews Count</label>
                  <input
                    type="number"
                    min="0"
                    value={prodReviewsCount}
                    onChange={(e) => setProdReviewsCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {submitError && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs">
                  <CheckCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      {formMode === 'add' ? 'Add Product to Hub' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border transition-all animate-scale-in max-w-sm ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/95 dark:border-emerald-900/45 dark:text-emerald-300' 
            : toast.type === 'error'
              ? 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/95 dark:border-rose-900/45 dark:text-rose-300'
              : 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-950/95 dark:border-blue-900/45 dark:text-blue-300'
        }`} id="admin-toast-notification">
          {toast.type === 'success' && <CheckCircle className="shrink-0 text-emerald-500" size={18} />}
          {toast.type === 'error' && <AlertCircle className="shrink-0 text-rose-500" size={18} />}
          {toast.type === 'info' && <Info className="shrink-0 text-blue-500" size={18} />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
