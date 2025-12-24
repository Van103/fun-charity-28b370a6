import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface SharedPostPreviewProps {
  sharedPostId: string;
}

interface SharedPost {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  media_urls: any[];
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const getAvatarGradient = (name: string) => {
  const gradients = [
    "from-purple-soft to-purple-light",
    "from-gold-champagne to-gold-light",
    "from-pink-400 to-rose-300",
    "from-sky-400 to-blue-300",
    "from-emerald-400 to-teal-300",
  ];
  const index = (name?.charCodeAt(0) || 0) % gradients.length;
  return gradients[index];
};

export function SharedPostPreview({ sharedPostId }: SharedPostPreviewProps) {
  const [sharedPost, setSharedPost] = useState<SharedPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSharedPost() {
      const { data: post } = await supabase
        .from("feed_posts")
        .select("id, user_id, title, content, media_urls, created_at")
        .eq("id", sharedPostId)
        .maybeSingle();

      if (post) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", post.user_id)
          .maybeSingle();

        setSharedPost({
          ...post,
          media_urls: (post.media_urls as any[]) || [],
          profiles: profile || undefined,
        });
      }
      setLoading(false);
    }

    fetchSharedPost();
  }, [sharedPostId]);

  if (loading) {
    return (
      <div className="border border-border rounded-xl p-4 bg-muted/30 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-2" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    );
  }

  if (!sharedPost) {
    return (
      <div className="border border-border rounded-xl p-4 bg-muted/30 text-muted-foreground text-sm">
        Bài viết không còn tồn tại
      </div>
    );
  }

  const userName = sharedPost.profiles?.full_name || "Người dùng";
  const timeAgo = formatDistanceToNow(new Date(sharedPost.created_at), {
    addSuffix: false,
    locale: vi,
  });

  // Parse media_urls
  const mediaUrls = (sharedPost.media_urls || []).map((item) => {
    if (typeof item === "string") {
      const isVideo = item.match(/\.(mp4|webm|mov)$/i);
      return { url: item, type: isVideo ? "video" : "image" };
    }
    return item as { url: string; type: string };
  });

  return (
    <Link
      to={`/social?post=${sharedPost.id}`}
      className="block border border-border rounded-xl overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      {/* Shared post header */}
      <div className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={sharedPost.profiles?.avatar_url || ""} />
            <AvatarFallback
              className={`bg-gradient-to-br ${getAvatarGradient(userName)} text-white text-xs font-semibold`}
            >
              {userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
      </div>

      {/* Shared post content */}
      {(sharedPost.title || sharedPost.content) && (
        <div className="px-3 pb-2">
          {sharedPost.title && (
            <p className="text-sm font-medium mb-1">{sharedPost.title}</p>
          )}
          {sharedPost.content && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {sharedPost.content}
            </p>
          )}
        </div>
      )}

      {/* Shared post media */}
      {mediaUrls.length > 0 && (
        <div className="relative">
          {mediaUrls[0].type === "video" ? (
            <video
              src={mediaUrls[0].url}
              className="w-full h-48 object-cover"
              muted
            />
          ) : (
            <img
              src={mediaUrls[0].url}
              alt=""
              className="w-full h-48 object-cover"
            />
          )}
          {mediaUrls.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              +{mediaUrls.length - 1}
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
