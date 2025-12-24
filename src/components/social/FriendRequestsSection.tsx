import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight, UserPlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface FriendRequest {
  id: string;
  senderId: string;
  userName: string;
  avatar?: string;
  mutualFriends: number;
  verified?: boolean;
}

interface UserSuggestion {
  userId: string;
  userName: string;
  avatar?: string;
  mutualFriends: number;
  verified?: boolean;
}

// Helper to get cover image style
const getCoverStyle = (index: number) => {
  const gradients = [
    "bg-gradient-to-br from-purple-500/40 to-pink-500/40",
    "bg-gradient-to-br from-blue-500/40 to-purple-500/40",
    "bg-gradient-to-br from-amber-500/40 to-orange-500/40",
    "bg-gradient-to-br from-emerald-500/40 to-teal-500/40",
  ];
  return gradients[index % gradients.length];
};

export function FriendRequestsSection() {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // Fetch pending friend requests where current user is the receiver (friend_id)
      const { data: requests } = await supabase
        .from("friendships")
        .select("id, user_id")
        .eq("friend_id", user.id)
        .eq("status", "pending");

      if (requests && requests.length > 0) {
        // Get sender profiles
        const senderIds = requests.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, is_verified")
          .in("user_id", senderIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Get mutual friends count for each sender
        const requestsWithMutual = await Promise.all(
          requests.map(async (req) => {
            const mutualCount = await getMutualFriendsCount(user.id, req.user_id);
            const profile = profileMap.get(req.user_id);
            return {
              id: req.id,
              senderId: req.user_id,
              userName: profile?.full_name || "Người dùng",
              avatar: profile?.avatar_url || undefined,
              mutualFriends: mutualCount,
              verified: profile?.is_verified || false,
            };
          })
        );

        setFriendRequests(requestsWithMutual);
      }

      // Fetch suggestions - users who are not friends and haven't sent/received requests
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, is_verified")
        .neq("user_id", user.id)
        .limit(20);

      if (allProfiles && allProfiles.length > 0) {
        // Get existing friendships
        const { data: existingFriendships } = await supabase
          .from("friendships")
          .select("user_id, friend_id")
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        const connectedUserIds = new Set<string>();
        existingFriendships?.forEach(f => {
          connectedUserIds.add(f.user_id);
          connectedUserIds.add(f.friend_id);
        });

        // Filter out already connected users
        const nonConnectedProfiles = allProfiles.filter(
          p => !connectedUserIds.has(p.user_id)
        );

        // Get mutual friends for suggestions
        const suggestionsWithMutual = await Promise.all(
          nonConnectedProfiles.slice(0, 8).map(async (profile) => {
            const mutualCount = await getMutualFriendsCount(user.id, profile.user_id);
            return {
              userId: profile.user_id,
              userName: profile.full_name || "Người dùng",
              avatar: profile.avatar_url || undefined,
              mutualFriends: mutualCount,
              verified: profile.is_verified || false,
            };
          })
        );

        setSuggestions(suggestionsWithMutual);
      }
    } catch (error) {
      console.error("Error fetching friend data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMutualFriendsCount = async (userId1: string, userId2: string): Promise<number> => {
    try {
      // Get friends of user1
      const { data: friends1 } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${userId1},friend_id.eq.${userId1}`);

      const user1Friends = new Set<string>();
      friends1?.forEach(f => {
        if (f.user_id === userId1) user1Friends.add(f.friend_id);
        else user1Friends.add(f.user_id);
      });

      // Get friends of user2
      const { data: friends2 } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${userId2},friend_id.eq.${userId2}`);

      let mutualCount = 0;
      friends2?.forEach(f => {
        const friendId = f.user_id === userId2 ? f.friend_id : f.user_id;
        if (user1Friends.has(friendId)) mutualCount++;
      });

      return mutualCount;
    } catch {
      return 0;
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (error) throw error;

      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success("Đã chấp nhận lời mời kết bạn!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success("Đã xóa lời mời kết bạn");
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleAddFriend = async (targetUserId: string) => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để kết bạn");
      return;
    }

    setProcessingIds(prev => new Set(prev).add(targetUserId));
    try {
      const { error } = await supabase
        .from("friendships")
        .insert({
          user_id: currentUserId,
          friend_id: targetUserId,
          status: "pending"
        });

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.userId !== targetUserId));
      toast.success("Đã gửi lời mời kết bạn!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const handleRemoveSuggestion = (userId: string) => {
    setSuggestions(prev => prev.filter(s => s.userId !== userId));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Don't show section if no data
  if (friendRequests.length === 0 && suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Lời mời kết bạn</h3>
            <Link to="/friends" className="text-sm text-primary hover:underline flex items-center gap-1">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {friendRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="shrink-0 w-28 rounded-xl overflow-hidden bg-card border border-border/50 shadow-sm"
              >
                {/* Cover photo area */}
                <div className={`h-12 ${getCoverStyle(index)} relative`}>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                    <div className="p-0.5 rounded-full bg-gradient-to-br from-primary to-primary-light">
                      <Avatar className="w-10 h-10 border-2 border-background">
                        <AvatarImage src={request.avatar} />
                        <AvatarFallback className="bg-primary/10 text-sm">
                          {request.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 pb-2 px-1.5 flex flex-col items-center text-center">
                  <Link to={`/user/${request.senderId}`} className="flex items-center gap-0.5 mb-0.5 hover:underline">
                    <span className="font-medium text-[11px] truncate max-w-full">
                      {request.userName}
                    </span>
                    {request.verified && <span className="text-primary text-[10px]">💜</span>}
                  </Link>
                  <span className="text-[10px] text-muted-foreground mb-1.5">
                    {request.mutualFriends} bạn chung
                  </span>
                  <div className="flex flex-col gap-1 w-full">
                    <Button 
                      size="sm" 
                      className="w-full h-6 text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => handleAcceptRequest(request.id, request.senderId)}
                      disabled={processingIds.has(request.id)}
                    >
                      {processingIds.has(request.id) ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Xác nhận"
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full h-6 text-[10px]"
                      onClick={() => handleDeclineRequest(request.id)}
                      disabled={processingIds.has(request.id)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Navigation arrow */}
            <Link 
              to="/friends"
              className="shrink-0 w-7 h-7 self-center rounded-full bg-background border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <Link to="/friends" className="text-xs text-primary hover:underline mt-2 mx-auto block text-center">
            Xem tất cả
          </Link>
        </div>
      )}

      {/* People You May Know */}
      {suggestions.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Những người bạn có thể biết</h3>
            <Link to="/friends" className="text-sm text-primary hover:underline flex items-center gap-1">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="shrink-0 w-28 rounded-xl overflow-hidden bg-card border border-border/50 shadow-sm relative"
              >
                {/* Remove button */}
                <button 
                  className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-muted transition-colors"
                  onClick={() => handleRemoveSuggestion(suggestion.userId)}
                >
                  <X className="w-2.5 h-2.5 text-muted-foreground" />
                </button>
                
                {/* Cover photo area */}
                <div className={`h-12 ${getCoverStyle(index + 2)} relative`}>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                    <div className="p-0.5 rounded-full bg-gradient-to-br from-primary to-primary-light">
                      <Avatar className="w-10 h-10 border-2 border-background">
                        <AvatarImage src={suggestion.avatar} />
                        <AvatarFallback className="bg-primary/10 text-sm">
                          {suggestion.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 pb-2 px-1.5 flex flex-col items-center text-center">
                  <Link to={`/user/${suggestion.userId}`} className="flex items-center gap-0.5 mb-0.5 hover:underline">
                    <span className="font-medium text-[11px] truncate max-w-full">
                      {suggestion.userName}
                    </span>
                    {suggestion.verified && <span className="text-primary text-[10px]">💜</span>}
                  </Link>
                  <span className="text-[10px] text-muted-foreground mb-1.5">
                    {suggestion.mutualFriends} bạn chung
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full h-6 text-[10px] px-1.5"
                    onClick={() => handleAddFriend(suggestion.userId)}
                    disabled={processingIds.has(suggestion.userId)}
                  >
                    {processingIds.has(suggestion.userId) ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-2.5 h-2.5 mr-0.5" />
                        Thêm bạn bè
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
            
            {/* Navigation arrow */}
            <Link 
              to="/friends"
              className="shrink-0 w-7 h-7 self-center rounded-full bg-background border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <Link to="/friends" className="text-xs text-primary hover:underline mt-2 mx-auto block text-center">
            Xem tất cả
          </Link>
        </div>
      )}
    </div>
  );
}
