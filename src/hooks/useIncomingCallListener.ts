import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IncomingCall {
  id: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string | null;
  callType: "video" | "audio";
}

interface UseIncomingCallListenerProps {
  userId: string | null;
  onAnswerCall?: (call: IncomingCall) => void;
}

export function useIncomingCallListener({ userId, onAnswerCall }: UseIncomingCallListenerProps) {
  const { toast } = useToast();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dismissCall = useCallback(() => {
    setIncomingCall(null);
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
  }, []);

  const answerCall = useCallback(() => {
    if (incomingCall && onAnswerCall) {
      onAnswerCall(incomingCall);
    }
    dismissCall();
  }, [incomingCall, onAnswerCall, dismissCall]);

  const declineCall = useCallback(async () => {
    if (incomingCall) {
      try {
        await supabase
          .from("call_sessions")
          .update({ status: "declined", ended_at: new Date().toISOString() })
          .eq("id", incomingCall.id);
      } catch (error) {
        console.error("Error declining call:", error);
      }
    }
    dismissCall();
  }, [incomingCall, dismissCall]);

  useEffect(() => {
    if (!userId) return;

    console.log("Setting up incoming call listener for user:", userId);

    // Listen for new call sessions where user is a participant
    const channel = supabase
      .channel("incoming-calls")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_sessions",
          filter: `status=eq.pending`
        },
        async (payload) => {
          console.log("New call session detected:", payload);
          
          const callSession = payload.new as {
            id: string;
            conversation_id: string;
            caller_id: string;
            call_type: string;
            status: string;
          };

          // Don't notify if user is the caller
          if (callSession.caller_id === userId) {
            console.log("Ignoring own call");
            return;
          }

          // Check if user is a participant in this conversation
          const { data: conversation, error: convError } = await supabase
            .from("conversations")
            .select("participant1_id, participant2_id")
            .eq("id", callSession.conversation_id)
            .single();

          if (convError || !conversation) {
            console.log("Could not fetch conversation");
            return;
          }

          const isParticipant = 
            conversation.participant1_id === userId || 
            conversation.participant2_id === userId;

          if (!isParticipant) {
            console.log("User is not a participant in this conversation");
            return;
          }

          // Get caller info
          const { data: callerProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", callSession.caller_id)
            .single();

          const incomingCallData: IncomingCall = {
            id: callSession.id,
            conversationId: callSession.conversation_id,
            callerId: callSession.caller_id,
            callerName: callerProfile?.full_name || "Người dùng",
            callerAvatar: callerProfile?.avatar_url || null,
            callType: callSession.call_type as "video" | "audio"
          };

          console.log("Incoming call from:", incomingCallData.callerName);
          setIncomingCall(incomingCallData);

          // Play notification sound
          try {
            const audio = new Audio("/sounds/notification.mp3");
            audio.loop = true;
            audio.play().catch(console.error);
            
            // Stop sound after 30 seconds
            setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
            }, 30000);
          } catch (error) {
            console.error("Error playing notification sound:", error);
          }

          // Auto dismiss after 30 seconds
          dismissTimeoutRef.current = setTimeout(() => {
            setIncomingCall(null);
          }, 30000);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      console.log("Cleaning up incoming call listener");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    };
  }, [userId]);

  return {
    incomingCall,
    answerCall,
    declineCall,
    dismissCall
  };
}
