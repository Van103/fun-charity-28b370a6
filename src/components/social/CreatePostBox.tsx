import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Image, Video, Sparkles, X, Loader2, Send, RefreshCw, AlertCircle, Check, Palette } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";

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

// Image style options
const imageStyleOptions = [
  { value: 'illustration', label: 'Tranh minh họa', emoji: '🎨' },
  { value: 'realistic', label: 'Chân thực', emoji: '📷' },
  { value: 'cartoon', label: 'Hoạt hình', emoji: '🎬' },
  { value: 'watercolor', label: 'Tranh vẽ tay', emoji: '🖌️' },
  { value: '3d', label: '3D Render', emoji: '🧊' },
];

export function CreatePostBox({ profile, onPostCreated }: CreatePostBoxProps) {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiImageStyle, setAiImageStyle] = useState("illustration");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [aiPreviewContent, setAiPreviewContent] = useState<string | null>(null);
  const [aiPreviewImage, setAiPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const createPost = useCreateFeedPost();

  const generateAiContent = async () => {
    setIsGenerating(true);
    setAiError(null);
    setGenerationProgress(0);
    setAiPreviewContent(null);
    setAiPreviewImage(null);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 10, 90));
    }, 500);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-post-content", {
        body: { topic: aiTopic, style: "thân thiện, ấm áp, truyền cảm hứng", imageStyle: aiImageStyle },
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (error) {
        // Handle specific error codes
        const errorMessage = error.message || "";
        if (errorMessage.includes("429") || error.status === 429) {
          setAiError(t("ai.errorRateLimit"));
          toast({
            title: t("ai.error"),
            description: t("ai.errorRateLimit"),
            variant: "destructive",
          });
          return;
        }
        if (errorMessage.includes("402") || error.status === 402) {
          setAiError(t("ai.errorPayment"));
          toast({
            title: t("ai.error"),
            description: t("ai.errorPayment"),
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data?.content) {
        // Show preview in modal instead of closing immediately
        setAiPreviewContent(data.content);
        
        // Handle AI-generated image preview
        if (data?.image) {
          setAiPreviewImage(data.image);
        }
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Error generating AI content:", error);
      
      const errorMsg = error.message || t("ai.errorGeneric");
      setAiError(errorMsg);
      
      toast({
        title: t("ai.error"),
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const applyAiContent = () => {
    if (aiPreviewContent) {
      setContent(aiPreviewContent);
    }
    if (aiPreviewImage) {
      setAiGeneratedImage(aiPreviewImage);
    }
    setShowAiModal(false);
    setAiTopic("");
    setAiPreviewContent(null);
    setAiPreviewImage(null);
    setAiError(null);
    toast({
      title: t("ai.success"),
      description: aiPreviewImage ? t("ai.successWithImage") : t("ai.successDesc"),
    });
  };

  const resetAiModal = () => {
    setAiPreviewContent(null);
    setAiPreviewImage(null);
    setAiError(null);
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
      <Dialog open={showAiModal} onOpenChange={(open) => {
        setShowAiModal(open);
        if (!open) {
          setAiError(null);
          setGenerationProgress(0);
          setAiPreviewContent(null);
          setAiPreviewImage(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t("ai.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Show input section when no preview */}
            {!aiPreviewContent && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("ai.topic")}
                  </label>
                  <Input
                    placeholder={t("ai.placeholder")}
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    disabled={isGenerating}
                    className="rounded-lg"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("ai.empty")}
                </p>
                
                {/* Image Style Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Kiểu ảnh AI
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {imageStyleOptions.map((style) => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => setAiImageStyle(style.value)}
                        disabled={isGenerating}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          aiImageStyle === style.value
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/30 border-border text-foreground hover:bg-muted/50'
                        } disabled:opacity-50`}
                      >
                        <span>{style.emoji}</span>
                        <span>{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Error State with Retry */}
                {aiError && (
                  <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-destructive font-medium">{aiError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateAiContent}
                        disabled={isGenerating}
                        className="gap-2"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {t("ai.retry")}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Progress Bar */}
                {isGenerating && (
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-gold-champagne transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {generationProgress < 50 ? "Đang tạo nội dung văn bản..." : "Đang tạo hình ảnh AI..."}
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={generateAiContent}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary rounded-lg h-11"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("ai.generating")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t("ai.generate")}
                    </>
                  )}
                </Button>
              </>
            )}

            {/* Preview Section - Show when content is generated */}
            {aiPreviewContent && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Nội dung AI đã tạo xong!</span>
                </div>
                
                {/* Editable Generated Text */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center justify-between">
                    <span>Nội dung bài viết:</span>
                    <span className="text-xs text-muted-foreground font-normal">Bạn có thể chỉnh sửa</span>
                  </label>
                  <Textarea
                    value={aiPreviewContent}
                    onChange={(e) => setAiPreviewContent(e.target.value)}
                    className="min-h-[150px] rounded-xl resize-none"
                    placeholder="Nội dung AI..."
                  />
                </div>
                
                {/* Generated Image Preview */}
                {aiPreviewImage && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      Hình ảnh AI:
                      <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </span>
                    </label>
                    <div className="rounded-xl overflow-hidden border border-primary/30 bg-muted">
                      <img 
                        src={aiPreviewImage} 
                        alt="AI Generated" 
                        className="w-full max-h-80 object-contain"
                      />
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={resetAiModal}
                    className="flex-1 rounded-lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tạo lại
                  </Button>
                  <Button
                    onClick={applyAiContent}
                    className="flex-1 bg-gradient-to-r from-primary to-gold-champagne hover:from-primary-dark hover:to-gold-champagne text-primary-foreground rounded-lg"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Sử dụng nội dung này
                  </Button>
                </div>
              </div>
            )}
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