import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIosPrompt, setIsIosPrompt] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone);
    if (isStandalone) {
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIos && !isStandalone) {
      setIsIosPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setSupportsPWA(false); // hide prompt
      } else {
        console.log('User dismissed the install prompt');
      }
    });
  };

  if ((!supportsPWA && !isIosPrompt) || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 text-sm font-medium z-50 relative shadow-md"
      >
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Download size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight">Install Alpharma Medical Hub Nig Ltd</span>
              <span className="text-blue-100 text-xs">For a faster, offline native experience</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsDismissed(true)} 
            className="text-blue-200 hover:text-white p-1.5 transition-colors sm:hidden bg-white/10 rounded-full"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {supportsPWA ? (
            <button 
              onClick={onClick} 
              className="w-full sm:w-auto bg-white text-blue-700 px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-sm active:scale-95 text-center flex items-center justify-center gap-2"
            >
              <Download size={16} /> Install App
            </button>
          ) : isIosPrompt ? (
            <div className="bg-black/20 rounded-xl px-4 py-2 text-xs flex items-center gap-2 w-full sm:w-auto backdrop-blur-sm border border-white/10">
              <span className="flex items-center gap-1"><Share size={12} className="inline"/> Share</span>
              <span>then</span>
              <span className="font-bold bg-white/20 px-2 py-0.5 rounded">Add to Home Screen</span>
            </div>
          ) : null}
          
          <button 
            onClick={() => setIsDismissed(true)} 
            className="text-blue-200 hover:text-white p-1.5 transition-colors hidden sm:block"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
