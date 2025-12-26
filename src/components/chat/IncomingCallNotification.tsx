import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface IncomingCallNotificationProps {
  callerName: string;
  callerAvatar: string | null;
  callType: "video" | "audio";
  onAnswer: () => void;
  onDecline: () => void;
}

export function IncomingCallNotification({
  callerName,
  callerAvatar,
  callType,
  onAnswer,
  onDecline
}: IncomingCallNotificationProps) {
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
              onClick={onDecline}
              className="w-14 h-14 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center shadow-lg transition-colors"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAnswer}
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
