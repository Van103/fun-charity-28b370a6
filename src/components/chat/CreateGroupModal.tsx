import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Friend {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  onGroupCreated: (conversationId: string) => void;
}

export function CreateGroupModal({
  open,
  onClose,
  currentUserId,
  onGroupCreated
}: CreateGroupModalProps) {
  const { toast } = useToast();
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Load friends
  useEffect(() => {
    if (!open) return;

    const loadFriends = async () => {
      setIsLoading(true);
      
      const { data: friendships } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      if (!friendships) {
        setIsLoading(false);
        return;
      }

      const friendIds = friendships.map(f => 
        f.user_id === currentUserId ? f.friend_id : f.user_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", friendIds);

      setFriends(profiles || []);
      setIsLoading(false);
    };

    loadFriends();
  }, [open, currentUserId]);

  const toggleFriend = (userId: string) => {
    setSelectedFriends(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên nhóm",
        variant: "destructive"
      });
      return;
    }

    if (selectedFriends.length < 2) {
      toast({
        title: "Lỗi",
        description: "Cần ít nhất 2 người để tạo nhóm",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          participant1_id: currentUserId,
          participant2_id: selectedFriends[0], // Required by schema
          is_group: true,
          name: groupName.trim(),
          created_by: currentUserId
        })
        .select()
        .single();

      if (convError || !conversation) throw convError;

      // Add all participants (including creator)
      const participants = [currentUserId, ...selectedFriends].map(userId => ({
        conversation_id: conversation.id,
        user_id: userId
      }));

      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert(participants);

      if (participantsError) throw participantsError;

      toast({
        title: "Thành công",
        description: `Đã tạo nhóm "${groupName.trim()}"`
      });

      onGroupCreated(conversation.id);
      handleClose();
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo nhóm chat",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName("");
    setSelectedFriends([]);
    setSearchQuery("");
    onClose();
  };

  const filteredFriends = friends.filter(f =>
    f.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tạo nhóm chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="group-name">Tên nhóm</Label>
            <Input
              id="group-name"
              placeholder="Nhập tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div>
            <Label>Chọn thành viên ({selectedFriends.length} đã chọn)</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm bạn bè..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-60 border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery ? "Không tìm thấy" : "Bạn chưa có bạn bè nào"}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredFriends.map(friend => (
                  <label
                    key={friend.user_id}
                    className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedFriends.includes(friend.user_id)}
                      onCheckedChange={() => toggleFriend(friend.user_id)}
                    />
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={friend.avatar_url || ""} />
                      <AvatarFallback>{friend.full_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{friend.full_name || "Người dùng"}</span>
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={createGroup} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo nhóm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
