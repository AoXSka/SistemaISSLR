import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7', 
    lg: 'w-9 h-9'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin`}>
        <div className="h-full w-full border-4 border-neutral-200 dark:border-neutral-700 border-t-primary-600 border-r-accent-600 rounded-full shadow-sm"></div>
      </div>
      {text && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 font-semibold animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}