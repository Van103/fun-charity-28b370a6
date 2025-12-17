import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  MessageCircle,
  MapPin,
  Pencil,
  Trash2,
  Loader2,
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
import { EditFeedPostModal } from "./EditFeedPostModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SocialPostCardProps {
  post: FeedPost;
  highlightPostId?: string | null;
}

// Soft gradient backgrounds for letter avatars
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

export function SocialPostCard({ post, highlightPostId }: SocialPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle highlight and scroll
  useEffect(() => {
    if (highlightPostId === post.id && cardRef.current) {
      // Scroll into view
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        setIsHighlighted(true);
        // Remove highlight after 3 seconds
        setTimeout(() => setIsHighlighted(false), 3000);
      }, 100);
    }
  }, [highlightPostId, post.id]);

  // Fetch current user
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", data.user.id)
          .maybeSingle();
        setCurrentUserAvatar(profile?.avatar_url || null);
      }
    });
  }, []);

  const isOwnPost = currentUserId === post.user_id;

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

  const userName = post.profiles?.full_name || "Người dùng";

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("feed_posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast({ title: "Đã xóa bài viết" });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa bài viết",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card overflow-hidden transition-all duration-500 ${
        isHighlighted ? "ring-4 ring-primary/50 shadow-lg shadow-primary/20" : ""
      }`}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with gold ring - clickable to profile */}
            <Link 
              to={isOwnPost ? "/profile" : `/user/${post.user_id}`}
              className="p-0.5 rounded-full bg-gradient-to-br from-gold-champagne to-gold-light"
            >
              <Avatar className="w-11 h-11 border-2 border-card">
                <AvatarImage src={post.profiles?.avatar_url || ""} />
                <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(userName)} text-white font-semibold`}>
                  {userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link 
                  to={isOwnPost ? "/profile" : `/user/${post.user_id}`}
                  className="font-semibold text-foreground hover:underline"
                >
                  {userName}
                </Link>
                {post.profiles?.is_verified && (
                  <span className="text-primary text-sm">✓</span>
                )}
                {post.location && (
                  <>
                    <span className="text-muted-foreground text-sm">tại</span>
                    <span className="text-primary text-sm font-medium flex items-center gap-1 hover:underline cursor-pointer">
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
            {/* Earned amount badge - shows total gifts received */}
            <Badge variant="outline" className="bg-gold-champagne/10 text-gold-dark border-gold-champagne/30 gap-1 text-xs font-medium">
              +{(post.fulfilled_amount || 0).toLocaleString()}₫
            </Badge>
            
            {/* More options dropdown - only show for own posts */}
            {isOwnPost && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem 
                    className="gap-2 cursor-pointer"
                    onClick={() => setShowEditModal(true)}
                  >
                    <Pencil className="w-4 h-4" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa bài
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <div className="px-4 pb-2">
          <h3 className="font-semibold text-lg text-foreground">{post.title}</h3>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {post.content}
        </div>
      </div>

      {/* Media - Responsive size with click to open lightbox */}
      {mediaUrls.length > 0 && (
        <div className="relative">
          {mediaUrls.length === 1 ? (
            mediaUrls[0].type === "video" ? (
              <video
                src={mediaUrls[0].url}
                controls
                className="w-full max-h-[400px] object-cover"
              />
            ) : (
              <img
                src={mediaUrls[0].url}
                alt=""
                onClick={() => {
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }}
                className="w-full max-h-[400px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
              />
            )
          ) : (
            <div className={`grid gap-0.5 ${
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
                          : "aspect-square"
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
                          : "aspect-square"
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

      {/* Image Lightbox */}
      <ImageLightbox
        images={mediaUrls}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Stats */}
      <div className="px-4 py-3 flex items-center justify-between text-sm text-muted-foreground border-b border-border">
        <div className="flex items-center gap-1.5">
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
              <span className="text-base">❤️</span>
              <span className="text-base">😆</span>
            </div>
          )}
          <span className="text-xs hover:underline cursor-pointer">
            {(totalReactions || post.reactions_count || 0).toLocaleString()} người
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="hover:underline cursor-pointer">{(post.comments_count || 0).toLocaleString()} bình luận</span>
          <span className="hover:underline cursor-pointer">0 chia sẻ</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between">
        <FeedReactionPicker
          currentReaction={userReaction}
          onReact={(type) => addReaction.mutate(type)}
          onRemoveReaction={() => removeReaction.mutate()}
          isLoading={addReaction.isPending || removeReaction.isPending}
        />
        <Button 
          variant="ghost" 
          size="sm"
          className={`gap-2 text-sm rounded-lg flex-1 mx-1 ${showComments ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
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

      {/* Edit Post Modal */}
      {showEditModal && (
        <EditFeedPostModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          post={{
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            media_urls: mediaUrls,
          }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}