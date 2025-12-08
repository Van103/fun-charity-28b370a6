import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  MessageCircle,
  Share2,
  Gift,
  Image as ImageIcon,
  Smile,
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

interface SocialPostCardProps {
  post: FeedPost;
}

export function SocialPostCard({ post }: SocialPostCardProps) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");

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

      {/* Media */}
      {mediaUrls.length > 0 && (
        <div className="relative">
          {mediaUrls.length === 1 ? (
            mediaUrls[0].type === "video" ? (
              <video
                src={mediaUrls[0].url}
                controls
                className="w-full max-h-[500px] object-cover"
              />
            ) : (
              <img
                src={mediaUrls[0].url}
                alt=""
                className="w-full max-h-[500px] object-cover"
              />
            )
          ) : (
            <div className={`grid gap-1 ${
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
                      className="w-full h-full object-cover aspect-square"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt=""
                      className="w-full h-full object-cover aspect-square"
                    />
                  )}
                  {i === 3 && mediaUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
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
          className="flex-1 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowCommentInput(!showCommentInput)}
        >
          <MessageCircle className="w-5 h-5" />
          Bình luận
        </Button>
        <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:text-foreground">
          <Gift className="w-5 h-5" />
          Tặng
        </Button>
        <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:text-foreground">
          <Share2 className="w-5 h-5" />
          Chia sẻ
        </Button>
      </div>

      {/* Comments Section */}
      {showCommentInput && (
        <div className="px-4 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>Xem thêm bình luận</span>
          </div>

          {/* Comment input */}
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-secondary/20 text-xs">U</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-3 py-2">
              <Input
                placeholder="Viết bình luận..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="border-none bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
              />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Smile className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Gift className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
