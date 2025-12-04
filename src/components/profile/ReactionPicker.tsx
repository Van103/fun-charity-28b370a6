import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const REACTIONS = [
  { type: "like", emoji: "👍", label: "Thích" },
  { type: "love", emoji: "❤️", label: "Yêu thích" },
  { type: "haha", emoji: "😆", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Buồn" },
  { type: "angry", emoji: "😡", label: "Phẫn nộ" },
];

interface ReactionPickerProps {
  onReact: (reactionType: string) => void;
  currentReaction?: string | null;
  reactions?: { type: string; count: number }[];
  disabled?: boolean;
}

export function ReactionPicker({ 
  onReact, 
  currentReaction, 
  reactions = [],
  disabled 
}: ReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const handleReact = (type: string) => {
    onReact(type);
    setOpen(false);
  };

  const currentEmoji = currentReaction 
    ? REACTIONS.find(r => r.type === currentReaction)?.emoji 
    : null;

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "flex-1 rounded-none gap-2",
              currentReaction && "text-secondary"
            )}
          >
            {currentEmoji ? (
              <span className="text-lg">{currentEmoji}</span>
            ) : (
              <span className="text-lg">👍</span>
            )}
            <span>{currentReaction ? REACTIONS.find(r => r.type === currentReaction)?.label : "Thích"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top">
          <div className="flex gap-1">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReact(reaction.type)}
                className={cn(
                  "text-2xl p-2 rounded-full hover:bg-muted transition-all hover:scale-125",
                  currentReaction === reaction.type && "bg-secondary/20"
                )}
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Reaction summary */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <div className="flex -space-x-1">
            {reactions.slice(0, 3).map((r) => (
              <span key={r.type} className="text-sm">
                {REACTIONS.find(reaction => reaction.type === r.type)?.emoji}
              </span>
            ))}
          </div>
          <span>{totalReactions}</span>
        </div>
      )}
    </div>
  );
}

// Mini reaction display for comments
export function ReactionDisplay({ 
  reactions,
  onReact,
  currentReaction,
  disabled
}: {
  reactions: { type: string; count: number }[];
  onReact: (type: string) => void;
  currentReaction?: string | null;
  disabled?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);
  
  const currentEmoji = currentReaction 
    ? REACTIONS.find(r => r.type === currentReaction)?.emoji 
    : null;

  return (
    <div className="relative inline-flex items-center gap-2">
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <button 
            className={cn(
              "text-xs hover:underline",
              currentReaction ? "text-secondary font-semibold" : "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {currentEmoji || "Thích"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" side="top">
          <div className="flex gap-0.5">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => {
                  onReact(reaction.type);
                  setShowPicker(false);
                }}
                className={cn(
                  "text-xl p-1.5 rounded-full hover:bg-muted transition-all hover:scale-110",
                  currentReaction === reaction.type && "bg-secondary/20"
                )}
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      {totalReactions > 0 && (
        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
          {reactions.slice(0, 3).map((r) => (
            <span key={r.type}>
              {REACTIONS.find(reaction => reaction.type === r.type)?.emoji}
            </span>
          ))}
          {totalReactions}
        </span>
      )}
    </div>
  );
}
