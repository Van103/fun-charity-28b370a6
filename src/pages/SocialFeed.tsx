import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SwipeIndicator } from "@/components/layout/SwipeIndicator";
import { LeftSidebar } from "@/components/social/LeftSidebar";
import { RightSidebar } from "@/components/social/RightSidebar";
import { StoriesSection } from "@/components/social/StoriesSection";
import { FriendRequestsSection } from "@/components/social/FriendRequestsSection";
import { CreatePostBox } from "@/components/social/CreatePostBox";
import { SocialPostCard } from "@/components/social/SocialPostCard";
import { PostCardSkeletonList, PostCardSkeleton } from "@/components/social/PostCardSkeleton";
import { PullToRefresh } from "@/components/social/PullToRefresh";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { 
  useInfiniteFeedPosts, 
  useIntersectionObserver
} from "@/hooks/useFeedPosts";
import { useQueryClient } from "@tanstack/react-query";
import { useFriendRequestNotifications } from "@/hooks/useFriendNotifications";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
}

export default function SocialFeed() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get scrollToPostId from navigation state
  useEffect(() => {
    const state = location.state as { scrollToPostId?: string } | null;
    if (state?.scrollToPostId) {
      setHighlightPostId(state.scrollToPostId);
      // Clear the state after getting the ID
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
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

  // Enable realtime friend notifications
  useFriendRequestNotifications(profile?.user_id || null);

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

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 sm:pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-secondary" />
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Bảng Tin - FUN Charity</title>
        <meta name="description" content="Xem bảng tin xã hội, kết nối với cộng đồng từ thiện minh bạch trên FUN Charity" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-16 sm:pt-20 pb-24 md:pb-12">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="flex gap-4 lg:gap-6">
              {/* Left Sidebar - Hidden on mobile/tablet */}
              <div className="hidden lg:block">
                <LeftSidebar profile={profile} />
              </div>

              {/* Main Feed - full width on mobile */}
              <div className="flex-1 w-full max-w-2xl mx-auto lg:mx-0">
                <PullToRefresh onRefresh={handleRefresh}>
                  <div className="space-y-4 sm:space-y-6">
                    <StoriesSection />
                    <CreatePostBox profile={profile} />
                    
                    <FriendRequestsSection />
                    
                    {/* Posts Feed */}
                    <div className="space-y-4 sm:space-y-6">
                      {postsLoading ? (
                        <PostCardSkeletonList count={3} />
                      ) : posts && posts.length > 0 ? (
                        <>
                          {posts.map((post) => (
                            <SocialPostCard 
                              key={post.id} 
                              post={post} 
                              highlightPostId={highlightPostId}
                            />
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
                        <div className="glass-card p-8 sm:p-12 text-center">
                          <p className="text-muted-foreground text-sm sm:text-base">
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
        <MobileBottomNav />
        <SwipeIndicator />
      </div>
    </>
  );
}
