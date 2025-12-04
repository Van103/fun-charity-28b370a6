import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

const campaigns = [
  {
    id: 1,
    title: "Nước Sạch Cho Vùng Nông Thôn Việt Nam",
    organization: "WaterAid Việt Nam",
    image: "https://images.unsplash.com/photo-1594398901394-4e34939a4fd0?w=800&auto=format&fit=crop&q=60",
    raised: 45000,
    goal: 60000,
    donors: 892,
    daysLeft: 12,
    location: "Việt Nam",
    category: "Nước & Vệ Sinh",
    verified: true,
    trending: true,
  },
  {
    id: 2,
    title: "Giáo Dục Cho Trẻ Em Khó Khăn",
    organization: "Quỹ EduHope",
    image: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800&auto=format&fit=crop&q=60",
    raised: 28500,
    goal: 40000,
    donors: 456,
    daysLeft: 25,
    location: "Ấn Độ",
    category: "Giáo Dục",
    verified: true,
    trending: false,
  },
  {
    id: 3,
    title: "Cứu Trợ Lương Thực Khẩn Cấp - Đông Phi",
    organization: "Mạng Lưới Lương Thực Toàn Cầu",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60",
    raised: 89000,
    goal: 100000,
    donors: 2341,
    daysLeft: 5,
    location: "Kenya",
    category: "Cứu Trợ Lương Thực",
    verified: true,
    trending: true,
  },
  {
    id: 4,
    title: "Vật Tư Y Tế Cho Phòng Khám Vùng Xa",
    organization: "Y Tế Không Biên Giới",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60",
    raised: 32000,
    goal: 50000,
    donors: 678,
    daysLeft: 18,
    location: "Philippines",
    category: "Y Tế",
    verified: true,
    trending: false,
  },
  {
    id: 5,
    title: "Nhà Ở Cho Gia Đình Vô Gia Cư",
    organization: "Sáng Kiến Mái Ấm",
    image: "https://images.unsplash.com/photo-1469022563428-aa04fef9f5a2?w=800&auto=format&fit=crop&q=60",
    raised: 67000,
    goal: 80000,
    donors: 1234,
    daysLeft: 8,
    location: "Brazil",
    category: "Nhà Ở",
    verified: true,
    trending: true,
  },
  {
    id: 6,
    title: "Dự Án Trồng Rừng Amazon",
    organization: "Liên Minh Xanh Trái Đất",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=60",
    raised: 120000,
    goal: 150000,
    donors: 3456,
    daysLeft: 30,
    location: "Brazil",
    category: "Môi Trường",
    verified: true,
    trending: true,
  },
];

const categories = [
  "Tất Cả Danh Mục",
  "Nước & Vệ Sinh",
  "Giáo Dục",
  "Cứu Trợ Lương Thực",
  "Y Tế",
  "Nhà Ở",
  "Môi Trường",
];

const Campaigns = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất Cả Danh Mục");

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Tất Cả Danh Mục" ||
      campaign.category === selectedCategory;
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
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Duyệt qua các chiến dịch đã được xác minh từ các tổ chức NGO đáng tin cậy trên toàn thế giới.
              Mọi khoản quyên góp đều được ghi nhận on-chain để minh bạch hoàn toàn.
            </p>
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
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campaign Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign, index) => (
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
                        src={campaign.image}
                        alt={campaign.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {campaign.verified && (
                          <Badge variant="verified" className="backdrop-blur-sm">
                            <Verified className="w-3 h-3" />
                            Đã Xác Minh
                          </Badge>
                        )}
                        {campaign.trending && (
                          <Badge variant="trending" className="backdrop-blur-sm">
                            <TrendingUp className="w-3 h-3" />
                            Nổi Bật
                          </Badge>
                        )}
                      </div>

                      {/* Category */}
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="secondary" className="backdrop-blur-sm">
                          {campaign.category}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        {campaign.location}
                      </div>

                      <h3 className="font-display font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {campaign.title}
                      </h3>

                      <p className="text-sm text-muted-foreground mb-4">
                        bởi {campaign.organization}
                      </p>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-semibold">
                            ${campaign.raised.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            mục tiêu ${campaign.goal.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={(campaign.raised / campaign.goal) * 100}
                          className="h-2"
                        />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {campaign.donors} nhà hảo tâm
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          còn {campaign.daysLeft} ngày
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Không tìm thấy chiến dịch phù hợp với tiêu chí của bạn.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Campaigns;
