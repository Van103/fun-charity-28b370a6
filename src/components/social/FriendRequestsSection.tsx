import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, UserPlus, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface FriendRequest {
  id: string;
  userName: string;
  avatar?: string;
  mutualFriends: number;
  verified?: boolean;
}

const mockRequests: FriendRequest[] = [
  { id: "1", userName: "Anh Elgon", mutualFriends: 25, verified: true },
  { id: "2", userName: "Na Trần", mutualFriends: 2, verified: true },
  { id: "3", userName: "Nông Liên", mutualFriends: 20, verified: true },
  { id: "4", userName: "Trần Tâm", mutualFriends: 20, verified: true },
];

const mockSuggestions: FriendRequest[] = [
  { id: "5", userName: "Khôi Phan", mutualFriends: 26, verified: true },
  { id: "6", userName: "Thu Thanh Hoàng", mutualFriends: 22, verified: true },
  { id: "7", userName: "Phạm Hằng", mutualFriends: 2, verified: true },
  { id: "8", userName: "Trang Huyền", mutualFriends: 11 },
];

// Helper to get cover image style
const getCoverStyle = (index: number) => {
  const gradients = [
    "bg-gradient-to-br from-purple-500/40 to-pink-500/40",
    "bg-gradient-to-br from-blue-500/40 to-purple-500/40",
    "bg-gradient-to-br from-amber-500/40 to-orange-500/40",
    "bg-gradient-to-br from-emerald-500/40 to-teal-500/40",
  ];
  return gradients[index % gradients.length];
};

export function FriendRequestsSection() {
  return (
    <div className="space-y-6">
      {/* Friend Requests */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Lời mời kết bạn</h3>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {mockRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="shrink-0 w-28 rounded-xl overflow-hidden bg-card border border-border/50 shadow-sm"
            >
              {/* Cover photo area with real image appearance */}
              <div className={`h-12 ${getCoverStyle(index)} relative`}>
                {/* Avatar positioned at bottom of cover */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                  <div className="p-0.5 rounded-full bg-gradient-to-br from-primary to-primary-light">
                    <Avatar className="w-10 h-10 border-2 border-background">
                      <AvatarImage src={request.avatar} />
                      <AvatarFallback className="bg-primary/10 text-sm">
                        {request.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 pb-2 px-1.5 flex flex-col items-center text-center">
                <div className="flex items-center gap-0.5 mb-0.5">
                  <span className="font-medium text-[11px] truncate max-w-full">
                    {request.userName}
                  </span>
                  {request.verified && <span className="text-primary text-[10px]">💜</span>}
                </div>
                <span className="text-[10px] text-muted-foreground mb-1.5">
                  {request.mutualFriends} bạn chung
                </span>
                <div className="flex flex-col gap-1 w-full">
                  <Button size="sm" className="w-full h-6 text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground">
                    Xác nhận
                  </Button>
                  <Button size="sm" variant="outline" className="w-full h-6 text-[10px]">
                    Xóa
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Navigation arrow */}
          <button className="shrink-0 w-7 h-7 self-center rounded-full bg-background border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <button className="text-xs text-primary hover:underline mt-2 mx-auto block">
          Xem tất cả
        </button>
      </div>

      {/* People You May Know */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Những người bạn có thể biết</h3>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {mockSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="shrink-0 w-28 rounded-xl overflow-hidden bg-card border border-border/50 shadow-sm relative"
            >
              {/* Remove button */}
              <button className="absolute top-1 right-1 z-10 w-4 h-4 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-muted transition-colors">
                <X className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
              
              {/* Cover photo area with label overlay */}
              <div className={`h-12 ${getCoverStyle(index + 2)} relative`}>
                {/* Decorative text overlay */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-30">
                  <span className="text-[6px] text-white font-bold tracking-widest rotate-[-15deg]">
                    SUPER APP
                  </span>
                </div>
                {/* Avatar positioned at bottom of cover */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                  <div className="p-0.5 rounded-full bg-gradient-to-br from-primary to-primary-light">
                    <Avatar className="w-10 h-10 border-2 border-background">
                      <AvatarImage src={suggestion.avatar} />
                      <AvatarFallback className="bg-primary/10 text-sm">
                        {suggestion.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 pb-2 px-1.5 flex flex-col items-center text-center">
                <div className="flex items-center gap-0.5 mb-0.5">
                  <span className="font-medium text-[11px] truncate max-w-full">
                    {suggestion.userName}
                  </span>
                  {suggestion.verified && <span className="text-primary text-[10px]">💜</span>}
                </div>
                <span className="text-[10px] text-muted-foreground mb-1.5">
                  {suggestion.mutualFriends} bạn chung
                </span>
                <Button size="sm" variant="outline" className="w-full h-6 text-[10px] px-1.5">
                  <UserPlus className="w-2.5 h-2.5 mr-0.5" />
                  Thêm bạn bè
                </Button>
              </div>
            </motion.div>
          ))}
          
          {/* Navigation arrow */}
          <button className="shrink-0 w-7 h-7 self-center rounded-full bg-background border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <button className="text-xs text-primary hover:underline mt-2 mx-auto block">
          Xem tất cả
        </button>
      </div>
    </div>
  );
}
