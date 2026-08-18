import { ShoppingCart, X, Trash2, Check, Receipt, ArrowLeft, Printer, MessageCircle, Copy, Plus, Minus, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { CartItem, MenuItem as MenuItemType, BusinessProfile } from '../types';
import { cn } from '../lib/utils';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  cart: CartItem[];
  onUpdateCart: (item: MenuItemType, delta: number) => void;
  onClear: () => void;
  currency: string;
  profile: BusinessProfile | null;
}

export default function Cart({
  isOpen,
  onClose,
  onOpen,
  cart,
  onUpdateCart,
  onClear,
  currency,
  profile
}: CartProps) {
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied] = useState(false);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleClose = () => {
    setShowReceipt(false);
    onClose();
  };

  const getOrderText = () => {
    if (!profile) return '';
    const itemsText = cart
      .map((item) => `${item.quantity}x ${item.name} (${currency}${(item.price * item.quantity).toFixed(2)})`)
      .join('\n');

    return `
🍔 NEW ORDER: ${(profile.businessName || 'ChatCart').toUpperCase()} 🍔
---------------------------
Items:
${itemsText}
---------------------------
TOTAL: ${currency}${total.toFixed(2)}
---------------------------
Order generated via ChatCart
`.trim();
  };

  const handleCopyOrder = () => {
    const text = getOrderText();
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Failed to copy order", e);
    }
  };

  const handleOrderMessenger = () => {
    if (!profile) return;
    const orderText = getOrderText();
    const cleanUsername = (profile.messengerPageUsername || '').replace(/^@/, '').trim();
    
    // Copy first
    handleCopyOrder();

    if (cleanUsername) {
      const encodedText = encodeURIComponent(orderText);
      const messengerUrl = `https://m.me/${cleanUsername}?ref=${encodedText}`;
      window.open(messengerUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert("Order copied to clipboard! (The business has not configured their Messenger username yet.)");
    }
  };

  if (itemCount === 0 && !isOpen) return null;

  return (
    <>
      {/* Sticky Floating Button */}
      <AnimatePresence>
        {!isOpen && itemCount > 0 && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={onOpen}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-[24px] shadow-2xl flex items-center gap-5 active:scale-95 transition-all border-2 border-white/80"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-emerald-600">
                {itemCount}
              </span>
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] uppercase font-black tracking-widest opacity-90">View Cart</span>
              <span className="text-base sm:text-lg font-black tracking-tight">{currency}{total.toFixed(2)}</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ 
                y: 0,
                transition: { type: 'spring', damping: 28, stiffness: 220 }
              }}
              exit={{ y: '100%' }}
              className={cn(
                "fixed z-[70] bg-zinc-50 flex flex-col shadow-2xl overflow-hidden",
                // Mobile: Bottom sheet
                "inset-x-0 bottom-0 rounded-t-[36px] max-h-[90vh]",
                // Desktop: Centered modal
                "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[36px] sm:w-[95vw] sm:max-w-[480px] sm:h-auto sm:max-h-[85vh]"
              )}
            >
              {!showReceipt ? (
                <>
                  <div className="p-5 sm:p-6 flex items-center justify-between bg-white border-b border-zinc-100 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">Your Order</h2>
                        <p className="text-zinc-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{itemCount} items selected</p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 bg-zinc-100 rounded-xl text-zinc-500 hover:bg-zinc-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
                    {cart.length === 0 ? (
                      <div className="py-16 text-center">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                          <ShoppingCart className="w-8 h-8" />
                        </div>
                        <p className="text-zinc-400 font-bold text-base">Your cart is empty</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-zinc-100 shadow-2xs">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-zinc-900 text-sm sm:text-base truncate">{item.name}</h4>
                            <p className="text-xs text-zinc-400 font-mono font-medium">
                              {currency}{Number(item.price).toFixed(2)} each
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl">
                              <button
                                onClick={() => onUpdateCart(item, -1)}
                                className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-zinc-900 shadow-2xs active:scale-90 transition-all hover:bg-zinc-50"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-zinc-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateCart(item, 1)}
                                className="w-7 h-7 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white shadow-2xs active:scale-90 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-5 sm:p-6 bg-white border-t border-zinc-100 space-y-4 shrink-0">
                    <div className="flex items-end justify-between">
                      <button
                        onClick={onClear}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 uppercase tracking-wider hover:opacity-80 transition-opacity mb-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear Cart
                      </button>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
                        <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight font-mono">
                          {currency}{total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        disabled={cart.length === 0}
                        onClick={() => setShowReceipt(true)}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <Receipt className="w-4 h-4" />
                        Show Receipt to Cashier
                      </button>

                      <div className="flex gap-2.5">
                        <button
                          disabled={cart.length === 0}
                          onClick={handleCopyOrder}
                          className={cn(
                            "flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border",
                            copied 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                              : "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50"
                          )}
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Copied!' : 'Copy Summary'}
                        </button>

                        <button
                          disabled={cart.length === 0}
                          onClick={handleOrderMessenger}
                          className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Order via Messenger
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Receipt View */
                <div className="flex flex-col h-full bg-zinc-100 overflow-hidden">
                  <div className="p-4 sm:p-5 flex items-center justify-between shrink-0">
                    <button 
                      onClick={() => setShowReceipt(false)}
                      className="flex items-center gap-1.5 text-zinc-600 font-bold text-xs hover:text-zinc-900"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Cart
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="p-2 bg-white rounded-xl text-emerald-600 shadow-2xs hover:bg-zinc-50 transition-colors"
                      title="Print Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 pb-8">
                    <div className="bg-white rounded-3xl shadow-lg p-6 max-w-sm mx-auto relative overflow-hidden">
                      <div className="text-center mb-6 pt-2">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                          <Utensils className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                          {profile?.businessName || 'Order Receipt'}
                        </h3>
                        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                          {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="border-t border-dashed border-zinc-200 py-4 space-y-2.5">
                        {cart.map((item) => (
                          <div key={item.id} className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-zinc-900 text-xs leading-tight truncate">{item.name}</p>
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                {item.quantity} x {currency}{Number(item.price).toFixed(2)}
                              </p>
                            </div>
                            <p className="font-bold text-zinc-900 text-xs font-mono">
                              {currency}{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-dashed border-zinc-200 pt-4 mt-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Subtotal</p>
                          <p className="font-mono text-xs text-zinc-700">{currency}{total.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-black text-zinc-900 uppercase">Total</p>
                          <p className="text-xl font-black text-emerald-600 tracking-tight font-mono">{currency}{total.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="mt-6 text-center">
                        <div className="inline-block px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100 mb-3">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Order Reference</p>
                          <p className="font-mono font-bold text-zinc-900 text-xs mt-0.5">#ORD-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed px-2">
                          Show this screen to the cashier or staff to verify your order.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
