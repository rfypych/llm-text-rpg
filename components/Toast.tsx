import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  type: 'success' | 'info' | 'error';
}

const toastConfig = {
    success: {
        icon: '✅',
        bg: 'bg-green-600',
        border: 'border-green-500'
    },
    info: {
        icon: '📜',
        bg: 'bg-sky-600',
        border: 'border-sky-500'
    },
    error: {
        icon: '❌',
        bg: 'bg-red-600',
        border: 'border-red-500'
    }
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, type }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const config = toastConfig[type];

  return (
    <div className={`fixed top-5 right-5 ${config.bg} text-white py-3 px-5 rounded-lg shadow-lg flex items-center gap-3 border-b-4 ${config.border} animate-fade-in-down font-sans z-50`}>
      <span className="text-xl">{config.icon}</span>
      <span>{message}</span>
    </div>
  );
};

// Add some basic animation keyframes in the global scope if not using a CSS file
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in-down {
    0% {
      opacity: 0;
      transform: translateY(-20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-down {
    animation: fade-in-down 0.5s ease-out forwards;
  }
  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.5s ease-out forwards;
  }
`;
document.head.appendChild(style);