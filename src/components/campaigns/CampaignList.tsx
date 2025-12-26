import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCampaignApi, Campaign, CampaignFilters } from '@/hooks/useCampaignApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  MapPin,
  Users,
  Clock,
  Verified,
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const CATEGORY_MAP: Record<string, string> = {
  education: 'Giáo Dục',
  healthcare: 'Y Tế',
  disaster_relief: 'Cứu Trợ Thiên Tai',
  poverty: 'Xóa Đói Giảm Nghèo',
  environment: 'Môi Trường',
  animal_welfare: 'Bảo Vệ Động Vật',
  community: 'Cộng Đồng',
  other: 'Khác',
};

const categories = [
  { value: 'all', label: 'Tất Cả Danh Mục' },
  { value: 'education', label: 'Giáo Dục' },
  { value: 'healthcare', label: 'Y Tế' },
  { value: 'disaster_relief', label: 'Cứu Trợ Thiên Tai' },
  { value: 'poverty', label: 'Xóa Đói Giảm Nghèo' },
  { value: 'environment', label: 'Môi Trường' },
  { value: 'animal_welfare', label: 'Bảo Vệ Động Vật' },
  { value: 'community', label: 'Cộng Đồng' },
  { value: 'other', label: 'Khác' },
];

const sortOptions = [
  { value: 'created_at:desc', label: 'Mới nhất' },
  { value: 'created_at:asc', label: 'Cũ nhất' },
  { value: 'raised_amount:desc', label: 'Quyên góp cao nhất' },
  { value: 'goal_amount:desc', label: 'Mục tiêu cao nhất' },
  { value: 'end_date:asc', label: 'Sắp kết thúc' },
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

interface CampaignListProps {
  initialFilters?: CampaignFilters;
  showFilters?: boolean;
  limit?: number;
  className?: string;
}

export function CampaignList({
  initialFilters = {},
  showFilters = true,
  limit = 12,
  className = '',
}: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || 'all');
  const [sortBy, setSortBy] = useState('created_at:desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { loading, listCampaigns } = useCampaignApi();

  useEffect(() => {
    fetchCampaigns();
  }, [selectedCategory, sortBy, currentPage]);

  const fetchCampaigns = async () => {
    const [sortField, sortOrder] = sortBy.split(':');
    const filters: CampaignFilters = {
      ...initialFilters,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchQuery || undefined,
      sort_by: sortField,
      sort_order: sortOrder as 'asc' | 'desc',
      page: currentPage,
      limit,
      status: 'active',
    };

    const result = await listCampaigns(filters);
    setCampaigns(result.campaigns);
    if (result.pagination) {
      setTotalPages(result.pagination.total_pages);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCampaigns();
  };

  return (
    <div className={className}>
      {showFilters && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm chiến dịch..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, index) => {
              const daysLeft = getDaysLeft(campaign.end_date);
              const progress =
                campaign.goal_amount > 0
                  ? (campaign.raised_amount / campaign.goal_amount) * 100
                  : 0;

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link to={`/campaigns/${campaign.id}`}>
                    <article className="glass-card-hover overflow-hidden group">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={
                            campaign.cover_image_url ||
                            'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60'
                          }
                          alt={campaign.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />

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

                        <div className="absolute bottom-3 left-3">
                          <Badge variant="secondary" className="backdrop-blur-sm">
                            {CATEGORY_MAP[campaign.category] || campaign.category}
                          </Badge>
                        </div>
                      </div>

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

                        {campaign.creator?.full_name && (
                          <p className="text-sm text-muted-foreground mb-4">
                            bởi {campaign.creator.full_name}
                          </p>
                        )}

                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-semibold">
                              {formatCurrency(campaign.raised_amount)}
                            </span>
                            <span className="text-muted-foreground">
                              mục tiêu {formatCurrency(campaign.goal_amount)}
                            </span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {campaign.stats?.donor_count || 0} nhà hảo tâm
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

          {campaigns.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                Không tìm thấy chiến dịch phù hợp với tiêu chí của bạn.
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
