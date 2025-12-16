import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LeftSidebar } from "@/components/social/LeftSidebar";
import { RightSidebar } from "@/components/social/RightSidebar";
import { CreatePostBox } from "@/components/social/CreatePostBox";
import { SocialPostCard } from "@/components/social/SocialPostCard";
import { PostCardSkeletonList, PostCardSkeleton } from "@/components/social/PostCardSkeleton";
import { PullToRefresh } from "@/components/social/PullToRefresh";
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
import { Camera, Edit, User as UserIcon } from "lucide-react";
import { EditProfileModal } from "@/components/profile/EditProfileModal";

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
            {/* Cover Image */}
            <div className="relative h-48 md:h-64 lg:h-80 bg-gradient-to-r from-secondary/30 to-primary/30 overflow-hidden">
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
                className="absolute bottom-4 right-4 gap-2"
                onClick={() => setEditModalOpen(true)}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Chỉnh sửa ảnh bìa</span>
              </Button>
            </div>

            {/* Profile Info Section */}
            <div className="container mx-auto px-4">
              <div className="relative flex flex-col md:flex-row md:items-end gap-4 pb-4">
                {/* Avatar */}
                <div className="relative -mt-16 md:-mt-20">
                  <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-xl">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Avatar"} />
                    <AvatarFallback className="bg-secondary/20 text-4xl">
                      <UserIcon className="w-16 h-16 text-secondary" />
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    onClick={() => setEditModalOpen(true)}
                    className="absolute bottom-2 right-2 p-2 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Name and Info */}
                <div className="flex-1 md:pb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {profile?.full_name || "Chưa đặt tên"}
                  </h1>
                  {profile?.bio && (
                    <p className="text-muted-foreground mt-1 max-w-lg">{profile.bio}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {profile?.reputation_score && profile.reputation_score > 0 && (
                      <span>⭐ {profile.reputation_score} điểm uy tín</span>
                    )}
                    {profile?.is_verified && (
                      <span className="text-secondary">✓ Đã xác minh</span>
                    )}
                  </div>
                </div>

                {/* Edit Button */}
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    className="gap-2"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Edit className="w-4 h-4" />
                    Chỉnh sửa hồ sơ
                  </Button>
                </div>
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
                    <CreatePostBox profile={profile} />
                    
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
      {profile && (
        <EditProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          profile={profile}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}
