import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Loader2, ImagePlus } from "lucide-react";

interface CreateCampaignModalProps {
  onCampaignCreated?: () => void;
}

const CATEGORIES = [
  { value: "education", label: "Giáo Dục" },
  { value: "healthcare", label: "Y Tế" },
  { value: "disaster_relief", label: "Cứu Trợ Thiên Tai" },
  { value: "poverty", label: "Xóa Đói Giảm Nghèo" },
  { value: "environment", label: "Môi Trường" },
  { value: "animal_welfare", label: "Bảo Vệ Động Vật" },
  { value: "community", label: "Cộng Đồng" },
  { value: "other", label: "Khác" },
];

export function CreateCampaignModal({ onCampaignCreated }: CreateCampaignModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    goalAmount: "",
    category: "other" as string,
    location: "",
    coverImageUrl: "",
    endDate: "",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      const fileExt = file.name.split('.').pop();
      const fileName = `campaign_${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, coverImageUrl: publicUrl }));
      toast.success("Đã tải lên ảnh bìa");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Lỗi tải ảnh: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề chiến dịch");
      return;
    }

    if (!formData.goalAmount || Number(formData.goalAmount) <= 0) {
      toast.error("Vui lòng nhập số tiền mục tiêu hợp lệ");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vui lòng đăng nhập để tạo chiến dịch");
        return;
      }

      const campaignData = {
        creator_id: user.id,
        title: formData.title.trim(),
        short_description: formData.shortDescription.trim() || null,
        description: formData.description.trim() || null,
        goal_amount: Number(formData.goalAmount),
        category: formData.category as "education" | "healthcare" | "disaster_relief" | "poverty" | "environment" | "animal_welfare" | "community" | "other",
        location: formData.location.trim() || null,
        cover_image_url: formData.coverImageUrl || null,
        end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        status: "pending_review" as const,
        currency: "VND",
      };

      const { error } = await supabase.from("campaigns").insert(campaignData);

      if (error) throw error;

      toast.success("Chiến dịch đã được tạo và đang chờ duyệt!");
      setFormData({
        title: "",
        shortDescription: "",
        description: "",
        goalAmount: "",
        category: "other",
        location: "",
        coverImageUrl: "",
        endDate: "",
      });
      setOpen(false);
      onCampaignCreated?.();
    } catch (error: any) {
      console.error("Create campaign error:", error);
      toast.error("Lỗi tạo chiến dịch: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Tạo Chiến Dịch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Chiến Dịch Mới</DialogTitle>
          <DialogDescription>
            Điền thông tin để tạo chiến dịch từ thiện. Chiến dịch sẽ được duyệt trước khi công khai.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Ảnh bìa</Label>
            <div className="relative">
              {formData.coverImageUrl ? (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img 
                    src={formData.coverImageUrl} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, coverImageUrl: "" }))}
                  >
                    Xóa
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors">
                  {uploadingImage ? (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Nhấn để tải ảnh</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              placeholder="Tên chiến dịch của bạn"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Mô tả ngắn</Label>
            <Input
              id="shortDescription"
              placeholder="Mô tả ngắn gọn về chiến dịch"
              value={formData.shortDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả chi tiết</Label>
            <Textarea
              id="description"
              placeholder="Mô tả đầy đủ về mục đích, đối tượng hưởng lợi, cách sử dụng quỹ..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Goal Amount */}
          <div className="space-y-2">
            <Label htmlFor="goalAmount">Mục tiêu quyên góp (VND) *</Label>
            <Input
              id="goalAmount"
              type="number"
              placeholder="10000000"
              min="1"
              value={formData.goalAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, goalAmount: e.target.value }))}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Danh mục</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Địa điểm</Label>
            <Input
              id="location"
              placeholder="Tỉnh/Thành phố, Quốc gia"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate">Ngày kết thúc</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo Chiến Dịch"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
