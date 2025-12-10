import { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  images: { url: string; type: string }[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Filter only images (no videos)
  const imageOnly = images.filter(img => img.type !== "video");

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToPrev = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : imageOnly.length - 1));
  };

  const goToNext = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev < imageOnly.length - 1 ? prev + 1 : 0));
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (scale > 1) {
      // If zoomed in, allow panning
      setPosition({
        x: position.x + info.offset.x,
        y: position.y + info.offset.y,
      });
    } else {
      // Swipe to navigate
      if (info.offset.x > 100) {
        goToPrev();
      } else if (info.offset.x < -100) {
        goToNext();
      }
    }
  };

  const toggleZoom = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const zoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  if (!isOpen || imageOnly.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Zoom controls */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={zoomOut}
            disabled={scale <= 1}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-white text-sm min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={zoomIn}
            disabled={scale >= 4}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Image counter */}
        {imageOnly.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 rounded-full px-4 py-2">
            <span className="text-white text-sm">
              {currentIndex + 1} / {imageOnly.length}
            </span>
          </div>
        )}

        {/* Navigation arrows */}
        {imageOnly.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={goToPrev}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={goToNext}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}

        {/* Main image with swipe and zoom */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: scale,
            x: position.x,
            y: position.y,
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag={scale === 1 ? "x" : true}
          dragConstraints={scale === 1 ? { left: 0, right: 0 } : undefined}
          dragElastic={scale === 1 ? 0.2 : 0.05}
          onDragEnd={handleDragEnd}
          onClick={toggleZoom}
          className="cursor-zoom-in max-w-[90vw] max-h-[85vh]"
          style={{ cursor: scale > 1 ? "grab" : "zoom-in" }}
        >
          <img
            src={imageOnly[currentIndex]?.url}
            alt=""
            className="max-w-full max-h-[85vh] object-contain select-none"
            draggable={false}
          />
        </motion.div>

        {/* Thumbnail strip */}
        {imageOnly.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto">
            {imageOnly.map((img, idx) => (
              <motion.button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}
                className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                  idx === currentIndex
                    ? "border-secondary"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
