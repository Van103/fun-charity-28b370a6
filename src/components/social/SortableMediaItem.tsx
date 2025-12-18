import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { X, GripVertical, Sparkles, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatBytes, UploadProgress } from "@/lib/media";

interface SortableMediaItemProps {
  id: string;
  preview: string;
  isVideo: boolean;
  isAiGenerated?: boolean;
  onRemove: () => void;
  onCancelUpload?: () => void;
  disabled?: boolean;
  uploadProgress?: UploadProgress | null;
  isCompressing?: boolean;
  compressionProgress?: number;
}

export function SortableMediaItem({
  id,
  preview,
  isVideo,
  isAiGenerated,
  onRemove,
  onCancelUpload,
  disabled,
  uploadProgress,
  isCompressing,
  compressionProgress,
}: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const isUploading = uploadProgress && uploadProgress.percentage < 100;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square rounded-xl overflow-hidden bg-muted border ${
        isAiGenerated ? "border-2 border-primary/50" : "border-border"
      } ${isDragging ? "ring-2 ring-primary shadow-lg" : ""}`}
    >
      {/* Media content */}
      {isVideo ? (
        <video
          src={preview}
          controls
          className="w-full h-full object-cover bg-black"
        />
      ) : (
        <img src={preview} alt="" className="w-full h-full object-cover" />
      )}

      {/* AI badge */}
      {isAiGenerated && (
        <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
          <Sparkles className="w-3 h-3" />
          AI
        </div>
      )}

      {/* Drag handle */}
      {!disabled && !isUploading && !isCompressing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 bg-black/60 text-white rounded-lg cursor-grab active:cursor-grabbing hover:bg-black/80 transition-colors z-10"
          style={{ touchAction: "none" }}
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Remove button */}
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 rounded-full shadow-lg z-10"
        onClick={onRemove}
        disabled={disabled || isUploading || isCompressing}
      >
        <X className="w-3 h-3" />
      </Button>

      {/* Compression overlay */}
      {isCompressing && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 z-20">
          <div className="text-white text-xs font-medium">Đang nén video...</div>
          <Progress value={compressionProgress} className="w-3/4 h-2" />
          <div className="text-white/80 text-xs">{compressionProgress}%</div>
        </div>
      )}

      {/* Upload progress overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 z-20">
          <div className="text-white text-xs font-medium">Đang tải lên...</div>
          <Progress value={uploadProgress.percentage} className="w-3/4 h-2" />
          <div className="text-white/80 text-xs">
            {uploadProgress.percentage}% • {formatBytes(uploadProgress.speed)}/s
          </div>
          {uploadProgress.remainingTime > 0 && (
            <div className="text-white/60 text-xs">
              Còn ~{formatTime(uploadProgress.remainingTime)}
            </div>
          )}
          {/* Cancel button */}
          {onCancelUpload && (
            <Button
              variant="destructive"
              size="sm"
              className="mt-2 h-7 text-xs gap-1"
              onClick={onCancelUpload}
            >
              <XCircle className="w-3 h-3" />
              Hủy upload
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
