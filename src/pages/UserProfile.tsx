import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LeftSidebar } from "@/components/social/LeftSidebar";
import { RightSidebar } from "@/components/social/RightSidebar";
import { StoriesSection } from "@/components/social/StoriesSection";
import { FriendRequestsSection } from "@/components/social/FriendRequestsSection";
import { CreatePostBox } from "@/components/social/CreatePostBox";
import { SocialPostCard } from "@/components/social/SocialPostCard";
import { PostCardSkeletonList, PostCardSkeleton } from "@/components/social/PostCardSkeleton";
import { PullToRefresh } from "@/components/social/PullToRefresh";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  useInfiniteFeedPosts, 
  useIntersectionObserver,
} from "@/hooks/useFeedPosts";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Edit, MapPin, Calendar, Briefcase, User as UserIcon } from "lucide-react";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          <div className="bg-card border-b border-border">
            {/* Cover Photo */}
            <div className="relative h-48 md:h-64 lg:h-80 bg-gradient-luxury">
              {profile?.cover_url ? (
                <img 
                  src={profile.cover_url} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-secondary/30 to-accent/30" />
              )}
              <button 
                onClick={() => setEditModalOpen(true)}
                className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-background transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm font-medium">Chỉnh sửa ảnh bìa</span>
              </button>
            </div>

            {/* Profile Info Section */}
            <div className="container mx-auto px-4">
              <div className="relative flex flex-col md:flex-row md:items-end gap-4 pb-4">
                {/* Avatar */}
                <div className="relative -mt-16 md:-mt-20">
                  <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg">
                    <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
                    <AvatarFallback className="text-4xl bg-secondary/20 text-secondary">
                      {profile?.full_name?.charAt(0) || <UserIcon className="w-12 h-12" />}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    onClick={() => setEditModalOpen(true)}
                    className="absolute bottom-2 right-2 bg-muted p-2 rounded-full hover:bg-muted/80 transition-colors border border-border"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Name and Info */}
                <div className="flex-1 md:pb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{profile?.full_name || "Chưa cập nhật tên"}</h1>
                  {profile?.bio && (
                    <p className="text-muted-foreground mt-1">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {profile?.role && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {profile.role === 'donor' ? 'Nhà hảo tâm' : 
                         profile.role === 'volunteer' ? 'Tình nguyện viên' :
                         profile.role === 'ngo' ? 'Tổ chức NGO' : 'Người thụ hưởng'}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Tham gia FUN Charity
                    </span>
                  </div>
                </div>

                {/* Edit Button */}
                <Button 
                  variant="outline" 
                  onClick={() => setEditModalOpen(true)}
                  className="self-start md:self-end"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa hồ sơ
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-6">
            <div className="flex gap-6">
              {/* Left Sidebar - Hidden on mobile */}
              <div className="hidden lg:block">
                <LeftSidebar profile={profile} />
              </div>

              {/* Main Feed */}
              <div className="flex-1 max-w-2xl mx-auto lg:mx-0">
                <PullToRefresh onRefresh={handleRefresh}>
                  <div className="space-y-6">
                    <StoriesSection />
                    <CreatePostBox profile={profile} />
                    <FriendRequestsSection />
                    
                    {/* Posts Feed */}
                    <div className="space-y-6">
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
              </div>

              {/* Right Sidebar - Hidden on mobile/tablet */}
              <div className="hidden xl:block">
                <RightSidebar />
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        profile={profile}
        onUpdate={handleProfileUpdate}
      />
    </>
  );
}
