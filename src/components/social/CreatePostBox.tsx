import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Image, Video, Sparkles, X, Loader2, Send, RefreshCw, AlertCircle, Check, Palette, Copy, Trash2 } from "lucide-react";
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
import { 
  formatBytesToMB, 
  MAX_IMAGE_BYTES, 
  MAX_VIDEO_BYTES,
  UploadProgress,
  uploadFileWithProgress,
  compressVideo,
  shouldCompressVideo,
  UploadController,
} from "@/lib/media";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableMediaItem } from "./SortableMediaItem";

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

interface MediaItem {
  id: string;
  file: File;
  preview: string;
  isVideo: boolean;
  uploadProgress?: UploadProgress | null;
  isCompressing?: boolean;
  compressionProgress?: number;
}

export function CreatePostBox({ profile, onPostCreated }: CreatePostBoxProps) {
  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
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
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadControllersRef = useRef<Map<string, UploadController>>(new Map());
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const createPost = useCreateFeedPost();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Auto-expand when media or AI content is added
  useEffect(() => {
    if (mediaItems.length > 0 || aiGeneratedImage || content) {
      setIsExpanded(true);
    }
  }, [mediaItems.length, aiGeneratedImage, content]);

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

  const revokePreviewUrl = (url?: string | null) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMediaItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const isVideo = type === "video" || file.type.startsWith("video/");
      const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      const maxSizeLabel = formatBytesToMB(limit);

      if (file.size > limit) {
        toast({
          title: "File quá lớn",
          description: `${file.name} vượt quá ${maxSizeLabel}`,
          variant: "destructive",
        });
        continue;
      }

      const itemId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      let processedFile = file;

      // Check if video needs compression
      if (isVideo && shouldCompressVideo(file)) {
        const newItem: MediaItem = {
          id: itemId,
          file,
          preview: URL.createObjectURL(file),
          isVideo: true,
          isCompressing: true,
          compressionProgress: 0,
        };
        setMediaItems((prev) => [...prev, newItem]);

        toast({
          title: "Đang nén video...",
          description: `${file.name} đang được nén để tối ưu dung lượng`,
        });

        try {
          processedFile = await compressVideo(file, {
            maxWidth: 1280,
            maxHeight: 720,
            videoBitrate: 2_000_000,
            onProgress: (progress) => {
              setMediaItems((prev) =>
                prev.map((item) =>
                  item.id === itemId
                    ? { ...item, compressionProgress: progress }
                    : item
                )
              );
            },
          });

          // Update item with compressed file
          setMediaItems((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    file: processedFile,
                    isCompressing: false,
                    compressionProgress: 100,
                  }
                : item
            )
          );

          toast({
            title: "Nén video thành công!",
            description: `Giảm từ ${formatBytesToMB(file.size)} xuống ${formatBytesToMB(processedFile.size)}`,
          });
        } catch (error) {
          console.error("Video compression failed:", error);
          // Keep original file if compression fails
          setMediaItems((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, isCompressing: false, compressionProgress: undefined }
                : item
            )
          );
          toast({
            title: "Không thể nén video",
            description: "Sẽ sử dụng video gốc",
            variant: "destructive",
          });
        }
      } else {
        // Add non-video or small video directly
        const newItem: MediaItem = {
          id: itemId,
          file: processedFile,
          preview: URL.createObjectURL(processedFile),
          isVideo,
        };
        setMediaItems((prev) => [...prev, newItem]);
      }
    }

    e.target.value = "";
  };

  const removeMedia = (id: string) => {
    // Cancel upload if in progress
    const controller = uploadControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      uploadControllersRef.current.delete(id);
    }
    
    setMediaItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        revokePreviewUrl(item.preview);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const cancelUpload = (id: string) => {
    const controller = uploadControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      uploadControllersRef.current.delete(id);
      
      // Reset upload progress for this item
      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, uploadProgress: null } : item
        )
      );
      
      toast({
        title: "Đã hủy upload",
        description: "Upload đã được hủy thành công",
      });
    }
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

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const uploadedUrls: string[] = [];
    
    // Upload regular media files with progress tracking
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      const fileExt = item.file.name.split(".").pop() || "bin";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      try {
        // Use XMLHttpRequest for progress tracking with abort capability
        const controller = uploadFileWithProgress(
          `${supabaseUrl}/storage/v1/object/post-images/${filePath}`,
          item.file,
          {
            "Authorization": `Bearer ${supabaseKey}`,
            "x-upsert": "true",
          },
          (progress) => {
            setMediaItems((prev) =>
              prev.map((m) =>
                m.id === item.id ? { ...m, uploadProgress: progress } : m
              )
            );
          }
        );
        
        // Store controller for potential cancellation
        uploadControllersRef.current.set(item.id, controller);
        
        await controller.promise;
        
        // Remove controller after successful upload
        uploadControllersRef.current.delete(item.id);

        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      } catch (error: any) {
        // Clean up controller reference
        uploadControllersRef.current.delete(item.id);
        
        // If cancelled, don't throw, just skip
        if (error.message === "Upload cancelled") {
          continue;
        }
        
        console.error(`Failed to upload ${item.file.name}:`, error);
        throw new Error(`Failed to upload ${item.file.name}: ${error.message}`);
      }
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
    if (!content.trim() && mediaItems.length === 0 && !aiGeneratedImage) {
      toast({
        title: "Nội dung trống",
        description: "Vui lòng nhập nội dung hoặc thêm hình ảnh / video",
        variant: "destructive",
      });
      return;
    }

    // Check if any item is still compressing
    if (mediaItems.some((item) => item.isCompressing)) {
      toast({
        title: "Đang xử lý",
        description: "Vui lòng đợi video nén xong",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let mediaUrls: string[] = [];
      if (mediaItems.length > 0 || aiGeneratedImage) {
        mediaUrls = await uploadFiles();
      }

      await createPost.mutateAsync({
        post_type: "story",
        content: content.trim(),
        media_urls: mediaUrls,
      });

      // Revoke blob preview URLs to avoid memory leaks
      mediaItems.forEach((item) => revokePreviewUrl(item.preview));

      setContent("");
      setMediaItems([]);
      setAiGeneratedImage(null);
      setIsExpanded(false);
      onPostCreated?.();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = isUploading || createPost.isPending;
  const canSubmit = content.trim() || mediaItems.length > 0 || aiGeneratedImage;

  return (
    <>
      <div className="glass-card overflow-hidden">
        {/* Main input area - Clean white */}
        <div className="p-4">
          <div className="flex gap-3">
            {/* User Avatar with gold ring - clickable to profile */}
            <Link to="/profile" className="p-0.5 rounded-full bg-gradient-to-br from-gold-champagne to-gold-light flex-shrink-0 self-start mt-1">
              <Avatar className="w-10 h-10 border-2 border-card">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(profile?.full_name || "U")} text-white font-medium`}>
                  {profile?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            {/* Input - expands when focused or has content */}
            <div className="flex-1">
              {!isExpanded && !content && mediaItems.length === 0 && !aiGeneratedImage ? (
                <input
                  type="text"
                  placeholder="Bạn đang nghĩ gì?"
                  onFocus={() => {
                    setIsExpanded(true);
                    setTimeout(() => textareaRef.current?.focus(), 50);
                  }}
                  className="w-full bg-muted/30 border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all cursor-pointer"
                  readOnly
                />
              ) : (
                <div className="space-y-3">
                  <textarea
                    ref={textareaRef}
                    placeholder="Bạn đang nghĩ gì? Chia sẻ câu chuyện, hình ảnh hoặc video của bạn..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none min-h-[120px]"
                    disabled={isSubmitting}
                    rows={4}
                  />
                  {/* Collapse button when empty */}
                  {!content && mediaItems.length === 0 && !aiGeneratedImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Thu gọn
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Media Previews with Drag & Drop */}
        {(mediaItems.length > 0 || aiGeneratedImage) && (
          <div className="px-4 pb-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={mediaItems.map((item) => item.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* AI Generated Image (not sortable) */}
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
                  {/* User uploaded media - Sortable */}
                  {mediaItems.map((item) => (
                    <SortableMediaItem
                      key={item.id}
                      id={item.id}
                      preview={item.preview}
                      isVideo={item.isVideo}
                      onRemove={() => removeMedia(item.id)}
                      onCancelUpload={item.uploadProgress ? () => cancelUpload(item.id) : undefined}
                      disabled={isSubmitting}
                      uploadProgress={item.uploadProgress}
                      isCompressing={item.isCompressing}
                      compressionProgress={item.compressionProgress}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {mediaItems.length > 1 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                💡 Kéo thả để sắp xếp thứ tự
              </p>
            )}
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
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
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(aiPreviewContent);
                          toast({
                            title: "Đã copy!",
                            description: "Nội dung đã được sao chép vào clipboard",
                          });
                        }}
                        className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </Button>
                      <span className="text-xs text-muted-foreground font-normal">Bạn có thể chỉnh sửa</span>
                    </div>
                  </label>
                  <Textarea
                    value={aiPreviewContent}
                    onChange={(e) => setAiPreviewContent(e.target.value)}
                    className="min-h-[220px] rounded-xl resize-y text-base leading-relaxed"
                    placeholder="Nội dung AI..."
                  />
                </div>
                
                {/* Generated Image Preview */}
                {aiPreviewImage && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        Hình ảnh AI:
                        <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAiPreviewImage(null)}
                        className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa ảnh
                      </Button>
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