import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = false, className = "" }: LogoProps) {
  const sizes = {
    sm: { icon: 36, text: "text-lg" },
    md: { icon: 48, text: "text-xl" },
    lg: { icon: 60, text: "text-2xl" },
    xl: { icon: 80, text: "text-3xl" },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <div className="relative">
        {/* Video Logo Container - Circular */}
        <div
          className="rounded-full overflow-hidden relative ring-2 ring-primary/30 shadow-lg shadow-primary/20 group-hover:ring-primary/50 group-hover:shadow-primary/40 transition-all duration-300"
          style={{ width: s.icon, height: s.icon }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-110"
          >
            <source src="/videos/logo-video.mp4" type="video/mp4" />
          </video>
          
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/10 to-transparent animate-shimmer pointer-events-none" 
               style={{ backgroundSize: "200% 100%" }} />
        </div>

        {/* Floating hearts */}
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
        >
          <svg width={s.icon * 0.18} height={s.icon * 0.18} viewBox="0 0 24 24" fill="#C9A23D">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute -bottom-0.5 -left-1"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        >
          <svg width={s.icon * 0.12} height={s.icon * 0.12} viewBox="0 0 24 24" fill="#2E0F4A">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute top-1/2 -right-2"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 1 }}
        >
          <svg width={s.icon * 0.1} height={s.icon * 0.1} viewBox="0 0 24 24" fill="#D4B85A">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>
      </div>

      {/* Text shows on hover */}
      <motion.span 
        className={`font-display font-bold ${s.text} text-gold-shimmer tracking-tight whitespace-nowrap`}
        initial={{ opacity: 0, width: 0 }}
        animate={{ 
          opacity: showText ? 1 : 0, 
          width: showText ? "auto" : 0 
        }}
        whileHover={{ opacity: 1, width: "auto" }}
        transition={{ duration: 0.3 }}
      >
        FUNCHARITY
      </motion.span>
    </div>
  );
}