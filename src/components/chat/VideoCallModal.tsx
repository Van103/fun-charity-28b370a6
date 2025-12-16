import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoCallModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  currentUserId: string;
  otherUser: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  callType: "video" | "audio";
  isIncoming?: boolean;
  callSessionId?: string;
}

export function VideoCallModal({
  open,
  onClose,
  conversationId,
  currentUserId,
  otherUser,
  callType,
  isIncoming = false,
  callSessionId
}: VideoCallModalProps) {
  const { toast } = useToast();
  const [callStatus, setCallStatus] = useState<"connecting" | "ringing" | "active" | "ended">(
    isIncoming ? "ringing" : "connecting"
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sessionIdRef = useRef<string | null>(callSessionId || null);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  // Initialize media stream
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Lỗi",
        description: "Không thể truy cập camera/microphone",
        variant: "destructive"
      });
      return null;
    }
  }, [callType, toast]);

  // Create peer connection
  const createPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(configuration);
    
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      console.log("Received remote track");
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: event.candidate }
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallStatus("active");
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  // Start outgoing call
  const startCall = useCallback(async () => {
    const stream = await initializeMedia();
    if (!stream) return;

    // Create call session in database
    const { data: session, error } = await supabase
      .from("call_sessions")
      .insert({
        conversation_id: conversationId,
        caller_id: currentUserId,
        call_type: callType,
        status: "pending"
      })
      .select()
      .single();

    if (error || !session) {
      console.error("Error creating call session:", error);
      toast({
        title: "Lỗi",
        description: "Không thể bắt đầu cuộc gọi",
        variant: "destructive"
      });
      return;
    }

    sessionIdRef.current = session.id;
    setCallStatus("ringing");

    const pc = createPeerConnection(stream);
    
    // Setup signaling channel
    const channel = supabase.channel(`call-${session.id}`);
    channelRef.current = channel;

    channel.on("broadcast", { event: "answer" }, async (msg) => {
      console.log("Received answer");
      const answer = msg.payload.answer;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    channel.on("broadcast", { event: "ice-candidate" }, async (msg) => {
      console.log("Received ICE candidate");
      await pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate));
    });

    channel.on("broadcast", { event: "call-declined" }, () => {
      toast({
        title: "Cuộc gọi bị từ chối",
        description: `${otherUser.full_name} đã từ chối cuộc gọi`
      });
      endCall();
    });

    channel.on("broadcast", { event: "call-ended" }, () => {
      endCall();
    });

    await channel.subscribe();

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    channel.send({
      type: "broadcast",
      event: "offer",
      payload: { 
        offer,
        caller_id: currentUserId,
        call_type: callType
      }
    });
  }, [conversationId, currentUserId, callType, initializeMedia, createPeerConnection, otherUser, toast]);

  // Answer incoming call
  const answerCall = useCallback(async () => {
    if (!callSessionId) return;

    const stream = await initializeMedia();
    if (!stream) return;

    const pc = createPeerConnection(stream);
    
    const channel = supabase.channel(`call-${callSessionId}`);
    channelRef.current = channel;

    channel.on("broadcast", { event: "offer" }, async (msg) => {
      console.log("Received offer");
      const offer = msg.payload.offer;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      channel.send({
        type: "broadcast",
        event: "answer",
        payload: { answer }
      });
    });

    channel.on("broadcast", { event: "ice-candidate" }, async (msg) => {
      console.log("Received ICE candidate");
      await pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate));
    });

    channel.on("broadcast", { event: "call-ended" }, () => {
      endCall();
    });

    await channel.subscribe();

    // Update call status
    await supabase
      .from("call_sessions")
      .update({ status: "active" })
      .eq("id", callSessionId);

    setCallStatus("active");
  }, [callSessionId, initializeMedia, createPeerConnection]);

  // Decline incoming call
  const declineCall = useCallback(async () => {
    if (callSessionId) {
      await supabase
        .from("call_sessions")
        .update({ status: "declined", ended_at: new Date().toISOString() })
        .eq("id", callSessionId);

      channelRef.current?.send({
        type: "broadcast",
        event: "call-declined",
        payload: {}
      });
    }
    cleanup();
    onClose();
  }, [callSessionId, onClose]);

  // End call
  const endCall = useCallback(async () => {
    if (sessionIdRef.current) {
      await supabase
        .from("call_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", sessionIdRef.current);

      channelRef.current?.send({
        type: "broadcast",
        event: "call-ended",
        payload: {}
      });
    }
    cleanup();
    onClose();
  }, [onClose]);

  // Cleanup
  const cleanup = useCallback(() => {
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus("ended");
  }, [localStream, remoteStream]);

  // Toggle mute
  const toggleMute = () => {
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = isMuted;
    });
    setIsMuted(!isMuted);
  };

  // Toggle video
  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach(track => {
      track.enabled = isVideoOff;
    });
    setIsVideoOff(!isVideoOff);
  };

  // Initialize call on mount
  useEffect(() => {
    if (open && !isIncoming) {
      startCall();
    }
  }, [open, isIncoming, startCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={() => endCall()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {callType === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Remote video/avatar */}
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {callType === "video" && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={otherUser.avatar_url || ""} />
                  <AvatarFallback className="text-2xl">
                    {otherUser.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-lg font-medium">{otherUser.full_name || "Người dùng"}</p>
                
                {callStatus === "connecting" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kết nối...</span>
                  </div>
                )}
                {callStatus === "ringing" && !isIncoming && (
                  <p className="text-muted-foreground animate-pulse">Đang đổ chuông...</p>
                )}
                {callStatus === "ringing" && isIncoming && (
                  <p className="text-primary animate-pulse">Cuộc gọi đến...</p>
                )}
                {callStatus === "active" && (
                  <p className="text-green-500">Đang trong cuộc gọi</p>
                )}
              </div>
            )}

            {/* Local video (picture-in-picture) */}
            {callType === "video" && localStream && (
              <div className="absolute bottom-4 right-4 w-32 aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Call controls */}
          <div className="flex items-center gap-4">
            {isIncoming && callStatus === "ringing" ? (
              <>
                <Button
                  size="lg"
                  className="rounded-full bg-green-500 hover:bg-green-600"
                  onClick={answerCall}
                >
                  <Phone className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full"
                  onClick={declineCall}
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  variant={isMuted ? "destructive" : "secondary"}
                  className="rounded-full"
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                
                {callType === "video" && (
                  <Button
                    size="lg"
                    variant={isVideoOff ? "destructive" : "secondary"}
                    className="rounded-full"
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </Button>
                )}

                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full"
                  onClick={endCall}
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
