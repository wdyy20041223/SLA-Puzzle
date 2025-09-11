import React from 'react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
}) => {
  // 防御性内联样式，确保文字可见
  const defensiveStyle: React.CSSProperties = {
    color: 'white',
    fontWeight: 600,
    fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} btn-${size} ${className}`}
      style={defensiveStyle}
    >
      {children}
    </button>
  );
};