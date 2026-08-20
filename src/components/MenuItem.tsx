import React from 'react';
import { Plus, Minus, Ban } from 'lucide-react';
import { MenuItem as MenuItemType } from '../types';

interface MenuItemProps {
  key?: string | number;
  item: MenuItemType;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onClick?: () => void;
  currency: string;
}

export default function MenuItem({ item, quantity, onAdd, onRemove, onClick, currency }: MenuItemProps) {
  const isSoldOut = item.available === false;

  return (
    <div 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`flex flex-col group h-full cursor-pointer select-none text-left focus:outline-hidden p-3 rounded-[28px] border-2 border-zinc-900 bg-white shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] hover:shadow-[5px_5px_0px_0px_rgba(24,24,27,1)] transition-all active:translate-x-[1px] active:translate-y-[1px] ${isSoldOut ? 'opacity-85' : ''}`}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 mb-3 border-2 border-zinc-900 transition-all duration-300">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${isSoldOut ? 'grayscale contrast-125' : 'group-hover:scale-105'}`}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 bg-zinc-50">
            <span className="text-3xl">🍽️</span>
          </div>
        )}
        
        {/* Badges container */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 z-10">
          {item.isPopular && (
            <div className="bg-amber-400 text-zinc-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              Popular
            </div>
          )}
          {isSoldOut && (
            <div className="bg-zinc-900 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border-2 border-zinc-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
              <Ban className="w-2.5 h-2.5 text-red-400" />
              Sold Out
            </div>
          )}
        </div>

        {/* Quick Add Button or Disabled Indicator */}
        {!isSoldOut && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            aria-label={`Add ${item.name} to cart`}
            className="absolute bottom-2.5 right-2.5 w-8 h-8 bg-white hover:bg-zinc-100 rounded-full flex items-center justify-center text-zinc-900 active:scale-90 transition-all border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
          >
            <Plus className="w-4 h-4 text-zinc-900 font-bold" />
          </button>
        )}

        {/* Active Quantity Badge in image */}
        {!isSoldOut && quantity > 0 && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-full border-2 border-zinc-950 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }} 
              className="p-0.5 hover:text-emerald-400 transition-colors active:scale-90" 
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black min-w-[16px] text-center font-mono">{quantity}</span>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }} 
              className="p-0.5 hover:text-emerald-400 transition-colors active:scale-90" 
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-between px-0.5">
        <div>
          <h3 className="font-black text-zinc-900 text-sm sm:text-base leading-tight mb-1 group-hover:text-emerald-700 transition-colors">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-zinc-600 text-xs font-medium line-clamp-2 mb-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200">
          <p className="text-zinc-900 font-mono font-black text-sm">
            {currency}{Number(item.price).toFixed(2)}
          </p>
          {isSoldOut && (
            <span className="text-[9px] font-black uppercase tracking-wider text-red-700 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded">
              Sold Out
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
