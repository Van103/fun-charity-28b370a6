import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProfileIntroCard } from "@/components/profile/ProfileIntroCard";
import { FriendsPreviewCard } from "@/components/profile/FriendsPreviewCard";
import { CreatePostBox } from "@/components/social/CreatePostBox";
import { SocialPostCard } from "@/components/social/SocialPostCard";
import { PostCardSkeletonList, PostCardSkeleton } from "@/components/social/PostCardSkeleton";
import { PullToRefresh } from "@/components/social/PullToRefresh";
import { PhotosPreviewCard, PhotosTab } from "@/components/profile/PhotosTab";
import { DonationHistoryCard } from "@/components/donations/DonationHistoryCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { 
  useInfiniteFeedPosts, 
  useIntersectionObserver,
} from "@/hooks/useFeedPosts";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Edit, User as UserIcon, Plus, ChevronDown } from "lucide-react";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFriendsCount, useFriendsPreview, formatFriendsCount } from "@/hooks/useFriendshipData";

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
  wallet_address: string | null;
}

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real friends data
  const { count: friendsCount } = useFriendsCount(profile?.user_id || null);
  const { friends: friendsPreview } = useFriendsPreview(profile?.user_id || null, 8);

  const { 
    posts, 
    isLoading: postsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteFeedPosts({});

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["infinite-feed-posts"] });
  }, [queryClient]);

  // Intersection observer callback for infinite scroll
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const loadMoreRef = useIntersectionObserver(loadMore, {
    rootMargin: "200px",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data as Profile);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải hồ sơ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  const tabs = [
    { id: "posts", label: "Bài viết" },
    { id: "donations", label: "Quyên góp" },
    { id: "about", label: "Giới thiệu" },
    { id: "friends", label: "Bạn bè" },
    { id: "photos", label: "Ảnh" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{profile?.full_name || "Hồ Sơ"} - FUN Charity</title>
        <meta name="description" content="Trang cá nhân của bạn trên FUN Charity - Nền tảng từ thiện minh bạch" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-16">
          {/* Facebook-style Profile Header */}
          <div className="bg-card shadow-sm">
            {/* Cover Image - Full width */}
            <div className="relative max-w-5xl mx-auto">
              <div className="relative h-[200px] sm:h-[280px] md:h-[350px] bg-gradient-to-r from-secondary/30 to-primary/30 overflow-hidden rounded-b-lg">
                {profile?.cover_url ? (
                  <img 
                    src={profile.cover_url} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-secondary/20 via-primary/10 to-secondary/20" />
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-4 right-4 gap-2 bg-white/90 hover:bg-white text-foreground shadow-md"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Chỉnh sửa ảnh bìa</span>
                </Button>
              </div>

              {/* Profile Info Section - Facebook style */}
              <div className="relative px-4 pb-4">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  {/* Avatar - Overlapping cover */}
                  <div className="relative -mt-[70px] md:-mt-[85px] z-10">
                    <Avatar className="w-[140px] h-[140px] md:w-[170px] md:h-[170px] border-4 border-card shadow-xl ring-4 ring-card">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Avatar"} />
                      <AvatarFallback className="bg-secondary/20 text-5xl">
                        <UserIcon className="w-20 h-20 text-secondary" />
                      </AvatarFallback>
                    </Avatar>
                    <button 
                      onClick={() => setEditModalOpen(true)}
                      className="absolute bottom-3 right-3 p-2.5 bg-muted hover:bg-muted/80 rounded-full transition-colors shadow-md border border-border"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Name and Stats */}
                  <div className="flex-1 md:pb-4 md:pl-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      {profile?.full_name || "Chưa đặt tên"}
                      {profile?.is_verified && (
                        <span className="ml-2 text-primary">✓</span>
                      )}
                    </h1>
                    <p className="text-muted-foreground font-medium">{formatFriendsCount(friendsCount)}</p>
                    
                    {/* Friends Avatars Preview - Real Data */}
                    {friendsPreview.length > 0 && (
                      <div className="flex -space-x-2 mt-2">
                        {friendsPreview.map((friend) => (
                          <Avatar 
                            key={friend.user_id}
                            className="w-8 h-8 border-2 border-card"
                          >
                            <AvatarImage src={friend.avatar_url || undefined} alt={friend.full_name || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-secondary/40 to-primary/40 text-xs">
                              {friend.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pb-4">
                    <Button className="gap-2 bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4" />
                      Thêm vào tin
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="gap-2"
                      onClick={() => setEditModalOpen(true)}
                    >
                      <Edit className="w-4 h-4" />
                      Chỉnh sửa trang cá nhân
                    </Button>
                    <Button variant="outline" size="icon">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border mt-4 pt-1">
                  {/* Navigation Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-4 text-sm font-semibold whitespace-nowrap transition-colors relative ${
                          activeTab === tab.id
                            ? "text-primary"
                            : "text-muted-foreground hover:bg-muted/50 rounded-lg"
                        }`}
                      >
                        {tab.label}
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />
                        )}
                      </button>
                    ))}
                    <button className="px-4 py-4 text-sm font-semibold text-muted-foreground hover:bg-muted/50 rounded-lg flex items-center gap-1">
                      Xem thêm
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Two Column Layout like Facebook */}
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left Column - Intro/About */}
              <div className="lg:w-[360px] shrink-0 space-y-4">
                <ProfileIntroCard profile={profile} onEdit={() => setEditModalOpen(true)} />
                
                {/* Photos Preview Card */}
                <div className="glass-card overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">Ảnh</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary/80"
                      onClick={() => setPhotosModalOpen(true)}
                    >
                      Xem tất cả ảnh
                    </Button>
                  </div>
                  <div className="px-4 pb-4">
                    <PhotosPreviewCard 
                      userId={profile?.user_id || null} 
                      onViewAll={() => setPhotosModalOpen(true)} 
                    />
                  </div>
                </div>

                {/* Friends Preview Card */}
                <FriendsPreviewCard userId={profile?.user_id || ""} />

                {/* Donation History Card */}
                <DonationHistoryCard userId={profile?.user_id || null} limit={5} />
              </div>

              {/* Right Column - Content based on active tab */}
              <div className="flex-1 min-w-0">
                {activeTab === "posts" && (
                  <PullToRefresh onRefresh={handleRefresh}>
                    <div className="space-y-4">
                      <CreatePostBox profile={profile} />
                      
                      {/* Posts Feed */}
                      <div className="space-y-4">
                        {postsLoading ? (
                          <PostCardSkeletonList count={3} />
                        ) : posts && posts.length > 0 ? (
                          <>
                            {posts.map((post) => (
                              <SocialPostCard key={post.id} post={post} />
                            ))}
                            
                            {/* Load More Trigger */}
                            <div ref={loadMoreRef} className="py-4">
                              {isFetchingNextPage && (
                                <PostCardSkeleton />
                              )}
                              {!hasNextPage && posts.length > 0 && (
                                <p className="text-center text-sm text-muted-foreground">
                                  Bạn đã xem hết tất cả bài viết 🎉
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="glass-card p-12 text-center">
                            <p className="text-muted-foreground">
                              Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </PullToRefresh>
                )}

                {activeTab === "donations" && (
                  <DonationHistoryCard 
                    userId={profile?.user_id || null} 
                    limit={20} 
                    showViewAll={false} 
                  />
                )}

                {activeTab === "about" && (
                  <div className="glass-card p-6">
                    <h3 className="font-bold text-lg mb-4">Giới thiệu</h3>
                    <p className="text-muted-foreground">
                      {profile?.bio || "Chưa có thông tin giới thiệu."}
                    </p>
                  </div>
                )}

                {activeTab === "friends" && (
                  <FriendsPreviewCard userId={profile?.user_id || ""} />
                )}

                {activeTab === "photos" && (
                  <div className="glass-card p-6">
                    <PhotosTab userId={profile?.user_id || null} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          profile={profile}
          onUpdate={handleProfileUpdate}
        />
      )}

      {/* Photos Modal */}
      <Dialog open={photosModalOpen} onOpenChange={setPhotosModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Ảnh</DialogTitle>
          </DialogHeader>
          <PhotosTab userId={profile?.user_id || null} />
        </DialogContent>
      </Dialog>
    </>
  );
}
