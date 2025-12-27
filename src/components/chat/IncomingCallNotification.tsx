import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useCallback } from "react";

interface IncomingCallNotificationProps {
  callerName: string;
  callerAvatar: string | null;
  callType: "video" | "audio";
  onAnswer: () => void;
  onDecline: () => void;
}

// Create Messenger-style incoming call ringtone
const createIncomingRingtone = (audioContext: AudioContext): OscillatorNode[] => {
  const oscillators: OscillatorNode[] = [];
  
  // Messenger incoming call has a distinctive "ring ring" pattern
  const frequencies = [440, 554.37]; // A4 and C#5 - pleasant chord
  
  frequencies.forEach(freq => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    // Create pulsing pattern
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    const patternDuration = 4; // 4 seconds per pattern
    const ringDuration = 0.8;
    const pauseDuration = 0.4;
    
    // Create repeating ring pattern
    for (let i = 0; i < 100; i++) { // Repeat for up to 100 cycles
      const cycleStart = i * patternDuration;
      
      // First ring
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + cycleStart);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + cycleStart + 0.05);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + cycleStart + ringDuration);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + cycleStart + ringDuration + 0.05);
      
      // Pause
      const secondRingStart = cycleStart + ringDuration + pauseDuration;
      
      // Second ring
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + secondRingStart);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + secondRingStart + 0.05);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + secondRingStart + ringDuration);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + secondRingStart + ringDuration + 0.05);
    }
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    
    oscillators.push(oscillator);
  });
  
  return oscillators;
};

// Vibration pattern like Messenger (ring-ring pause ring-ring)
const vibratePattern = () => {
  if ('vibrate' in navigator) {
    // Pattern: vibrate, pause, vibrate, longer pause, repeat
    const pattern = [
      300, 100, 300, // First ring-ring
      500, // Pause
      300, 100, 300, // Second ring-ring
      1500 // Long pause before repeat
    ];
    
    navigator.vibrate(pattern);
  }
};

const stopVibration = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
};

export function IncomingCallNotification({
  callerName,
  callerAvatar,
  callType,
  onAnswer,
  onDecline
}: IncomingCallNotificationProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopRingtone = useCallback(() => {
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    oscillatorsRef.current = [];
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    stopVibration();
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Start ringtone
    try {
      audioContextRef.current = new AudioContext();
      oscillatorsRef.current = createIncomingRingtone(audioContextRef.current);
    } catch (error) {
      console.error("Error playing ringtone:", error);
    }
    
    // Start vibration pattern (repeating)
    vibratePattern();
    vibrationIntervalRef.current = setInterval(() => {
      vibratePattern();
    }, 3400); // Total pattern duration
    
    return () => {
      stopRingtone();
    };
  }, [stopRingtone]);

  const handleAnswer = () => {
    stopRingtone();
    onAnswer();
  };

  const handleDecline = () => {
    stopRingtone();
    onDecline();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.9 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Avatar className="w-14 h-14 border-2 border-primary/30">
                  <AvatarImage src={callerAvatar || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {callerName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              
              <div className="flex-1">
                <p className="font-semibold text-foreground text-lg">{callerName}</p>
                <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                  {callType === "video" ? (
                    <>
                      <Video className="w-4 h-4" />
                      Cuộc gọi video đến...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4" />
                      Cuộc gọi thoại đến...
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 flex items-center justify-center gap-6 bg-card">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDecline}
              className="w-14 h-14 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center shadow-lg transition-colors"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                scale: [1, 1.15, 1],
                boxShadow: [
                  "0 0 0 0 rgba(34, 197, 94, 0.4)",
                  "0 0 0 15px rgba(34, 197, 94, 0)",
                  "0 0 0 0 rgba(34, 197, 94, 0)"
                ]
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              onClick={handleAnswer}
              className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg transition-colors"
            >
              <Phone className="w-6 h-6 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
