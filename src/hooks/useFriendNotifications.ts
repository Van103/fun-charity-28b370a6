import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FriendshipPayload {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
}

export function useFriendRequestNotifications(currentUserId: string | null) {
  const { toast } = useToast();

  const fetchSenderProfile = useCallback(async (senderId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", senderId)
      .maybeSingle();
    return data;
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, []);

  const createNotification = useCallback(async (
    userId: string,
    title: string,
    message: string,
    type: "friend_request",
    senderId?: string,
    senderAvatarUrl?: string | null
  ) => {
    try {
      await supabase.from("notifications").insert({
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        data: senderId ? { sender_id: senderId, sender_avatar_url: senderAvatarUrl } : {},
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Listen for new friend requests (INSERT with status = pending)
    const friendRequestChannel = supabase
      .channel('friend-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const friendship = payload.new as FriendshipPayload;
          
          if (friendship.status === 'pending') {
            const sender = await fetchSenderProfile(friendship.user_id);
            const senderName = sender?.full_name || "Ai đó";
            
            // Play notification sound
            playNotificationSound();
            
            // Show toast notification
            toast({
              title: "Lời mời kết bạn mới",
              description: `${senderName} đã gửi lời mời kết bạn`,
            });

            // Create persistent notification with sender info
            await createNotification(
              currentUserId,
              "Lời mời kết bạn mới",
              `${senderName} đã gửi lời mời kết bạn cho bạn`,
              "friend_request",
              friendship.user_id,
              sender?.avatar_url
            );
          }
        }
      )
      .subscribe();

    // Listen for accepted friend requests (UPDATE with status = accepted)
    const friendAcceptChannel = supabase
      .channel('friend-accepts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const friendship = payload.new as FriendshipPayload;
          const oldFriendship = payload.old as FriendshipPayload;
          
          if (oldFriendship.status === 'pending' && friendship.status === 'accepted') {
            const friend = await fetchSenderProfile(friendship.friend_id);
            const friendName = friend?.full_name || "Ai đó";
            
            // Show toast notification
            toast({
              title: "Kết bạn thành công!",
              description: `${friendName} đã chấp nhận lời mời kết bạn của bạn`,
            });

            // Create persistent notification
            await createNotification(
              currentUserId,
              "Đã chấp nhận kết bạn",
              `${friendName} đã chấp nhận lời mời kết bạn của bạn`,
              "friend_request"
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendRequestChannel);
      supabase.removeChannel(friendAcceptChannel);
    };
  }, [currentUserId, toast, fetchSenderProfile, createNotification, playNotificationSound]);
}