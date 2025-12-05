import { useEffect, useRef, useState, useCallback } from 'react';
import { useMotion } from '@/contexts/MotionContext';
import { useCursor, CursorType } from '@/contexts/CursorContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'diamond' | 'heart' | 'star' | 'circle';
  color: string;
}

const CustomCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const { reduceMotion } = useMotion();
  const { cursorType, particlesEnabled, currentCursor } = useCursor();
  const [isVisible, setIsVisible] = useState(false);

  const getParticleType = (cursor: CursorType): Particle['type'] => {
    switch (cursor) {
      case 'diamond': return 'diamond';
      case 'heart': return 'heart';
      case 'star': return 'star';
      default: return 'diamond';
    }
  };

  const createParticle = useCallback((x: number, y: number): Particle => {
    const rand = Math.random();
    // Gold color palette for falling particles
    const goldColors = [
      'rgba(255, 215, 0, 1)',    // Gold
      'rgba(255, 193, 7, 1)',    // Amber
      'rgba(201, 162, 61, 1)',   // Dark gold
      'rgba(255, 235, 59, 1)',   // Yellow
      'rgba(255, 165, 0, 1)',    // Orange gold
    ];
    const color = goldColors[Math.floor(rand * goldColors.length)];
    
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      life: 1,
      maxLife: 60 + Math.random() * 40,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      type: getParticleType(cursorType),
      color,
    };
  }, [cursorType]);

  const drawParticle = useCallback((
    ctx: CanvasRenderingContext2D,
    particle: Particle
  ) => {
    const { x, y, size, rotation, life, type, color } = particle;
    const alpha = life * 0.8;
    const colorWithAlpha = color.replace(/[\d.]+\)$/, `${alpha})`);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    switch (type) {
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.6, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.6, 0);
        ctx.closePath();
        ctx.fillStyle = colorWithAlpha;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        break;

      case 'heart':
        ctx.beginPath();
        const s = size * 0.5;
        ctx.moveTo(0, s);
        ctx.bezierCurveTo(-s * 2, -s, -s, -s * 2, 0, -s * 0.5);
        ctx.bezierCurveTo(s, -s * 2, s * 2, -s, 0, s);
        ctx.fillStyle = colorWithAlpha;
        ctx.fill();
        break;

      case 'star':
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? size : size * 0.4;
          if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fillStyle = colorWithAlpha;
        ctx.fill();
        break;

      default:
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = colorWithAlpha;
        ctx.fill();
    }

    ctx.restore();
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dx = mouseRef.current.x - lastMouseRef.current.x;
    const dy = mouseRef.current.y - lastMouseRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Spawn gold particles based on movement - more particles falling everywhere
    if (distance > 3 && !reduceMotion && particlesEnabled && cursorType !== 'default') {
      const particleCount = Math.min(Math.floor(distance / 8), 4);
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(
          createParticle(
            mouseRef.current.x + (Math.random() - 0.5) * 30,
            mouseRef.current.y + (Math.random() - 0.5) * 20
          )
        );
      }
    }

    lastMouseRef.current = { ...mouseRef.current };

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.06;
      particle.vx *= 0.99;
      particle.rotation += particle.rotationSpeed;
      particle.life -= 1 / particle.maxLife;

      if (particle.life > 0) {
        drawParticle(ctx, particle);
        return true;
      }
      return false;
    });

    // Limit particles for performance - increased for more sparkle effect
    if (particlesRef.current.length > 80) {
      particlesRef.current = particlesRef.current.slice(-80);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [createParticle, drawParticle, reduceMotion, particlesEnabled, cursorType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      setIsVisible(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setIsVisible(true);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  if (reduceMotion || !particlesEnabled || cursorType === 'default') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ opacity: isVisible ? 1 : 0 }}
    />
  );
};

export default CustomCursor;
