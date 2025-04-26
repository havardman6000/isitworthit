
import React from 'react';

const FloatingElements = () => {
  const floatingItems = [
    { icon: '🪙', delay: 0, size: 'text-3xl' },
    { icon: '💰', delay: 2, size: 'text-4xl' },
    { icon: '💎', delay: 1, size: 'text-2xl' },
    { icon: '🏆', delay: 3, size: 'text-4xl' },
    { icon: '🧠', delay: 2.5, size: 'text-3xl' },
    { icon: '🐐', delay: 1.5, size: 'text-4xl' },
    { icon: '🚀', delay: 0.5, size: 'text-3xl' },
  ];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {floatingItems.map((item, index) => (
        <div
          key={index}
          className="absolute animate-float"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${item.delay}s`,
            opacity: 0.5,
          }}
        >
          <span className={`${item.size}`}>{item.icon}</span>
        </div>
      ))}
    </div>
  );
};

export default FloatingElements;
