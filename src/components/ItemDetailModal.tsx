import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Sparkles, Check } from 'lucide-react';
import { MenuItem, CartItem } from '../types';

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  cartItem?: CartItem;
  onUpdateCart: (item: MenuItem, delta: number) => void;
  currency?: string;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  cartItem,
  onUpdateCart,
  currency = '₱'
}) => {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    if (cartItem && cartItem.quantity > 0) {
      setSelectedQuantity(cartItem.quantity);
    } else {
      setSelectedQuantity(1);
    }
  }, [item, cartItem, isOpen]);

  if (!isOpen || !item) return null;

  const currentCartQty = cartItem?.quantity || 0;
  const totalPrice = Number(item.price) * selectedQuantity;

  const handleAddOrUpdate = () => {
    const delta = selectedQuantity - currentCartQty;
    if (delta !== 0) {
      onUpdateCart(item, delta);
    } else if (currentCartQty === 0) {
      onUpdateCart(item, selectedQuantity);
    }

    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-zinc-100 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/90 sm:bg-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-white transition-all shadow-sm z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto overscroll-contain flex-1">
          {/* Item Image Header */}
          <div className="relative aspect-4/3 sm:aspect-16/10 w-full bg-zinc-100 overflow-hidden">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-300 bg-zinc-50">
                <span className="text-5xl">🍽️</span>
              </div>
            )}

            {item.isPopular && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-white" />
                Bestseller
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-tight">
                  {item.name}
                </h2>
              </div>
              <div className="text-lg font-mono font-black text-emerald-600">
                {currency}{Number(item.price).toFixed(2)}
              </div>
            </div>

            {item.description ? (
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Description</p>
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">Freshly prepared to order.</p>
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 sm:p-5 bg-zinc-50/90 backdrop-blur-md border-t border-zinc-100 flex items-center gap-3 shrink-0">
          {/* Quantity Selector */}
          <div className="flex items-center bg-white border border-zinc-200 rounded-2xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedQuantity(prev => Math.max(1, prev - 1))}
              disabled={selectedQuantity <= 1}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-9 text-center font-mono font-black text-zinc-900 text-sm">
              {selectedQuantity}
            </span>
            <button
              type="button"
              onClick={() => setSelectedQuantity(prev => prev + 1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition-all active:scale-95"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add / Update Cart Button */}
          <button
            type="button"
            onClick={handleAddOrUpdate}
            className={`flex-1 min-h-[48px] py-3.5 px-4 rounded-2xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-between active:scale-[0.98] ${
              addedAnimation 
                ? 'bg-emerald-700 shadow-emerald-700/20' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            <span className="flex items-center gap-2">
              {addedAnimation ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {addedAnimation 
                ? 'Added!' 
                : currentCartQty > 0 
                  ? 'Update Order' 
                  : 'Add to Order'}
            </span>
            <span className="font-mono font-black text-emerald-100">
              {currency}{totalPrice.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
