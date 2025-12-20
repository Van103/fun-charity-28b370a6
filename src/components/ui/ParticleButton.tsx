import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, ButtonProps } from './button';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  speed: number;
  life: number;
  type: 'star' | 'circle' | 'diamond' | 'heart';
}

interface ParticleButtonProps extends ButtonProps {
  particleColors?: string[];
  particleCount?: number;
  particleSize?: { min: number; max: number };
  glowColor?: string;
  pulseEffect?: boolean;
}

const ParticleButton = React.forwardRef<HTMLButtonElement, ParticleButtonProps>(
  ({ 
    children, 
    className,
    particleColors = ['#84D9BA', '#FFD700', '#FF6B9D', '#8B5CF6', '#00D4FF'],
    particleCount = 8,
    particleSize = { min: 4, max: 8 },
    glowColor = '#84D9BA',
    pulseEffect = true,
    ...props 
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isHovered, setIsHovered] = useState(false);
    const particleIdRef = useRef(0);

    const particleTypes: Particle['type'][] = ['star', 'circle', 'diamond', 'heart'];

    const createParticle = (rect: DOMRect): Particle => {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      switch (side) {
        case 0: // top
          x = Math.random() * rect.width;
          y = -10;
          break;
        case 1: // right
          x = rect.width + 10;
          y = Math.random() * rect.height;
          break;
        case 2: // bottom
          x = Math.random() * rect.width;
          y = rect.height + 10;
          break;
        default: // left
          x = -10;
          y = Math.random() * rect.height;
      }

      return {
        id: particleIdRef.current++,
        x,
        y,
        size: Math.random() * (particleSize.max - particleSize.min) + particleSize.min,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.5 + 0.3,
        life: 1,
        type: particleTypes[Math.floor(Math.random() * particleTypes.length)]
      };
    };

    useEffect(() => {
      if (!isHovered || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const interval = setInterval(() => {
        setParticles(prev => {
          const newParticles = prev
            .map(p => ({ ...p, life: p.life - 0.02 }))
            .filter(p => p.life > 0);
          
          if (newParticles.length < particleCount) {
            newParticles.push(createParticle(rect));
          }
          
          return newParticles;
        });
      }, 100);

      return () => clearInterval(interval);
    }, [isHovered, particleCount]);

    const renderParticle = (particle: Particle) => {
      const baseStyle = {
        left: particle.x,
        top: particle.y,
        width: particle.size,
        height: particle.size,
      };

      switch (particle.type) {
        case 'star':
          return (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none"
              style={baseStyle}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ 
                opacity: particle.life,
                scale: [0, 1.2, 1],
                rotate: 360,
                x: Math.cos(particle.angle) * 20,
                y: Math.sin(particle.angle) * 20,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              <svg viewBox="0 0 24 24" fill={particle.color}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </motion.div>
          );
        case 'diamond':
          return (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none"
              style={{
                ...baseStyle,
                background: particle.color,
                transform: 'rotate(45deg)',
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: particle.life,
                scale: [0, 1.3, 1],
                x: Math.cos(particle.angle) * 25,
                y: Math.sin(particle.angle) * 25,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
            />
          );
        case 'heart':
          return (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none"
              style={baseStyle}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: particle.life,
                scale: [0, 1.2, 0.9, 1.1, 1],
                x: Math.cos(particle.angle) * 30,
                y: Math.sin(particle.angle) * 30 - 10,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 3, ease: "easeOut" }}
            >
              <svg viewBox="0 0 24 24" fill={particle.color}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </motion.div>
          );
        default:
          return (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none rounded-full"
              style={{
                ...baseStyle,
                background: `radial-gradient(circle, ${particle.color} 0%, transparent 70%)`,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: particle.life * 0.8,
                scale: [0, 1.5, 1],
                x: Math.cos(particle.angle) * 20,
                y: Math.sin(particle.angle) * 20,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          );
      }
    };

    return (
      <div 
        ref={containerRef}
        className="relative inline-block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setParticles([]);
        }}
      >
        {/* Ambient glow */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor}40 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
          animate={{
            opacity: isHovered ? [0.5, 0.8, 0.5] : 0.3,
            scale: isHovered ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Particles */}
        <AnimatePresence>
          {particles.map(renderParticle)}
        </AnimatePresence>

        {/* Pulse ring effect */}
        {pulseEffect && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              border: `2px solid ${glowColor}`,
            }}
            animate={{
              opacity: [0.6, 0],
              scale: [1, 1.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}

        {/* Button */}
        <Button 
          ref={ref} 
          className={className}
          {...props}
        >
          {children}
        </Button>
      </div>
    );
  }
);

ParticleButton.displayName = 'ParticleButton';

export { ParticleButton };
