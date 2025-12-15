import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Image, Video, Sparkles, X, Loader2 } from "lucide-react";
import { useCreateFeedPost } from "@/hooks/useFeedPosts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreatePostModal } from "./CreatePostModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CreatePostBoxProps {
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  onPostCreated?: () => void;
}

export function CreatePostBox({ profile, onPostCreated }: CreatePostBoxProps) {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const createPost = useCreateFeedPost();

  const generateAiContent = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-post-content", {
        body: { topic: aiTopic, style: "thân thiện, ấm áp, truyền cảm hứng" },
      });

      if (error) throw error;

      if (data?.content) {
        setContent(data.content);
        setShowAiModal(false);
        setAiTopic("");
        toast({
          title: "Tạo nội dung thành công! ✨",
          description: "AI đã tạo nội dung cho bạn. Bạn có thể chỉnh sửa trước khi đăng.",
        });
      }
    } catch (error: any) {
      console.error("Error generating AI content:", error);
      toast({
        title: "Lỗi tạo nội dung",
        description: error.message || "Không thể tạo nội dung. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Bạn cần đăng nhập để đăng bài");
    }

    const uploadedUrls: string[] = [];
    
    for (const file of mediaFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

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
        post_type: "story",
        content: content.trim(),
        media_urls: mediaUrls,
      });

      setContent("");
      setMediaFiles([]);
      setMediaPreviews([]);
      onPostCreated?.();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = isUploading || createPost.isPending;

  return (
    <>
      <div className="glass-card overflow-hidden">
        {/* Input area with purple gradient background */}
        <div className="bg-gradient-to-r from-primary/90 to-primary p-3 flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white/30">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-white/20 text-white">
              {profile?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <input
            type="text"
            placeholder="Đăng bài để nhận từ 999 Happy Camly Coin trở lên nhé 🤗"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 bg-white/20 border-none rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
            disabled={isSubmitting}
          />
        </div>

        {/* Media Previews */}
        {mediaPreviews.length > 0 && (
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-background">
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

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e, "image")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e, "video")}
        />

        {/* Action buttons */}
        <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 px-3"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Image className="w-4 h-4 text-success" />
              <span className="text-xs">Ảnh/Bài viết</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 px-3"
              onClick={() => videoInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Video className="w-4 h-4 text-destructive" />
              <span className="text-xs">Video</span>
            </Button>
          </div>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground gap-2 px-4"
            onClick={() => setShowAiModal(true)}
            disabled={isSubmitting}
          >
            <Sparkles className="w-4 h-4" />
            <span>Enjoy AI</span>
          </Button>
        </div>
      </div>

      {/* AI Content Modal */}
      <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Enjoy AI - Tạo nội dung tự động
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Chủ đề bạn muốn viết về (tùy chọn)
              </label>
              <Input
                placeholder="Ví dụ: Giúp đỡ trẻ em vùng cao, bảo vệ môi trường..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Để trống để AI tự tạo nội dung về hoạt động từ thiện
            </p>
            <Button
              onClick={generateAiContent}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-primary to-primary-light"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo nội dung...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Tạo nội dung với AI
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Post Modal */}
      <CreatePostModal 
        open={showAdvancedModal}
        onOpenChange={setShowAdvancedModal}
        profile={profile}
      />
    </>
  );
}