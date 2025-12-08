import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export interface Reaction {
  type: string;
  emoji: string;
  label: string;
  color: string;
}

export const REACTIONS: Reaction[] = [
  { type: "like", emoji: "👍", label: "Thích", color: "text-blue-500" },
  { type: "love", emoji: "❤️", label: "Yêu thích", color: "text-red-500" },
  { type: "haha", emoji: "😆", label: "Haha", color: "text-yellow-500" },
  { type: "wow", emoji: "😮", label: "Wow", color: "text-yellow-500" },
  { type: "sad", emoji: "😢", label: "Buồn", color: "text-yellow-500" },
  { type: "angry", emoji: "😠", label: "Phẫn nộ", color: "text-orange-500" },
];

interface FeedReactionPickerProps {
  currentReaction?: string | null;
  onReact: (reactionType: string) => void;
  onRemoveReaction: () => void;
  isLoading?: boolean;
}

export function FeedReactionPicker({
  currentReaction,
  onReact,
  onRemoveReaction,
  isLoading,
}: FeedReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);

  const activeReaction = REACTIONS.find((r) => r.type === currentReaction);

  const handleReactionClick = (reactionType: string) => {
    if (currentReaction === reactionType) {
      onRemoveReaction();
    } else {
      onReact(reactionType);
    }
    setShowPicker(false);
  };

  const handleButtonClick = () => {
    if (currentReaction) {
      onRemoveReaction();
    } else {
      onReact("like");
    }
  };

  return (
    <div 
      className="relative flex-1"
      onMouseEnter={() => setShowPicker(true)}
      onMouseLeave={() => {
        setShowPicker(false);
        setHoveredReaction(null);
      }}
    >
      {/* Reaction Picker Popup */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-full left-0 mb-2 bg-background/95 backdrop-blur-md rounded-full shadow-lg border border-border px-2 py-1.5 flex items-center gap-1 z-50"
          >
            {REACTIONS.map((reaction, index) => (
              <motion.button
                key={reaction.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: hoveredReaction === reaction.type ? 1.3 : 1,
                }}
                transition={{ 
                  delay: index * 0.03,
                  scale: { type: "spring", stiffness: 400, damping: 10 }
                }}
                onClick={() => handleReactionClick(reaction.type)}
                onMouseEnter={() => setHoveredReaction(reaction.type)}
                onMouseLeave={() => setHoveredReaction(null)}
                className={`relative text-2xl hover:scale-125 transition-transform duration-150 p-1 ${
                  currentReaction === reaction.type ? "scale-110" : ""
                }`}
                disabled={isLoading}
              >
                <span className="block transform-gpu">{reaction.emoji}</span>
                
                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredReaction === reaction.type && (
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded-md whitespace-nowrap"
                    >
                      {reaction.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <Button
        variant="ghost"
        className={`w-full gap-2 transition-colors ${
          activeReaction 
            ? `${activeReaction.color} hover:${activeReaction.color}` 
            : "text-muted-foreground hover:text-secondary"
        }`}
        onClick={handleButtonClick}
        disabled={isLoading}
      >
        {activeReaction ? (
          <motion.span
            key={activeReaction.type}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-lg"
          >
            {activeReaction.emoji}
          </motion.span>
        ) : (
          <Heart className="w-5 h-5" />
        )}
        <span className={activeReaction ? activeReaction.color : ""}>
          {activeReaction ? activeReaction.label : "Thích"}
        </span>
      </Button>
    </div>
  );
}
