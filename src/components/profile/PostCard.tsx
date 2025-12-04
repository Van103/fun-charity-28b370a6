import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MediaItem {
  url: string;
  type: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string | null;
    image_url: string | null;
    media_urls?: MediaItem[] | null;
    created_at: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  currentUserId: string | null;
  onDelete: () => void;
}

export function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const { toast } = useToast();

  // Get media items from media_urls or fallback to image_url
  const mediaItems: MediaItem[] = post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0
    ? post.media_urls
    : post.image_url
      ? [{ url: post.image_url, type: "image" }]
      : [];

  useEffect(() => {
    fetchLikes();
    fetchComments();
  }, [post.id]);

  const fetchLikes = async () => {
    const { count } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    setLikesCount(count || 0);

    if (currentUserId) {
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", currentUserId)
        .maybeSingle();

      setLiked(!!data);
    }
  };

  const fetchComments = async () => {
    const { data: commentsData } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    if (commentsData && commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );

      const commentsWithProfiles = commentsData.map((comment) => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || {
          full_name: null,
          avatar_url: null,
        },
      }));

      setComments(commentsWithProfiles);
    } else {
      setComments([]);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để thích bài viết",
        variant: "destructive",
      });
      return;
    }

    try {
      if (liked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
        setLikesCount((prev) => prev - 1);
      } else {
        await supabase.from("post_likes").insert({
          post_id: post.id,
          user_id: currentUserId,
        });
        setLikesCount((prev) => prev + 1);
      }
      setLiked(!liked);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: post.id,
        user_id: currentUserId,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      fetchComments();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể gửi bình luận",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã xóa bài viết",
      });
      onDelete();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài viết",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Đã sao chép",
      description: "Đường dẫn đã được sao chép vào clipboard",
    });
  };

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.profiles?.avatar_url || ""} />
            <AvatarFallback className="bg-secondary/20 text-secondary">
              {post.profiles?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-foreground">
              {post.profiles?.full_name || "Người dùng"}
            </h4>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        {currentUserId === post.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa bài viết
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Media Carousel */}
      {mediaItems.length > 0 && (
        <div className="relative w-full">
          {mediaItems[currentMediaIndex].type === "video" ? (
            <video
              src={mediaItems[currentMediaIndex].url}
              className="w-full object-cover max-h-[500px]"
              controls
            />
          ) : (
            <img
              src={mediaItems[currentMediaIndex].url}
              alt="Post"
              className="w-full object-cover max-h-[500px]"
            />
          )}
          
          {/* Navigation arrows */}
          {mediaItems.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={prevMedia}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={nextMedia}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              
              {/* Dots indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {mediaItems.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentMediaIndex ? "bg-white" : "bg-white/50"
                    }`}
                    onClick={() => setCurrentMediaIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground border-b border-border">
        <span>{likesCount} lượt thích</span>
        <span>{comments.length} bình luận</span>
      </div>

      {/* Actions */}
      <div className="flex items-center border-b border-border">
        <Button
          variant="ghost"
          className={`flex-1 rounded-none ${liked ? "text-red-500" : ""}`}
          onClick={handleLike}
        >
          <Heart className={`w-5 h-5 mr-2 ${liked ? "fill-current" : ""}`} />
          Thích
        </Button>
        <Button
          variant="ghost"
          className="flex-1 rounded-none"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Bình luận
        </Button>
        <Button variant="ghost" className="flex-1 rounded-none" onClick={handleShare}>
          <Share2 className="w-5 h-5 mr-2" />
          Chia sẻ
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="p-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.profiles?.avatar_url || ""} />
                <AvatarFallback className="text-xs bg-secondary/20 text-secondary">
                  {comment.profiles?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted/50 rounded-lg p-2">
                <span className="font-semibold text-sm">
                  {comment.profiles?.full_name || "Người dùng"}
                </span>
                <p className="text-sm text-foreground">{comment.content}</p>
              </div>
            </div>
          ))}

          {currentUserId && (
            <div className="flex gap-2">
              <Textarea
                placeholder="Viết bình luận..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[40px] resize-none text-sm"
                rows={1}
              />
              <Button
                size="icon"
                variant="gold"
                onClick={handleComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
