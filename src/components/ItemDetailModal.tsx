import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Sparkles, Check, Ban } from 'lucide-react';
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

  const isSoldOut = item.available === false;
  const currentCartQty = cartItem?.quantity || 0;
  const totalPrice = Number(item.price) * selectedQuantity;

  const handleAddOrUpdate = () => {
    if (isSoldOut) return;
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
      <div className="relative z-10 bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] border-2 border-zinc-900 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-zinc-900 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 transition-all border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] z-20 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto overscroll-contain flex-1">
          {/* Item Image Header */}
          <div className="relative aspect-4/3 sm:aspect-16/10 w-full bg-zinc-100 overflow-hidden border-b-2 border-zinc-900">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className={`w-full h-full object-cover ${isSoldOut ? 'grayscale contrast-125' : ''}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-50">
                <span className="text-5xl">🍽️</span>
              </div>
            )}

            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              {item.isPopular && (
                <div className="bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-zinc-950 text-zinc-950" />
                  Bestseller
                </div>
              )}
              {isSoldOut && (
                <div className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5">
                  <Ban className="w-3 h-3 text-red-400" />
                  Sold Out
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-tight">
                {item.name}
              </h2>
              <div className="flex items-center gap-3 pt-1">
                <div className="text-xl font-mono font-black text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-lg border border-zinc-900/40 inline-block">
                  {currency}{Number(item.price).toFixed(2)}
                </div>
              </div>
            </div>

            {item.description ? (
              <div className="space-y-1 pt-1">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description</p>
                <p className="text-sm text-zinc-700 font-medium leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic pt-1 font-medium">Freshly prepared to order.</p>
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 sm:p-5 bg-white border-t-2 border-zinc-900 flex items-center gap-3 shrink-0">
          {isSoldOut ? (
            <button
              type="button"
              disabled
              className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl font-bold text-sm bg-zinc-200 text-zinc-600 border-2 border-zinc-400 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Ban className="w-4 h-4 text-zinc-500" />
              Item Currently Sold Out
            </button>
          ) : (
            <>
              {/* Quantity Selector */}
              <div className="flex items-center bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-1 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                <button
                  type="button"
                  onClick={() => setSelectedQuantity(prev => Math.max(1, prev - 1))}
                  disabled={selectedQuantity <= 1}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-900 hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95 font-bold"
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
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-900 hover:bg-zinc-200 transition-all active:scale-95 font-bold"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add / Update Cart Button */}
              <button
                type="button"
                onClick={handleAddOrUpdate}
                className={`flex-1 min-h-[48px] py-3.5 px-4 rounded-2xl font-bold text-sm border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-between active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                  addedAnimation 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white'
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
                <span className="font-mono font-black text-emerald-300">
                  {currency}{totalPrice.toFixed(2)}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
