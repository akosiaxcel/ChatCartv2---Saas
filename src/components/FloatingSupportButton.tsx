import React, { useState } from 'react';
import { PAYMENT_CONFIG } from '../lib/constants';
import { MessageCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function FloatingSupportButton() {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();

  // If on a public menu page with a customer cart, we keep it subtle or in a non-conflicting position
  const isPublicMenu = location.pathname.startsWith('/menu/') || (
    location.pathname !== '/login' && 
    location.pathname !== '/superadmin' && 
    location.pathname !== '/dashboard' && 
    location.pathname !== '/editor' && 
    location.pathname !== '/superadmin/dashboard' &&
    !location.pathname.endsWith('/dashboard') &&
    !location.pathname.endsWith('/editor')
  );

  return (
    <div 
      className={`fixed z-40 transition-all duration-300 ${
        isPublicMenu ? 'bottom-24 left-4 md:bottom-6 md:left-6' : 'bottom-6 right-6'
      }`}
    >
      <a
        href={PAYMENT_CONFIG.messengerUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group flex items-center gap-3 bg-white hover:bg-zinc-900 text-zinc-800 hover:text-white p-3 md:px-4 md:py-3 rounded-full shadow-lg hover:shadow-2xl border border-zinc-200/80 hover:border-zinc-800 transition-all duration-300 active:scale-95"
        aria-label="Contact WapDev Support on Messenger"
      >
        {/* Messenger Icon with Pulse Glow */}
        <div className="relative flex items-center justify-center shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0084FF] via-[#00C6FF] to-[#A855F7] flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <svg 
              className="w-4 h-4 text-white fill-current" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.516 3.736 7.186V22l3.434-1.884c.907.251 1.867.387 2.83.387 5.523 0 10-4.145 10-9.245C22 6.145 17.523 2 12 2zm1.066 12.443l-2.73-2.91-5.326 2.91 5.858-6.22 2.795 2.91 5.261-2.91-5.858 6.22z"/>
            </svg>
          </div>
          
          {/* Online green indicator */}
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>
        </div>

        {/* Text details */}
        <div className="hidden sm:flex flex-col text-left pr-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 group-hover:text-zinc-300">
            WapDev Support
          </span>
          <span className="text-xs font-bold leading-tight">
            Chat on Messenger
          </span>
        </div>
      </a>
    </div>
  );
}
