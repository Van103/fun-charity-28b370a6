import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MediaItem {
  url: string;
  type: string;
}

interface PhotosTabProps {
  userId: string | null;
}

export function PhotosTab({ userId }: PhotosTabProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchMedia();
    }
  }, [userId]);

  const fetchMedia = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("image_url, media_urls")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const allMedia: MediaItem[] = [];
      
      data.forEach((post) => {
        // Check media_urls first (new format)
        if (post.media_urls && Array.isArray(post.media_urls)) {
          (post.media_urls as unknown as MediaItem[]).forEach((item) => {
            if (item && item.url) {
              allMedia.push(item);
            }
          });
        }
        // Fallback to image_url (old format)
        else if (post.image_url) {
          allMedia.push({ url: post.image_url, type: "image" });
        }
      });
      
      setMedia(allMedia);
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary" />
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Chưa có hình ảnh/video</h3>
        <p className="text-muted-foreground">
          Các hình ảnh và video từ bài viết sẽ xuất hiện ở đây
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {media.map((item, index) => (
        <Dialog key={index}>
          <DialogTrigger asChild>
            <div className="aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted hover:opacity-90 transition-opacity relative">
              {item.type === "video" ? (
                <>
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-foreground fill-current ml-1" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={item.url}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
            {item.type === "video" ? (
              <video
                src={item.url}
                className="w-full h-auto max-h-[90vh] rounded-lg"
                controls
                autoPlay
              />
            ) : (
              <img
                src={item.url}
                alt={`Media ${index + 1}`}
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
