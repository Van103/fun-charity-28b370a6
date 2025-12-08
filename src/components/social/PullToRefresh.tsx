import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, useAnimation } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 80 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const controls = useAnimation();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Apply resistance to pull
      const resistance = 0.4;
      const distance = Math.min(diff * resistance, threshold * 1.5);
      setPullDistance(distance);
    }
  }, [isPulling, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      // Animate to fixed position while refreshing
      await controls.start({ y: threshold });
      
      try {
        await onRefresh();
      } finally {
        // Reset after refresh
        setIsRefreshing(false);
        setPullDistance(0);
        await controls.start({ y: 0 });
      }
    } else {
      // Reset if threshold not reached
      setPullDistance(0);
    }
    
    setIsPulling(false);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh, controls]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;
  const scale = 0.5 + progress * 0.5;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div 
        className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
        style={{ 
          top: -40,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
        animate={{
          y: isRefreshing ? threshold : pullDistance,
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <motion.div 
          className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center"
          style={{
            scale,
          }}
        >
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: rotation }}
            transition={isRefreshing ? { 
              repeat: Infinity, 
              duration: 0.8, 
              ease: "linear" 
            } : { 
              duration: 0 
            }}
          >
            <RefreshCw 
              className={`w-5 h-5 ${
                progress >= 1 || isRefreshing 
                  ? "text-secondary" 
                  : "text-muted-foreground"
              }`}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content with pull effect */}
      <motion.div
        animate={{
          y: isRefreshing ? threshold : pullDistance,
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {children}
      </motion.div>

      {/* Refreshing text */}
      {isRefreshing && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground z-40"
        >
          Đang làm mới...
        </motion.p>
      )}
    </div>
  );
}
