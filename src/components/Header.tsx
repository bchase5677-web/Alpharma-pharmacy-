import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ShoppingCart, Heart, User, Sun, Moon, Phone } from 'lucide-react';
import { Tab, WebsiteSettings } from '../types';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  cartCount: number;
  wishlistCount: number;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAccount: () => void;
  isLoggedIn: boolean;
  username: string;
  settings: WebsiteSettings;
}

export default function Header({
  activeTab,
  setActiveTab,
  cartCount,
  wishlistCount,
  darkMode,
  setDarkMode,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount,
  isLoggedIn,
  username,
  settings
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems: { name: string; id: Tab }[] = [
    { name: 'Home', id: 'home' },
    { name: 'About Us', id: 'about' },
    { name: 'Shop', id: 'shop' },
    { name: 'Medical Equipment', id: 'equipment' },
    { name: 'Categories', id: 'categories' },
    { name: 'Services', id: 'services' },
    { name: 'AI Assistant', id: 'ai-assistant' },
    { name: 'Contact', id: 'contact' },
  ];

  const handleNavClick = (tabId: Tab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-300 shadow-sm">
      {/* Top Banner with quick support info */}
      <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 text-white text-xs py-2 px-4 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Phone size={12} className="animate-pulse" />
          <span>Support & Order: </span>
          <a href={`tel:${settings.telephone.replace(/\s+/g, '')}`} className="font-semibold hover:underline">{settings.telephone}</a>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span>📍 {settings.address}</span>
          <span className="bg-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">Nigeria-Optimized 🇳🇬</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('home')} 
          className="flex items-center gap-2 cursor-pointer group"
          id="brand-logo"
        >
          {settings.logo ? (
            <div className="h-12 sm:h-14 flex items-center justify-start group-hover:scale-105 transition-transform">
              <img key={settings.logo} src={settings.logo} alt={settings.websiteName} className="h-full max-h-12 sm:max-h-14 w-auto object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                Α
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold leading-none tracking-tight flex items-center gap-1">
                  <span className="text-blue-600 dark:text-blue-400">{settings.websiteName}</span>
                  <span className="text-emerald-500">{settings.websiteSubName}</span>
                </h1>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-semibold">Hub</span>
              </div>
            </>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === item.id
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {item.name}
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
            id="theme-toggle"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Wishlist */}
          <button
            onClick={onOpenWishlist}
            className="p-2 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition-colors relative"
            title="Wishlist"
            id="wishlist-toggle"
          >
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart */}
          <button
            onClick={onOpenCart}
            className="p-2 rounded-lg text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition-colors relative"
            title="Shopping Cart"
            id="cart-toggle"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <button
            onClick={onOpenAccount}
            className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-lg transition-colors border ${
              isLoggedIn
                ? 'bg-blue-50/50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Account profile"
            id="account-toggle"
          >
            <User size={18} />
            <span className="text-xs font-semibold hidden md:inline-block max-w-[80px] truncate">
              {isLoggedIn ? username.split(' ')[0] : 'Sign In'}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-colors"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800"
          >
            <div className="px-4 py-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors flex items-center justify-between ${
                    activeTab === item.id
                      ? 'bg-blue-500 text-white font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <span>{item.name}</span>
                  {activeTab === item.id && <span className="w-2 h-2 rounded-full bg-white" />}
                </button>
              ))}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>{settings.address} Support</span>
                  <a href={`tel:${settings.telephone.replace(/\s+/g, '')}`} className="text-blue-600 font-semibold dark:text-blue-400">{settings.telephone}</a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
