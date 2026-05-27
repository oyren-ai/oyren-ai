import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 128 128" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M53.165 11L73.835 32.529V11H92.2084V76.6739L73.835 58.5992L53.165 37.8601V117H34.7917V11H53.165Z" 
        fill="currentColor"
      />
    </svg>
  );
};

export default Logo;

// Alternative version with color variants
export const LogoIcon: React.FC<{
  size?: number;
  className?: string;
  variant?: "default" | "primary" | "muted";
}> = ({ size = 32, variant = "default", className = '' }) => {
  const getColorClass = () => {
    switch (variant) {
      case "primary":
        return "text-primary";
      case "muted":
        return "text-muted-foreground";
      default:
        return "text-current";
    }
  };

  return (
    <Logo 
      className={`${getColorClass()} ${className}`} 
      size={size}
    />
  );
};