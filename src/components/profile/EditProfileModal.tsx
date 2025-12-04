import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import { z } from "zod";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  role: string | null;
  reputation_score: number | null;
  is_verified: boolean | null;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onUpdate: (profile: Profile) => void;
}

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Tên không được để trống").max(100, "Tên tối đa 100 ký tự"),
  bio: z.string().max(500, "Tiểu sử tối đa 500 ký tự").optional(),
});

export function EditProfileModal({ isOpen, onClose, profile, onUpdate }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(profile?.cover_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ full_name?: string; bio?: string }>({});
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: "Kích thước ảnh tối đa 5MB",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: "Kích thước ảnh bìa tối đa 10MB",
          variant: "destructive",
        });
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, userId: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    // Validate input
    const validation = profileSchema.safeParse({ full_name: fullName, bio });
    if (!validation.success) {
      const fieldErrors: { full_name?: string; bio?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "full_name") fieldErrors.full_name = err.message;
        if (err.path[0] === "bio") fieldErrors.bio = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (!profile) return;
    setSaving(true);

    try {
      let avatarUrl = profile.avatar_url;
      let coverUrl = profile.cover_url;

      // Upload avatar if changed
      if (avatarFile) {
        const url = await uploadFile(avatarFile, "avatars", profile.user_id);
        if (url) avatarUrl = url;
      }

      // Upload cover if changed
      if (coverFile) {
        const url = await uploadFile(coverFile, "covers", profile.user_id);
        if (url) coverUrl = url;
      }

      // Update profile in database
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          cover_url: coverUrl,
        })
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Hồ sơ đã được cập nhật",
      });

      onUpdate(data as Profile);
      onClose();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật hồ sơ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Chỉnh Sửa Hồ Sơ</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Ảnh Bìa</Label>
            <div
              className="relative h-32 rounded-xl overflow-hidden bg-muted cursor-pointer group"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-luxury" />
              )}
              <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-background" />
              </div>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>

          {/* Avatar */}
          <div className="space-y-2">
            <Label>Ảnh Đại Diện</Label>
            <div className="flex items-center gap-4">
              <div
                className="relative cursor-pointer group"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Avatar className="w-20 h-20 border-2 border-border">
                  <AvatarImage src={avatarPreview || ""} />
                  <AvatarFallback className="text-2xl bg-secondary/20 text-secondary">
                    {fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-background" />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Tải Ảnh Lên
              </Button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và Tên</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên"
              maxLength={100}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name}</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Tiểu Sử</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Giới thiệu về bản thân..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500
            </p>
            {errors.bio && (
              <p className="text-sm text-destructive">{errors.bio}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button variant="gold" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang Lưu...
                </>
              ) : (
                "Lưu Thay Đổi"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}