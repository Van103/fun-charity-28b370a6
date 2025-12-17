import { useState, useEffect, useRef } from "react";
import { Search, X, User, Newspaper, FileText, UserPlus, UserCheck, UserMinus, MessageCircle, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  type: "user" | "campaign" | "post";
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
}

interface FriendshipStatus {
  status: "none" | "pending_sent" | "pending_received" | "friends";
  friendshipId?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, FriendshipStatus>>({});
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
        setFriendshipStatuses({});
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Check friendship status for user results
  const checkFriendshipStatuses = async (userIds: string[]) => {
    if (!currentUserId || userIds.length === 0) return;

    const statuses: Record<string, FriendshipStatus> = {};

    for (const userId of userIds) {
      if (userId === currentUserId) {
        statuses[userId] = { status: "none" }; // Self
        continue;
      }

      // Check if friendship exists
      const { data: friendship } = await supabase
        .from("friendships")
        .select("id, status, user_id, friend_id")
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUserId})`)
        .maybeSingle();

      if (!friendship) {
        statuses[userId] = { status: "none" };
      } else if (friendship.status === "accepted") {
        statuses[userId] = { status: "friends", friendshipId: friendship.id };
      } else if (friendship.status === "pending") {
        if (friendship.user_id === currentUserId) {
          statuses[userId] = { status: "pending_sent", friendshipId: friendship.id };
        } else {
          statuses[userId] = { status: "pending_received", friendshipId: friendship.id };
        }
      } else {
        statuses[userId] = { status: "none" };
      }
    }

    setFriendshipStatuses(statuses);
  };

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    const allResults: SearchResult[] = [];

    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .ilike("full_name", `%${searchQuery}%`)
        .limit(5);

      if (profiles) {
        const userIds: string[] = [];
        profiles.forEach((p) => {
          allResults.push({
            type: "user",
            id: p.user_id,
            title: p.full_name || "Người dùng",
            image: p.avatar_url || undefined,
          });
          userIds.push(p.user_id);
        });
        
        // Check friendship statuses for all user results
        if (currentUserId) {
          checkFriendshipStatuses(userIds);
        }
      }

      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, title, short_description, cover_image_url")
        .or(`title.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`)
        .eq("status", "active")
        .limit(5);

      if (campaigns) {
        campaigns.forEach((c) => {
          allResults.push({
            type: "campaign",
            id: c.id,
            title: c.title,
            subtitle: c.short_description || undefined,
            image: c.cover_image_url || undefined,
          });
        });
      }

      const { data: posts } = await supabase
        .from("feed_posts")
        .select("id, title, content")
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .eq("is_active", true)
        .limit(5);

      if (posts) {
        posts.forEach((p) => {
          allResults.push({
            type: "post",
            id: p.id,
            title: p.title || p.content?.substring(0, 50) || "Bài viết",
            subtitle: p.content?.substring(0, 80) || undefined,
          });
        });
      }

      setResults(allResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setQuery("");
    setResults([]);
    setIsFocused(false);

    switch (result.type) {
      case "user":
        navigate(`/user/${result.id}`);
        break;
      case "campaign":
        navigate(`/campaigns/${result.id}`);
        break;
      case "post":
        navigate("/social", { state: { scrollToPostId: result.id } });
        break;
    }
  };

  const sendFriendRequest = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      toast({ title: "Vui lòng đăng nhập", variant: "destructive" });
      return;
    }

    setLoadingActions(prev => ({ ...prev, [userId]: true }));

    try {
      const { error } = await supabase
        .from("friendships")
        .insert({
          user_id: currentUserId,
          friend_id: userId,
          status: "pending"
        });

      if (error) throw error;

      setFriendshipStatuses(prev => ({
        ...prev,
        [userId]: { status: "pending_sent" }
      }));

      toast({ title: "Đã gửi lời mời kết bạn!" });
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast({ title: "Lỗi gửi lời mời", description: error.message, variant: "destructive" });
    } finally {
      setLoadingActions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const acceptFriendRequest = async (userId: string, friendshipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingActions(prev => ({ ...prev, [userId]: true }));

    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (error) throw error;

      setFriendshipStatuses(prev => ({
        ...prev,
        [userId]: { status: "friends", friendshipId }
      }));

      toast({ title: "Đã chấp nhận lời mời kết bạn!" });
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setLoadingActions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const cancelFriendRequest = async (userId: string, friendshipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingActions(prev => ({ ...prev, [userId]: true }));

    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      setFriendshipStatuses(prev => ({
        ...prev,
        [userId]: { status: "none" }
      }));

      toast({ title: "Đã hủy lời mời kết bạn" });
    } catch (error: any) {
      console.error("Error canceling friend request:", error);
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setLoadingActions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const unfriend = async (userId: string, friendshipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingActions(prev => ({ ...prev, [userId]: true }));

    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      setFriendshipStatuses(prev => ({
        ...prev,
        [userId]: { status: "none" }
      }));

      toast({ title: "Đã hủy kết bạn" });
    } catch (error: any) {
      console.error("Error unfriending:", error);
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setLoadingActions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const startConversation = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery("");
    setResults([]);
    setIsFocused(false);
    navigate(`/messages?userId=${userId}`);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="w-4 h-4" />;
      case "campaign":
        return <Newspaper className="w-4 h-4" />;
      case "post":
        return <FileText className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const renderFriendshipActions = (result: SearchResult) => {
    if (result.type !== "user" || result.id === currentUserId || !currentUserId) {
      return null;
    }

    const status = friendshipStatuses[result.id];
    const isLoading = loadingActions[result.id];

    if (isLoading) {
      return (
        <div className="flex items-center gap-1">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!status || status.status === "none") {
      return (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs gap-1"
          onClick={(e) => sendFriendRequest(result.id, e)}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Kết bạn
        </Button>
      );
    }

    if (status.status === "pending_sent") {
      return (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs gap-1 text-muted-foreground"
          onClick={(e) => cancelFriendRequest(result.id, status.friendshipId!, e)}
        >
          <X className="w-3.5 h-3.5" />
          Hủy lời mời
        </Button>
      );
    }

    if (status.status === "pending_received") {
      return (
        <Button
          size="sm"
          variant="default"
          className="h-7 px-2 text-xs gap-1"
          onClick={(e) => acceptFriendRequest(result.id, status.friendshipId!, e)}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Chấp nhận
        </Button>
      );
    }

    if (status.status === "friends") {
      return (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1 text-primary"
            onClick={(e) => startConversation(result.id, e)}
            title="Nhắn tin"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
            onClick={(e) => unfriend(result.id, status.friendshipId!, e)}
            title="Hủy kết bạn"
          >
            <UserMinus className="w-3.5 h-3.5" />
          </Button>
        </div>
      );
    }

    return null;
  };

  const showResults = isFocused && (query.length >= 2 || results.length > 0);

  return (
    <div ref={containerRef} className="relative hidden md:block">
      {/* Facebook-style always visible search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Tìm kiếm trên FUN Charity"
          className="w-[300px] h-10 pl-10 pr-9 bg-muted/50 rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-all border-0"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-[380px] bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <ScrollArea className="max-h-[400px]">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Đang tìm kiếm...
                </div>
              ) : results.length === 0 && query.length >= 2 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Không tìm thấy kết quả
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}-${index}`}
                      className="px-3 py-2.5 hover:bg-muted cursor-pointer transition-colors flex items-center gap-3"
                      onClick={() => handleResultClick(result)}
                    >
                      {result.type === "user" && result.image ? (
                        <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                          <AvatarImage src={result.image} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {result.title[0]}
                          </AvatarFallback>
                        </Avatar>
                      ) : result.type === "user" ? (
                        <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {result.title[0]}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          {getIcon(result.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                        {result.type === "user" && friendshipStatuses[result.id]?.status === "friends" && (
                          <p className="text-xs text-primary flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            Bạn bè
                          </p>
                        )}
                      </div>
                      {renderFriendshipActions(result)}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
