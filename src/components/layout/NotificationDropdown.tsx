import { useState, useEffect } from "react";
import { Bell, Check, Gift, MessageCircle, Users, Award, Heart, AlertCircle, UserCheck, UserX, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  data: Record<string, any>;
}

const notificationIcons: Record<string, React.ReactNode> = {
  donation_received: <Gift className="w-4 h-4 text-green-500" />,
  donation_sent: <Heart className="w-4 h-4 text-pink-500" />,
  friend_request: <Users className="w-4 h-4 text-blue-500" />,
  comment_reply: <MessageCircle className="w-4 h-4 text-purple-500" />,
  badge_earned: <Award className="w-4 h-4 text-yellow-500" />,
  campaign_update: <AlertCircle className="w-4 h-4 text-orange-500" />,
  system: <Bell className="w-4 h-4 text-muted-foreground" />,
};

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
    fetchNotifications();

    // Set up realtime subscription
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleAcceptFriendRequest = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;

    setProcessingIds(prev => new Set(prev).add(notification.id));

    try {
      // Find the pending friend request where current user is the friend_id
      const { data: friendRequest, error: findError } = await supabase
        .from("friendships")
        .select("*")
        .eq("friend_id", currentUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError || !friendRequest) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy lời mời kết bạn",
          variant: "destructive",
        });
        return;
      }

      // Update the friendship status to accepted
      const { error: updateError } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendRequest.id);

      if (updateError) {
        toast({
          title: "Lỗi",
          description: "Không thể chấp nhận lời mời",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Thành công",
        description: "Đã chấp nhận lời mời kết bạn",
      });

      // Mark notification as read and remove it from list
      await markAsRead(notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast({
        title: "Lỗi",
        description: "Đã có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const handleDeclineFriendRequest = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;

    setProcessingIds(prev => new Set(prev).add(notification.id));

    try {
      // Find and delete the pending friend request
      const { data: friendRequest, error: findError } = await supabase
        .from("friendships")
        .select("*")
        .eq("friend_id", currentUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError || !friendRequest) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy lời mời kết bạn",
          variant: "destructive",
        });
        return;
      }

      const { error: deleteError } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendRequest.id);

      if (deleteError) {
        toast({
          title: "Lỗi",
          description: "Không thể từ chối lời mời",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Đã từ chối",
        description: "Đã từ chối lời mời kết bạn",
      });

      // Mark notification as read and remove it
      await markAsRead(notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast({
        title: "Lỗi",
        description: "Đã có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const getIcon = (type: string) => {
    return notificationIcons[type] || notificationIcons.system;
  };

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
  };

  const isProcessing = (id: string) => processingIds.has(id);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-semibold">Thông báo</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              <Check className="w-3 h-3 mr-1" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {/* Show avatar for friend requests, icon for others */}
                    {notification.type === "friend_request" && notification.data?.sender_avatar_url ? (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={notification.data.sender_avatar_url} />
                        <AvatarFallback className="bg-blue-100">
                          <User className="w-4 h-4 text-blue-500" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        {getIcon(notification.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.is_read ? "font-semibold" : ""}`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.created_at)}
                      </p>

                      {/* Friend request action buttons */}
                      {notification.type === "friend_request" && !notification.is_read && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => handleAcceptFriendRequest(notification, e)}
                            disabled={isProcessing(notification.id)}
                          >
                            {isProcessing(notification.id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3 mr-1" />
                                Chấp nhận
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={(e) => handleDeclineFriendRequest(notification, e)}
                            disabled={isProcessing(notification.id)}
                          >
                            {isProcessing(notification.id) ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <UserX className="w-3 h-3 mr-1" />
                                Từ chối
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
