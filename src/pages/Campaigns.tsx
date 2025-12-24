import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { CreateCampaignModal } from "@/components/campaigns/CreateCampaignModal";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  MapPin,
  Users,
  Clock,
  Verified,
  TrendingUp,
  Heart,
  Loader2,
} from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  short_description: string | null;
  cover_image_url: string | null;
  raised_amount: number;
  goal_amount: number;
  location: string | null;
  category: string;
  is_verified: boolean | null;
  is_featured: boolean | null;
  end_date: string | null;
  created_at: string;
  creator_profile?: {
    full_name: string | null;
  };
  donors_count?: number;
}

const CATEGORY_MAP: Record<string, string> = {
  education: "Giáo Dục",
  healthcare: "Y Tế",
  disaster_relief: "Cứu Trợ Thiên Tai",
  poverty: "Xóa Đói Giảm Nghèo",
  environment: "Môi Trường",
  animal_welfare: "Bảo Vệ Động Vật",
  community: "Cộng Đồng",
  other: "Khác",
};

const categories = [
  { value: "all", label: "Tất Cả Danh Mục" },
  { value: "education", label: "Giáo Dục" },
  { value: "healthcare", label: "Y Tế" },
  { value: "disaster_relief", label: "Cứu Trợ Thiên Tai" },
  { value: "poverty", label: "Xóa Đói Giảm Nghèo" },
  { value: "environment", label: "Môi Trường" },
  { value: "animal_welfare", label: "Bảo Vệ Động Vật" },
  { value: "community", label: "Cộng Đồng" },
  { value: "other", label: "Khác" },
];

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B ₫`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ₫`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ₫`;
  }
  return `${amount.toLocaleString()} ₫`;
};

const getDaysLeft = (endDate: string | null): number | null => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      // Fetch active campaigns
      const { data: campaignsData, error } = await supabase
        .from("campaigns")
        .select("*")
        .in("status", ["approved", "active"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (campaignsData && campaignsData.length > 0) {
        // Fetch creator profiles
        const creatorIds = [...new Set(campaignsData.map(c => c.creator_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", creatorIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Fetch donors count for each campaign
        const campaignsWithDetails = await Promise.all(
          campaignsData.map(async (campaign) => {
            const { count } = await supabase
              .from("donations")
              .select("*", { count: "exact", head: true })
              .eq("campaign_id", campaign.id)
              .eq("status", "completed");

            return {
              ...campaign,
              creator_profile: profileMap.get(campaign.creator_id),
              donors_count: count || 0,
            };
          })
        );

        setCampaigns(campaignsWithDetails);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (campaign.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory =
      selectedCategory === "all" || campaign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="trending" className="mb-4">
              <Heart className="w-3.5 h-3.5 mr-1" />
              Tạo Tác Động
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Khám Phá <span className="gradient-text">Chiến Dịch</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Duyệt qua các chiến dịch đã được xác minh từ các tổ chức NGO đáng tin cậy trên toàn thế giới.
              Mọi khoản quyên góp đều được ghi nhận on-chain để minh bạch hoàn toàn.
            </p>
            <CreateCampaignModal onCampaignCreated={fetchCampaigns} />
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm chiến dịch..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campaign Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign, index) => {
                const daysLeft = getDaysLeft(campaign.end_date);
                const progress = campaign.goal_amount > 0 
                  ? (campaign.raised_amount / campaign.goal_amount) * 100 
                  : 0;

                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link to={`/campaigns/${campaign.id}`}>
                      <article className="glass-card-hover overflow-hidden group">
                        {/* Image */}
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={campaign.cover_image_url || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60"}
                            alt={campaign.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex gap-2">
                            {campaign.is_verified && (
                              <Badge variant="verified" className="backdrop-blur-sm">
                                <Verified className="w-3 h-3" />
                                Đã Xác Minh
                              </Badge>
                            )}
                            {campaign.is_featured && (
                              <Badge variant="trending" className="backdrop-blur-sm">
                                <TrendingUp className="w-3 h-3" />
                                Nổi Bật
                              </Badge>
                            )}
                          </div>

                          {/* Category */}
                          <div className="absolute bottom-3 left-3">
                            <Badge variant="secondary" className="backdrop-blur-sm">
                              {CATEGORY_MAP[campaign.category] || campaign.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          {campaign.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <MapPin className="w-3.5 h-3.5" />
                              {campaign.location}
                            </div>
                          )}

                          <h3 className="font-display font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {campaign.title}
                          </h3>

                          {campaign.creator_profile?.full_name && (
                            <p className="text-sm text-muted-foreground mb-4">
                              bởi {campaign.creator_profile.full_name}
                            </p>
                          )}

                          {/* Progress */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="font-semibold">
                                {formatCurrency(campaign.raised_amount)}
                              </span>
                              <span className="text-muted-foreground">
                                mục tiêu {formatCurrency(campaign.goal_amount)}
                              </span>
                            </div>
                            <Progress
                              value={Math.min(progress, 100)}
                              className="h-2"
                            />
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {campaign.donors_count || 0} nhà hảo tâm
                            </div>
                            {daysLeft !== null && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                còn {daysLeft} ngày
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!loading && filteredCampaigns.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">Không tìm thấy chiến dịch phù hợp với tiêu chí của bạn.</p>
              <CreateCampaignModal onCampaignCreated={fetchCampaigns} />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Campaigns;
