import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 24, color = 'currentColor' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shopping Cart Handle */}
      <path 
        d="M15 25H25L35 75H85" 
        stroke={color} 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Speech Bubble / Cart Body */}
      <path 
        d="M30 35H90V65H45L30 80V35Z" 
        fill={color}
      />
      {/* Chat Lines */}
      <line x1="45" y1="45" x2="75" y2="45" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <line x1="45" y1="55" x2="65" y2="55" stroke="white" strokeWidth="4" strokeLinecap="round" />
      {/* Wheel */}
      <circle cx="75" cy="85" r="6" fill={color} />
    </svg>
  );
};
