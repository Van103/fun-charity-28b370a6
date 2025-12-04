import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Trash2, Edit2, X, Check, Copy, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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
  onUpdate?: () => void;
}

export function PostCard({ post, currentUserId, onDelete, onUpdate }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Get media items from media_urls or fallback to image_url
  const mediaItems: MediaItem[] = post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0
    ? post.media_urls as unknown as MediaItem[]
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

  const handleEdit = async () => {
    if (!editContent.trim() && mediaItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ content: editContent.trim() })
        .eq("id", post.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã cập nhật bài viết",
      });
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật bài viết",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareToProfile = async () => {
    if (!currentUserId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để chia sẻ",
        variant: "destructive",
      });
      return;
    }

    try {
      const shareContent = `Chia sẻ từ ${post.profiles?.full_name || "Người dùng"}:\n\n${post.content || ""}`;
      
      const { error } = await supabase.from("posts").insert([{
        user_id: currentUserId,
        content: shareContent,
        media_urls: mediaItems.length > 0 ? JSON.parse(JSON.stringify(mediaItems)) : null,
        image_url: post.image_url,
      }]);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã chia sẻ lên trang cá nhân",
      });
      onUpdate?.();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể chia sẻ bài viết",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/profile?post=${post.id}`;
    navigator.clipboard.writeText(postUrl);
    toast({
      title: "Đã sao chép",
      description: "Đường dẫn bài viết đã được sao chép",
    });
  };

  const handleSendMessage = () => {
    toast({
      title: "Tính năng đang phát triển",
      description: "Chức năng gửi tin nhắn sẽ sớm được cập nhật",
    });
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: vi,
  });

  // Facebook-style grid layout for media
  const renderMediaGrid = () => {
    if (mediaItems.length === 0) return null;

    if (mediaItems.length === 1) {
      const item = mediaItems[0];
      return (
        <div 
          className="w-full cursor-pointer"
          onClick={() => setSelectedMediaIndex(0)}
        >
          {item.type === "video" ? (
            <video src={item.url} className="w-full max-h-[600px] object-contain bg-black" controls />
          ) : (
            <img src={item.url} alt="Post" className="w-full max-h-[600px] object-contain bg-muted" />
          )}
        </div>
      );
    }

    if (mediaItems.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1">
          {mediaItems.map((item, index) => (
            <div 
              key={index} 
              className="aspect-square cursor-pointer overflow-hidden"
              onClick={() => setSelectedMediaIndex(index)}
            >
              {item.type === "video" ? (
                <video src={item.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={item.url} alt={`Media ${index + 1}`} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      );
    }

    if (mediaItems.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1">
          <div 
            className="row-span-2 cursor-pointer overflow-hidden"
            onClick={() => setSelectedMediaIndex(0)}
          >
            {mediaItems[0].type === "video" ? (
              <video src={mediaItems[0].url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={mediaItems[0].url} alt="Media 1" className="w-full h-full object-cover" />
            )}
          </div>
          {mediaItems.slice(1).map((item, index) => (
            <div 
              key={index + 1} 
              className="aspect-square cursor-pointer overflow-hidden"
              onClick={() => setSelectedMediaIndex(index + 1)}
            >
              {item.type === "video" ? (
                <video src={item.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={item.url} alt={`Media ${index + 2}`} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      );
    }

    if (mediaItems.length === 4) {
      return (
        <div className="grid grid-cols-2 gap-1">
          {mediaItems.map((item, index) => (
            <div 
              key={index} 
              className="aspect-square cursor-pointer overflow-hidden"
              onClick={() => setSelectedMediaIndex(index)}
            >
              {item.type === "video" ? (
                <video src={item.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={item.url} alt={`Media ${index + 1}`} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      );
    }

    // 5+ images
    return (
      <div className="grid grid-cols-2 gap-1">
        {mediaItems.slice(0, 4).map((item, index) => (
          <div 
            key={index} 
            className="aspect-square cursor-pointer overflow-hidden relative"
            onClick={() => setSelectedMediaIndex(index)}
          >
            {item.type === "video" ? (
              <video src={item.url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={item.url} alt={`Media ${index + 1}`} className="w-full h-full object-cover" />
            )}
            {index === 3 && mediaItems.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{mediaItems.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
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
                <DropdownMenuItem onClick={() => {
                  setEditContent(post.content || "");
                  setIsEditing(true);
                }}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Chỉnh sửa bài viết
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
        {isEditing ? (
          <div className="px-4 pb-3 space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] resize-none"
              placeholder="Nội dung bài viết..."
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-1" />
                Hủy
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={handleEdit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Lưu
              </Button>
            </div>
          </div>
        ) : (
          post.content && (
            <div className="px-4 pb-3">
              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
            </div>
          )
        )}

        {/* Media Grid */}
        {renderMediaGrid()}

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex-1 rounded-none">
                <Share2 className="w-5 h-5 mr-2" />
                Chia sẻ
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleShareToProfile}>
                <UserPlus className="w-4 h-4 mr-2" />
                Chia sẻ lên trang cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendMessage}>
                <Send className="w-4 h-4 mr-2" />
                Gửi qua tin nhắn
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="w-4 h-4 mr-2" />
                Sao chép liên kết
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Full screen media viewer */}
      <Dialog open={selectedMediaIndex !== null} onOpenChange={() => setSelectedMediaIndex(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black border-none">
          {selectedMediaIndex !== null && mediaItems[selectedMediaIndex] && (
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setSelectedMediaIndex(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              
              {/* Media display */}
              <div className="flex items-center justify-center min-h-[50vh] max-h-[90vh]">
                {mediaItems[selectedMediaIndex].type === "video" ? (
                  <video
                    src={mediaItems[selectedMediaIndex].url}
                    className="max-w-full max-h-[90vh] object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <img
                    src={mediaItems[selectedMediaIndex].url}
                    alt="Full view"
                    className="max-w-full max-h-[90vh] object-contain"
                  />
                )}
              </div>

              {/* Navigation for multiple media */}
              {mediaItems.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={() => setSelectedMediaIndex((prev) => 
                      prev !== null ? (prev - 1 + mediaItems.length) % mediaItems.length : 0
                    )}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={() => setSelectedMediaIndex((prev) => 
                      prev !== null ? (prev + 1) % mediaItems.length : 0
                    )}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                  
                  {/* Thumbnails */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/60 rounded-lg">
                    {mediaItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedMediaIndex(index)}
                        className={`w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                          index === selectedMediaIndex ? "border-secondary" : "border-transparent"
                        }`}
                      >
                        {item.type === "video" ? (
                          <video src={item.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={item.url} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
