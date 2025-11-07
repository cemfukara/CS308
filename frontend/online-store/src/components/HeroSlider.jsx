import React, { useState, useEffect } from 'react';
import './HeroSlider.css';

const slides = [
  {
    image: '/src/assets/hero1.jpg',
    title: 'Experience Cutting-Edge Tech',
  },
  {
    image: '/src/assets/hero2.jpg',
    title: 'Shop the Latest Devices',
  },
  {
    image: '/src/assets/hero3.jpg',
    title: 'Upgrade Your Digital Life',
  },
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-slider">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`hero-slide ${index === current ? 'active' : ''}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          {/* We’ll make these clickable later */}
        </div>
      ))}

      <div className="hero-dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === current ? 'active' : ''}`}
            onClick={() => setCurrent(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
