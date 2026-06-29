import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, PhoneCall, Sparkles, HeartPulse, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { Message, Tab } from '../types';

interface AIChatWidgetProps {
  isEmbed?: boolean; // If true, display as a static element on the dedicated page
  onNavigate?: (tab: Tab) => void;
}

export default function AIChatWidget({ isEmbed = false, onNavigate }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! Welcome to Alpharma Medical Hub Nig Ltd. 🇳🇬 I am your dedicated AI healthcare assistant. I can guide you on our medications, check clinical device availability, answer health FAQs, or help you organize your order. \n\nHow can I support your health today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminButton, setShowAdminButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, showAdminButton]);

  const suggestedQuestions = [
    "What products do you have for Diabetes Care?",
    "Do you require a doctor prescription for antibiotics?",
    "How fast is your medical delivery to Zaria or Kaduna?",
    "Do you stock digital Blood Pressure monitors?"
  ];

  const handleOpenAdmin = () => {
    if (onNavigate) {
      onNavigate('admin');
      if (!isEmbed) {
        setIsOpen(false);
      }
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const trimmedText = textToSend.trim();
    const isExactAdmin = trimmedText.toLowerCase() === 'admin';

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (isExactAdmin) {
      setShowAdminButton(true);
      setIsLoading(true);
      // Simulate quick secure admin response client-side for absolute reliability
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: "🔐 Administrative access request recognized. Please click the button below to proceed to the secure Admin Panel. You will be required to authenticate with valid administrative credentials.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 500);
      return;
    }

    // Hide the admin button immediately if anything other than admin is typed
    setShowAdminButton(false);
    setIsLoading(true);

    try {
      // Map history format safely
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch(window.location.origin + '/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text || "I apologize, but I'm having trouble connecting to the server. I'll connect you directly with our healthcare team on WhatsApp.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: "I’ll connect you directly with our healthcare team on WhatsApp.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalateToWhatsApp = () => {
    const text = encodeURIComponent("Hello Alpharma Medical Hub Nig Ltd, I need quick support with medications/medical equipment.");
    window.open(`https://wa.me/2348037377762?text=${text}`, '_blank');
  };

  const chatContainerClasses = isEmbed
    ? "w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-lg"
    : "fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col items-end";

  const renderChatContent = () => (
    <>
      {/* Top Header of Chat */}
      <div className="p-4 bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center border border-white/10 relative">
            <HeartPulse size={18} className="animate-pulse text-emerald-300" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold flex items-center gap-1">
              Alpharma AI Assistant <Sparkles size={11} className="text-amber-300" />
            </h3>
            <p className="text-[10px] text-teal-100 font-medium">Licensed Pharmacist Co-Pilot • Online</p>
          </div>
        </div>
        
        {!isEmbed && (
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Messages Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/80">
        {messages.map((m) => (
          <div 
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
              }`}
            >
              {/* Render formatting safely */}
              <div className="whitespace-pre-wrap">{m.text}</div>
              
              {/* Escalation button inside message bubble if AI directs to WhatsApp */}
              {m.text.includes("I’ll connect you directly with our healthcare team on WhatsApp") && (
                <button
                  type="button"
                  onClick={handleEscalateToWhatsApp}
                  className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  <PhoneCall size={12} /> Contact Team via WhatsApp
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <AnimatePresence>
          {showAdminButton && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="flex justify-start w-full max-w-[85%] py-2"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenAdmin}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                id="open-admin-panel-btn"
              >
                <span>🔐 Open Admin Panel</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions and Footer Inputs */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        {messages.length === 1 && (
          <div className="mb-3">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-1">Suggested Questions</p>
            <div className="flex flex-wrap gap-1.5 max-h-[84px] overflow-y-auto">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-[10.5px] font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-950 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg text-left transition-all flex items-center gap-1"
                >
                  <span>{q}</span>
                  <ArrowUpRight size={10} />
                </button>
              ))}
            </div>
          </div>
        )}

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about medications, equipment, or dosing..."
            className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow"
          >
            <Send size={14} />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 px-1">
          <span className="flex items-center gap-0.5"><ShieldAlert size={9} /> Consult doctors for prescription medication.</span>
          <button 
            type="button" 
            onClick={handleEscalateToWhatsApp} 
            className="text-emerald-500 hover:underline font-bold flex items-center gap-0.5"
          >
            Human Escalate
          </button>
        </div>
      </div>
    </>
  );

  if (isEmbed) {
    return (
      <div className={chatContainerClasses} id="ai-chat-embed">
        {renderChatContent()}
      </div>
    );
  }

  return (
    <div className={chatContainerClasses} id="ai-chat-floating-widget">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-full sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[460px] shadow-2xl mb-4 transition-colors duration-300"
          >
            {renderChatContent()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-emerald-500 text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform relative group border border-blue-400/20"
        id="ai-widget-floating-trigger"
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
        
        {/* Pulsing indicator */}
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 text-[8px] font-bold flex items-center justify-center text-white animate-bounce">
          AI
        </span>

        {/* Hover label */}
        {!isOpen && (
          <span className="absolute right-16 scale-0 group-hover:scale-100 bg-slate-900/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur shadow whitespace-nowrap transition-all duration-200">
            Chat with Medical Hub AI
          </span>
        )}
      </button>
    </div>
  );
}
