import { Settings2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCursor, CURSOR_OPTIONS, CursorType } from '@/contexts/CursorContext';
import { cn } from '@/lib/utils';

const CursorSettings = () => {
  const { cursorType, setCursorType, particlesEnabled, setParticlesEnabled } = useCursor();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-primary/90 text-primary-foreground hover:bg-primary shadow-lg hover:shadow-xl transition-all duration-300"
          title="Cài đặt con trỏ"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="end" 
        className="w-72 p-4 bg-card/95 backdrop-blur-xl border-border/50"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Settings2 className="h-4 w-4 text-secondary" />
            <h3 className="font-semibold text-sm">Tùy chỉnh con trỏ</h3>
          </div>

          {/* Cursor Options Grid */}
          <div className="grid grid-cols-4 gap-2">
            {CURSOR_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setCursorType(option.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200",
                  "hover:bg-muted/50 border-2",
                  cursorType === option.id 
                    ? "border-secondary bg-secondary/10" 
                    : "border-transparent"
                )}
                title={option.nameVi}
              >
                {option.id === 'default' ? (
                  <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                      <path d="M4 4l7 19 2-7 7-2z"/>
                    </svg>
                  </div>
                ) : (
                  <img 
                    src={`${option.cursor}?v=${Date.now()}`} 
                    alt={option.nameVi} 
                    className="w-8 h-8 object-contain"
                  />
                )}
                <span className="text-[10px] mt-1 text-muted-foreground truncate w-full text-center">
                  {option.nameVi}
                </span>
                {cursorType === option.id && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Particles Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-secondary" />
              <Label htmlFor="particles" className="text-sm">
                Hiệu ứng lấp lánh
              </Label>
            </div>
            <Switch
              id="particles"
              checked={particlesEnabled}
              onCheckedChange={setParticlesEnabled}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Chọn kiểu con trỏ và bật/tắt hiệu ứng hạt khi di chuyển chuột.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CursorSettings;
