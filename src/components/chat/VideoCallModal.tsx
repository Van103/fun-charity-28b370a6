import { useState, useEffect, useRef, useCallback } from "react";
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
  Loader2,
  X,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "ringing" | "active" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sessionIdRef = useRef<string | null>(callSessionId || null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isCleanedUpRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ]
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start call timer
  useEffect(() => {
    if (callStatus === "active") {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [callStatus]);

  // Cleanup function - uses refs to avoid stale closures
  const cleanup = useCallback(() => {
    if (isCleanedUpRef.current) return;
    isCleanedUpRef.current = true;
    
    console.log("Cleaning up video call resources...");
    
    // Stop all tracks from local stream using ref
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      localStreamRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      console.log("Closed peer connection");
    }
    
    // Remove channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      console.log("Removed signaling channel");
    }
    
    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    // Reset states
    setLocalStream(null);
    setRemoteStream(null);
    setCallDuration(0);
  }, []);

  // End call
  const endCall = useCallback(async () => {
    console.log("Ending call...");
    
    if (sessionIdRef.current) {
      try {
        await supabase
          .from("call_sessions")
          .update({ status: "ended", ended_at: new Date().toISOString() })
          .eq("id", sessionIdRef.current);

        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "call-ended",
            payload: {}
          });
        }
      } catch (error) {
        console.error("Error updating call session:", error);
      }
    }
    
    cleanup();
    setCallStatus("ended");
    onClose();
  }, [onClose, cleanup]);

  // Initialize media stream
  const initializeMedia = useCallback(async () => {
    try {
      console.log("Requesting media access...", callType);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video" ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "user"
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log("Got media stream:", stream.getTracks().map(t => t.kind));
      
      // Store in ref for cleanup
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error: any) {
      console.error("Error accessing media devices:", error);
      
      let errorMessage = "Không thể truy cập camera/microphone.";
      if (error.name === "NotAllowedError") {
        errorMessage = "Vui lòng cho phép truy cập camera và microphone trong trình duyệt.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "Không tìm thấy camera hoặc microphone.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera hoặc microphone đang được sử dụng bởi ứng dụng khác.";
      }
      
      toast({
        title: "Lỗi truy cập thiết bị",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  }, [callType, toast]);

  // Create peer connection
  const createPeerConnection = useCallback((stream: MediaStream) => {
    // Close existing connection if any
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    console.log("Creating new peer connection...");
    const pc = new RTCPeerConnection(configuration);
    
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      console.log("Added track:", track.kind);
    });

    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        console.log("Sending ICE candidate");
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
        console.log("Connection lost, ending call");
        endCall();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [endCall]);

  // Start outgoing call
  const startCall = useCallback(async () => {
    if (isCleanedUpRef.current) return;
    
    console.log("Starting outgoing call...");
    setCallStatus("connecting");
    
    const stream = await initializeMedia();
    if (!stream) {
      setCallStatus("ended");
      onClose();
      return;
    }

    const pc = createPeerConnection(stream);
    
    try {
      // Create offer first
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("Created offer");

      // Create call session in database with offer stored
      const { data: session, error } = await supabase
        .from("call_sessions")
        .insert({
          conversation_id: conversationId,
          caller_id: currentUserId,
          call_type: callType,
          status: "pending",
          signaling_data: { offer: { type: offer.type, sdp: offer.sdp } }
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
        cleanup();
        onClose();
        return;
      }

      sessionIdRef.current = session.id;
      setCallStatus("ringing");
      console.log("Call session created:", session.id);
      
      // Setup signaling channel
      const channel = supabase.channel(`call-${session.id}`);
      channelRef.current = channel;

      channel.on("broadcast", { event: "answer" }, async (msg) => {
        console.log("Received answer");
        const answer = msg.payload.answer;
        if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== "closed") {
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (e) {
            console.error("Error setting remote description:", e);
          }
        }
      });

      channel.on("broadcast", { event: "ice-candidate" }, async (msg) => {
        console.log("Received ICE candidate");
        try {
          if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== "closed") {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.payload.candidate));
          }
        } catch (e) {
          console.error("Error adding ICE candidate:", e);
        }
      });

      channel.on("broadcast", { event: "call-declined" }, () => {
        toast({
          title: "Cuộc gọi bị từ chối",
          description: `${otherUser.full_name || "Người dùng"} đã từ chối cuộc gọi`
        });
        cleanup();
        setCallStatus("ended");
        onClose();
      });

      channel.on("broadcast", { event: "call-ended" }, () => {
        console.log("Call ended by remote");
        cleanup();
        setCallStatus("ended");
        onClose();
      });

      await channel.subscribe();
      console.log("Subscribed to signaling channel");
      
    } catch (error) {
      console.error("Error starting call:", error);
      toast({
        title: "Lỗi",
        description: "Không thể bắt đầu cuộc gọi",
        variant: "destructive"
      });
      cleanup();
      onClose();
    }
  }, [conversationId, currentUserId, callType, initializeMedia, createPeerConnection, otherUser, toast, cleanup, onClose]);

  // Answer incoming call
  const answerCall = useCallback(async () => {
    if (!callSessionId || isCleanedUpRef.current) return;

    console.log("Answering incoming call...");
    setCallStatus("connecting");

    // First, get the offer from the database
    const { data: callSession, error: fetchError } = await supabase
      .from("call_sessions")
      .select("signaling_data")
      .eq("id", callSessionId)
      .single();

    if (fetchError || !callSession) {
      console.error("Error fetching call session:", fetchError);
      toast({
        title: "Lỗi",
        description: "Không thể tham gia cuộc gọi",
        variant: "destructive"
      });
      onClose();
      return;
    }

    const stream = await initializeMedia();
    if (!stream) {
      onClose();
      return;
    }

    const pc = createPeerConnection(stream);
    
    const channel = supabase.channel(`call-${callSessionId}`);
    channelRef.current = channel;

    channel.on("broadcast", { event: "ice-candidate" }, async (msg) => {
      console.log("Received ICE candidate");
      try {
        if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== "closed") {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.payload.candidate));
        }
      } catch (e) {
        console.error("Error adding ICE candidate:", e);
      }
    });

    channel.on("broadcast", { event: "call-ended" }, () => {
      console.log("Call ended by remote");
      cleanup();
      setCallStatus("ended");
      onClose();
    });

    await channel.subscribe();
    console.log("Subscribed to signaling channel");

    try {
      // Set remote description from stored offer
      const signalingData = callSession.signaling_data as { offer?: RTCSessionDescriptionInit };
      if (signalingData?.offer) {
        console.log("Setting remote description from stored offer");
        await pc.setRemoteDescription(new RTCSessionDescription(signalingData.offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("Created answer");

        channel.send({
          type: "broadcast",
          event: "answer",
          payload: { answer: { type: answer.type, sdp: answer.sdp } }
        });
        
        // Update call status in DB
        await supabase
          .from("call_sessions")
          .update({ status: "active" })
          .eq("id", callSessionId);

        setCallStatus("active");
      } else {
        console.error("No offer found in call session");
        toast({
          title: "Lỗi",
          description: "Không tìm thấy dữ liệu cuộc gọi",
          variant: "destructive"
        });
        cleanup();
        onClose();
      }
    } catch (error) {
      console.error("Error answering call:", error);
      toast({
        title: "Lỗi",
        description: "Không thể trả lời cuộc gọi",
        variant: "destructive"
      });
      cleanup();
      onClose();
    }
  }, [callSessionId, initializeMedia, createPeerConnection, cleanup, toast, onClose]);

  // Decline incoming call
  const declineCall = useCallback(async () => {
    console.log("Declining call...");
    
    if (callSessionId) {
      try {
        await supabase
          .from("call_sessions")
          .update({ status: "declined", ended_at: new Date().toISOString() })
          .eq("id", callSessionId);

        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "call-declined",
            payload: {}
          });
        }
      } catch (error) {
        console.error("Error declining call:", error);
      }
    }
    
    cleanup();
    setCallStatus("ended");
    onClose();
  }, [callSessionId, cleanup, onClose]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  }, [isVideoOff]);

  // Switch camera (for mobile)
  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current) return;
    
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    const constraints = videoTrack.getConstraints();
    const currentFacingMode = (constraints.facingMode as string) || "user";
    const newFacingMode = currentFacingMode === "user" ? "environment" : "user";

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace track in peer connection
      const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Update local stream
      videoTrack.stop();
      localStreamRef.current.removeTrack(videoTrack);
      localStreamRef.current.addTrack(newVideoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } catch (error) {
      console.error("Error switching camera:", error);
      toast({
        title: "Lỗi",
        description: "Không thể chuyển đổi camera",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Handle close button
  const handleClose = useCallback(() => {
    endCall();
  }, [endCall]);

  // Initialize call on mount
  useEffect(() => {
    if (open && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      isCleanedUpRef.current = false;
      
      if (isIncoming) {
        setCallStatus("ringing");
      } else {
        startCall();
      }
    }
  }, [open, isIncoming, startCall]);

  // Cleanup on unmount or when modal closes
  useEffect(() => {
    return () => {
      console.log("VideoCallModal unmounting, cleaning up...");
      cleanup();
      hasInitializedRef.current = false;
    };
  }, [cleanup]);

  // Reset refs when modal closes
  useEffect(() => {
    if (!open) {
      hasInitializedRef.current = false;
      isCleanedUpRef.current = false;
    }
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-white/20">
                <AvatarImage src={otherUser.avatar_url || ""} />
                <AvatarFallback className="text-lg bg-primary/20 text-white">
                  {otherUser.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold text-lg">{otherUser.full_name || "Người dùng"}</p>
                <p className="text-white/60 text-sm">
                  {callStatus === "idle" && "Chuẩn bị..."}
                  {callStatus === "connecting" && "Đang kết nối..."}
                  {callStatus === "ringing" && (isIncoming ? "Cuộc gọi đến..." : "Đang đổ chuông...")}
                  {callStatus === "active" && formatDuration(callDuration)}
                  {callStatus === "ended" && "Đã kết thúc"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {callType === "video" && callStatus === "active" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                  title="Đổi camera"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-full h-10 w-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main video area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Remote video/avatar */}
          {callType === "video" && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <motion.div
                animate={callStatus === "ringing" ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Avatar className="w-32 h-32 border-4 border-primary/30 shadow-2xl">
                  <AvatarImage src={otherUser.avatar_url || ""} />
                  <AvatarFallback className="text-4xl bg-primary/20 text-white">
                    {otherUser.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              
              <p className="text-white text-2xl font-semibold mt-6">
                {otherUser.full_name || "Người dùng"}
              </p>
              
              {callStatus === "connecting" && (
                <div className="flex items-center gap-2 text-white/60 mt-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang kết nối...</span>
                </div>
              )}
              {callStatus === "ringing" && !isIncoming && (
                <p className="text-white/60 mt-2 animate-pulse">Đang đổ chuông...</p>
              )}
              {callStatus === "ringing" && isIncoming && (
                <p className="text-primary mt-2 animate-pulse text-lg">
                  Cuộc gọi {callType === "video" ? "video" : "thoại"} đến
                </p>
              )}
              {callStatus === "active" && callType === "audio" && (
                <p className="text-green-400 mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Đang trong cuộc gọi
                </p>
              )}
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          {callType === "video" && localStream && (
            <motion.div 
              drag
              dragConstraints={containerRef}
              className="absolute bottom-24 right-4 w-32 sm:w-40 aspect-[3/4] bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 cursor-move"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <VideoOff className="w-8 h-8 text-white/50" />
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Call controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4">
            {isIncoming && callStatus === "ringing" ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={declineCall}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={answerCall}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg"
                >
                  <Phone className="w-7 h-7 text-white" />
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
                  }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </motion.button>
                
                {callType === "video" && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                      isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={endCall}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
