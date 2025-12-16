import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, UserCheck, MessageCircle, Users, Camera, MapPin, Briefcase, GraduationCap, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SocialPostCard } from "@/components/social/SocialPostCard";
import { useInfiniteFeedPosts, useIntersectionObserver } from "@/hooks/useFeedPosts";
import { PostCardSkeleton } from "@/components/social/PostCardSkeleton";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  is_verified: boolean | null;
  reputation_score: number | null;
}

interface ProfileDetail {
  id: string;
  detail_type: string;
  title: string;
  subtitle: string | null;
  is_current: boolean | null;
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileDetails, setProfileDetails] = useState<ProfileDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [mutualFriendsCount, setMutualFriendsCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch posts for this user
  const { 
    data: postsData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading: isLoadingPosts 
  } = useInfiniteFeedPosts({});

  const loadMoreRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, { threshold: 0.1 });

  // Filter posts by this user
  const userPosts = postsData?.pages.flatMap(page => page.posts).filter(p => p.user_id === userId) || [];

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // If viewing own profile, redirect to /profile
      if (user?.id === userId) {
        navigate('/profile');
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError || !profileData) {
        toast({
          title: "Không tìm thấy hồ sơ",
          variant: "destructive"
        });
        navigate('/social');
        return;
      }

      setProfile(profileData);

      // Fetch profile details
      const { data: details } = await supabase
        .from("profile_details")
        .select("*")
        .eq("user_id", userId)
        .eq("is_visible", true)
        .order("display_order");

      setProfileDetails(details || []);

      // Fetch friends count
      const { count: fCount } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq("status", "accepted");

      setFriendsCount(fCount || 0);

      // Check friendship status if logged in
      if (user) {
        const { data: friendship } = await supabase
          .from("friendships")
          .select("*")
          .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
          .maybeSingle();

        if (friendship) {
          setFriendshipId(friendship.id);
          if (friendship.status === 'accepted') {
            setFriendshipStatus('friends');
          } else if (friendship.user_id === user.id) {
            setFriendshipStatus('pending_sent');
          } else {
            setFriendshipStatus('pending_received');
          }
        }

        // Calculate mutual friends
        const { data: myFriends } = await supabase
          .from("friendships")
          .select("user_id, friend_id")
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq("status", "accepted");

        const { data: theirFriends } = await supabase
          .from("friendships")
          .select("user_id, friend_id")
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
          .eq("status", "accepted");

        if (myFriends && theirFriends) {
          const myFriendIds = new Set(myFriends.map(f => f.user_id === user.id ? f.friend_id : f.user_id));
          const theirFriendIds = new Set(theirFriends.map(f => f.user_id === userId ? f.friend_id : f.user_id));
          
          let mutual = 0;
          myFriendIds.forEach(id => {
            if (theirFriendIds.has(id)) mutual++;
          });
          setMutualFriendsCount(mutual);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [userId, navigate, toast]);

  const sendFriendRequest = async () => {
    if (!currentUserId || !userId) return;
    setIsProcessing(true);

    const { error } = await supabase
      .from("friendships")
      .insert({ user_id: currentUserId, friend_id: userId, status: 'pending' });

    if (!error) {
      setFriendshipStatus('pending_sent');
      toast({ title: "Đã gửi lời mời kết bạn" });
    }
    setIsProcessing(false);
  };

  const acceptFriendRequest = async () => {
    if (!friendshipId) return;
    setIsProcessing(true);

    const { error } = await supabase
      .from("friendships")
      .update({ status: 'accepted' })
      .eq("id", friendshipId);

    if (!error) {
      setFriendshipStatus('friends');
      toast({ title: "Đã chấp nhận lời mời kết bạn" });
    }
    setIsProcessing(false);
  };

  const cancelFriendRequest = async () => {
    if (!friendshipId) return;
    setIsProcessing(true);

    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (!error) {
      setFriendshipStatus('none');
      setFriendshipId(null);
      toast({ title: "Đã hủy lời mời" });
    }
    setIsProcessing(false);
  };

  const startConversation = async () => {
    if (!currentUserId || !userId) return;
    navigate(`/messages?user=${userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const workDetails = profileDetails.filter(d => d.detail_type === 'work');
  const educationDetails = profileDetails.filter(d => d.detail_type === 'education');

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{profile.full_name || "Hồ sơ"} | FUN Charity</title>
      </Helmet>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-4 pb-20">
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-64 md:h-80 rounded-b-xl overflow-hidden bg-gradient-to-r from-primary/20 to-gold-champagne/20">
          {profile.cover_url && (
            <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Profile Header */}
        <div className="relative px-4 sm:px-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
            <div className="p-1 rounded-full bg-gradient-to-br from-gold-champagne to-primary">
              <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-card">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-gold-champagne text-white">
                  {profile.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {profile.full_name}
                </h1>
                {profile.is_verified && (
                  <Badge className="bg-primary text-primary-foreground">✓ Đã xác minh</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="font-medium">{friendsCount} bạn bè</span>
                {mutualFriendsCount > 0 && currentUserId && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {mutualFriendsCount} bạn chung
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            {currentUserId && (
              <div className="flex gap-2">
                {friendshipStatus === 'none' && (
                  <Button onClick={sendFriendRequest} disabled={isProcessing} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Kết bạn
                  </Button>
                )}
                {friendshipStatus === 'pending_sent' && (
                  <Button variant="outline" onClick={cancelFriendRequest} disabled={isProcessing}>
                    Hủy lời mời
                  </Button>
                )}
                {friendshipStatus === 'pending_received' && (
                  <>
                    <Button onClick={acceptFriendRequest} disabled={isProcessing} className="gap-2">
                      <UserCheck className="w-4 h-4" />
                      Chấp nhận
                    </Button>
                    <Button variant="outline" onClick={cancelFriendRequest} disabled={isProcessing}>
                      Từ chối
                    </Button>
                  </>
                )}
                {friendshipStatus === 'friends' && (
                  <Button variant="outline" className="gap-2">
                    <UserCheck className="w-4 h-4" />
                    Bạn bè
                  </Button>
                )}
                <Button variant="outline" onClick={startConversation} className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Nhắn tin
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="mt-4">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 gap-4">
            <TabsTrigger value="posts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Bài viết
            </TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Giới thiệu
            </TabsTrigger>
            <TabsTrigger value="photos" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Ảnh
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <div className="grid lg:grid-cols-5 gap-6">
              {/* About sidebar */}
              <div className="lg:col-span-2 space-y-4">
                <div className="glass-card p-4">
                  <h3 className="font-semibold text-lg mb-3">Giới thiệu</h3>
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
                  )}
                  
                  <div className="space-y-3">
                    {workDetails.map(detail => (
                      <div key={detail.id} className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{detail.title}</p>
                          {detail.subtitle && (
                            <p className="text-xs text-muted-foreground">{detail.subtitle}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {educationDetails.map(detail => (
                      <div key={detail.id} className="flex items-start gap-3">
                        <GraduationCap className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{detail.title}</p>
                          {detail.subtitle && (
                            <p className="text-xs text-muted-foreground">{detail.subtitle}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Posts */}
              <div className="lg:col-span-3 space-y-4">
                {isLoadingPosts ? (
                  Array.from({ length: 2 }).map((_, i) => <PostCardSkeleton key={i} />)
                ) : userPosts.length === 0 ? (
                  <div className="glass-card p-8 text-center text-muted-foreground">
                    Chưa có bài viết nào
                  </div>
                ) : (
                  userPosts.map(post => (
                    <SocialPostCard key={post.id} post={post} />
                  ))
                )}
                <div ref={loadMoreRef} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="glass-card p-6 max-w-2xl space-y-6">
              {profile.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Tiểu sử</h3>
                  <p className="text-muted-foreground">{profile.bio}</p>
                </div>
              )}
              
              {workDetails.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Công việc</h3>
                  <div className="space-y-3">
                    {workDetails.map(detail => (
                      <div key={detail.id} className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{detail.title}</p>
                          {detail.subtitle && <p className="text-sm text-muted-foreground">{detail.subtitle}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {educationDetails.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Học vấn</h3>
                  <div className="space-y-3">
                    {educationDetails.map(detail => (
                      <div key={detail.id} className="flex items-start gap-3">
                        <GraduationCap className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{detail.title}</p>
                          {detail.subtitle && <p className="text-sm text-muted-foreground">{detail.subtitle}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            <div className="glass-card p-6 text-center text-muted-foreground">
              Chưa có ảnh nào
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}