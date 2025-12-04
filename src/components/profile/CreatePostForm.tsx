import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, X, Send, Video } from "lucide-react";

interface MediaItem {
  file: File;
  preview: string;
  type: "image" | "video";
}

interface CreatePostFormProps {
  profile: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  onPostCreated: () => void;
}

export function CreatePostForm({ profile, onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: MediaItem[] = [];
    
    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      
      if (!isImage && !isVideo) return;
      
      const preview = URL.createObjectURL(file);
      newItems.push({
        file,
        preview,
        type: isVideo ? "video" : "image",
      });
    });

    setMediaItems((prev) => [...prev, ...newItems]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeMedia = (index: number) => {
    setMediaItems((prev) => {
      const item = prev[index];
      URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaItems.length === 0) return;
    if (!profile?.user_id) return;

    setIsSubmitting(true);
    try {
      const uploadedMedia: { url: string; type: string }[] = [];

      // Upload all media files
      for (const item of mediaItems) {
        const fileExt = item.file.name.split(".").pop();
        const filePath = `${profile.user_id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

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

      const { error } = await supabase.from("posts").insert({
        user_id: profile.user_id,
        content: content.trim() || null,
        image_url: uploadedMedia.length > 0 ? uploadedMedia[0].url : null,
        media_urls: uploadedMedia,
      });

      if (error) throw error;

      // Clean up previews
      mediaItems.forEach((item) => URL.revokeObjectURL(item.preview));
      
      setContent("");
      setMediaItems([]);
      onPostCreated();

      toast({
        title: "Thành công",
        description: "Bài viết đã được đăng",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể đăng bài viết",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className="bg-secondary/20 text-secondary">
            {profile?.full_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Bạn đang nghĩ gì?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none border-none bg-muted/50 focus-visible:ring-1 focus-visible:ring-secondary"
          />
        </div>
      </div>

      {/* Media Previews */}
      {mediaItems.length > 0 && (
        <div className={`grid gap-2 ${mediaItems.length === 1 ? 'grid-cols-1' : mediaItems.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {mediaItems.map((item, index) => (
            <div key={index} className="relative aspect-square">
              {item.type === "video" ? (
                <video
                  src={item.preview}
                  className="w-full h-full object-cover rounded-lg"
                  controls
                />
              ) : (
                <img
                  src={item.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 w-7 h-7"
                onClick={() => removeMedia(index)}
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

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
            multiple
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-secondary"
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Ảnh/Video
          </Button>
        </div>
        <Button
          variant="gold"
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting || (!content.trim() && mediaItems.length === 0)}
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Đăng
        </Button>
      </div>
    </div>
  );
}
