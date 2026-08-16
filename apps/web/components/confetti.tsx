"use client";
import { useEffect, useState } from "react";

const COLORS = ["var(--violet)", "var(--lime)", "var(--coral)", "var(--gold)"];
const PARTICLE_COUNT = 24;

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
};

// Confeti de un solo disparo (docs/features/motion-system.md, 0.8.9.3):
// reservado para cambio de rango. CSS puro, sin canvas ni librería. Las
// posiciones aleatorias se generan en un efecto (no durante el render, que
// debe ser puro) y se aplican en el siguiente frame.
export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
      id: index,
      left: Math.random() * 100,
      delay: Math.round(Math.random() * 150),
      duration: Math.round(700 + Math.random() * 300),
      color: COLORS[index % COLORS.length]!,
      rotate: Math.round(Math.random() * 360),
    }));
    requestAnimationFrame(() => setParticles(generated));
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          style={{
            position: "absolute",
            left: `${particle.left}%`,
            top: "-10px",
            width: 8,
            height: 8,
            borderRadius: 2,
            background: particle.color,
            transform: `rotate(${particle.rotate}deg)`,
            animation: `confetti-fall ${particle.duration}ms ease-in ${particle.delay}ms both`,
          }}
        />
      ))}
    </div>
  );
}
