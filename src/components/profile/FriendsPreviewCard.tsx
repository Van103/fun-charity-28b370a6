import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon } from "lucide-react";

interface FriendProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface FriendsPreviewCardProps {
  userId: string;
}

export function FriendsPreviewCard({ userId }: FriendsPreviewCardProps) {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchFriends();
    }
  }, [userId]);

  const fetchFriends = async () => {
    try {
      // Get accepted friendships
      const { data: friendships, error } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) throw error;

      // Get friend IDs
      const friendIds = (friendships || []).map(f => 
        f.user_id === userId ? f.friend_id : f.user_id
      );

      setFriendCount(friendIds.length);

      if (friendIds.length > 0) {
        // Fetch profiles for up to 9 friends
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, avatar_url")
          .in("user_id", friendIds.slice(0, 9));

        setFriends(profiles || []);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Bạn bè</h3>
            <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1" />
          </div>
        </div>
        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="aspect-square bg-muted animate-pulse rounded-lg mb-1" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Bạn bè</h3>
          <p className="text-sm text-muted-foreground">
            {friendCount > 0 ? `${friendCount.toLocaleString()} người bạn` : "Chưa có bạn bè"}
          </p>
        </div>
        <Link to="/friends">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            Xem tất cả
          </Button>
        </Link>
      </div>
      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        {friends.length > 0 ? (
          friends.map((friend) => (
            <Link 
              to="/friends" 
              key={friend.id} 
              className="text-center hover:opacity-80 transition-opacity"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-1 bg-muted">
                {friend.avatar_url ? (
                  <img 
                    src={friend.avatar_url} 
                    alt={friend.full_name || "Friend"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/20 to-primary/20">
                    <UserIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-foreground truncate">
                {friend.full_name || "Người dùng"}
              </p>
            </Link>
          ))
        ) : (
          // Empty placeholders
          [...Array(9)].map((_, i) => (
            <Link 
              to="/friends" 
              key={i} 
              className="text-center hover:opacity-80 transition-opacity"
            >
              <div className="aspect-square bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg mb-1 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-xs font-medium text-muted-foreground truncate">Thêm bạn</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}