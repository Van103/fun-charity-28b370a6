import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Video, Sparkles, X, Loader2, Send, PenSquare } from "lucide-react";
import { useCreateFeedPost } from "@/hooks/useFeedPosts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreatePostModal } from "./CreatePostModal";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const createPost = useCreateFeedPost();

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
      <div className="glass-card p-4">
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="w-10 h-10 border-2 border-secondary/30">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-secondary/20">
              {profile?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <Textarea
            placeholder="Đăng bài để nhận từ 999 Happy Camly Coin trở lên nhé 🎉"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[60px] bg-muted/50 border-none rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-secondary resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Media Previews */}
        {mediaPreviews.length > 0 && (
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
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

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Image className="w-4 h-4 text-success" />
              <span className="hidden sm:inline text-xs">Ảnh</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-1.5"
              onClick={() => videoInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Video className="w-4 h-4 text-destructive" />
              <span className="hidden sm:inline text-xs">Video</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-secondary hover:bg-muted/50 gap-1.5"
              onClick={() => setShowAdvancedModal(true)}
              disabled={isSubmitting}
            >
              <PenSquare className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Nâng cao</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost"
              className="gap-1.5"
              disabled={isSubmitting}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI</span>
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-secondary to-secondary-light text-secondary-foreground gap-1.5"
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Đang đăng...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Post Modal */}
      <CreatePostModal 
        open={showAdvancedModal}
        onOpenChange={setShowAdvancedModal}
        profile={profile}
      />
    </>
  );
}
