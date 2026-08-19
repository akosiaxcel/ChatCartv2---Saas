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
      className={`flex flex-col group h-full cursor-pointer select-none text-left focus:outline-hidden ${isSoldOut ? 'opacity-80' : ''}`}
    >
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-zinc-100 mb-3 shadow-xs border border-zinc-100 transition-all duration-300 group-hover:shadow-md">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${isSoldOut ? 'grayscale contrast-125' : 'group-hover:scale-105'}`}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300">
            <span className="text-3xl">🍽️</span>
          </div>
        )}
        
        {/* Badges container */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1 z-10">
          {item.isPopular && (
            <div className="bg-red-500 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
              Popular
            </div>
          )}
          {isSoldOut && (
            <div className="bg-zinc-900/90 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md border border-white/20 flex items-center gap-1">
              <Ban className="w-2.5 h-2.5 text-red-400" />
              Sold Out
            </div>
          )}
        </div>

        {/* Action Button: Sold Out Pill or Quick Add Button */}
        {isSoldOut ? (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="absolute bottom-3 right-3 bg-zinc-900/90 backdrop-blur-xs text-zinc-200 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md border border-white/10"
          >
            Sold Out
          </div>
        ) : (
          /* Quick Add Button with stopPropagation so card click opens modal separately if desired */
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            aria-label={`Add ${item.name} to cart`}
            className="absolute bottom-3 right-3 w-9 h-9 bg-white/95 hover:bg-white rounded-full shadow-md flex items-center justify-center text-zinc-900 active:scale-90 transition-all border border-zinc-200/50 hover:shadow-lg"
          >
            <Plus className="w-5 h-5 text-zinc-800" />
          </button>
        )}

        {/* Active Quantity Badge in image */}
        {!isSoldOut && quantity > 0 && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-lg border border-white/20 text-white"
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
            <span className="text-xs font-bold min-w-[16px] text-center font-mono">{quantity}</span>
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
      
      <div className="flex-1 flex flex-col justify-between px-1">
        <div>
          <h3 className="font-bold text-zinc-900 text-sm sm:text-base leading-tight mb-1 group-hover:text-emerald-700 transition-colors">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-zinc-500 text-xs line-clamp-2 mb-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-emerald-600 font-mono font-bold text-sm">
            {currency}{Number(item.price).toFixed(2)}
          </p>
          {isSoldOut && (
            <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
              Sold Out
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
