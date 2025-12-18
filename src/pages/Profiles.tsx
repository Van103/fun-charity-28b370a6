import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Heart,
  Users,
  Building2,
  Star,
  Award,
  Trophy,
  Shield,
  Verified,
  Calendar,
  MapPin,
  Wallet,
  UserPlus,
  MessageCircle,
  Loader2,
} from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "donor" | "volunteer" | "ngo" | "beneficiary" | null;
  reputation_score: number | null;
  is_verified: boolean | null;
  wallet_address: string | null;
  created_at: string | null;
}

const Profiles = () => {
  const [activeTab, setActiveTab] = useState("donors");
  const [donors, setDonors] = useState<Profile[]>([]);
  const [volunteers, setVolunteers] = useState<Profile[]>([]);
  const [ngos, setNgos] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("reputation_score", { ascending: false });

      if (error) throw error;

      if (data) {
        // Filter by role
        setDonors(data.filter((p) => p.role === "donor"));
        setVolunteers(data.filter((p) => p.role === "volunteer"));
        setNgos(data.filter((p) => p.role === "ngo"));
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (address: string | null) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  };

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

  const ProfileCard = ({ profile, type }: { profile: Profile; type: "donor" | "volunteer" | "ngo" }) => {
    const borderColor = type === "donor" ? "border-secondary" : type === "volunteer" ? "border-primary" : "border-success";
    const badgeVariant = type === "donor" ? "donor" : type === "volunteer" ? "volunteer" : "ngo";
    const roleLabel = type === "donor" ? "Nhà Hảo Tâm" : type === "volunteer" ? "Tình Nguyện Viên" : "Tổ Chức";
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 luxury-border hover:shadow-lg transition-shadow"
      >
        <div className="flex items-start gap-4 mb-4">
          <Link to={`/user/${profile.user_id}`}>
            <Avatar className={`w-16 h-16 border-2 ${borderColor} cursor-pointer hover:opacity-80 transition-opacity`}>
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className={`bg-gradient-to-br ${getAvatarGradient(profile.full_name || "U")} text-white font-medium`}>
                {profile.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link to={`/user/${profile.user_id}`} className="hover:underline">
                <h3 className="font-display font-semibold">{profile.full_name || "Người dùng"}</h3>
              </Link>
              {profile.is_verified && <Verified className="w-4 h-4 text-secondary" />}
            </div>
            {profile.wallet_address && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                <Wallet className="w-3 h-3" />
                {shortenAddress(profile.wallet_address)}
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" />
              Tham gia {formatDate(profile.created_at)}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{profile.bio}</p>
        )}

        {/* Reputation */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor((profile.reputation_score || 0) / 20)
                    ? "text-secondary fill-secondary"
                    : "text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold">{profile.reputation_score || 0} điểm</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <div className="font-display font-bold text-primary">
              {profile.reputation_score || 0}
            </div>
            <div className="text-xs text-muted-foreground">Điểm Uy Tín</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <Badge variant={badgeVariant} className="text-xs">
              <Award className="w-3 h-3 mr-1" />
              {roleLabel}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link to={`/user/${profile.user_id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <UserPlus className="w-4 h-4" />
              Xem hồ sơ
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="glass-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-4" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
        {type === "donors" && <Heart className="w-8 h-8 text-muted-foreground" />}
        {type === "volunteers" && <Users className="w-8 h-8 text-muted-foreground" />}
        {type === "ngos" && <Building2 className="w-8 h-8 text-muted-foreground" />}
      </div>
      <h3 className="font-semibold text-lg mb-2">Chưa có {type === "donors" ? "nhà hảo tâm" : type === "volunteers" ? "tình nguyện viên" : "tổ chức"} nào</h3>
      <p className="text-muted-foreground text-sm">
        Hãy là người đầu tiên tham gia cộng đồng của chúng tôi!
      </p>
    </div>
  );

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
                {!loading && <span className="ml-1 text-xs bg-secondary/20 px-1.5 py-0.5 rounded-full">{donors.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="volunteers" className="gap-2 rounded-lg">
                <Users className="w-4 h-4" />
                Tình Nguyện Viên
                {!loading && <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">{volunteers.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="ngos" className="gap-2 rounded-lg">
                <Building2 className="w-4 h-4" />
                Tổ Chức
                {!loading && <span className="ml-1 text-xs bg-success/20 px-1.5 py-0.5 rounded-full">{ngos.length}</span>}
              </TabsTrigger>
            </TabsList>

            {/* Donors Tab */}
            <TabsContent value="donors">
              {loading ? (
                <LoadingSkeleton />
              ) : donors.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {donors.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} type="donor" />
                  ))}
                </div>
              ) : (
                <EmptyState type="donors" />
              )}
            </TabsContent>

            {/* Volunteers Tab */}
            <TabsContent value="volunteers">
              {loading ? (
                <LoadingSkeleton />
              ) : volunteers.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {volunteers.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} type="volunteer" />
                  ))}
                </div>
              ) : (
                <EmptyState type="volunteers" />
              )}
            </TabsContent>

            {/* NGOs Tab */}
            <TabsContent value="ngos">
              {loading ? (
                <LoadingSkeleton />
              ) : ngos.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {ngos.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} type="ngo" />
                  ))}
                </div>
              ) : (
                <EmptyState type="ngos" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Profiles;
