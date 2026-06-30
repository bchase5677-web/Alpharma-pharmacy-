import React, { useState } from 'react';
import { X, User, Lock, Mail, ShieldCheck, MapPin, ClipboardList, CheckCircle2 } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string) => void;
  onLogout: () => void;
  isLoggedIn: boolean;
  username: string;
}

export default function AccountModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onLogout,
  isLoggedIn,
  username
}: AccountModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      if (!name || !email || !password) {
        alert("Please fill in all registration fields.");
        return;
      }
      onLoginSuccess(name);
    } else {
      if (!email || !password) {
        alert("Please specify email and password.");
        return;
      }
      onLoginSuccess(email.split('@')[0] || "Health Customer");
    }
  };

  // Mock Trackable orders for realistic Nig Ltd logistics in Zaria/Kaduna
  const MOCK_ORDERS = [
    {
      id: "ALP-2026-9042",
      date: "June 24, 2026",
      status: "Dispatched",
      deliveryAddress: "Samaru Main St, Zaria, Kaduna State",
      items: "Omeprazole 20mg, Vitamin C 1000mg Effervescent",
      total: "₦4,300",
      steps: [
        { label: "Order Received", complete: true },
        { label: "Medication Verified by Pharmacist", complete: true },
        { label: "Out with Dispatch Rider", complete: true },
        { label: "Delivered", complete: false }
      ]
    },
    {
      id: "ALP-2026-8911",
      date: "May 29, 2026",
      status: "Delivered",
      deliveryAddress: "General Hospital Rd, Zaria, Kaduna State",
      items: "Digital Blood Pressure Monitor, Amoxicillin 500mg",
      total: "₦26,700",
      steps: [
        { label: "Order Received", complete: true },
        { label: "Medication Verified by Pharmacist", complete: true },
        { label: "Out with Dispatch Rider", complete: true },
        { label: "Delivered", complete: true }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6" id="account-modal-container">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {isLoggedIn ? `${username}'s Health Hub` : isRegister ? 'Register Patient Account' : 'Patient/Client Portal'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-5 sm:p-6 max-h-[500px] overflow-y-auto">
          {isLoggedIn ? (
            <div className="space-y-6">
              {/* Account Overview Card */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950/20 dark:to-teal-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{username}</h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={12} /> Verified Patient Member • Alpharma Medical Hub Nig Ltd
                  </p>
                </div>
              </div>

              {/* Order Tracking System */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                  <ClipboardList size={14} /> Active Order Logistics Tracking
                </h4>

                <div className="space-y-4">
                  {MOCK_ORDERS.map((order) => (
                    <div 
                      key={order.id} 
                      className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">{order.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === 'Delivered' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                        }`}>{order.status}</span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                        <p><strong className="text-slate-700 dark:text-slate-300">Items:</strong> {order.items}</p>
                        <p><strong className="text-slate-700 dark:text-slate-300">Delivery Address:</strong> {order.deliveryAddress}</p>
                        <p><strong className="text-slate-700 dark:text-slate-300">Total Paid:</strong> {order.total}</p>
                      </div>

                      {/* Tracker Steps */}
                      <div className="pt-2">
                        <div className="grid grid-cols-4 gap-1 text-center">
                          {order.steps.map((step, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className={`mx-auto w-5 h-5 rounded-full flex items-center justify-center text-white ${
                                step.complete ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                              }`}>
                                {step.complete ? <CheckCircle2 size={12} /> : <span className="text-[10px]">{idx+1}</span>}
                              </div>
                              <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 leading-tight">{step.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logout Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Alpharma Medical Hub Nig Ltd</span>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 rounded-xl text-xs font-bold transition-all"
                >
                  Sign Out of Account
                </button>
              </div>
            </div>
          ) : (
            /* Login/Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access verified medications, view doctor summaries, track dispatch shipments in Kaduna, or book free healthcare consultation services.
              </p>

              {isRegister && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Patient Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-slate-400" size={14} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alhaji Ibrahim Musa"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={14} />
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Account Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-slate-400" size={14} />
                  <input
                    type="password"
                    required
                    placeholder="Enter 6+ character password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Phone Number (WhatsApp Active)</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +234 803 737 7762"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-lg mt-2"
              >
                {isRegister ? 'Register & Verify Account' : 'Authenticate Account'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isRegister ? "Already have an account? Sign In" : "Need a patient account? Register here"}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
