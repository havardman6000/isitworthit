
import React, { useEffect, useState } from 'react';

const ConfettiExplosion = () => {
  const [confetti, setConfetti] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const colors = ['confetti-red', 'confetti-blue', 'confetti-green', 'confetti-yellow', 'confetti-purple'];
    const confettiCount = 100;
    const newConfetti = [];

    for (let i = 0; i < confettiCount; i++) {
      // Random properties for each confetti piece
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = 10 + Math.random() * 80; // Position between 10-90% of screen width
      const size = 5 + Math.random() * 10; // Size between 5-15px
      const delay = Math.random() * 0.5; // Delay up to 0.5s
      const duration = 1 + Math.random() * 3; // Duration between 1-4s
      
      // Random angle for the confetti to shoot out
      const angle = Math.random() * 360;
      const distance = 20 + Math.random() * 80; // Distance to travel
      
      const style = {
        left: `${left}%`,
        top: '50%',
        width: `${size}px`,
        height: `${size}px`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${Math.random() * 360}deg)`,
      };

      newConfetti.push(
        <div
          key={`confetti-${i}`}
          className={`confetti ${color} animate-confetti`}
          style={style}
        />
      );
    }

    setConfetti(newConfetti);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {confetti}
    </div>
  );
};

export default ConfettiExplosion;
