
import React, { useEffect, useState } from 'react';

const MoneyRain = () => {
  const [moneyElements, setMoneyElements] = useState<JSX.Element[]>([]);

  useEffect(() => {
    // Create money rain elements
    const createMoneyRain = () => {
      const newMoneyElements = [];
      const moneyCount = 10; // Number of money particles

      for (let i = 0; i < moneyCount; i++) {
        const delay = Math.random() * 5; // Random delay up to 5s
        const duration = 3 + Math.random() * 3; // Random duration between 3-6s
        const size = 20 + Math.random() * 20; // Random size between 20-40px
        const rotateStart = Math.random() * 360; // Random initial rotation
        const leftPosition = Math.random() * 100; // Random position across screen width

        const style = {
          left: `${leftPosition}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          width: `${size}px`,
          height: `${size / 2}px`,
          transform: `rotate(${rotateStart}deg)`,
        };

        newMoneyElements.push(
          <div
            key={`money-${i}`}
            className="money-particle animate-money-rain"
            style={style}
          />
        );
      }

      setMoneyElements(newMoneyElements);
    };

    createMoneyRain();

    // Recreate money rain periodically
    const interval = setInterval(createMoneyRain, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {moneyElements}
    </div>
  );
};

export default MoneyRain;
