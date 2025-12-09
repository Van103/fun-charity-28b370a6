import { useState, useEffect, useRef } from "react";
import { Heart, Volume2, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const mantras = [
  "Lòng tốt là ánh sáng, mỗi hành động thiện nguyện là một tia sáng chiếu rọi thế giới.",
  "Cho đi không làm ta nghèo đi, mà làm trái tim ta giàu có hơn.",
  "Minh bạch là nền tảng của niềm tin, blockchain là cầu nối của lòng nhân ái.",
  "Mỗi đồng quyên góp là một hạt giống yêu thương được gieo vào cuộc đời.",
  "Sự kết nối làm nên sức mạnh, cộng đồng FUN là gia đình của những trái tim nhân hậu.",
  "Tình nguyện không chỉ là cho đi, mà còn là nhận lại niềm vui vô bờ bến.",
  "Mỗi hành động từ thiện được ghi dấu mãi mãi trên blockchain của lòng nhân ái.",
  "Ánh sáng của sự cho đi sẽ soi sáng con đường của cả người cho lẫn người nhận."
];

export function DivineMantrasCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReadButton, setShowReadButton] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % mantras.length);
      }, 8000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  const handleHover = (hovering: boolean) => {
    setIsPaused(hovering);
    setShowReadButton(hovering);
  };

  const handleReadMantra = () => {
    setIsReading(true);
    
    // Simulate reading time
    setTimeout(() => {
      setIsReading(false);
      toast.success(
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-secondary" />
          <span>Bạn đã nhận được <strong className="text-secondary">1,000 $FUN</strong> reward!</span>
        </div>,
        {
          description: "Cảm ơn bạn đã lan tỏa ánh sáng từ bi 💜✨",
          duration: 5000,
        }
      );
    }, 3000);
  };

  return (
    <div 
      className="relative w-full overflow-hidden py-6"
      style={{
        background: `
          radial-gradient(ellipse at center, rgba(75, 0, 130, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 20% 80%, rgba(255, 215, 0, 0.15) 0%, transparent 40%),
          radial-gradient(ellipse at 80% 20%, rgba(138, 43, 226, 0.2) 0%, transparent 40%),
          linear-gradient(180deg, rgba(10, 5, 20, 0.95) 0%, rgba(20, 10, 40, 0.98) 100%)
        `,
      }}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
      onTouchStart={() => handleHover(true)}
      onTouchEnd={() => handleHover(false)}
    >
      {/* Twinkling stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/60 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Soft light rays */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 opacity-20"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255, 215, 0, 0.4) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-secondary/80 font-medium">
            Thần Chú Thiện Nguyện
          </span>
          <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
        </div>

        <div className="relative min-h-[80px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="flex items-center justify-center gap-3 text-center max-w-4xl mx-auto"
            >
              {/* Blinking heart left */}
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
              </motion.div>

              {/* Mantra text with gradient glow */}
              <p 
                className="text-lg md:text-xl font-medium italic leading-relaxed"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  background: "linear-gradient(135deg, #9B4DCA 0%, #FFD700 50%, #E8B923 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textShadow: "0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(75, 0, 130, 0.2)",
                  filter: "drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))",
                }}
              >
                "{mantras[currentIndex]}"
              </p>

              {/* Blinking heart right */}
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
              >
                <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Read aloud button */}
        <AnimatePresence>
          {showReadButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-center mt-4"
            >
              <Button
                onClick={handleReadMantra}
                disabled={isReading}
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-all gap-2 shadow-lg shadow-secondary/20"
                size="sm"
              >
                {isReading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    Đang đọc thần chú...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Đọc to thần chú này (+1,000 $FUN)
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {mantras.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? "bg-secondary w-6" 
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
