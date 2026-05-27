import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  isSidebarCollapsed: boolean;
}

const SidebarToggleIcon: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" fill="currentColor" fillOpacity="0.2"/>
    <path d="M16 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H16V21Z" fill="currentColor"/>
  </svg>
);

export default SidebarToggleIcon; 