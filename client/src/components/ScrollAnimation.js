import React, { useEffect, useRef, useState } from 'react';

export default function ScrollAnimation({ children, animationClass = 'fade-up', style = {} }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Animate only once when scrolled into view
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={isVisible ? animationClass : 'invisible-pre-scroll'} 
      style={{ display: 'inline-block', ...style }}
    >
      {children}
    </div>
  );
}
