import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32, color }) => {
  // If color="white" is explicitly requested (e.g., inside solid emerald/dark container), adapt colors
  const isMonochromeWhite = color === 'white' || color === '#ffffff' || color === '#fff';
  const cartColor = isMonochromeWhite ? '#ffffff' : (color || '#00C389');
  const accentColor = isMonochromeWhite ? 'rgba(255, 255, 255, 0.95)' : '#0F172A';
  const innerBg = isMonochromeWhite ? 'transparent' : 'white';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="13 20 73 57" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Brand Mark Cart Outline & Speech Bubble */}
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* Cart Handle & Base Rail */}
        <path
          d="M17 24.5H25.5C28.8 24.5 31.6 26.8 32.5 29.8L39.8 54.5C41 58.8 45 61.8 49.5 61.8H61.5"
          stroke={cartColor}
          strokeWidth="6.8"
        />

        {/* Speech Bubble / Cart Basket Body */}
        <path
          d="M37.5 33.5C37.5 29.5 40.5 26.5 44.5 26.5H73C78 26.5 82.5 30.5 82.5 36.5V47C82.5 52.8 78 57 73 57H66.5V66 L57 57H44.5C39.5 57 37.5 52.8 37.5 47V33.5Z"
          fill={innerBg}
          stroke={cartColor}
          strokeWidth="6.5"
        />
      </g>

      {/* 3 Chat Typing Dots inside the basket */}
      <circle cx="50" cy="43.5" r="3.4" fill={accentColor} />
      <circle cx="59.5" cy="43.5" r="3.4" fill={accentColor} />
      <circle cx="69" cy="43.5" r="3.4" fill={accentColor} />

      {/* 2 Cart Wheels */}
      <circle cx="45" cy="71" r="5.2" fill={accentColor} />
      <circle cx="60.5" cy="71" r="5.2" fill={accentColor} />
    </svg>
  );
};
export default Logo;
