import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ChevronLeft, ChevronRight, Video } from "lucide-react";
import { motion } from "framer-motion";

interface Story {
  id: string;
  userName: string;
  avatar: string;
  hasNew: boolean;
  isLive?: boolean;
  coverImage?: string;
}

const mockStories: Story[] = [
  { id: "1", userName: "Anh Elgon", avatar: "", hasNew: true, coverImage: "from-pink-400/60 to-purple-500/60" },
  { id: "2", userName: "Kim Ngọc", avatar: "", hasNew: true, coverImage: "from-amber-400/60 to-orange-500/60" },
  { id: "3", userName: "Lê Minh Trí", avatar: "", hasNew: true, coverImage: "from-emerald-400/60 to-teal-500/60" },
  { id: "4", userName: "Lê Huỳnh Như", avatar: "", hasNew: false, coverImage: "from-blue-400/60 to-indigo-500/60" },
  { id: "5", userName: "Na Trần", avatar: "", hasNew: true, coverImage: "from-rose-400/60 to-pink-500/60" },
];

export function StoriesSection() {
  const [activeTab, setActiveTab] = useState("stories");

  return (
    <div className="glass-card p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="stories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            📖 Stories
          </TabsTrigger>
          <TabsTrigger value="live" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Video className="w-4 h-4 mr-1" />
            Live
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stories" className="mt-0">
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {/* Create Story */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="shrink-0 cursor-pointer"
              >
                <div className="relative w-20 h-28 rounded-xl bg-gradient-to-br from-muted to-muted/50 border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] text-center text-muted-foreground">Tạo tin</span>
                </div>
              </motion.div>

              {/* Story Items */}
              {mockStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="shrink-0 cursor-pointer group"
                >
                  <div className="relative w-20 h-28 rounded-xl overflow-hidden">
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${story.coverImage || "from-primary/40 to-secondary/40"}`} />
                    
                    {/* Avatar - circular with gradient ring at center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`p-0.5 rounded-full ${
                        story.hasNew 
                          ? "bg-gradient-to-br from-primary via-primary-light to-primary" 
                          : "bg-border"
                      }`}>
                        <Avatar className="w-12 h-12 border-2 border-background">
                          <AvatarImage src={story.avatar} />
                          <AvatarFallback className="bg-primary/20 text-sm">
                            {story.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>

                    {/* Live indicator */}
                    {story.isLive && (
                      <div className="absolute top-1 right-1">
                        <span className="px-1.5 py-0.5 bg-destructive text-destructive-foreground text-[9px] rounded-full">
                          LIVE
                        </span>
                      </div>
                    )}

                    {/* Name at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                      <span className="text-[10px] text-white font-medium line-clamp-1 text-center block">
                        {story.userName}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Navigation Arrow */}
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-7 h-7 bg-background/90 rounded-full shadow-lg flex items-center justify-center hover:bg-background transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </TabsContent>

        <TabsContent value="live" className="mt-0">
          <div className="flex items-center justify-center h-36 text-muted-foreground">
            <div className="text-center">
              <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chưa có ai đang phát trực tiếp</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
