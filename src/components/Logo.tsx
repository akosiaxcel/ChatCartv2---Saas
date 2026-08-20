import React from 'react';

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
        src="/brand-mark.png"
        alt="ChatCart Brand Mark"
        width={size}
        height={size}
        className="w-full h-full object-cover scale-[1.32] transform select-none"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.endsWith('brand-mark.jpg')) {
            target.src = '/brand-mark.jpg';
          }
        }}
      />
    </div>
  );
};

export default Logo;
