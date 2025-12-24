import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { useFriendRequestNotifications } from "@/hooks/useFriendNotifications";
import { 
  Search, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Users, 
  Clock,
  User as UserIcon,
  Loader2,
  MessageCircle
} from "lucide-react";

interface FriendProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profile?: FriendProfile;
}

export default function Friends() {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<FriendProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Enable realtime friend notifications
  useFriendRequestNotifications(currentUserId);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(user.id);
    await Promise.all([
      fetchFriends(user.id),
      fetchPendingRequests(user.id),
      fetchSentRequests(user.id),
      fetchSuggestions(user.id),
    ]);
    setLoading(false);
  };

  const fetchFriends = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .eq("status", "accepted")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) throw error;

      // Fetch profiles for friends
      const friendIds = (data || []).map(f => 
        f.user_id === userId ? f.friend_id : f.user_id
      );

      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, avatar_url, bio")
          .in("user_id", friendIds);

        const friendsWithProfiles = (data || []).map(friendship => {
          const friendUserId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
          const profile = profiles?.find(p => p.user_id === friendUserId);
          return { ...friendship, profile };
        });

        setFriends(friendsWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchPendingRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .eq("friend_id", userId)
        .eq("status", "pending");

      if (error) throw error;

      const senderIds = (data || []).map(f => f.user_id);

      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, avatar_url, bio")
          .in("user_id", senderIds);

        const requestsWithProfiles = (data || []).map(request => {
          const profile = profiles?.find(p => p.user_id === request.user_id);
          return { ...request, profile };
        });

        setPendingRequests(requestsWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const fetchSentRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending");

      if (error) throw error;

      const receiverIds = (data || []).map(f => f.friend_id);

      if (receiverIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, avatar_url, bio")
          .in("user_id", receiverIds);

        const requestsWithProfiles = (data || []).map(request => {
          const profile = profiles?.find(p => p.user_id === request.friend_id);
          return { ...request, profile };
        });

        setSentRequests(requestsWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching sent requests:", error);
    }
  };

  const fetchSuggestions = async (userId: string) => {
    try {
      // Get existing friendships
      const { data: friendships } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      const excludeIds = new Set<string>([userId]);
      friendships?.forEach(f => {
        excludeIds.add(f.user_id);
        excludeIds.add(f.friend_id);
      });

      // Get random profiles as suggestions
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, bio")
        .limit(10);

      const filteredSuggestions = (profiles || []).filter(
        p => !excludeIds.has(p.user_id)
      );

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, bio")
        .ilike("full_name", `%${searchQuery}%`)
        .neq("user_id", currentUserId)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("friendships")
        .insert({
          user_id: currentUserId,
          friend_id: friendId,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Đã gửi lời mời kết bạn",
        description: "Đang chờ phản hồi",
      });

      // Refresh data
      await Promise.all([
        fetchSentRequests(currentUserId),
        fetchSuggestions(currentUserId),
      ]);
      setSearchResults(prev => prev.filter(p => p.user_id !== friendId));
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Đã chấp nhận lời mời",
        description: "Các bạn đã trở thành bạn bè",
      });

      if (currentUserId) {
        await Promise.all([
          fetchFriends(currentUserId),
          fetchPendingRequests(currentUserId),
        ]);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Đã từ chối lời mời",
      });

      if (currentUserId) {
        await fetchPendingRequests(currentUserId);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const cancelFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Đã hủy lời mời kết bạn",
      });

      if (currentUserId) {
        await fetchSentRequests(currentUserId);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unfriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Đã hủy kết bạn",
      });

      if (currentUserId) {
        await fetchFriends(currentUserId);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const FriendCard = ({ profile, actions }: { profile?: FriendProfile; actions: React.ReactNode }) => (
    <div className="glass-card p-4 flex items-center gap-4">
      <Avatar className="w-16 h-16">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="bg-secondary/20">
          <UserIcon className="w-8 h-8 text-secondary" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground truncate">
          {profile?.full_name || "Người dùng"}
        </h4>
        {profile?.bio && (
          <p className="text-sm text-muted-foreground truncate">{profile.bio}</p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        {actions}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Bạn bè - FUN Charity</title>
        <meta name="description" content="Quản lý bạn bè và kết nối với cộng đồng FUN Charity" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-20 pb-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">Bạn bè</h1>
              <p className="text-muted-foreground">Kết nối với cộng đồng và tìm kiếm bạn mới</p>
            </div>

            {/* Search */}
            <div className="glass-card p-4 mb-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm bạn bè theo tên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tìm kiếm"}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Kết quả tìm kiếm</h3>
                  {searchResults.map((profile) => (
                    <FriendCard
                      key={profile.id}
                      profile={profile}
                      actions={
                        <Button size="sm" onClick={() => sendFriendRequest(profile.user_id)}>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Kết bạn
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <Tabs defaultValue="friends" className="space-y-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="friends" className="gap-2">
                  <Users className="w-4 h-4" />
                  Bạn bè ({friends.length})
                </TabsTrigger>
                <TabsTrigger value="requests" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Lời mời ({pendingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="sent" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Đã gửi ({sentRequests.length})
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="gap-2">
                  <UserCheck className="w-4 h-4" />
                  Gợi ý
                </TabsTrigger>
              </TabsList>

              {/* Friends List */}
              <TabsContent value="friends" className="space-y-3">
                {friends.length > 0 ? (
                  friends.map((friendship) => (
                    <FriendCard
                      key={friendship.id}
                      profile={friendship.profile}
                      actions={
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => unfriend(friendship.id)}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Hủy kết bạn
                        </Button>
                      }
                    />
                  ))
                ) : (
                  <div className="glass-card p-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Bạn chưa có bạn bè nào</p>
                  </div>
                )}
              </TabsContent>

              {/* Pending Requests */}
              <TabsContent value="requests" className="space-y-3">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => (
                    <FriendCard
                      key={request.id}
                      profile={request.profile}
                      actions={
                        <>
                          <Button size="sm" onClick={() => acceptFriendRequest(request.id)}>
                            Chấp nhận
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => rejectFriendRequest(request.id)}
                          >
                            Từ chối
                          </Button>
                        </>
                      }
                    />
                  ))
                ) : (
                  <div className="glass-card p-8 text-center">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có lời mời kết bạn nào</p>
                  </div>
                )}
              </TabsContent>

              {/* Sent Requests */}
              <TabsContent value="sent" className="space-y-3">
                {sentRequests.length > 0 ? (
                  sentRequests.map((request) => (
                    <FriendCard
                      key={request.id}
                      profile={request.profile}
                      actions={
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelFriendRequest(request.id)}
                        >
                          Hủy lời mời
                        </Button>
                      }
                    />
                  ))
                ) : (
                  <div className="glass-card p-8 text-center">
                    <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Bạn chưa gửi lời mời nào</p>
                  </div>
                )}
              </TabsContent>

              {/* Suggestions */}
              <TabsContent value="suggestions" className="space-y-3">
                {suggestions.length > 0 ? (
                  suggestions.map((profile) => (
                    <FriendCard
                      key={profile.id}
                      profile={profile}
                      actions={
                        <Button size="sm" onClick={() => sendFriendRequest(profile.user_id)}>
                          <UserPlus className="w-4 h-4 mr-1" />
                          Kết bạn
                        </Button>
                      }
                    />
                  ))
                ) : (
                  <div className="glass-card p-8 text-center">
                    <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Không có gợi ý nào</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}