import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, Send, ShieldCheck, MapPin, CreditCard } from 'lucide-react';
import { CartItem, WebsiteSettings } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  settings: WebsiteSettings;
  onLogEvent?: (type: string, message: string) => void;
}

export default function Cart({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  settings,
  onLogEvent
}: CartProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'delivery'>('transfer');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const deliveryFee = deliveryMethod === 'delivery' ? (settings.deliveryFee || 1500) : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!customerName || !customerPhone || (deliveryMethod === 'delivery' && !deliveryAddress)) {
      alert("Please fill in your name, phone number, and delivery address.");
      return;
    }

    // Report event to backend log flow
    if (onLogEvent) {
      onLogEvent('whatsapp_click', `Customer ${customerName} initiated WhatsApp checkout order for total ₦${total.toLocaleString()}`);
    }

    // Format perfect Nigerian-optimized order text for WhatsApp
    let orderText = `*${(settings.companyFullName || "ALPHARMA MEDICAL HUB NIG LTD").toUpperCase()} - NEW ORDER*\n`;
    orderText += `--------------------------------------\n`;
    orderText += `*Customer Details:*\n`;
    orderText += `• Name: ${customerName}\n`;
    orderText += `• Phone: ${customerPhone}\n`;
    orderText += `• Fulfillment: ${deliveryMethod === 'delivery' ? '🚗 Dispatch Delivery' : `🏪 In-Store Pickup (${settings.address})`}\n`;
    if (deliveryMethod === 'delivery') {
      orderText += `• Address: ${deliveryAddress}\n`;
    }
    orderText += `• Payment Choice: ${paymentMethod === 'transfer' ? '🏦 Bank Transfer/Card' : '💵 Pay on Delivery'}\n\n`;

    orderText += `*Ordered Items:*\n`;
    cartItems.forEach((item, index) => {
      orderText += `${index + 1}. ${item.product.name} (x${item.quantity}) - ₦${(item.product.price * item.quantity).toLocaleString()}\n`;
    });

    orderText += `\n--------------------------------------\n`;
    orderText += `*Subtotal:* ₦${subtotal.toLocaleString()}\n`;
    if (deliveryMethod === 'delivery') {
      orderText += `*Delivery Fee:* ₦${deliveryFee.toLocaleString()}\n`;
    }
    orderText += `*GRAND TOTAL:* ₦${total.toLocaleString()}\n\n`;
    orderText += `Please confirm availability and send bank details to proceed with my order!`;

    const encodedText = encodeURIComponent(orderText);
    const whatsappUrl = `https://wa.me/${settings.whatsappNumber || "2348037377762"}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-container">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 flex flex-col shadow-2xl rounded-l-2xl border-l border-slate-100 dark:border-slate-800 transition-colors duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shopping Cart</h2>
              <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              id="close-cart-btn"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 mb-4 border border-slate-100 dark:border-slate-800">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Your cart is empty</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Browse our pharmacy items or ask our medical AI Assistant for suggestions.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Items Ordered</span>
                    <button 
                      onClick={onClearCart}
                      className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Clear All
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div 
                        key={item.product.id}
                        className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/60"
                      >
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.product.name}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{item.product.category}</span>
                          <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 block mt-1">
                            ₦{item.product.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col justify-between items-end">
                          <button 
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                          
                          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 scale-90 origin-bottom-right">
                            <button 
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[12px] text-center">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery and Preferences Form */}
                <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Fulfillment & Delivery Details</span>

                  {/* Customer Information */}
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ibrahim Abubakar"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Active WhatsApp/Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +234 803..."
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Delivery Method Selection */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">How would you like to receive your items?</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('delivery')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          deliveryMethod === 'delivery'
                            ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-900'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <MapPin size={13} /> Dispatch Rider
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('pickup')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          deliveryMethod === 'pickup'
                            ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-900'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        🏪 {settings.websiteName} Pickup
                      </button>
                    </div>
                  </div>

                  {/* Delivery Address Input */}
                  {deliveryMethod === 'delivery' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Full Delivery Address *</label>
                      <textarea
                        required
                        placeholder={`Specify street address, local area, landmarks in ${settings.address}`}
                        rows={2}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}

                  {/* Payment Method Selection */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">Preferred Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('transfer')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          paymentMethod === 'transfer'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard size={13} /> Bank Transfer / Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('delivery')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          paymentMethod === 'delivery'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        💵 Pay on Delivery
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer Pricing Summary */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="space-y-1.5 mb-4 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">₦{subtotal.toLocaleString()}</span>
                </div>
                {deliveryMethod === 'delivery' && (
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Delivery Fee (Kaduna)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₦{deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 dark:text-slate-100 font-bold text-sm pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <span>Grand Total</span>
                  <span className="text-blue-600 dark:text-blue-400">₦{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Secure Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                id="checkout-wa-submit"
              >
                <Send size={14} />
                <span>Dispatch Order via WhatsApp</span>
              </button>

              <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                <ShieldCheck size={11} className="text-emerald-500" />
                <span>Genuine pharmaceuticals & medical devices guaranteed</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
