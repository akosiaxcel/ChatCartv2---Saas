import React from 'react';
import brandMarkSrc from '../assets/images/brand_mark_logo_1787201273034.jpg';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 36 }) => {
  return (
    <div 
      className={`shrink-0 overflow-hidden flex items-center justify-center rounded-lg ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src={brandMarkSrc}
        alt="ChatCart Brand Mark"
        width={size}
        height={size}
        className="w-full h-full object-cover scale-[1.32] transform select-none"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== '/brand-mark.png' && !target.src.endsWith('/brand-mark.png')) {
            target.src = '/brand-mark.png';
          } else if (target.src !== '/brand-mark.jpg' && !target.src.endsWith('/brand-mark.jpg')) {
            target.src = '/brand-mark.jpg';
          }
        }}
      />
    </div>
  );
};

export default Logo;
