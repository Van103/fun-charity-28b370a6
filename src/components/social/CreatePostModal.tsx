import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Image, 
  Video, 
  X, 
  Loader2, 
  Send, 
  MapPin, 
  HandHeart, 
  Gift, 
  MessageSquare,
  AlertTriangle,
  Users,
  Coins
} from "lucide-react";
import { useCreateFeedPost, FeedPostType, UrgencyLevel } from "@/hooks/useFeedPosts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const postTypeConfig: Record<FeedPostType, { label: string; icon: React.ElementType; color: string; description: string }> = {
  need: { 
    label: "Cần Hỗ Trợ", 
    icon: HandHeart, 
    color: "text-destructive",
    description: "Đăng nhu cầu cần được hỗ trợ từ cộng đồng"
  },
  supply: { 
    label: "Sẵn Sàng Cho", 
    icon: Gift, 
    color: "text-success",
    description: "Chia sẻ nguồn lực bạn có thể đóng góp"
  },
  story: { 
    label: "Câu Chuyện", 
    icon: MessageSquare, 
    color: "text-secondary",
    description: "Chia sẻ câu chuyện, cập nhật từ thiện"
  },
  update: { 
    label: "Cập Nhật", 
    icon: MessageSquare, 
    color: "text-primary",
    description: "Cập nhật tiến độ chiến dịch"
  },
};

const categoryConfig = [
  { value: "education", label: "Giáo dục", emoji: "📚" },
  { value: "healthcare", label: "Y tế", emoji: "🏥" },
  { value: "disaster_relief", label: "Cứu trợ thiên tai", emoji: "🆘" },
  { value: "poverty", label: "Xóa đói giảm nghèo", emoji: "🏠" },
  { value: "environment", label: "Môi trường", emoji: "🌱" },
  { value: "animal_welfare", label: "Động vật", emoji: "🐾" },
  { value: "community", label: "Cộng đồng", emoji: "🤝" },
  { value: "other", label: "Khác", emoji: "💫" },
];

const urgencyConfig: Record<UrgencyLevel, { label: string; color: string }> = {
  low: { label: "Thấp", color: "bg-muted text-muted-foreground" },
  medium: { label: "Trung bình", color: "bg-yellow-500/20 text-yellow-600" },
  high: { label: "Cao", color: "bg-orange-500/20 text-orange-600" },
  critical: { label: "Khẩn cấp", color: "bg-destructive/20 text-destructive" },
};

export function CreatePostModal({ open, onOpenChange, profile }: CreatePostModalProps) {
  const [postType, setPostType] = useState<FeedPostType>("story");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("medium");
  const [targetAmount, setTargetAmount] = useState("");
  const [beneficiariesCount, setBeneficiariesCount] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const createPost = useCreateFeedPost();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File quá lớn",
          description: `${file.name} vượt quá 20MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setMediaFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of mediaFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `feed/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const resetForm = () => {
    setPostType("story");
    setTitle("");
    setContent("");
    setLocation("");
    setCategory("");
    setUrgency("medium");
    setTargetAmount("");
    setBeneficiariesCount("");
    setMediaFiles([]);
    setMediaPreviews([]);
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      toast({
        title: "Nội dung trống",
        description: "Vui lòng nhập nội dung hoặc thêm hình ảnh",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        mediaUrls = await uploadFiles();
      }

      await createPost.mutateAsync({
        post_type: postType,
        title: title.trim() || undefined,
        content: content.trim(),
        media_urls: mediaUrls,
        location: location.trim() || undefined,
        category: category || undefined,
        urgency: postType === "need" ? urgency : undefined,
        target_amount: targetAmount ? parseInt(targetAmount) : undefined,
        beneficiaries_count: beneficiariesCount ? parseInt(beneficiariesCount) : undefined,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = isUploading || createPost.isPending;
  const showNeedFields = postType === "need";
  const showSupplyFields = postType === "supply";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="gradient-text">Tạo bài viết mới</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-secondary/30">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-secondary/20">
                {profile?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile?.full_name || "Người dùng"}</p>
              <p className="text-sm text-muted-foreground">Đăng công khai</p>
            </div>
          </div>

          {/* Post Type Selection */}
          <div className="space-y-2">
            <Label>Loại bài viết</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.entries(postTypeConfig) as [FeedPostType, typeof postTypeConfig[FeedPostType]][]).map(([type, config]) => {
                const Icon = config.icon;
                const isSelected = postType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setPostType(type)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected 
                        ? "border-secondary bg-secondary/10" 
                        : "border-border hover:border-secondary/50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${config.color}`} />
                    <p className="font-medium text-sm">{config.label}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {postTypeConfig[postType].description}
            </p>
          </div>

          {/* Title (optional for story) */}
          {(showNeedFields || showSupplyFields) && (
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                placeholder="Nhập tiêu đề bài viết..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              placeholder={
                postType === "need" 
                  ? "Mô tả chi tiết nhu cầu cần hỗ trợ..." 
                  : postType === "supply"
                  ? "Mô tả nguồn lực bạn muốn đóng góp..."
                  : "Chia sẻ câu chuyện của bạn..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Location & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Địa điểm
              </Label>
              <Input
                id="location"
                placeholder="VD: Quận 1, TP.HCM"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Danh mục</Label>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categoryConfig.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Need-specific fields */}
          <AnimatePresence>
            {showNeedFields && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Mức độ khẩn cấp
                    </Label>
                    <Select value={urgency} onValueChange={(v) => setUrgency(v as UrgencyLevel)} disabled={isSubmitting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(urgencyConfig) as [UrgencyLevel, typeof urgencyConfig[UrgencyLevel]][]).map(([level, config]) => (
                          <SelectItem key={level} value={level}>
                            <Badge className={config.color}>{config.label}</Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAmount" className="flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      Mục tiêu (VNĐ)
                    </Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      placeholder="1,000,000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beneficiaries" className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Số người thụ hưởng
                    </Label>
                    <Input
                      id="beneficiaries"
                      type="number"
                      placeholder="10"
                      value={beneficiariesCount}
                      onChange={(e) => setBeneficiariesCount(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label>Hình ảnh / Video</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Image className="w-4 h-4" />
                Thêm ảnh
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Video className="w-4 h-4" />
                Thêm video
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Media Previews */}
            {mediaPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    {mediaFiles[index]?.type.startsWith("video/") ? (
                      <video src={preview} className="w-full h-full object-cover" />
                    ) : (
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeMedia(index)}
                      disabled={isSubmitting}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
              className="bg-gradient-to-r from-secondary to-secondary-light text-secondary-foreground gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang đăng...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Đăng bài
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
