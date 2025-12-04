import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Share2, Send, MoreHorizontal, Trash2, Edit2, Copy, UserPlus, Image as ImageIcon, X } from "lucide-react";
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
import { ReactionPicker, ReactionDisplay, REACTIONS } from "./ReactionPicker";
import { StickerPicker } from "./StickerPicker";
import { EditPostModal } from "./EditPostModal";

interface MediaItem {
  url: string;
  type: string;
}

interface Comment {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  reactions?: { type: string; count: number }[];
  userReaction?: string | null;
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postReactions, setPostReactions] = useState<{ type: string; count: number }[]>([]);
  const [userPostReaction, setUserPostReaction] = useState<string | null>(null);
  const commentImageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get media items from media_urls or fallback to image_url
  const mediaItems: MediaItem[] = post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0
    ? post.media_urls as unknown as MediaItem[]
    : post.image_url
      ? [{ url: post.image_url, type: "image" }]
      : [];

  useEffect(() => {
    fetchPostReactions();
    fetchComments();
  }, [post.id]);

  const fetchPostReactions = async () => {
    const { data } = await supabase
      .from("post_reactions")
      .select("reaction_type, user_id")
      .eq("post_id", post.id);

    if (data) {
      // Count reactions by type
      const reactionCounts: Record<string, number> = {};
      data.forEach((r) => {
        reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
        if (r.user_id === currentUserId) {
          setUserPostReaction(r.reaction_type);
        }
      });
      
      setPostReactions(
        Object.entries(reactionCounts).map(([type, count]) => ({ type, count }))
      );
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

      // Fetch comment reactions
      const commentIds = commentsData.map((c) => c.id);
      const { data: reactionsData } = await supabase
        .from("comment_reactions")
        .select("comment_id, reaction_type, user_id")
        .in("comment_id", commentIds);

      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );

      const commentsWithProfiles = commentsData.map((comment) => {
        // Count reactions for this comment
        const commentReactions = (reactionsData || []).filter(r => r.comment_id === comment.id);
        const reactionCounts: Record<string, number> = {};
        let userReaction: string | null = null;
        
        commentReactions.forEach((r) => {
          reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
          if (r.user_id === currentUserId) {
            userReaction = r.reaction_type;
          }
        });

        return {
          ...comment,
          profiles: profilesMap.get(comment.user_id) || {
            full_name: null,
            avatar_url: null,
          },
          reactions: Object.entries(reactionCounts).map(([type, count]) => ({ type, count })),
          userReaction,
        };
      });

      setComments(commentsWithProfiles);
    } else {
      setComments([]);
    }
  };

  const handlePostReaction = async (reactionType: string) => {
    if (!currentUserId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để tương tác",
        variant: "destructive",
      });
      return;
    }

    try {
      if (userPostReaction === reactionType) {
        // Remove reaction
        await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId)
          .eq("reaction_type", reactionType);
        setUserPostReaction(null);
      } else {
        // Remove existing reaction first if any
        if (userPostReaction) {
          await supabase
            .from("post_reactions")
            .delete()
            .eq("post_id", post.id)
            .eq("user_id", currentUserId);
        }
        // Add new reaction
        await supabase.from("post_reactions").insert({
          post_id: post.id,
          user_id: currentUserId,
          reaction_type: reactionType,
        });
        setUserPostReaction(reactionType);
      }
      fetchPostReactions();
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  const handleCommentReaction = async (commentId: string, reactionType: string, currentReaction: string | null) => {
    if (!currentUserId) return;

    try {
      if (currentReaction === reactionType) {
        await supabase
          .from("comment_reactions")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", currentUserId)
          .eq("reaction_type", reactionType);
      } else {
        if (currentReaction) {
          await supabase
            .from("comment_reactions")
            .delete()
            .eq("comment_id", commentId)
            .eq("user_id", currentUserId);
        }
        await supabase.from("comment_reactions").insert({
          comment_id: commentId,
          user_id: currentUserId,
          reaction_type: reactionType,
        });
      }
      fetchComments();
    } catch (error) {
      console.error("Error toggling comment reaction:", error);
    }
  };

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCommentImage(file);
      setCommentImagePreview(URL.createObjectURL(file));
    }
  };

  const removeCommentImage = () => {
    if (commentImagePreview) {
      URL.revokeObjectURL(commentImagePreview);
    }
    setCommentImage(null);
    setCommentImagePreview(null);
  };

  const handleStickerSelect = (sticker: string) => {
    setNewComment((prev) => prev + sticker);
  };

  const handleComment = async () => {
    if (!newComment.trim() && !commentImage) return;
    if (!currentUserId) return;

    setIsSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (commentImage) {
        const fileExt = commentImage.name.split(".").pop();
        const filePath = `comments/${currentUserId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, commentImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("post_comments").insert({
        post_id: post.id,
        user_id: currentUserId,
        content: newComment.trim(),
        image_url: imageUrl,
      });

      if (error) throw error;

      setNewComment("");
      removeCommentImage();
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

  const totalReactions = postReactions.reduce((sum, r) => sum + r.count, 0);

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
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
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
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
          </div>
        )}

        {/* Media Grid */}
        {renderMediaGrid()}

        {/* Stats */}
        <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground border-b border-border">
          <div className="flex items-center gap-1">
            {postReactions.length > 0 && (
              <>
                <div className="flex -space-x-1">
                  {postReactions.slice(0, 3).map((r) => (
                    <span key={r.type} className="text-sm">
                      {REACTIONS.find(reaction => reaction.type === r.type)?.emoji}
                    </span>
                  ))}
                </div>
                <span>{totalReactions}</span>
              </>
            )}
          </div>
          <span>{comments.length} bình luận</span>
        </div>

        {/* Actions */}
        <div className="flex items-center border-b border-border">
          <ReactionPicker
            onReact={handlePostReaction}
            currentReaction={userPostReaction}
            reactions={postReactions}
            disabled={!currentUserId}
          />
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
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={comment.profiles?.avatar_url || ""} />
                  <AvatarFallback className="text-xs bg-secondary/20 text-secondary">
                    {comment.profiles?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="bg-muted/50 rounded-2xl p-3">
                    <span className="font-semibold text-sm block">
                      {comment.profiles?.full_name || "Người dùng"}
                    </span>
                    <p className="text-sm text-foreground">{comment.content}</p>
                    {comment.image_url && (
                      <img 
                        src={comment.image_url} 
                        alt="Comment" 
                        className="mt-2 rounded-lg max-h-48 object-cover cursor-pointer"
                        onClick={() => window.open(comment.image_url!, '_blank')}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4 px-2">
                    <ReactionDisplay
                      reactions={comment.reactions || []}
                      currentReaction={comment.userReaction}
                      onReact={(type) => handleCommentReaction(comment.id, type, comment.userReaction || null)}
                      disabled={!currentUserId}
                    />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { locale: vi })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* New Comment Input */}
            {currentUserId && (
              <div className="space-y-2">
                {commentImagePreview && (
                  <div className="relative inline-block">
                    <img 
                      src={commentImagePreview} 
                      alt="Preview" 
                      className="max-h-32 rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6"
                      onClick={removeCommentImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Viết bình luận..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[40px] resize-none text-sm pr-20"
                      rows={1}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <input
                        type="file"
                        ref={commentImageInputRef}
                        accept="image/*,image/gif"
                        onChange={handleCommentImageSelect}
                        className="hidden"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => commentImageInputRef.current?.click()}
                      >
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <StickerPicker onSelect={handleStickerSelect} />
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="gold"
                    onClick={handleComment}
                    disabled={(!newComment.trim() && !commentImage) || isSubmitting}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Post Modal */}
      <EditPostModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        post={post}
        onSaved={() => onUpdate?.()}
      />

      {/* Full screen media viewer */}
      <Dialog open={selectedMediaIndex !== null} onOpenChange={() => setSelectedMediaIndex(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black border-none">
          {selectedMediaIndex !== null && mediaItems[selectedMediaIndex] && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setSelectedMediaIndex(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              
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
