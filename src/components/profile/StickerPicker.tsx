import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sticker } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Predefined sticker sets using emojis
const STICKER_SETS = {
  emotions: [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
    "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
    "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
    "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐",
  ],
  animals: [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
    "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵",
    "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇",
    "🐺", "🐗", "🐴", "🦄", "🐝", "🦋", "🐌", "🐞",
  ],
  love: [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
    "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗",
    "💖", "💘", "💝", "💟", "♥️", "💌", "💋", "🫶",
    "🤟", "🤙", "👍", "👏", "🙌", "🤝", "🫂", "💪",
  ],
  fun: [
    "🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🍰", "🧁",
    "🍭", "🍬", "🍫", "🍩", "🍪", "🌈", "⭐", "🌟",
    "✨", "💫", "🔥", "💥", "💢", "💦", "💨", "🎵",
    "🎶", "🎤", "🎧", "🎮", "🎯", "🏆", "🥇", "🎪",
  ],
};

interface StickerPickerProps {
  onSelect: (sticker: string) => void;
}

export function StickerPicker({ onSelect }: StickerPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (sticker: string) => {
    onSelect(sticker);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Sticker className="w-5 h-5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" side="top" align="start">
        <Tabs defaultValue="emotions">
          <TabsList className="w-full grid grid-cols-4 h-8">
            <TabsTrigger value="emotions" className="text-xs">😀</TabsTrigger>
            <TabsTrigger value="animals" className="text-xs">🐶</TabsTrigger>
            <TabsTrigger value="love" className="text-xs">❤️</TabsTrigger>
            <TabsTrigger value="fun" className="text-xs">🎉</TabsTrigger>
          </TabsList>
          {Object.entries(STICKER_SETS).map(([key, stickers]) => (
            <TabsContent key={key} value={key} className="mt-2">
              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                {stickers.map((sticker, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(sticker)}
                    className="text-2xl p-1 rounded hover:bg-muted transition-colors"
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
