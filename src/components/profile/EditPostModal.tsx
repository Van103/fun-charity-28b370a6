import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, X, Video, Plus } from "lucide-react";

interface MediaItem {
  url: string;
  type: string;
}

interface EditPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    user_id: string;
    content: string | null;
    media_urls?: MediaItem[] | null;
    image_url?: string | null;
  };
  onSaved: () => void;
}

export function EditPostModal({ open, onOpenChange, post, onSaved }: EditPostModalProps) {
  const [content, setContent] = useState(post.content || "");
  const [existingMedia, setExistingMedia] = useState<MediaItem[]>(() => {
    if (post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0) {
      return post.media_urls as unknown as MediaItem[];
    }
    if (post.image_url) {
      return [{ url: post.image_url, type: "image" }];
    }
    return [];
  });
  const [newMediaFiles, setNewMediaFiles] = useState<{ file: File; preview: string; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      
      if (!isImage && !isVideo) return;
      
      const preview = URL.createObjectURL(file);
      setNewMediaFiles((prev) => [...prev, {
        file,
        preview,
        type: isVideo ? "video" : "image",
      }]);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewMedia = (index: number) => {
    setNewMediaFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const uploadedMedia: MediaItem[] = [...existingMedia];

      // Upload new media files
      for (const item of newMediaFiles) {
        const fileExt = item.file.name.split(".").pop();
        const filePath = `${post.user_id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, item.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);

        uploadedMedia.push({
          url: publicUrl,
          type: item.type,
        });
      }

      const { error } = await supabase
        .from("posts")
        .update({
          content: content.trim() || null,
          media_urls: JSON.parse(JSON.stringify(uploadedMedia)),
          image_url: uploadedMedia.length > 0 ? uploadedMedia[0].url : null,
        })
        .eq("id", post.id);

      if (error) throw error;

      // Clean up previews
      newMediaFiles.forEach((item) => URL.revokeObjectURL(item.preview));

      toast({
        title: "Thành công",
        description: "Đã cập nhật bài viết",
      });
      
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật bài viết",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allMedia = [
    ...existingMedia.map((m, i) => ({ ...m, isNew: false, index: i })),
    ...newMediaFiles.map((m, i) => ({ url: m.preview, type: m.type, isNew: true, index: i })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì?"
            className="min-h-[120px] resize-none"
          />

          {/* Media Grid */}
          {allMedia.length > 0 && (
            <div className={`grid gap-2 ${allMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {allMedia.map((item, i) => (
                <div key={i} className="relative aspect-square">
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover rounded-lg"
                      controls
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={`Media ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 w-7 h-7"
                    onClick={() => item.isNew 
                      ? removeNewMedia(item.index) 
                      : removeExistingMedia(item.index)
                    }
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {item.type === "video" && (
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Video
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Media Button */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              className="hidden"
              multiple
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              <ImageIcon className="w-4 h-4" />
              Thêm ảnh/video
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              variant="gold"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
