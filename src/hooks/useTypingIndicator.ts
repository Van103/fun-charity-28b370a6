import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface TypingUser {
  id: string;
  name: string;
}

export function useTypingIndicator(conversationId: string | null, currentUserId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Broadcast typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!conversationId || !currentUserId || !channelRef.current) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", currentUserId)
      .maybeSingle();

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: currentUserId,
        user_name: profile?.full_name || "Người dùng",
        is_typing: isTyping
      }
    });
  }, [conversationId, currentUserId]);

  // Handle input change with debounce
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  }, [setTyping]);

  // Subscribe to typing events
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase.channel(`typing-${conversationId}`, {
      config: { broadcast: { self: false } }
    });

    channel.on("broadcast", { event: "typing" }, (payload) => {
      const { user_id, user_name, is_typing } = payload.payload;
      
      if (user_id === currentUserId) return;

      setTypingUsers(prev => {
        if (is_typing) {
          if (!prev.find(u => u.id === user_id)) {
            return [...prev, { id: user_id, name: user_name }];
          }
          return prev;
        } else {
          return prev.filter(u => u.id !== user_id);
        }
      });
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  return { typingUsers, handleTyping, setTyping };
}
