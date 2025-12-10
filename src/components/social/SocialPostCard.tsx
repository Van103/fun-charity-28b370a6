import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  MessageCircle,
  Coins,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { FeedPost } from "@/hooks/useFeedPosts";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { FeedReactionPicker, REACTIONS } from "./FeedReactionPicker";
import { usePostReactions } from "@/hooks/useFeedReactions";
import { FeedComments } from "./FeedComments";
import { SharePopover } from "./SharePopover";
import { GiftDonateModal } from "./GiftDonateModal";
import { ImageLightbox } from "./ImageLightbox";
import { supabase } from "@/integrations/supabase/client";

interface SocialPostCardProps {
  post: FeedPost;
}

export function SocialPostCard({ post }: SocialPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Fetch current user avatar
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", data.user.id)
          .maybeSingle();
        setCurrentUserAvatar(profile?.avatar_url || null);
      }
    });
  }, []);

  // Reactions hook
  const {
    userReaction,
    reactionCounts,
    totalReactions,
    addReaction,
    removeReaction,
  } = usePostReactions(post.id);

  // Get top 3 reaction types for display
  const topReactions = Object.entries(reactionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => REACTIONS.find((r) => r.type === type))
    .filter(Boolean);

  // Parse media_urls - handle both string[] and {url, type}[] formats
  const mediaUrls = (post.media_urls || []).map((item) => {
    if (typeof item === 'string') {
      const isVideo = item.match(/\.(mp4|webm|mov)$/i);
      return { url: item, type: isVideo ? 'video' : 'image' };
    }
    return item as { url: string; type: string };
  });

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { 
    addSuffix: false, 
    locale: vi 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-secondary/30">
              <AvatarImage src={post.profiles?.avatar_url || ""} />
              <AvatarFallback className="bg-secondary/20">
                {post.profiles?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {post.profiles?.full_name || "Người dùng"}
                </span>
                {post.profiles?.is_verified && (
                  <CheckCircle className="w-4 h-4 text-secondary fill-secondary/20" />
                )}
                {post.location && (
                  <>
                    <span className="text-muted-foreground text-sm">tại</span>
                    <span className="text-secondary text-sm font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.location}
                    </span>
                  </>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {post.target_amount && post.target_amount > 0 && (
              <Badge variant="outline" className="text-secondary border-secondary/30 gap-1">
                <Coins className="w-3 h-3" />
                {post.target_amount.toLocaleString()} ₫
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <div className="px-4 pb-2">
          <h3 className="font-semibold text-lg">{post.title}</h3>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {post.content}
        </div>
      </div>

      {/* Media - Responsive size with click to open lightbox */}
      {mediaUrls.length > 0 && (
        <div className="relative px-4 pb-3">
          {mediaUrls.length === 1 ? (
            mediaUrls[0].type === "video" ? (
              <video
                src={mediaUrls[0].url}
                controls
                className="w-full max-h-[200px] sm:max-h-[250px] md:max-h-[300px] lg:max-h-[350px] object-cover rounded-xl"
              />
            ) : (
              <img
                src={mediaUrls[0].url}
                alt=""
                onClick={() => {
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }}
                className="w-full max-h-[200px] sm:max-h-[250px] md:max-h-[300px] lg:max-h-[350px] object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
              />
            )
          ) : (
            <div className={`grid gap-1 rounded-xl overflow-hidden ${
              mediaUrls.length === 2 ? "grid-cols-2" :
              mediaUrls.length === 3 ? "grid-cols-2" :
              "grid-cols-2"
            }`}>
              {mediaUrls.slice(0, 4).map((item, i) => (
                <div 
                  key={i}
                  className={`relative ${
                    mediaUrls.length === 3 && i === 0 ? "row-span-2" : ""
                  }`}
                >
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      className={`w-full object-cover ${
                        mediaUrls.length === 3 && i === 0 
                          ? "h-full" 
                          : "aspect-square max-h-[100px] sm:max-h-[120px] md:max-h-[150px]"
                      }`}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt=""
                      onClick={() => {
                        setLightboxIndex(i);
                        setLightboxOpen(true);
                      }}
                      className={`w-full object-cover cursor-pointer hover:opacity-95 transition-opacity ${
                        mediaUrls.length === 3 && i === 0 
                          ? "h-full" 
                          : "aspect-square max-h-[100px] sm:max-h-[120px] md:max-h-[150px]"
                      }`}
                    />
                  )}
                  {i === 3 && mediaUrls.length > 4 && (
                    <div 
                      className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        setLightboxIndex(3);
                        setLightboxOpen(true);
                      }}
                    >
                      <span className="text-white text-lg sm:text-xl font-bold">
                        +{mediaUrls.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={mediaUrls}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          {topReactions.length > 0 ? (
            <div className="flex -space-x-1">
              {topReactions.map((reaction) => (
                <motion.span
                  key={reaction?.type}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-base"
                >
                  {reaction?.emoji}
                </motion.span>
              ))}
            </div>
          ) : (
            <div className="flex -space-x-1">
              <span className="text-base">👍</span>
            </div>
          )}
          <span>{totalReactions || post.reactions_count || 0} người đã bày tỏ cảm xúc</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{post.comments_count || 0} Bình luận</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-around gap-1">
        <FeedReactionPicker
          currentReaction={userReaction}
          onReact={(type) => addReaction.mutate(type)}
          onRemoveReaction={() => removeReaction.mutate()}
          isLoading={addReaction.isPending || removeReaction.isPending}
        />
        <Button 
          variant="ghost" 
          className={`flex-1 gap-2 ${showComments ? "text-secondary" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-5 h-5" />
          Bình luận
        </Button>
        <GiftDonateModal post={post} />
        <SharePopover post={post} currentUserAvatar={currentUserAvatar} />
      </div>

      {/* Comments Section */}
      {showComments && (
        <FeedComments postId={post.id} currentUserAvatar={currentUserAvatar} />
      )}
    </motion.div>
  );
}
