'use client'

import { useEffect } from 'react';
import '@/styles/animations.css';

export default function AnimatedBackground() {
  useEffect(() => {
    const createCells = (count: number) => {
      const background = document.getElementById('animated-background');
      const colors = ['#10B981', '#6366F1'];
      
      for (let i = 0; i < count; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        const size = Math.random() * 30 + 20;
        cell.style.width = `${size}px`;
        cell.style.height = `${size}px`;
        cell.style.left = `${Math.random() * 100}vw`;
        cell.style.top = `${Math.random() * 100}vh`;
        cell.style.animationDuration = `${Math.random() * 3 + 2}s`;
        cell.style.animationDelay = `${Math.random() * 2}s`;
        const colorIndex = i % 2;
        cell.style.backgroundColor = colors[colorIndex];
        background?.appendChild(cell);

        setTimeout(() => {
          cell.style.opacity = '0.5';
        }, Math.random() * 3000);
      }
    };

    createCells(40);
  }, []);

  return (
    <div
      id="animated-background"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    />
  );
}