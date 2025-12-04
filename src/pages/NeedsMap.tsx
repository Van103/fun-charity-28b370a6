import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Search,
  Filter,
  AlertTriangle,
  Users,
  Clock,
  Verified,
  Zap,
  Heart,
  Building2,
  Phone,
} from "lucide-react";

const needs = [
  {
    id: 1,
    title: "Cần Vật Tư Y Tế Khẩn Cấp",
    location: "TP. Hồ Chí Minh, Việt Nam",
    coordinates: { lat: 10.8231, lng: 106.6297 },
    urgency: "critical",
    type: "Y Tế",
    organization: "Hội Chữ Thập Đỏ Việt Nam",
    verified: true,
    eta: "2-3 ngày",
    description: "Cần gấp vật tư y tế cho nạn nhân lũ lụt",
    beneficiaries: 500,
    matched: false,
  },
  {
    id: 2,
    title: "Phân Phối Nước Sạch",
    location: "Đồng Bằng Sông Cửu Long, Việt Nam",
    coordinates: { lat: 10.0452, lng: 105.7469 },
    urgency: "high",
    type: "Nước & Vệ Sinh",
    organization: "WaterAid Việt Nam",
    verified: true,
    eta: "1 tuần",
    description: "Cần viên lọc nước và bộ lọc nước",
    beneficiaries: 1200,
    matched: true,
  },
  {
    id: 3,
    title: "Đồ Dùng Học Tập Cho Trẻ Em Vùng Cao",
    location: "Sapa, Việt Nam",
    coordinates: { lat: 22.3363, lng: 103.8438 },
    urgency: "medium",
    type: "Giáo Dục",
    organization: "Quỹ EduHope",
    verified: true,
    eta: "2 tuần",
    description: "Sách, vở và dụng cụ viết",
    beneficiaries: 350,
    matched: false,
  },
  {
    id: 4,
    title: "Gói Thực Phẩm Cho Người Cao Tuổi",
    location: "Hà Nội, Việt Nam",
    coordinates: { lat: 21.0285, lng: 105.8542 },
    urgency: "high",
    type: "An Ninh Lương Thực",
    organization: "Hội Chữ Thập Đỏ Việt Nam",
    verified: true,
    eta: "3-5 ngày",
    description: "Gói thực phẩm hàng tháng cho 200 hộ gia đình người cao tuổi",
    beneficiaries: 200,
    matched: false,
  },
];

const urgencyColors = {
  critical: "bg-destructive text-destructive-foreground animate-pulse",
  high: "bg-warning text-warning-foreground",
  medium: "bg-secondary text-secondary-foreground",
  low: "bg-muted text-muted-foreground",
};

const urgencyLabels = {
  critical: "Cấp Bách",
  high: "Cao",
  medium: "Trung Bình",
  low: "Thấp",
};

const NeedsMap = () => {
  const [selectedUrgency, setSelectedUrgency] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNeeds = needs.filter((need) => {
    const matchesUrgency = selectedUrgency === "all" || need.urgency === selectedUrgency;
    const matchesType = selectedType === "all" || need.type === selectedType;
    const matchesSearch = need.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         need.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUrgency && matchesType && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge variant="urgent" className="mb-4">
              <Zap className="w-3.5 h-3.5 mr-1" />
              Kết Nối Realtime
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Bản Đồ <span className="gradient-text">Nhu Cầu</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Khám phá nhu cầu từ thiện realtime. Smart matching engine kết nối nguồn lực với nhu cầu phù hợp.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo địa điểm hoặc tiêu đề..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
              <SelectTrigger className="w-full md:w-[180px]">
                <AlertTriangle className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Mức độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Mức Độ</SelectItem>
                <SelectItem value="critical">Cấp Bách</SelectItem>
                <SelectItem value="high">Cao</SelectItem>
                <SelectItem value="medium">Trung Bình</SelectItem>
                <SelectItem value="low">Thấp</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Loại</SelectItem>
                <SelectItem value="Y Tế">Y Tế</SelectItem>
                <SelectItem value="Nước & Vệ Sinh">Nước & Vệ Sinh</SelectItem>
                <SelectItem value="Giáo Dục">Giáo Dục</SelectItem>
                <SelectItem value="An Ninh Lương Thực">An Ninh Lương Thực</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Map Placeholder */}
            <div className="lg:col-span-2">
              <div className="glass-card p-6 h-[500px] flex items-center justify-center luxury-border relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_hsl(43_55%_52%_/_0.1),_transparent_50%)]" />
                
                {/* Map pins visualization */}
                <div className="relative w-full h-full">
                  {filteredNeeds.map((need, index) => (
                    <motion.div
                      key={need.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="absolute cursor-pointer group"
                      style={{
                        left: `${20 + (index * 20)}%`,
                        top: `${30 + (index * 15)}%`,
                      }}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        need.urgency === "critical" ? "bg-destructive animate-pulse" :
                        need.urgency === "high" ? "bg-warning" : "bg-secondary"
                      }`}>
                        <MapPin className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                        <div className="bg-card p-2 rounded-lg shadow-lg text-xs whitespace-nowrap border border-border">
                          {need.title}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="absolute bottom-4 left-4 flex gap-2">
                  <Badge variant="destructive" className="text-xs">Cấp Bách</Badge>
                  <Badge variant="warning" className="text-xs">Cao</Badge>
                  <Badge variant="secondary" className="text-xs">Trung Bình</Badge>
                </div>
              </div>
            </div>

            {/* Needs List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Nhu Cầu Đang Hoạt Động ({filteredNeeds.length})</h3>
                <Button variant="hero" size="sm">
                  <Zap className="w-4 h-4" />
                  Kết Nối Thông Minh
                </Button>
              </div>

              {filteredNeeds.map((need, index) => (
                <motion.div
                  key={need.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-4 luxury-border hover:border-secondary/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={urgencyColors[need.urgency as keyof typeof urgencyColors]}>
                      {urgencyLabels[need.urgency as keyof typeof urgencyLabels]}
                    </Badge>
                    {need.verified && (
                      <Badge variant="verified">
                        <Verified className="w-3 h-3" />
                        Đã Xác Minh
                      </Badge>
                    )}
                  </div>

                  <h4 className="font-semibold mb-1 line-clamp-1">{need.title}</h4>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    {need.location}
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {need.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {need.organization}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {need.beneficiaries} người thụ hưởng
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3 text-secondary" />
                      <span className="text-secondary font-medium">Dự kiến: {need.eta}</span>
                    </div>
                    {need.matched ? (
                      <Badge variant="success" className="text-xs">Đã Kết Nối</Badge>
                    ) : (
                      <Button variant="outline" size="sm" className="text-xs h-7">
                        <Heart className="w-3 h-3" />
                        Hỗ Trợ
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default NeedsMap;
