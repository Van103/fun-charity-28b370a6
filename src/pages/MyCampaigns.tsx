import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCampaignApi, Campaign } from "@/hooks/useCampaignApi";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Send, 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Target,
  Users,
  Calendar,
  ImagePlus
} from "lucide-react";
import { CreateCampaignModal } from "@/components/campaigns/CreateCampaignModal";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Nháp", icon: <Edit className="w-3 h-3" />, variant: "secondary" },
  pending_review: { label: "Chờ duyệt", icon: <Clock className="w-3 h-3" />, variant: "outline" },
  approved: { label: "Đã duyệt", icon: <CheckCircle className="w-3 h-3" />, variant: "default" },
  active: { label: "Đang chạy", icon: <CheckCircle className="w-3 h-3" />, variant: "default" },
  completed: { label: "Hoàn thành", icon: <Target className="w-3 h-3" />, variant: "default" },
  rejected: { label: "Từ chối", icon: <XCircle className="w-3 h-3" />, variant: "destructive" },
  paused: { label: "Tạm dừng", icon: <AlertCircle className="w-3 h-3" />, variant: "outline" },
  cancelled: { label: "Đã hủy", icon: <XCircle className="w-3 h-3" />, variant: "destructive" },
};

export default function MyCampaigns() {
  const navigate = useNavigate();
  const { listCampaigns, updateCampaign, updateCampaignStatus, deleteCampaign, loading } = useCampaignApi();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    goalAmount: "",
    category: "other",
    location: "",
    coverImageUrl: "",
    endDate: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (currentUserId) {
      loadCampaigns();
    }
  }, [currentUserId, activeTab]);

  const loadCampaigns = async () => {
    if (!currentUserId) return;
    
    const filters: any = { creatorId: currentUserId };
    if (activeTab !== "all") {
      filters.status = activeTab;
    }
    
    const result = await listCampaigns(filters);
    if (result) {
      setCampaigns(result.campaigns);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditFormData({
      title: campaign.title,
      shortDescription: campaign.short_description || "",
      description: campaign.description || "",
      goalAmount: campaign.goal_amount.toString(),
      category: campaign.category,
      location: campaign.location || "",
      coverImageUrl: campaign.cover_image_url || "",
      endDate: campaign.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : "",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `campaign_${currentUserId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(fileName);

      setEditFormData(prev => ({ ...prev, coverImageUrl: publicUrl }));
      toast.success("Đã tải lên ảnh bìa");
    } catch (error: any) {
      toast.error("Lỗi tải ảnh: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign) return;

    const success = await updateCampaign(editingCampaign.id, {
      title: editFormData.title,
      short_description: editFormData.shortDescription,
      description: editFormData.description,
      goal_amount: Number(editFormData.goalAmount),
      category: editFormData.category as any,
      location: editFormData.location,
      cover_image_url: editFormData.coverImageUrl,
      end_date: editFormData.endDate ? new Date(editFormData.endDate).toISOString() : null,
    });

    if (success) {
      toast.success("Đã cập nhật chiến dịch");
      setEditingCampaign(null);
      loadCampaigns();
    }
  };

  const handleSubmitForReview = async (campaignId: string) => {
    const success = await updateCampaignStatus(campaignId, "pending_review");
    if (success) {
      toast.success("Chiến dịch đã được gửi để duyệt");
      loadCampaigns();
    }
  };

  const handleDelete = async () => {
    if (!deletingCampaignId) return;
    
    const success = await deleteCampaign(deletingCampaignId);
    if (success) {
      toast.success("Đã xóa chiến dịch");
      setDeletingCampaignId(null);
      loadCampaigns();
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTabCount = (status: string) => {
    if (status === "all") return campaigns.length;
    return campaigns.filter(c => c.status === status).length;
  };

  const filteredCampaigns = activeTab === "all" 
    ? campaigns 
    : campaigns.filter(c => c.status === activeTab);

  if (!currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Chiến Dịch Của Tôi</h1>
            <p className="text-muted-foreground mt-1">Quản lý các chiến dịch bạn đã tạo</p>
          </div>
          <CreateCampaignModal onCampaignCreated={loadCampaigns} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-2">
            <TabsTrigger value="all">Tất cả ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="draft">Nháp</TabsTrigger>
            <TabsTrigger value="pending_review">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="active">Đang chạy</TabsTrigger>
            <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Chưa có chiến dịch nào</h3>
                  <p className="text-muted-foreground mb-4">
                    Bắt đầu tạo chiến dịch từ thiện đầu tiên của bạn
                  </p>
                  <CreateCampaignModal onCampaignCreated={loadCampaigns} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredCampaigns.map((campaign) => {
                  const progress = campaign.goal_amount > 0 
                    ? (campaign.raised_amount / campaign.goal_amount) * 100 
                    : 0;
                  const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                  
                  return (
                    <Card key={campaign.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {/* Cover Image */}
                        <div className="md:w-48 h-32 md:h-auto flex-shrink-0">
                          {campaign.cover_image_url ? (
                            <img 
                              src={campaign.cover_image_url} 
                              alt={campaign.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <ImagePlus className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4">
                          <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{campaign.title}</h3>
                              <Badge variant={statusConfig.variant} className="gap-1">
                                {statusConfig.icon}
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {(campaign.status === "draft" || campaign.status === "rejected") && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEdit(campaign)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setDeletingCampaignId(campaign.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {campaign.short_description || campaign.description}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {getCategoryLabel(campaign.category)}
                            </span>
                            {campaign.end_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(campaign.end_date), "dd/MM/yyyy", { locale: vi })}
                              </span>
                            )}
                          </div>

                          {/* Progress */}
                          <div className="space-y-2">
                            <Progress value={Math.min(progress, 100)} className="h-2" />
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-primary">
                                {formatCurrency(campaign.raised_amount)}
                              </span>
                              <span className="text-muted-foreground">
                                / {formatCurrency(campaign.goal_amount)} ({progress.toFixed(0)}%)
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          {campaign.status === "draft" && (
                            <div className="mt-4">
                              <Button 
                                size="sm" 
                                onClick={() => handleSubmitForReview(campaign.id)}
                                className="gap-2"
                              >
                                <Send className="w-4 h-4" />
                                Gửi duyệt
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Edit Dialog */}
      <Dialog open={!!editingCampaign} onOpenChange={() => setEditingCampaign(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Chiến Dịch</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin chiến dịch của bạn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Ảnh bìa</Label>
              <div className="relative">
                {editFormData.coverImageUrl ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={editFormData.coverImageUrl} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute bottom-2 right-2"
                      onClick={() => setEditFormData(prev => ({ ...prev, coverImageUrl: "" }))}
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

            <div className="space-y-2">
              <Label htmlFor="edit-title">Tiêu đề *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-shortDescription">Mô tả ngắn</Label>
              <Input
                id="edit-shortDescription"
                value={editFormData.shortDescription}
                onChange={(e) => setEditFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả chi tiết</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-goalAmount">Mục tiêu (VND) *</Label>
              <Input
                id="edit-goalAmount"
                type="number"
                value={editFormData.goalAmount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, goalAmount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Danh mục</Label>
              <Select 
                value={editFormData.category} 
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label htmlFor="edit-location">Địa điểm</Label>
              <Input
                id="edit-location"
                value={editFormData.location}
                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-endDate">Ngày kết thúc</Label>
              <Input
                id="edit-endDate"
                type="date"
                value={editFormData.endDate}
                onChange={(e) => setEditFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setEditingCampaign(null)}
              >
                Hủy
              </Button>
              <Button className="flex-1" onClick={handleSaveEdit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCampaignId} onOpenChange={() => setDeletingCampaignId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Chiến dịch sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
