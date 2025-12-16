import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Image, Video, Sparkles, X, Loader2, Send } from "lucide-react";
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
    user_id?: string;
  } | null;
  onPostCreated?: () => void;
}

// Soft gradient backgrounds for letter avatars
const getAvatarGradient = (name: string) => {
  const gradients = [
    "from-purple-soft to-purple-light",
    "from-gold-champagne to-gold-light",
    "from-pink-400 to-rose-300",
    "from-sky-400 to-blue-300",
  ];
  const index = (name?.charCodeAt(0) || 0) % gradients.length;
  return gradients[index];
};

export function CreatePostBox({ profile, onPostCreated }: CreatePostBoxProps) {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
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
        
        // Handle AI-generated image
        if (data?.image) {
          setAiGeneratedImage(data.image);
        }
        
        setShowAiModal(false);
        setAiTopic("");
        toast({
          title: "Tạo nội dung thành công! ✨",
          description: data?.image 
            ? "AI đã tạo nội dung và hình ảnh cho bạn. Bạn có thể chỉnh sửa trước khi đăng."
            : "AI đã tạo nội dung cho bạn. Bạn có thể chỉnh sửa trước khi đăng.",
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

  const removeAiImage = () => {
    setAiGeneratedImage(null);
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

  // Convert base64 to File for upload
  const base64ToFile = async (base64: string, filename: string): Promise<File> => {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  };

  const uploadFiles = async (): Promise<string[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Bạn cần đăng nhập để đăng bài");
    }

    const uploadedUrls: string[] = [];
    
    // Upload regular media files
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

    // Upload AI-generated image if exists
    if (aiGeneratedImage) {
      const aiFile = await base64ToFile(aiGeneratedImage, `ai-generated-${Date.now()}.png`);
      const fileName = `${Date.now()}-ai-generated.png`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, aiFile);

      if (uploadError) {
        console.error("Failed to upload AI image:", uploadError);
      } else {
        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0 && !aiGeneratedImage) {
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
      if (mediaFiles.length > 0 || aiGeneratedImage) {
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
      setAiGeneratedImage(null);
      onPostCreated?.();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = isUploading || createPost.isPending;
  const canSubmit = content.trim() || mediaFiles.length > 0 || aiGeneratedImage;

  return (
    <>
      <div className="glass-card overflow-hidden">
        {/* Main input area - Clean white */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* User Avatar with gold ring - clickable to profile */}
            <Link to="/profile" className="p-0.5 rounded-full bg-gradient-to-br from-gold-champagne to-gold-light flex-shrink-0">
              <Avatar className="w-10 h-10 border-2 border-card">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(profile?.full_name || "U")} text-white font-medium`}>
                  {profile?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            {/* Input - shorter height */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Bạn đang nghĩ gì?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Media Previews */}
        {(mediaPreviews.length > 0 || aiGeneratedImage) && (
          <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* AI Generated Image */}
            {aiGeneratedImage && (
              <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border-2 border-primary/50">
                <img src={aiGeneratedImage} alt="AI Generated" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full shadow-lg"
                  onClick={removeAiImage}
                  disabled={isSubmitting}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            {/* User uploaded media */}
            {mediaPreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border">
                {mediaFiles[index]?.type.startsWith("video/") ? (
                  <video src={preview} className="w-full h-full object-cover" />
                ) : (
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full shadow-lg"
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

        {/* Action buttons - Clean separator */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-success hover:bg-success/10 gap-2 rounded-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Image className="w-5 h-5" />
              <span className="text-xs font-medium hidden sm:inline">Ảnh</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2 rounded-lg"
              onClick={() => videoInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Video className="w-5 h-5" />
              <span className="text-xs font-medium hidden sm:inline">Video</span>
            </Button>
            <Button 
              variant="ghost"
              size="sm" 
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 rounded-lg"
              onClick={() => setShowAiModal(true)}
              disabled={isSubmitting}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-medium hidden sm:inline">AI</span>
            </Button>
          </div>
          
          {/* Post button */}
          <Button 
            size="sm" 
            className={`gap-2 px-5 rounded-lg font-semibold transition-all ${
              canSubmit 
                ? "bg-primary hover:bg-gradient-to-r hover:from-primary hover:to-gold-champagne text-primary-foreground shadow-sm" 
                : "bg-muted text-muted-foreground"
            }`}
            onClick={handleSubmit}
            disabled={isSubmitting || !canSubmit}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>ĐĂNG</span>
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
                className="rounded-lg"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Để trống để AI tự tạo nội dung về hoạt động từ thiện
            </p>
            <Button
              onClick={generateAiContent}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary rounded-lg"
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