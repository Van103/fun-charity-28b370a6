import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Heart,
  Users,
  Building2,
  Star,
  Award,
  Trophy,
  Shield,
  Verified,
  TrendingUp,
  ExternalLink,
  Calendar,
  MapPin,
  Wallet,
} from "lucide-react";

const profiles = {
  donors: [
    {
      id: 1,
      name: "Sarah Nguyễn",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
      wallet: "0x1a2b...3c4d",
      reputation: 4.9,
      totalDonated: 15000,
      campaigns: 23,
      badges: ["Kim Cương", "Tiên Phong", "Nhà Vô Địch Tác Động"],
      verified: true,
      joinedDate: "Tháng 1, 2024",
    },
    {
      id: 2,
      name: "Quỹ Tech4Good",
      avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200",
      wallet: "tech4good.eth",
      reputation: 5.0,
      totalDonated: 50000,
      campaigns: 15,
      badges: ["Anh Hùng Doanh Nghiệp", "Bạch Kim"],
      verified: true,
      joinedDate: "Tháng 12, 2023",
    },
  ],
  volunteers: [
    {
      id: 3,
      name: "Minh Trần",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      wallet: "0x5e6f...7g8h",
      reputation: 4.7,
      hoursVolunteered: 120,
      tasksCompleted: 45,
      badges: ["Siêu Tình Nguyện Viên", "Lãnh Đạo Cộng Đồng"],
      verified: true,
      joinedDate: "Tháng 2, 2024",
    },
  ],
  ngos: [
    {
      id: 4,
      name: "WaterAid Việt Nam",
      avatar: "https://images.unsplash.com/photo-1594398901394-4e34939a4fd0?w=200",
      wallet: "wateraid.eth",
      reputation: 4.9,
      totalRaised: 250000,
      campaigns: 12,
      beneficiaries: 15000,
      badges: ["NGO Đã Xác Minh", "Nhà Vô Địch Minh Bạch", "Hiệu Suất Cao"],
      verified: true,
      kycStatus: "Đã Xác Minh",
      location: "TP. Hồ Chí Minh, Việt Nam",
    },
  ],
};

const Profiles = () => {
  const [activeTab, setActiveTab] = useState("donors");

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <Badge variant="gold" className="mb-4">
              <Users className="w-3.5 h-3.5 mr-1" />
              Hồ Sơ Cộng Đồng
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Cộng Đồng</span> Của Chúng Ta
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Khám phá hồ sơ của Nhà Hảo Tâm, Tình Nguyện Viên và Tổ Chức. Uy tín được xác minh on-chain.
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-center mb-8 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="donors" className="gap-2 rounded-lg">
                <Heart className="w-4 h-4" />
                Nhà Hảo Tâm
              </TabsTrigger>
              <TabsTrigger value="volunteers" className="gap-2 rounded-lg">
                <Users className="w-4 h-4" />
                Tình Nguyện Viên
              </TabsTrigger>
              <TabsTrigger value="ngos" className="gap-2 rounded-lg">
                <Building2 className="w-4 h-4" />
                Tổ Chức
              </TabsTrigger>
            </TabsList>

            {/* Donors Tab */}
            <TabsContent value="donors">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.donors.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card p-6 luxury-border"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-16 h-16 border-2 border-secondary">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback>{profile.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold">{profile.name}</h3>
                          {profile.verified && <Verified className="w-4 h-4 text-secondary" />}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                          <Wallet className="w-3 h-3" />
                          {profile.wallet}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          Tham gia {profile.joinedDate}
                        </div>
                      </div>
                    </div>

                    {/* Reputation */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(profile.reputation)
                                ? "text-secondary fill-secondary"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold">{profile.reputation}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-xl">
                        <div className="font-display font-bold text-secondary">
                          ${profile.totalDonated.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Tổng Quyên Góp</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-xl">
                        <div className="font-display font-bold">{profile.campaigns}</div>
                        <div className="text-xs text-muted-foreground">Chiến Dịch</div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {profile.badges.map((badge) => (
                        <Badge key={badge} variant="donor" className="text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Volunteers Tab */}
            <TabsContent value="volunteers">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.volunteers.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card p-6 luxury-border"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-16 h-16 border-2 border-primary">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback>{profile.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold">{profile.name}</h3>
                          {profile.verified && <Verified className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                          <Wallet className="w-3 h-3" />
                          {profile.wallet}
                        </div>
                      </div>
                    </div>

                    {/* Reputation */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(profile.reputation)
                                ? "text-secondary fill-secondary"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold">{profile.reputation}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-xl">
                        <div className="font-display font-bold text-primary">
                          {profile.hoursVolunteered} giờ
                        </div>
                        <div className="text-xs text-muted-foreground">Số Giờ</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-xl">
                        <div className="font-display font-bold">{profile.tasksCompleted}</div>
                        <div className="text-xs text-muted-foreground">Nhiệm Vụ</div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {profile.badges.map((badge) => (
                        <Badge key={badge} variant="volunteer" className="text-xs">
                          <Trophy className="w-3 h-3 mr-1" />
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* NGOs Tab */}
            <TabsContent value="ngos">
              <div className="grid md:grid-cols-2 gap-6">
                {profiles.ngos.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card p-6 luxury-border"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-20 h-20 border-2 border-success rounded-xl">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback>{profile.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold text-lg">{profile.name}</h3>
                          {profile.verified && <Verified className="w-5 h-5 text-success" />}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono mb-1">
                          <Wallet className="w-3 h-3" />
                          {profile.wallet}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {profile.location}
                        </div>
                        <Badge variant="success" className="mt-2 text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          KYC {profile.kycStatus}
                        </Badge>
                      </div>
                    </div>

                    {/* Reputation */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(profile.reputation)
                                ? "text-secondary fill-secondary"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold">{profile.reputation}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-xl">
                        <div className="font-display font-bold text-success">
                          ${(profile.totalRaised / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-muted-foreground">Đã Gây Quỹ</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-xl">
                        <div className="font-display font-bold">{profile.campaigns}</div>
                        <div className="text-xs text-muted-foreground">Chiến Dịch</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-xl">
                        <div className="font-display font-bold">
                          {(profile.beneficiaries / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-muted-foreground">Đã Hỗ Trợ</div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {profile.badges.map((badge) => (
                        <Badge key={badge} variant="ngo" className="text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Profiles;
